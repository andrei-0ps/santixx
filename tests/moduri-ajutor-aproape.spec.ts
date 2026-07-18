import { expect, test } from "@playwright/test";
import {
  filterMedicalCareResultsByMode,
  getMedicalCareModeLabel,
  MEDICAL_CARE_VIEW_MODES,
} from "../src/lib/moduriAjutorAproape";
import type { MedicalCareFoundResult, MedicalCareResult } from "../src/lib/medical-care.logic";

const baseResult = {
  available: true,
  placeType: "pharmacy",
  name: "Farmacie test",
  lat: 44.4,
  lng: 26.1,
  distanceMeters: 120,
  address: null,
  phone: null,
  openingHours: "24/7",
  source: "manual_verified",
  sourceLabel: "Date verificate Santix",
  sourceUrl: "https://example.test",
  confidence: "high",
  emergencyCapability: "none",
} satisfies Omit<MedicalCareFoundResult, "id" | "category" | "status">;

const results: MedicalCareResult[] = [
  {
    ...baseResult,
    id: "open",
    category: "open_pharmacy",
    status: "open_now",
  },
  {
    ...baseResult,
    id: "nonstop",
    category: "nonstop_pharmacy",
    status: "nonstop",
  },
  {
    ...baseResult,
    id: "hospital",
    placeType: "hospital",
    category: "emergency_hospital",
    status: "emergency_unit",
    emergencyCapability: "probable_emergency",
  },
];

test("nearby care exposes the expected view modes", () => {
  expect(MEDICAL_CARE_VIEW_MODES).toEqual([
    "recommended",
    "open_pharmacies",
    "nonstop_pharmacies",
    "emergency_hospitals",
  ]);
  expect(getMedicalCareModeLabel("recommended", "ro")).toBe("Recomandat acum");
  expect(getMedicalCareModeLabel("open_pharmacies", "ro")).toBe("Farmacii deschise");
  expect(getMedicalCareModeLabel("nonstop_pharmacies", "ro")).toBe("Farmacii Non-Stop");
  expect(getMedicalCareModeLabel("emergency_hospitals", "ro")).toBe("Spitale/urgențe");
});

test("nearby care modes keep recommended as three slots and filter specific categories", () => {
  expect(filterMedicalCareResultsByMode(results, "recommended")).toHaveLength(3);
  expect(filterMedicalCareResultsByMode(results, "open_pharmacies")).toEqual([results[0]]);
  expect(filterMedicalCareResultsByMode(results, "nonstop_pharmacies")).toEqual([results[1]]);
  expect(filterMedicalCareResultsByMode(results, "emergency_hospitals")).toEqual([results[2]]);
});
