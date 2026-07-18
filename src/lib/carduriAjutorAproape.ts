import type {
  MedicalCareCategory,
  MedicalCareFoundResult,
  MedicalCareMissingReason,
  MedicalCareResult,
} from "@/lib/medical-care.logic";
import { isNonStopOpeningHours } from "@/lib/medical-care.logic";

export type MedicalCareCardLanguage = "ro" | "en";

export const MEDICAL_CARE_CARD_CATEGORIES = [
  "open_pharmacy",
  "nonstop_pharmacy",
  "emergency_hospital",
] satisfies readonly MedicalCareCategory[];

const cardLabels = {
  ro: {
    categories: {
      open_pharmacy: "Farmacie deschisă acum",
      open_nonstop_pharmacy: "Farmacie Non-Stop deschisă acum",
      nonstop_pharmacy: "Altă farmacie Non-Stop",
      emergency_hospital: "Spital apropiat / urgențe",
    },
    status: {
      open_now: "Deschis acum",
      nonstop: "Non-Stop",
      upu_verified: "UPU verificat",
      cpu_verified: "CPU verificat",
      emergency_hospital_verified: "Urgențe verificate",
      probable_emergency: "Urgențe probabile",
      nearby_hospital: "Spital apropiat",
      not_found: "Nu a fost găsit",
    },
    source: {
      santix: "Date verificate Santix",
      osm: "Date OSM",
      official: "Sursă oficială",
    },
    missing: {
      no_open_pharmacy: "Nu am găsit o farmacie deschisă verificabilă în zona ta.",
      no_different_open_pharmacy:
        "Nu am găsit altă farmacie deschisă verificabilă în zona ta.",
      no_nonstop_pharmacy: "Nu am găsit o farmacie Non-Stop verificabilă în zona ta.",
      no_different_nonstop_pharmacy:
        "Nu am găsit altă farmacie Non-Stop verificabilă în zona ta.",
      no_emergency_hospital: "Nu am găsit un spital relevant în zona selectată.",
    } satisfies Record<MedicalCareMissingReason, string>,
    safety:
      "Santix oferă orientare educațională și informații de proximitate. În situații grave sau cu risc imediat, contactează serviciile de urgență.",
  },
  en: {
    categories: {
      open_pharmacy: "Open pharmacy now",
      open_nonstop_pharmacy: "Open 24/7 pharmacy now",
      nonstop_pharmacy: "Alternative 24/7 pharmacy",
      emergency_hospital: "Nearby hospital / emergency",
    },
    status: {
      open_now: "Open now",
      nonstop: "24/7",
      upu_verified: "Verified ER",
      cpu_verified: "Verified urgent care",
      emergency_hospital_verified: "Verified emergency care",
      probable_emergency: "Probable emergency care",
      nearby_hospital: "Nearby hospital",
      not_found: "Not found",
    },
    source: {
      santix: "Santix verified data",
      osm: "OSM data",
      official: "Official source",
    },
    missing: {
      no_open_pharmacy: "No verifiable open pharmacy was found in your area.",
      no_different_open_pharmacy:
        "No other verifiable open pharmacy was found in your area.",
      no_nonstop_pharmacy: "No verifiable 24/7 pharmacy was found in your area.",
      no_different_nonstop_pharmacy:
        "No other verifiable 24/7 pharmacy was found in your area.",
      no_emergency_hospital: "No relevant hospital was found in the selected area.",
    } satisfies Record<MedicalCareMissingReason, string>,
    safety:
      "Santix provides educational orientation and proximity information. In serious situations or immediate risk, contact emergency services.",
  },
} as const;

export function orderMedicalCareCardResults(results: MedicalCareResult[]) {
  return MEDICAL_CARE_CARD_CATEGORIES.map(
    (category) =>
      results.find((result) => result.category === category) ?? unavailableResultFor(category),
  );
}

export function getMedicalCareCardCategoryLabel(
  category: MedicalCareCategory,
  lang: MedicalCareCardLanguage,
  result?: MedicalCareResult,
) {
  if (
    category === "open_pharmacy" &&
    result?.available &&
    isNonStopOpeningHours(result.openingHours)
  ) {
    return cardLabels[lang].categories.open_nonstop_pharmacy;
  }

  return cardLabels[lang].categories[category];
}

export function getMedicalCareCardMissingMessage(
  reason: MedicalCareMissingReason,
  lang: MedicalCareCardLanguage,
) {
  return cardLabels[lang].missing[reason];
}

export function getMedicalCareSourceBadgeLabel(
  result: MedicalCareFoundResult,
  lang: MedicalCareCardLanguage,
) {
  if (result.source === "manual_verified") return cardLabels[lang].source.santix;
  if (result.source === "osm" || result.source === "osm_fallback") {
    return cardLabels[lang].source.osm;
  }

  return cardLabels[lang].source.official;
}

export function getMedicalCareStatusBadgeLabel(
  result: MedicalCareFoundResult,
  lang: MedicalCareCardLanguage,
) {
  return getMedicalCareStatusBadgeLabels(result, lang)[0];
}

export function getMedicalCareStatusBadgeLabels(
  result: MedicalCareFoundResult,
  lang: MedicalCareCardLanguage,
) {
  if (result.category === "open_pharmacy") {
    return isNonStopOpeningHours(result.openingHours)
      ? [cardLabels[lang].status.open_now, cardLabels[lang].status.nonstop]
      : [cardLabels[lang].status.open_now];
  }

  if (result.category === "nonstop_pharmacy") return [cardLabels[lang].status.nonstop];

  if (result.source === "osm" || result.source === "osm_fallback") {
    return result.emergencyCapability === "probable_emergency"
      ? [cardLabels[lang].status.probable_emergency]
      : [cardLabels[lang].status.nearby_hospital];
  }

  switch (result.emergencyCapability) {
    case "upu_verified":
      return [cardLabels[lang].status.upu_verified];
    case "cpu_verified":
      return [cardLabels[lang].status.cpu_verified];
    case "emergency_hospital_verified":
      return [cardLabels[lang].status.emergency_hospital_verified];
    case "probable_emergency":
      return [cardLabels[lang].status.probable_emergency];
    default:
      return [cardLabels[lang].status.nearby_hospital];
  }
}

export function getMedicalCareNotFoundLabel(lang: MedicalCareCardLanguage) {
  return cardLabels[lang].status.not_found;
}

export function getMedicalCareSafetyNote(lang: MedicalCareCardLanguage) {
  return cardLabels[lang].safety;
}

function unavailableResultFor(category: MedicalCareCategory): MedicalCareResult {
  return {
    available: false,
    category,
    placeType: category === "emergency_hospital" ? "hospital" : "pharmacy",
    status: "not_found",
    reason: missingReasonFor(category),
  };
}

function missingReasonFor(category: MedicalCareCategory): MedicalCareMissingReason {
  return category === "open_pharmacy"
    ? "no_open_pharmacy"
    : category === "nonstop_pharmacy"
      ? "no_nonstop_pharmacy"
      : "no_emergency_hospital";
}
