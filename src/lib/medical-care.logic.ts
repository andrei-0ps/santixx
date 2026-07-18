import type { Coordinates, MedicalCarePlaceType } from "@/lib/medical-care.types";

export type MedicalCareCategory = "open_pharmacy" | "nonstop_pharmacy" | "emergency_hospital";
export type MedicalCareStatus = "open_now" | "nonstop" | "emergency_unit" | "not_found";
export type MedicalCareResultSource =
  | "osm"
  | "osm_fallback"
  | "manual_verified"
  | "official_registry"
  | "dsp";
export type MedicalCareResultConfidence = "high" | "medium" | "low";
export type MedicalCareEmergencyCapability =
  | "upu_verified"
  | "cpu_verified"
  | "emergency_hospital_verified"
  | "probable_emergency"
  | "none";
export type MedicalCareMissingReason =
  | "no_open_pharmacy"
  | "no_different_open_pharmacy"
  | "no_nonstop_pharmacy"
  | "no_different_nonstop_pharmacy"
  | "no_emergency_hospital";
export type MedicalCareFallbackReason = "osm_timeout" | "osm_error" | "osm_no_results";

export type MedicalCareFoundResult = {
  available: true;
  id: string;
  category: MedicalCareCategory;
  placeType: MedicalCarePlaceType;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  status: Exclude<MedicalCareStatus, "not_found">;
  source: MedicalCareResultSource;
  sourceLabel: string;
  sourceUrl: string;
  confidence: MedicalCareResultConfidence;
  emergencyCapability: MedicalCareEmergencyCapability;
  selectionReason?: string;
};

export type MedicalCareUnavailableResult = {
  available: false;
  category: MedicalCareCategory;
  placeType: MedicalCarePlaceType;
  status: "not_found";
  reason: MedicalCareMissingReason;
  fallbackReason?: MedicalCareFallbackReason;
  fallbackRadiusMeters?: number;
};

export type MedicalCareResult = MedicalCareFoundResult | MedicalCareUnavailableResult;

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  elements?: OverpassElement[];
};

type MedicalCareCandidate = {
  id: string;
  placeType: MedicalCarePlaceType;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  tags: Record<string, string>;
};

export const ROMANIA_TIME_ZONE = "Europe/Bucharest";
const DEFAULT_SEARCH_RADIUS_METERS = 16000;
const DEFAULT_OVERPASS_LIMIT = 220;
const DAY_TO_INDEX: Record<string, number> = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};
const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const DAY_TOKEN_PATTERN = /\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g;
const DAY_RANGE_PATTERN = /\b(Mo|Tu|We|Th|Fr|Sa|Su)\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su)\b/g;
const TIME_RANGE_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2}|24)(?::(\d{2}))?/g;

export function buildOverpassMedicalQuery(
  center: Coordinates,
  radiusMeters = DEFAULT_SEARCH_RADIUS_METERS,
  limit = DEFAULT_OVERPASS_LIMIT,
) {
  const around = `(around:${radiusMeters},${center.lat},${center.lng})`;

  return `
    [out:json][timeout:12];
    (
      node${around}["amenity"="pharmacy"];
      way${around}["amenity"="pharmacy"];
      node${around}["healthcare"="pharmacy"];
      way${around}["healthcare"="pharmacy"];
      node${around}["amenity"="hospital"];
      way${around}["amenity"="hospital"];
      node${around}["healthcare"="hospital"];
      way${around}["healthcare"="hospital"];
    );
    out center ${limit};
  `;
}

export function distanceMeters(from: Coordinates, to: Coordinates) {
  const earthRadiusMeters = 6371000;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

export function isNonStopOpeningHours(openingHours: string | null | undefined) {
  if (!openingHours) return false;

  const value = stripDiacritics(openingHours).toLowerCase();
  return (
    /\b24\s*\/\s*7\b/.test(value) ||
    /\bnon\s*-?\s*stop\b/.test(value) ||
    /\bnonstop\b/.test(value) ||
    /00:00\s*[-–]\s*24:00/.test(value) ||
    /00:00\s*[-–]\s*00:00/.test(value)
  );
}

export function isOpenAt(
  openingHours: string | null | undefined,
  now = new Date(),
  timeZone = ROMANIA_TIME_ZONE,
) {
  if (!openingHours) return false;
  if (isNonStopOpeningHours(openingHours)) return true;

  const localTime = getLocalDayAndMinutes(now, timeZone);
  const previousDayIndex = (localTime.dayIndex + 6) % 7;
  const segments = openingHours
    .replace(/\([^)]*\)/g, " ")
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    if (/\boff\b/i.test(segment) && ![...segment.matchAll(TIME_RANGE_PATTERN)].length) {
      continue;
    }

    const ranges = [...segment.matchAll(TIME_RANGE_PATTERN)];
    if (!ranges.length) continue;

    const daySpec = segment.slice(0, ranges[0].index ?? 0);

    for (const range of ranges) {
      const start = timeToMinutes(range[1], range[2]);
      const end = timeToMinutes(range[3], range[4]);

      if (start === end && start === 0) {
        return true;
      }

      if (end > start) {
        if (
          daySpecMatches(daySpec, localTime.dayIndex) &&
          localTime.minutes >= start &&
          localTime.minutes < end
        ) {
          return true;
        }
        continue;
      }

      const openBeforeMidnight =
        daySpecMatches(daySpec, localTime.dayIndex) && localTime.minutes >= start;
      const openAfterMidnight =
        daySpecMatches(daySpec, previousDayIndex) && localTime.minutes < end;
      if (openBeforeMidnight || openAfterMidnight) return true;
    }
  }

  return false;
}

