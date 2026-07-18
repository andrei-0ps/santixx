import {
  verifiedMedicalLocations,
  type VerifiedMedicalLocation,
} from "@/data/locatiiMedicaleVerificate";
import {
  completeWithOsmFallback,
  OSM_FALLBACK_TIMEOUT_MS,
  type OSMFallbackAttempt,
  type OverpassFetcher,
} from "@/lib/fallbackOsmAjutorAproape";
import {
  distanceMeters,
  isNonStopOpeningHours,
  isOpenAt,
  ROMANIA_TIME_ZONE,
  type MedicalCareCategory,
  type MedicalCareEmergencyCapability,
  type MedicalCareFallbackReason,
  type MedicalCareFoundResult,
  type MedicalCareMissingReason,
  type MedicalCareResult,
  type MedicalCareResultConfidence,
  type MedicalCareResultSource,
  type OverpassElement,
} from "@/lib/medical-care.logic";
import type { Coordinates, MedicalCarePlaceType } from "@/lib/medical-care.types";
import type { MedicalCareViewMode } from "@/lib/moduriAjutorAproape";

const AUDIT_DISTANCE_LIMIT_METERS = 30000;
const TAB_VISIBLE_LIMIT = 5;
const MAX_SOURCE_BONUS_DISTANCE_SWING_METERS = 1000;

export type MedicalCareCenterSource =
  | "browser"
  | "manual"
  | "manual_search"
  | "manual_map"
  | "demo";

type CandidateScore = {
  category: MedicalCareCategory;
  score: number;
  rank: number | null;
  reason: string;
};

export type MedicalCareAuditCandidate = {
  id: string;
  name: string;
  placeType: MedicalCarePlaceType;
  source: MedicalCareResultSource;
  sourceLabel: string;
  sourceUrl: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  distanceMeters: number | null;
  phone: string | null;
  openingHours: string | null;
  interpretedSchedule: string;
  openNow: boolean | null;
  isNonStop: boolean;
  confidence: MedicalCareResultConfidence;
  emergencyCapability: MedicalCareEmergencyCapability;
  accepted: boolean;
  acceptedSlot: MedicalCareCategory | null;
  reason: string;
  rejectionReason: string | null;
  scores: Partial<Record<MedicalCareCategory, CandidateScore>>;
  score: number | null;
  rank: number | null;
};

export type MedicalCareDecisionSummary = {
  analyzedLocations: number;
  pharmaciesFound: number;
  pharmaciesWithSchedule: number;
  pharmaciesOpenNow: number;
  selectedResults: number;
  rejectedDuplicates: number;
  rejectedIrrelevant: number;
  rejectedOnlineOrVeterinary: number;
};

export type MedicalCareOsmFallbackStatus = {
  attemptedRadiiMeters: number[];
  timeoutMs: number;
  rawElements: number;
  fallbackReason: MedicalCareFallbackReason | null;
  timedOut: boolean;
  externalDataAvailable: boolean;
};

export type MedicalCareDecisionContext = {
  results: MedicalCareResult[];
  selectedSlots: MedicalCareResult[];
  visibleItemsByMode: Record<MedicalCareViewMode, MedicalCareResult[]>;
  allCandidates: MedicalCareAuditCandidate[];
  auditCandidates: MedicalCareAuditCandidate[];
  auditCandidatesByMode: Record<MedicalCareViewMode, MedicalCareAuditCandidate[]>;
  activeCenter: {
    coordinates: Coordinates;
    source: MedicalCareCenterSource;
    searchText?: string | null;
    geocodedLabel?: string | null;
    geocodedAddress?: string | null;
  };
  calculatedAtIso: string;
  timeZone: typeof ROMANIA_TIME_ZONE;
  osmFallback: MedicalCareOsmFallbackStatus;
  summary: MedicalCareDecisionSummary;
};

type BuildMedicalCareDecisionContextOptions = {
  centerSource?: MedicalCareCenterSource;
  manualSearchText?: string | null;
  geocodedLabel?: string | null;
  geocodedAddress?: string | null;
  fetcher?: OverpassFetcher;
  now?: Date;
  radiiMeters?: readonly number[];
  timeoutMs?: number;
};

type SelectedCandidateSlots = Partial<Record<MedicalCareCategory, MedicalCareAuditCandidate>>;

