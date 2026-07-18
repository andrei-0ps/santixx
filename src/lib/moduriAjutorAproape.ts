import type { MedicalCareCategory, MedicalCareResult } from "@/lib/medical-care.logic";

export type MedicalCareViewMode =
  | "recommended"
  | "open_pharmacies"
  | "nonstop_pharmacies"
  | "emergency_hospitals";

export type MedicalCareModeLanguage = "ro" | "en";

export const MEDICAL_CARE_VIEW_MODES = [
  "recommended",
  "open_pharmacies",
  "nonstop_pharmacies",
  "emergency_hospitals",
] satisfies readonly MedicalCareViewMode[];

const modeLabels = {
  ro: {
    recommended: "Recomandat acum",
    open_pharmacies: "Farmacii deschise",
    nonstop_pharmacies: "Farmacii Non-Stop",
    emergency_hospitals: "Spitale/urgențe",
  },
  en: {
    recommended: "Recommended now",
    open_pharmacies: "Open pharmacies",
    nonstop_pharmacies: "24/7 pharmacies",
    emergency_hospitals: "Hospitals/emergency",
  },
} satisfies Record<MedicalCareModeLanguage, Record<MedicalCareViewMode, string>>;

const modeCategory: Partial<Record<MedicalCareViewMode, MedicalCareCategory>> = {
  open_pharmacies: "open_pharmacy",
  nonstop_pharmacies: "nonstop_pharmacy",
  emergency_hospitals: "emergency_hospital",
};

export function getMedicalCareModeLabel(
  mode: MedicalCareViewMode,
  lang: MedicalCareModeLanguage,
) {
  return modeLabels[lang][mode];
}

export function filterMedicalCareResultsByMode(
  results: MedicalCareResult[],
  mode: MedicalCareViewMode,
) {
  if (mode === "recommended") return results;

  const category = modeCategory[mode];
  return category ? results.filter((result) => result.category === category) : results;
}

export function modeCategoryFor(mode: MedicalCareViewMode) {
  return modeCategory[mode] ?? null;
}