export function buildMedicalCareResults(
  center: Coordinates,
  elements: OverpassElement[],
  now = new Date(),
): MedicalCareResult[] {
  const candidates = normalizeMedicalCareCandidates(center, elements);
  const pharmacies = candidates.filter((candidate) => candidate.placeType === "pharmacy");
  const hospitals = candidates.filter((candidate) => candidate.placeType === "hospital");

  const nearestOpenPharmacy = pharmacies
    .filter((candidate) => isOpenAt(candidate.openingHours, now))
    .sort(sortByDistance)[0];
  const nearestNonstopPharmacy = pharmacies
    .filter(
      (candidate) =>
        candidate.id !== nearestOpenPharmacy?.id &&
        isNonStopOpeningHours(candidate.openingHours),
    )
    .sort(sortByDistance)[0];
  const hasAnyDifferentNonstopPharmacy = pharmacies.some(
    (candidate) =>
      candidate.id !== nearestOpenPharmacy?.id &&
      isNonStopOpeningHours(candidate.openingHours),
  );
  const nearestEmergencyHospital = hospitals.filter(isEmergencyHospital).sort(sortByDistance)[0];

  return [
    candidateToResult("open_pharmacy", nearestOpenPharmacy),
    candidateToResult(
      "nonstop_pharmacy",
      nearestNonstopPharmacy,
      nearestOpenPharmacy &&
        isNonStopOpeningHours(nearestOpenPharmacy.openingHours) &&
        !hasAnyDifferentNonstopPharmacy
        ? "no_different_nonstop_pharmacy"
        : undefined,
    ),
    candidateToResult("emergency_hospital", nearestEmergencyHospital),
  ];
}

function candidateToResult(
  category: MedicalCareCategory,
  candidate: MedicalCareCandidate | undefined,
  missingReason?: MedicalCareMissingReason,
): MedicalCareResult {
  if (!candidate) {
    return {
      available: false,
      category,
      placeType: category === "emergency_hospital" ? "hospital" : "pharmacy",
      status: "not_found",
      reason:
        missingReason ??
        (category === "open_pharmacy"
          ? "no_open_pharmacy"
          : category === "nonstop_pharmacy"
            ? "no_nonstop_pharmacy"
            : "no_emergency_hospital"),
    };
  }

  return {
    available: true,
    id: candidate.id,
    category,
    placeType: candidate.placeType,
    name: candidate.name,
    lat: candidate.lat,
    lng: candidate.lng,
    distanceMeters: Math.round(candidate.distanceMeters),
    address: candidate.address,
    phone: candidate.phone,
    openingHours: candidate.openingHours,
    status:
      category === "open_pharmacy"
        ? "open_now"
        : category === "nonstop_pharmacy"
          ? "nonstop"
          : "emergency_unit",
    source: "osm_fallback",
    sourceLabel: "OpenStreetMap fallback",
    sourceUrl: "https://www.openstreetmap.org/",
    confidence: "low",
    emergencyCapability: category === "emergency_hospital" ? "probable_emergency" : "none",
  };
}