export async function buildMedicalCareDecisionContext(
  center: Coordinates,
  options: BuildMedicalCareDecisionContextOptions = {},
): Promise<MedicalCareDecisionContext> {
  const now = options.now ?? new Date();
  const osmAttempts = await collectOsmAttempts(center, now, options);
  const osmFallback = summarizeOsmFallback(osmAttempts, options.timeoutMs);
  const allCandidates = rankCandidates([
    ...buildVerifiedCandidates(center, now),
    ...buildOsmCandidates(center, now, osmAttempts),
  ]);
  const selectedCandidates = selectCandidateSlots(allCandidates);
  const selectedSlots = buildSelectedSlots(selectedCandidates, allCandidates, osmFallback);
  const selectedIdsBySlot = markAcceptedCandidates(allCandidates, selectedSlots);
  const visibleItemsByMode = buildVisibleItemsByMode(selectedSlots, allCandidates);
  const auditCandidatesByMode = buildAuditCandidatesByMode(allCandidates);

  return {
    results: selectedSlots,
    selectedSlots,
    visibleItemsByMode,
    allCandidates,
    auditCandidates: allCandidates,
    auditCandidatesByMode,
    activeCenter: {
      coordinates: center,
      source: options.centerSource ?? "browser",
      searchText: options.manualSearchText ?? null,
      geocodedLabel: options.geocodedLabel ?? null,
      geocodedAddress: options.geocodedAddress ?? null,
    },
    calculatedAtIso: now.toISOString(),
    timeZone: ROMANIA_TIME_ZONE,
    osmFallback,
    summary: summarizeAudit(selectedSlots, allCandidates, selectedIdsBySlot),
  };
}

async function collectOsmAttempts(
  center: Coordinates,
  now: Date,
  options: BuildMedicalCareDecisionContextOptions,
) {
  const osmAttempts: OSMFallbackAttempt[] = [];

  await completeWithOsmFallback(center, emptyMedicalCareResults(), {
    fetcher: options.fetcher,
    now,
    radiiMeters: options.radiiMeters,
    timeoutMs: options.timeoutMs,
    onAttempt: (attempt) => osmAttempts.push(attempt),
  });

  return osmAttempts;
}

function summarizeOsmFallback(
  attempts: OSMFallbackAttempt[],
  timeoutMs: number | undefined,
): MedicalCareOsmFallbackStatus {
  const rawElements = attempts.reduce((total, attempt) => total + attempt.elements.length, 0);
  const timedOut = attempts.some((attempt) => attempt.error === "timeout");
  const hasError = attempts.some((attempt) => attempt.error === "error");
  const fallbackReason: MedicalCareFallbackReason | null =
    rawElements > 0
      ? null
      : timedOut
        ? "osm_timeout"
        : hasError
          ? "osm_error"
          : attempts.length
            ? "osm_no_results"
            : null;

  return {
    attemptedRadiiMeters: attempts.map((attempt) => attempt.radiusMeters),
    timeoutMs: timeoutMs ?? OSM_FALLBACK_TIMEOUT_MS,
    rawElements,
    fallbackReason,
    timedOut,
    externalDataAvailable: rawElements > 0,
  };
}

function buildVerifiedCandidates(center: Coordinates, now: Date): MedicalCareAuditCandidate[] {
  return verifiedMedicalLocations
    .map((location) => ({
      location,
      distanceMeters: Math.round(distanceMeters(center, location.coordinates)),
    }))
    .filter((item) => item.distanceMeters <= AUDIT_DISTANCE_LIMIT_METERS)
    .map(({ location, distanceMeters }) => {
      const isNonStop = location.isNonStop || isNonStopOpeningHours(location.openingHours);
      const openNow = location.openingHours
        ? isNonStop || isOpenAt(location.openingHours, now)
        : null;

      return createCandidate({
        id: location.id,
        name: location.name,
        placeType: location.type,
        source: toResultSource(location.source),
        sourceLabel: "Date verificate Santix",
        sourceUrl: location.sourceUrl,
        address: location.address,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        distanceMeters,
        phone: location.phone,
        openingHours: location.openingHours,
        openNow,
        isNonStop,
        confidence: location.confidence,
        emergencyCapability: location.emergencyCapability,
        rejectionReason: null,
      });
    });
}

