import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildMedicalCareDecisionContext,
  type MedicalCareCenterSource,
  type MedicalCareDecisionContext,
} from "@/lib/contextAjutorAproape";
import { completeWithOsmFallback } from "@/lib/fallbackOsmAjutorAproape";
import { buildVerifiedMedicalCareResults } from "@/lib/selectareLocatiiVerificate";
import type { MedicalCareResult } from "@/lib/medical-care.logic";
import type { Coordinates } from "@/lib/medical-care.types";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Santix MVP nearby care (https://santix.ro)",
};

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const DecisionSearchSchema = CoordinatesSchema.extend({
  source: z.enum(["browser", "manual", "manual_search", "manual_map", "demo"]).optional(),
  searchText: z.string().trim().min(1).max(120).optional(),
  geocodedLabel: z.string().trim().min(1).max(300).optional(),
  geocodedAddress: z.string().trim().min(1).max(300).optional(),
});

const AreaSchema = z.object({
  area: z.string().trim().min(2).max(120),
});

export type MedicalCareGeocodeResult = Coordinates & {
  id: string;
  label: string;
  fullAddress: string;
  cityOrCounty: string | null;
  resultType: string | null;
};

export type MedicalCareGeocodeResponse = {
  query: string;
  results: MedicalCareGeocodeResult[];
};

export type NominatimHit = {
  place_id?: number | string;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    postcode?: string;
    country?: string;
  };
};

export const findNearbyMedicalCare = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CoordinatesSchema.parse(input))
  .handler(async ({ data }): Promise<MedicalCareResult[]> => {
    const verifiedResults = buildVerifiedMedicalCareResults(data);
    return completeWithOsmFallback(data, verifiedResults);
  });

export const findNearbyMedicalCareDecision = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DecisionSearchSchema.parse(input))
  .handler(async ({ data }): Promise<MedicalCareDecisionContext> => {
    const centerSource: MedicalCareCenterSource =
      data.source === "manual" ? "manual_search" : (data.source ?? "browser");
    return buildMedicalCareDecisionContext(
      { lat: data.lat, lng: data.lng },
      {
        centerSource,
        manualSearchText: data.searchText ?? null,
        geocodedLabel: data.geocodedLabel ?? null,
        geocodedAddress: data.geocodedAddress ?? null,
      },
    );
  });

export const geocodeMedicalCareArea = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AreaSchema.parse(input))
  .handler(async ({ data }): Promise<MedicalCareGeocodeResponse> => {
    const params = new URLSearchParams({
      q: `${data.area}, Romania`,
      format: "jsonv2",
      countrycodes: "ro",
      limit: "5",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
      headers: REQUEST_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const hits = (await response.json()) as NominatimHit[];
    const results = normalizeMedicalCareGeocodeHits(data.area, hits);

    if (!results.length) {
      throw new Error("Nu am găsit zona introdusă.");
    }

    return { query: data.area, results };
  });

export function normalizeMedicalCareGeocodeHits(
  query: string,
  hits: NominatimHit[],
): MedicalCareGeocodeResult[] {
  const seen = new Set<string>();
  const candidates: MedicalCareGeocodeResult[] = [];

  for (const hit of hits) {
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const fullAddress = hit.display_name?.trim() || query;
    const duplicateKey = `${lat.toFixed(5)},${lng.toFixed(5)}:${normalizeGeocodeText(fullAddress)}`;
    if (seen.has(duplicateKey)) continue;
    seen.add(duplicateKey);

    const cityOrCounty = cityOrCountyFromAddress(hit.address);
    const resultType = hit.addresstype ?? hit.type ?? hit.class ?? null;

    candidates.push({
      id: String(hit.place_id ?? `${lat.toFixed(6)},${lng.toFixed(6)}`),
      lat,
      lng,
      label: hit.name?.trim() || firstAddressPart(fullAddress),
      fullAddress,
      cityOrCounty,
      resultType,
    });
  }

  return candidates.slice(0, 5);
}

function cityOrCountyFromAddress(address: NominatimHit["address"]) {
  if (!address) return null;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  const county = address.county ?? address.state;
  if (city && county && city !== county) return `${city}, ${county}`;
  return city ?? county ?? null;
}

function firstAddressPart(value: string) {
  return value.split(",")[0]?.trim() || value;
}

function normalizeGeocodeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
