import {
  buildMedicalCareResults,
  buildOverpassMedicalQuery,
  distanceMeters,
  isNonStopOpeningHours,
  type MedicalCareFallbackReason,
  type MedicalCareFoundResult,
  type MedicalCareResult,
  type OverpassElement,
  type OverpassResponse,
} from "@/lib/medical-care.logic";
import type { Coordinates } from "@/lib/medical-care.types";

export const OSM_FALLBACK_RADII_METERS = [3000, 7000, 15000] as const;
export const OSM_FALLBACK_TIMEOUT_MS = 8000;

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const OVERPASS_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "User-Agent": "Santix InfoEducatie nearby care demo",
};

export type OverpassFetcher = (
  center: Coordinates,
  radiusMeters: number,
  signal: AbortSignal,
) => Promise<OverpassElement[]>;

type OSMFallbackOptions = {
  fetcher?: OverpassFetcher;
  now?: Date;
  onAttempt?: (attempt: OSMFallbackAttempt) => void;
  radiiMeters?: readonly number[];
  timeoutMs?: number;
};

export type OSMFallbackAttempt = {
  radiusMeters: number;
  elements: OverpassElement[];
  error?: "timeout" | "error";
};

class OsmFallbackTimeoutError extends Error {
  constructor() {
    super("Overpass request timed out");
    this.name = "OsmFallbackTimeoutError";
  }
}

export async function completeWithOsmFallback(
  center: Coordinates,
  verifiedResults: MedicalCareResult[],
  options: OSMFallbackOptions = {},
): Promise<MedicalCareResult[]> {
  let results = verifiedResults;
  if (allSlotsAvailable(results)) return results;

  const fetcher = options.fetcher ?? fetchOverpassMedicalElements;
  const timeoutMs = options.timeoutMs ?? OSM_FALLBACK_TIMEOUT_MS;
  const radiiMeters = options.radiiMeters ?? OSM_FALLBACK_RADII_METERS;
  const now = options.now ?? new Date();
  let fallbackReason: MedicalCareFallbackReason = "osm_no_results";
  let lastAttemptedRadius: number | undefined;
  let hadSuccessfulResponse = false;

  for (const radiusMeters of radiiMeters) {
    if (allSlotsAvailable(results)) break;
    lastAttemptedRadius = radiusMeters;

    try {
      const elements = await runWithTimeout(fetcher, center, radiusMeters, timeoutMs);
      options.onAttempt?.({ radiusMeters, elements });
      hadSuccessfulResponse = true;
      if (!elements.length) continue;

      const osmResults = buildMedicalCareResults(center, elements, now);
      results = mergeMedicalCareFallbackResults(results, osmResults);
    } catch (error) {
      fallbackReason = error instanceof OsmFallbackTimeoutError ? "osm_timeout" : "osm_error";
      options.onAttempt?.({
        radiusMeters,
        elements: [],
        error: error instanceof OsmFallbackTimeoutError ? "timeout" : "error",
      });
      break;
    }
  }

  if (allSlotsAvailable(results)) return results;

  return annotateMissingFallback(
    results,
    hadSuccessfulResponse ? "osm_no_results" : fallbackReason,
    lastAttemptedRadius,
  );
}

export async function fetchOverpassMedicalElements(
  center: Coordinates,
  radiusMeters: number,
  signal: AbortSignal,
): Promise<OverpassElement[]> {
  const body = new URLSearchParams({
    data: buildOverpassMedicalQuery(center, radiusMeters),
  });

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: OVERPASS_HEADERS,
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OverpassResponse;
  return Array.isArray(payload.elements) ? payload.elements : [];
}

export function mergeMedicalCareFallbackResults(
  primaryResults: MedicalCareResult[],
  fallbackResults: MedicalCareResult[],
) {
  const merged = [...primaryResults];
  const selected = merged.filter(isAvailableResult);

  for (const [index, primary] of merged.entries()) {
    if (primary.available) continue;

    const fallback = fallbackResultForMissingSlot(primary, fallbackResults, selected);

    if (!fallback) continue;

    merged[index] = fallback;
    selected.push(fallback);
  }

  return merged;
}

function fallbackResultForMissingSlot(
  primary: MedicalCareResult,
  fallbackResults: MedicalCareResult[],
  selected: MedicalCareFoundResult[],
) {
  const exactFallback = fallbackResults.find(
    (result): result is MedicalCareFoundResult =>
      result.available &&
      result.category === primary.category &&
      !selected.some((selectedResult) => isSameMedicalPlace(selectedResult, result)),
  );

  if (exactFallback) return exactFallback;

  if (primary.category !== "nonstop_pharmacy") return null;

  const openNonstopFallback = fallbackResults.find(
    (result): result is MedicalCareFoundResult =>
      result.available &&
      result.category === "open_pharmacy" &&
      isNonStopOpeningHours(result.openingHours) &&
      !selected.some((selectedResult) => isSameMedicalPlace(selectedResult, result)),
  );

  if (!openNonstopFallback) return null;

  return {
    ...openNonstopFallback,
    category: "nonstop_pharmacy",
    status: "nonstop",
    emergencyCapability: "none",
  } satisfies MedicalCareFoundResult;
}

function allSlotsAvailable(results: MedicalCareResult[]) {
  return results.length === 3 && results.every((result) => result.available);
}

async function runWithTimeout(
  fetcher: OverpassFetcher,
  center: Coordinates,
  radiusMeters: number,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      controller.abort();
      reject(new OsmFallbackTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetcher(center, radiusMeters, controller.signal),
      timeoutPromise,
    ]);
  } catch (error) {
    if (
      error instanceof OsmFallbackTimeoutError ||
      controller.signal.aborted ||
      isAbortError(error)
    ) {
      throw new OsmFallbackTimeoutError();
    }

    throw error;
  } finally {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  }
}

function annotateMissingFallback(
  results: MedicalCareResult[],
  fallbackReason: MedicalCareFallbackReason,
  fallbackRadiusMeters: number | undefined,
) {
  return results.map((result): MedicalCareResult => {
    if (result.available) return result;

    return {
      ...result,
      fallbackReason,
      fallbackRadiusMeters,
    };
  });
}

function isAvailableResult(result: MedicalCareResult): result is MedicalCareFoundResult {
  return result.available;
}

function isSameMedicalPlace(first: MedicalCareFoundResult, second: MedicalCareFoundResult) {
  if (first.id === second.id) return true;
  if (first.placeType !== second.placeType) return false;

  const sameName = normalizeName(first.name) === normalizeName(second.name);
  const closeEnough =
    distanceMeters(
      { lat: first.lat, lng: first.lng },
      { lat: second.lat, lng: second.lng },
    ) <= 80;

  return closeEnough && sameName;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