function buildOsmCandidates(
  center: Coordinates,
  now: Date,
  osmAttempts: OSMFallbackAttempt[],
): MedicalCareAuditCandidate[] {
  const seen = new Set(verifiedMedicalLocations.map((location) => candidateKeyForVerified(location)));
  const candidates: MedicalCareAuditCandidate[] = [];

  for (const attempt of osmAttempts) {
    for (const element of attempt.elements) {
      const tags = element.tags ?? {};
      const coords = elementCoordinates(element);
      const placeType = detectPlaceType(tags);
      const name = cleanText(tags.name) ?? cleanText(tags.operator) ?? "Locație OSM";
      const id = `${element.type}-${element.id}`;

      if (!coords || !placeType) {
        candidates.push(
          createRejectedOsmCandidate(
            id,
            name,
            placeType ?? "pharmacy",
            "Respins: nu are coordonate sau tip medical utilizabil.",
          ),
        );
        continue;
      }

      const text = searchableText(tags, name);
      const key = candidateKey(placeType, name, coords);
      const isDuplicate = seen.has(key);
      seen.add(key);

      const onlineOrVeterinary = isOnlineOrVeterinary(text);
      const irrelevant = isIrrelevantMedicalResult(placeType, text);
      const emergencyCapability =
        placeType === "hospital" && isEmergencyHospitalText(text)
          ? "probable_emergency"
          : "none";
      const openingHours = cleanText(tags.opening_hours) ?? null;
      const isNonStop = isNonStopOpeningHours(openingHours);
      const openNow = openingHours ? isNonStop || isOpenAt(openingHours, now) : null;

      let rejectionReason: string | null = null;
      if (isDuplicate) {
        rejectionReason = "Respins: duplicat OSM.";
      } else if (onlineOrVeterinary) {
        rejectionReason = "Respins: rezultat online sau veterinar.";
      } else if (irrelevant) {
        rejectionReason = "Respins: clinică irelevantă pentru ajutor imediat.";
      } else if (placeType === "hospital" && emergencyCapability === "none") {
        rejectionReason = "Respins pentru slotul de urgențe: spital fără semnal clar de urgență.";
      }

      candidates.push(
        createCandidate({
          id,
          name,
          placeType,
          source: "osm_fallback",
          sourceLabel: "Date OSM / parțial verificate",
          sourceUrl: "https://www.openstreetmap.org/",
          address: buildAddress(tags),
          lat: coords.lat,
          lng: coords.lng,
          distanceMeters: Math.round(distanceMeters(center, coords)),
          phone: cleanText(tags.phone) ?? cleanText(tags["contact:phone"]) ?? null,
          openingHours,
          openNow,
          isNonStop,
          confidence: "low",
          emergencyCapability,
          rejectionReason,
        }),
      );
    }
  }

  return candidates;
}

function createCandidate(
  candidate: Omit<
    MedicalCareAuditCandidate,
    "accepted" | "acceptedSlot" | "reason" | "scores" | "score" | "rank" | "interpretedSchedule"
  > & {
    openNow: boolean | null;
    isNonStop: boolean;
    openingHours: string | null;
  },
): MedicalCareAuditCandidate {
  return {
    ...candidate,
    interpretedSchedule: interpretedScheduleLabel(
      candidate.openNow,
      candidate.isNonStop,
      candidate.openingHours,
    ),
    accepted: false,
    acceptedSlot: null,
    reason: candidate.rejectionReason ?? "Analizată pentru scor și proximitate.",
    scores: {},
    score: null,
    rank: null,
  };
}

function createRejectedOsmCandidate(
  id: string,
  name: string,
  placeType: MedicalCarePlaceType,
  reason: string,
): MedicalCareAuditCandidate {
  return createCandidate({
    id,
    name,
    placeType,
    source: "osm_fallback",
    sourceLabel: "Date OSM / parțial verificate",
    sourceUrl: "https://www.openstreetmap.org/",
    address: null,
    lat: null,
    lng: null,
    distanceMeters: null,
    phone: null,
    openingHours: null,
    openNow: null,
    isNonStop: false,
    confidence: "low",
    emergencyCapability: "none",
    rejectionReason: reason,
  });
}

