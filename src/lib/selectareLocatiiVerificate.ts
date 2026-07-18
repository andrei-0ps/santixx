import { verifiedMedicalLocations, type VerifiedMedicalLocation } from "@/data/locatiiMedicaleVerificate";
import {
  distanceMeters,
  isOpenAt,
  type MedicalCareCategory,
  type MedicalCareFoundResult,
  type MedicalCareMissingReason,
  type MedicalCareResult,
  type MedicalCareResultSource,
} from "@/lib/medical-care.logic";
import type { Coordinates } from "@/lib/medical-care.types";

const MAX_VERIFIED_DISTANCE_METERS = 30000;

type VerifiedCandidate = VerifiedMedicalLocation & {
  distanceMeters: number;
};

export function buildVerifiedMedicalCareResults(
  center: Coordinates,
  now = new Date(),
): MedicalCareResult[] {
  const candidates = verifiedMedicalLocations
    .map((location): VerifiedCandidate => ({
      ...location,
      distanceMeters: distanceMeters(center, location.coordinates),
    }))
    .filter((location) => location.distanceMeters <= MAX_VERIFIED_DISTANCE_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const nearestOpenPharmacy = candidates.find(
    (location) =>
      location.type === "pharmacy" &&
      location.capabilities.includes("open_pharmacy_candidate") &&
      (location.isNonStop || isOpenAt(location.openingHours, now)),
  );
  const nearestNonstopPharmacy = candidates.find(
    (location) =>
      location.type === "pharmacy" &&
      location.id !== nearestOpenPharmacy?.id &&
      location.isNonStop &&
      location.capabilities.includes("nonstop_pharmacy"),
  );
  const hasAnyDifferentNonstopPharmacy = candidates.some(
    (location) =>
      location.type === "pharmacy" &&
      location.id !== nearestOpenPharmacy?.id &&
      location.isNonStop &&
      location.capabilities.includes("nonstop_pharmacy"),
  );
  const nearestEmergencyHospital = candidates
    .filter(
      (location) =>
        location.type === "hospital" &&
        (location.capabilities.includes("emergency_care_verified") ||
          location.capabilities.includes("emergency_care_probable")),
    )
    .sort((a, b) => emergencyPriority(a) - emergencyPriority(b) || a.distanceMeters - b.distanceMeters)[0];

  return [
    verifiedCandidateToResult("open_pharmacy", nearestOpenPharmacy),
    verifiedCandidateToResult(
      "nonstop_pharmacy",
      nearestNonstopPharmacy,
      nearestOpenPharmacy?.isNonStop && !hasAnyDifferentNonstopPharmacy
        ? "no_different_nonstop_pharmacy"
        : undefined,
    ),
    verifiedCandidateToResult("emergency_hospital", nearestEmergencyHospital),
  ];
}

function verifiedCandidateToResult(
  category: MedicalCareCategory,
  candidate: VerifiedCandidate | undefined,
  missingReason?: MedicalCareMissingReason,
): MedicalCareResult {
  if (!candidate) {
    return {
      available: false,
      category,
      placeType: category === "emergency_hospital" ? "hospital" : "pharmacy",
      status: "not_found",
      reason: missingReason ?? missingReasonFor(category),
    };
  }

  return {
    available: true,
    id: candidate.id,
    category,
    placeType: candidate.type,
    name: candidate.name,
    lat: candidate.coordinates.lat,
    lng: candidate.coordinates.lng,
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
    source: toResultSource(candidate.source),
    sourceLabel: candidate.sourceLabel,
    sourceUrl: candidate.sourceUrl,
    confidence: candidate.confidence,
    emergencyCapability: candidate.emergencyCapability,
  };
}

function missingReasonFor(category: MedicalCareCategory): MedicalCareMissingReason {
  return category === "open_pharmacy"
    ? "no_open_pharmacy"
    : category === "nonstop_pharmacy"
      ? "no_nonstop_pharmacy"
      : "no_emergency_hospital";
}

function emergencyPriority(candidate: VerifiedCandidate) {
  switch (candidate.emergencyCapability) {
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

function toResultSource(source: VerifiedMedicalLocation["source"]): MedicalCareResultSource {
  return source;
}