function normalizeMedicalCareCandidates(center: Coordinates, elements: OverpassElement[]) {
  const seen = new Set<string>();
  const candidates: MedicalCareCandidate[] = [];

  for (const element of elements) {
    const coords = elementCoordinates(element);
    const placeType = detectPlaceType(element.tags);
    const tags = element.tags ?? {};
    if (!coords || !placeType || !isHumanMedicalPlace(tags)) continue;

    const name =
      cleanText(tags.name) ??
      cleanText(tags.operator) ??
      (placeType === "hospital" ? "Spital" : "Farmacie");
    if (!isRelevantOsmMedicalResult(placeType, tags, name)) continue;

    const key = `${placeType}:${stripDiacritics(name).toLowerCase()}:${coords.lat.toFixed(
      5,
    )}:${coords.lng.toFixed(5)}`;
    if (seen.has(key)) continue;

    seen.add(key);
    candidates.push({
      id: `${element.type}-${element.id}`,
      placeType,
      name,
      lat: coords.lat,
      lng: coords.lng,
      distanceMeters: distanceMeters(center, coords),
      address: buildAddress(tags),
      phone: cleanText(tags.phone) ?? cleanText(tags["contact:phone"]) ?? null,
      openingHours: cleanText(tags.opening_hours) ?? null,
      tags,
    });
  }

  return candidates.sort(sortByDistance);
}

function sortByDistance(a: { distanceMeters: number }, b: { distanceMeters: number }) {
  return a.distanceMeters - b.distanceMeters;
}

function detectPlaceType(tags: Record<string, string> | undefined): MedicalCarePlaceType | null {
  const amenity = tags?.amenity?.toLowerCase();
  const healthcare = tags?.healthcare?.toLowerCase();
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "hospital" || healthcare === "hospital") return "hospital";
  return null;
}

function isHumanMedicalPlace(tags: Record<string, string>) {
  const values = [
    tags.name,
    tags.operator,
    tags.amenity,
    tags.healthcare,
    tags.veterinary,
    tags.description,
  ]
    .filter(Boolean)
    .join(" ");

  return !/(veterinar|veterinary|\bvet\b|pet\s|animal|canin|felin)/i.test(values);
}

function isRelevantOsmMedicalResult(
  placeType: MedicalCarePlaceType,
  tags: Record<string, string>,
  name: string,
) {
  const text = stripDiacritics(
    [
      name,
      tags.operator,
      tags.official_name,
      tags.short_name,
      tags.description,
      tags.website,
      tags["contact:website"],
      tags.shop,
      tags.healthcare,
      tags.amenity,
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();

  if (/(veterinar|veterinary|\bvet\b|pet\s|animal|canin|felin)/i.test(text)) {
    return false;
  }

  if (placeType === "pharmacy") {
    return !/(farmacie online|online pharmacy|\bonline\b|e-?shop|comenzi online|livrare|depozit farmaceutic|distributie farmaceutica|distribuitor farmaceutic|warehouse)/i.test(
      text,
    );
  }

  return !/(stomatolog|stomatologie|dentar|dentist|cabinet dentar|clinica dentara|laborator analize|imagistica|radiologie|dializa|recuperare|kineto|estetic|policlinica|clinica privata)/i.test(
    text,
  );
}

function isEmergencyHospital(candidate: MedicalCareCandidate) {
  const text = stripDiacritics(
    [
      candidate.name,
      candidate.tags.official_name,
      candidate.tags.short_name,
      candidate.tags.operator,
      candidate.tags.description,
      candidate.tags["healthcare:speciality"],
      candidate.tags.emergency,
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();

  return /(\bupu\b|unitate de primiri urgente|primiri urgente|camera de garda|departament(?:ul)? de urgenta|spital(?:ul)?[^;,.]*\burgenta\b|\burgenta\b[^;,.]*spital|emergency department|emergency room)/.test(
    text,
  );
}

function elementCoordinates(element: OverpassElement): Coordinates | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function buildAddress(tags: Record<string, string>) {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

function cleanText(value: string | undefined) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function getLocalDayAndMinutes(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    dayIndex: WEEKDAY_TO_INDEX[weekday] ?? 1,
    minutes: hour * 60 + minute,
  };
}

function timeToMinutes(hourValue: string, minuteValue: string | undefined) {
  const hour = Number(hourValue);
  const minute = Number(minuteValue ?? "0");
  if (hour === 24) return 24 * 60;
  return Math.min(hour, 23) * 60 + Math.min(minute, 59);
}

function daySpecMatches(daySpec: string, dayIndex: number) {
  const cleanSpec = daySpec.trim();
  const tokens = [...cleanSpec.matchAll(DAY_TOKEN_PATTERN)].map((match) => match[1]);
  if (!tokens.length) return true;

  for (const range of cleanSpec.matchAll(DAY_RANGE_PATTERN)) {
    const start = DAY_TO_INDEX[range[1]];
    const end = DAY_TO_INDEX[range[2]];
    if (start === undefined || end === undefined) continue;

    if (start <= end) {
      if (dayIndex >= start && dayIndex <= end) return true;
    } else if (dayIndex >= start || dayIndex <= end) {
      return true;
    }
  }

  return tokens.some((token) => DAY_TO_INDEX[token] === dayIndex);
}