function rankCandidates(candidates: MedicalCareAuditCandidate[]) {
  addScore(candidates, "open_pharmacy", scoreOpenPharmacy);
  addScore(candidates, "nonstop_pharmacy", scoreNonstopPharmacy);
  addScore(candidates, "emergency_hospital", scoreEmergencyHospital);

  return candidates
    .map((candidate) => {
      const rankedScores = Object.values(candidate.scores);
      const bestScore = rankedScores.length
        ? rankedScores.reduce((best, score) => (score.score < best.score ? score : best))
        : null;

      return {
        ...candidate,
        score: bestScore?.score ?? null,
        rank: bestScore?.rank ?? null,
        reason: candidate.rejectionReason ?? generalCandidateReason(candidate),
      };
    })
    .sort(sortAuditCandidates);
}

function addScore(
  candidates: MedicalCareAuditCandidate[],
  category: MedicalCareCategory,
  scoreFn: (candidate: MedicalCareAuditCandidate) => CandidateScore | null,
) {
  const scored = candidates
    .map((candidate) => ({ candidate, score: scoreFn(candidate) }))
    .filter(
      (item): item is { candidate: MedicalCareAuditCandidate; score: CandidateScore } =>
        item.score !== null,
    )
    .sort((first, second) => first.score.score - second.score.score);

  scored.forEach((item, index) => {
    item.candidate.scores[category] = {
      ...item.score,
      rank: index + 1,
    };
  });
}

function scoreOpenPharmacy(candidate: MedicalCareAuditCandidate): CandidateScore | null {
  if (candidate.placeType !== "pharmacy" || candidate.rejectionReason) return null;
  if (!candidate.openingHours || candidate.openNow !== true) return null;
  if (candidate.distanceMeters === null) return null;

  const score =
    candidate.distanceMeters -
    sourceBonusForOpenPharmacy(candidate.source) -
    confidenceBonus(candidate.confidence) -
    phoneBonus(candidate.phone);

  return {
    category: "open_pharmacy",
    score: Math.max(0, Math.round(score)),
    rank: null,
    reason: "Eligibilă: are program cunoscut și este deschisă acum.",
  };
}

function scoreNonstopPharmacy(candidate: MedicalCareAuditCandidate): CandidateScore | null {
  if (candidate.placeType !== "pharmacy" || candidate.rejectionReason) return null;
  if (!candidate.isNonStop || candidate.distanceMeters === null) return null;

  const score =
    candidate.distanceMeters -
    sourceBonusForNonstopPharmacy(candidate.source) -
    confidenceBonus(candidate.confidence) -
    phoneBonus(candidate.phone);

  return {
    category: "nonstop_pharmacy",
    score: Math.max(0, Math.round(score)),
    rank: null,
    reason: "Eligibilă: este Non-Stop.",
  };
}

function scoreEmergencyHospital(candidate: MedicalCareAuditCandidate): CandidateScore | null {
  if (candidate.placeType !== "hospital" || candidate.rejectionReason) return null;
  if (candidate.emergencyCapability === "none" || candidate.distanceMeters === null) return null;

  const score =
    emergencyPriority(candidate.emergencyCapability) * 100000 +
    sourcePriorityForHospital(candidate.source) * 5000 +
    candidate.distanceMeters;

  return {
    category: "emergency_hospital",
    score: Math.max(0, Math.round(score)),
    rank: null,
    reason: "Eligibil: are semnal de urgențe probabile sau verificate.",
  };
}

function selectCandidateSlots(candidates: MedicalCareAuditCandidate[]): SelectedCandidateSlots {
  const selectedOpen = rankedCandidatesFor(candidates, "open_pharmacy")[0];
  const selectedNonstop = rankedCandidatesFor(candidates, "nonstop_pharmacy").find(
    (candidate) => !selectedOpen || !isSameCandidatePlace(candidate, selectedOpen),
  );
  const selectedHospital = rankedCandidatesFor(candidates, "emergency_hospital")[0];

  return {
    open_pharmacy: selectedOpen,
    nonstop_pharmacy: selectedNonstop,
    emergency_hospital: selectedHospital,
  };
}

function buildSelectedSlots(
  selectedCandidates: SelectedCandidateSlots,
  allCandidates: MedicalCareAuditCandidate[],
  osmFallback: MedicalCareOsmFallbackStatus,
): MedicalCareResult[] {
  const selectedOpen = selectedCandidates.open_pharmacy;
  const hasOnlySameNonstopCandidate =
    Boolean(selectedOpen?.scores.nonstop_pharmacy) &&
    !rankedCandidatesFor(allCandidates, "nonstop_pharmacy").some(
      (candidate) => !isSameCandidatePlace(candidate, selectedOpen),
    );

  return [
    selectedCandidates.open_pharmacy
      ? candidateToResult(
          "open_pharmacy",
          selectedCandidates.open_pharmacy,
          selectionReasonForOpenPharmacy(
            selectedCandidates.open_pharmacy,
            allCandidates,
            osmFallback,
          ),
        )
      : unavailableResult("open_pharmacy", "no_open_pharmacy"),
    selectedCandidates.nonstop_pharmacy
      ? candidateToResult(
          "nonstop_pharmacy",
          selectedCandidates.nonstop_pharmacy,
          selectionReasonForNonstop(selectedCandidates.nonstop_pharmacy, osmFallback),
        )
      : unavailableResult(
          "nonstop_pharmacy",
          hasOnlySameNonstopCandidate ? "no_different_nonstop_pharmacy" : "no_nonstop_pharmacy",
        ),
    selectedCandidates.emergency_hospital
      ? candidateToResult(
          "emergency_hospital",
          selectedCandidates.emergency_hospital,
          selectionReasonForHospital(selectedCandidates.emergency_hospital),
        )
      : unavailableResult("emergency_hospital", "no_emergency_hospital"),
  ];
}

function markAcceptedCandidates(
  candidates: MedicalCareAuditCandidate[],
  selectedSlots: MedicalCareResult[],
) {
  const selectedIdsBySlot = new Map<MedicalCareCategory, string>();

  for (const slot of selectedSlots) {
    if (!slot.available) continue;
    selectedIdsBySlot.set(slot.category, slot.id);
    const candidate = candidates.find((item) => item.id === slot.id);
    if (!candidate) continue;
    candidate.accepted = true;
    candidate.acceptedSlot = slot.category;
    candidate.reason = slot.selectionReason ?? candidate.reason;
  }

  for (const candidate of candidates) {
    if (candidate.accepted || candidate.rejectionReason) continue;
    candidate.reason = nonSelectedReason(candidate);
  }

  return selectedIdsBySlot;
}

function buildVisibleItemsByMode(
  selectedSlots: MedicalCareResult[],
  candidates: MedicalCareAuditCandidate[],
): Record<MedicalCareViewMode, MedicalCareResult[]> {
  return {
    recommended: selectedSlots,
    open_pharmacies: rankedCandidatesFor(candidates, "open_pharmacy")
      .slice(0, TAB_VISIBLE_LIMIT)
      .map((candidate) =>
        candidateToResult(
          "open_pharmacy",
          candidate,
          tabReasonForCandidate("open_pharmacy", candidate),
        ),
      ),
    nonstop_pharmacies: rankedCandidatesFor(candidates, "nonstop_pharmacy")
      .slice(0, TAB_VISIBLE_LIMIT)
      .map((candidate) =>
        candidateToResult("nonstop_pharmacy", candidate, tabReasonForCandidate("nonstop_pharmacy", candidate)),
      ),
    emergency_hospitals: rankedCandidatesFor(candidates, "emergency_hospital")
      .slice(0, TAB_VISIBLE_LIMIT)
      .map((candidate) =>
        candidateToResult("emergency_hospital", candidate, tabReasonForCandidate("emergency_hospital", candidate)),
      ),
  };
}

function buildAuditCandidatesByMode(
  candidates: MedicalCareAuditCandidate[],
): Record<MedicalCareViewMode, MedicalCareAuditCandidate[]> {
  return {
    recommended: candidates,
    open_pharmacies: candidates
      .filter((candidate) => candidate.placeType === "pharmacy" && candidate.openNow === true)
      .sort(sortByScoreFor("open_pharmacy")),
    nonstop_pharmacies: candidates
      .filter((candidate) => candidate.placeType === "pharmacy" && candidate.isNonStop)
      .sort(sortByScoreFor("nonstop_pharmacy")),
    emergency_hospitals: candidates
      .filter((candidate) => candidate.placeType === "hospital")
      .sort(sortByScoreFor("emergency_hospital")),
  };
}

function candidateToResult(
  category: MedicalCareCategory,
  candidate: MedicalCareAuditCandidate,
  selectionReason: string,
): MedicalCareFoundResult {
  return {
    available: true,
    id: candidate.id,
    category,
    placeType: candidate.placeType,
    name: candidate.name,
    lat: candidate.lat ?? 0,
    lng: candidate.lng ?? 0,
    distanceMeters: candidate.distanceMeters ?? 0,
    address: candidate.address,
    phone: candidate.phone,
    openingHours: candidate.openingHours,
    status:
      category === "open_pharmacy"
        ? "open_now"
        : category === "nonstop_pharmacy"
          ? "nonstop"
          : "emergency_unit",
    source: candidate.source,
    sourceLabel: candidate.sourceLabel,
    sourceUrl: candidate.sourceUrl,
    confidence: candidate.confidence,
    emergencyCapability:
      category === "emergency_hospital" ? candidate.emergencyCapability : "none",
    selectionReason,
  };
}

function unavailableResult(
  category: MedicalCareCategory,
  reason: MedicalCareMissingReason,
): MedicalCareResult {
  return {
    available: false,
    category,
    placeType: category === "emergency_hospital" ? "hospital" : "pharmacy",
    status: "not_found",
    reason,
  };
}

function emptyMedicalCareResults(): MedicalCareResult[] {
  return [
    unavailableResult("open_pharmacy", "no_open_pharmacy"),
    unavailableResult("nonstop_pharmacy", "no_nonstop_pharmacy"),
    unavailableResult("emergency_hospital", "no_emergency_hospital"),
  ];
}

function rankedCandidatesFor(
  candidates: MedicalCareAuditCandidate[],
  category: MedicalCareCategory,
) {
  return candidates
    .filter((candidate) => candidate.scores[category])
    .sort((first, second) => {
      const firstScore = first.scores[category]?.score ?? Number.POSITIVE_INFINITY;
      const secondScore = second.scores[category]?.score ?? Number.POSITIVE_INFINITY;
      return firstScore - secondScore;
    });
}

function selectionReasonForOpenPharmacy(
  candidate: MedicalCareAuditCandidate,
  allCandidates: MedicalCareAuditCandidate[],
  osmFallback: MedicalCareOsmFallbackStatus,
) {
  if (isFarVerifiedResultAfterOsmTimeout(candidate, osmFallback)) {
    return "Aleasă din date verificate Santix. Datele externe nu au răspuns la timp, deci rezultatul poate fi mai îndepărtat.";
  }

  const openCandidates = rankedCandidatesFor(allCandidates, "open_pharmacy");
  const isNearest = !openCandidates.some(
    (item) =>
      item.id !== candidate.id &&
      (item.distanceMeters ?? Number.POSITIVE_INFINITY) <
        (candidate.distanceMeters ?? Number.POSITIVE_INFINITY),
  );

  if (isNearest) {
    if (candidate.isNonStop) {
      return "Aleasă pentru că este cea mai apropiată farmacie Non-Stop deschisă acum.";
    }

    return "Aleasă pentru că este cea mai apropiată farmacie deschisă acum dintre candidații cu program cunoscut.";
  }

  if (candidate.source === "manual_verified") {
    return "Aleasă pentru că este o farmacie verificată Santix deschisă acum și are cel mai bun scor disponibil.";
  }

  return "Aleasă pentru că are cel mai bun scor pentru o farmacie deschisă acum: distanță, program cunoscut, telefon și sursă.";
}

function selectionReasonForNonstop(
  candidate: MedicalCareAuditCandidate,
  osmFallback: MedicalCareOsmFallbackStatus,
) {
  if (isFarVerifiedResultAfterOsmTimeout(candidate, osmFallback)) {
    return "Aleasă din date verificate Santix. Datele externe nu au răspuns la timp, deci farmacia Non-Stop poate fi mai îndepărtată.";
  }

  if (candidate.source !== "manual_verified") {
    return "Aleasă ca alternativă Non-Stop diferită de recomandarea principală.";
  }

  return candidate.source === "manual_verified"
    ? "Aleasă ca alternativă Non-Stop verificată Santix, diferită de recomandarea principală."
    : "Aleasă ca alternativă Non-Stop diferită de recomandarea principală.";
}

function selectionReasonForHospital(candidate: MedicalCareAuditCandidate) {
  switch (candidate.emergencyCapability) {
    case "upu_verified":
      return "Aleasă pentru că are UPU verificat.";
    case "cpu_verified":
      return "Aleasă pentru că are CPU verificat.";
    case "emergency_hospital_verified":
      return "Aleasă pentru că are urgențe verificate.";
    default:
      return "Aleasă ca spital apropiat cu urgențe probabile.";
  }
}

function tabReasonForCandidate(
  category: MedicalCareCategory,
  candidate: MedicalCareAuditCandidate,
) {
  const score = candidate.scores[category];
  const rank = score?.rank ? `#${score.rank}` : "";

  if (category === "open_pharmacy") {
    return `Candidat ${rank} pentru farmacii deschise acum: program cunoscut, distanță, telefon și sursă.`;
  }

  if (category === "nonstop_pharmacy") {
    return `Candidat ${rank} pentru farmacii Non-Stop: confirmare 24/7, sursă, distanță și telefon.`;
  }

  return `Candidat ${rank} pentru spitale/urgențe: nivel de urgență, sursă și distanță.`;
}

function isFarVerifiedResultAfterOsmTimeout(
  candidate: MedicalCareAuditCandidate,
  osmFallback: MedicalCareOsmFallbackStatus,
) {
  return (
    candidate.source === "manual_verified" &&
    (candidate.distanceMeters ?? 0) >= 3000 &&
    osmFallback.fallbackReason === "osm_timeout"
  );
}

function nonSelectedReason(candidate: MedicalCareAuditCandidate) {
  if (candidate.placeType === "pharmacy") {
    if (!candidate.openingHours) return "Respins pentru farmacie deschisă: nu are program cunoscut.";
    if (candidate.openNow !== true && !candidate.isNonStop) {
      return "Respins pentru farmacie deschisă: nu este deschisă la ora calculului.";
    }
  }

  if (candidate.score !== null && candidate.rank !== null) {
    return "Analizată, dar o altă locație a avut scor/rank mai bun pentru slotul relevant.";
  }

  return "Analizată, dar nu a fost eligibilă pentru cele 3 sloturi finale.";
}

function generalCandidateReason(candidate: MedicalCareAuditCandidate) {
  const score = candidate.scores.open_pharmacy ??
    candidate.scores.nonstop_pharmacy ??
    candidate.scores.emergency_hospital;

  return score?.reason ?? candidate.rejectionReason ?? "Analizată pentru scor și proximitate.";
}

function summarizeAudit(
  selectedSlots: MedicalCareResult[],
  auditCandidates: MedicalCareAuditCandidate[],
  selectedIdsBySlot: Map<MedicalCareCategory, string>,
): MedicalCareDecisionSummary {
  return {
    analyzedLocations: auditCandidates.length,
    pharmaciesFound: auditCandidates.filter((candidate) => candidate.placeType === "pharmacy").length,
    pharmaciesWithSchedule: auditCandidates.filter(
      (candidate) => candidate.placeType === "pharmacy" && Boolean(candidate.openingHours),
    ).length,
    pharmaciesOpenNow: auditCandidates.filter(
      (candidate) => candidate.placeType === "pharmacy" && candidate.openNow === true,
    ).length,
    selectedResults:
      selectedSlots.filter((result) => result.available).length || selectedIdsBySlot.size,
    rejectedDuplicates: auditCandidates.filter((candidate) => candidate.reason.includes("duplicat")).length,
    rejectedIrrelevant: auditCandidates.filter((candidate) => candidate.reason.includes("irelevant")).length,
    rejectedOnlineOrVeterinary: auditCandidates.filter(
      (candidate) => candidate.reason.includes("online") || candidate.reason.includes("veterinar"),
    ).length,
  };
}

function interpretedScheduleLabel(
  openNow: boolean | null,
  isNonStop: boolean,
  openingHours: string | null,
) {
  if (!openingHours) return "Program necunoscut";
  if (isNonStop) return "Non-Stop";
  if (openNow) return "Deschis acum";
  return "Închis acum";
}

function sourceBonusForOpenPharmacy(source: MedicalCareResultSource) {
  if (source === "manual_verified") return 120;
  if (source === "official_registry" || source === "dsp") return 90;
  return 0;
}

function sourceBonusForNonstopPharmacy(source: MedicalCareResultSource) {
  if (source === "manual_verified") return Math.min(650, MAX_SOURCE_BONUS_DISTANCE_SWING_METERS);
  if (source === "official_registry" || source === "dsp") {
    return Math.min(500, MAX_SOURCE_BONUS_DISTANCE_SWING_METERS);
  }
  return 0;
}

function sourcePriorityForHospital(source: MedicalCareResultSource) {
  if (source === "manual_verified" || source === "official_registry" || source === "dsp") {
    return 0;
  }
  return 1;
}

function confidenceBonus(confidence: MedicalCareResultConfidence) {
  if (confidence === "high") return 50;
  if (confidence === "medium") return 25;
  return 0;
}

function phoneBonus(phone: string | null) {
  return phone ? 60 : 0;
}

function emergencyPriority(capability: MedicalCareEmergencyCapability) {
  switch (capability) {
    case "upu_verified":
      return 0;
    case "cpu_verified":
      return 1;
    case "emergency_hospital_verified":
      return 2;
    case "probable_emergency":
      return 3;
    default:
      return 4;
  }
}

function sortAuditCandidates(first: MedicalCareAuditCandidate, second: MedicalCareAuditCandidate) {
  if (first.accepted !== second.accepted) return first.accepted ? -1 : 1;
  if (first.placeType !== second.placeType) return first.placeType === "pharmacy" ? -1 : 1;
  return (first.distanceMeters ?? Number.POSITIVE_INFINITY) -
    (second.distanceMeters ?? Number.POSITIVE_INFINITY);
}

function sortByScoreFor(category: MedicalCareCategory) {
  return (first: MedicalCareAuditCandidate, second: MedicalCareAuditCandidate) => {
    const firstScore = first.scores[category]?.score ?? Number.POSITIVE_INFINITY;
    const secondScore = second.scores[category]?.score ?? Number.POSITIVE_INFINITY;
    if (firstScore !== secondScore) return firstScore - secondScore;
    return (first.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (second.distanceMeters ?? Number.POSITIVE_INFINITY);
  };
}

function isSameCandidatePlace(
  first: MedicalCareAuditCandidate,
  second: MedicalCareAuditCandidate | null | undefined,
) {
  if (!second) return false;
  if (first.id === second.id) return true;
  if (first.placeType !== second.placeType) return false;
  if (
    first.lat === null ||
    first.lng === null ||
    second.lat === null ||
    second.lng === null
  ) {
    return false;
  }

  const sameName = normalizeName(first.name) === normalizeName(second.name);
  const closeEnough =
    distanceMeters(
      { lat: first.lat, lng: first.lng },
      { lat: second.lat, lng: second.lng },
    ) <= 80;

  return sameName && closeEnough;
}

function elementCoordinates(element: OverpassElement): Coordinates | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function detectPlaceType(tags: Record<string, string>): MedicalCarePlaceType | null {
  const amenity = tags.amenity?.toLowerCase();
  const healthcare = tags.healthcare?.toLowerCase();
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "hospital" || healthcare === "hospital") return "hospital";
  return null;
}

function isOnlineOrVeterinary(text: string) {
  return /(farmacie online|online pharmacy|\bonline\b|e-?shop|veterinar|veterinary|\bvet\b|pet\s|animal|canin|felin)/i.test(text);
}

function isIrrelevantMedicalResult(placeType: MedicalCarePlaceType, text: string) {
  if (placeType === "pharmacy") return false;
  return /(stomatolog|stomatologie|dentar|dentist|cabinet dentar|clinica dentara|laborator analize|imagistica|radiologie|dializa|recuperare|kineto|estetic|policlinica|clinica privata)/i.test(text);
}

function isEmergencyHospitalText(text: string) {
  return /(\bupu\b|unitate de primiri urgente|primiri urgente|camera de garda|departament(?:ul)? de urgenta|spital(?:ul)?[^;,.]*\burgenta\b|\burgenta\b[^;,.]*spital|emergency department|emergency room)/.test(
    text,
  );
}

function searchableText(tags: Record<string, string>, name: string) {
  return normalizeName(
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
      tags.emergency,
      tags["healthcare:speciality"],
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildAddress(tags: Record<string, string>) {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

function candidateKeyForVerified(location: VerifiedMedicalLocation) {
  return candidateKey(location.type, location.name, location.coordinates);
}

function candidateKey(placeType: MedicalCarePlaceType, name: string, coords: Coordinates) {
  return `${placeType}:${normalizeName(name)}:${coords.lat.toFixed(5)}:${coords.lng.toFixed(5)}`;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanText(value: string | undefined) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function toResultSource(source: VerifiedMedicalLocation["source"]): MedicalCareResultSource {
  return source;
}
