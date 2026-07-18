import { expect, test } from "@playwright/test";
import {
  getMedicalCareCardCategoryLabel,
  getMedicalCareCardMissingMessage,
  getMedicalCareSafetyNote,
  getMedicalCareSourceBadgeLabel,
  getMedicalCareStatusBadgeLabel,
  getMedicalCareStatusBadgeLabels,
  orderMedicalCareCardResults,
} from "../src/lib/carduriAjutorAproape";
import type { MedicalCareFoundResult } from "../src/lib/medical-care.logic";

test("nearby care cards stay limited to the three decision slots", () => {
  const results = orderMedicalCareCardResults([
    foundResult({
      category: "emergency_hospital",
      placeType: "hospital",
      name: "Spital verificat",
      emergencyCapability: "upu_verified",
    }),
    foundResult({
      category: "open_pharmacy",
      placeType: "pharmacy",
      name: "Farmacie deschisa",
      status: "open_now",
    }),
    foundResult({
      category: "open_pharmacy",
      placeType: "pharmacy",
      name: "Farmacie duplicata care nu trebuie afisata",
      status: "open_now",
    }),
  ]);

  expect(results).toHaveLength(3);
  expect(results.map((result) => result.category)).toEqual([
    "open_pharmacy",
    "nonstop_pharmacy",
    "emergency_hospital",
  ]);
  expect(results[1]).toMatchObject({
    available: false,
    category: "nonstop_pharmacy",
    reason: "no_nonstop_pharmacy",
  });
});

test("nearby care cards use clear unavailable messages", () => {
  expect(getMedicalCareCardMissingMessage("no_different_open_pharmacy", "ro")).toBe(
    "Nu am găsit altă farmacie deschisă verificabilă în zona ta.",
  );
  expect(getMedicalCareCardMissingMessage("no_nonstop_pharmacy", "ro")).toBe(
    "Nu am găsit o farmacie Non-Stop verificabilă în zona ta.",
  );
  expect(getMedicalCareCardMissingMessage("no_different_nonstop_pharmacy", "ro")).toBe(
    "Nu am găsit altă farmacie Non-Stop verificabilă în zona ta.",
  );
  expect(getMedicalCareCardMissingMessage("no_emergency_hospital", "ro")).toBe(
    "Nu am găsit un spital relevant în zona selectată.",
  );
});

test("nearby care cards differentiate Santix verified data from OSM fallback", () => {
  expect(
    getMedicalCareSourceBadgeLabel(
      foundResult({
        source: "manual_verified",
      }),
      "ro",
    ),
  ).toBe("Date verificate Santix");

  expect(
    getMedicalCareSourceBadgeLabel(
      foundResult({
        source: "osm_fallback",
        confidence: "low",
      }),
      "ro",
    ),
  ).toBe("Date OSM");
});

test("nearby care cards clarify non-stop pharmacies without changing slot deduplication", () => {
  expect(getMedicalCareCardCategoryLabel("nonstop_pharmacy", "ro")).toBe(
    "Altă farmacie Non-Stop",
  );
  expect(
    getMedicalCareCardCategoryLabel(
      "open_pharmacy",
      "ro",
      foundResult({
        category: "open_pharmacy",
        openingHours: "24/7",
      }),
    ),
  ).toBe("Farmacie Non-Stop deschisă acum");

  expect(
    getMedicalCareStatusBadgeLabels(
      foundResult({
        category: "open_pharmacy",
        openingHours: "24/7",
      }),
      "ro",
    ),
  ).toEqual(["Deschis acum", "Non-Stop"]);

  expect(
    getMedicalCareStatusBadgeLabels(
      foundResult({
        category: "open_pharmacy",
        openingHours: "Mo-Fr 08:00-20:00",
      }),
      "ro",
    ),
  ).toEqual(["Deschis acum"]);
});

test("legacy single status badge helper keeps returning the primary decision badge", () => {
  expect(
    getMedicalCareStatusBadgeLabel(
      foundResult({
        category: "open_pharmacy",
        openingHours: "24/7",
      }),
      "ro",
    ),
  ).toBe("Deschis acum");
});

test("nearby care hospital badge never promotes OSM fallback to verified UPU", () => {
  expect(
    getMedicalCareStatusBadgeLabel(
      foundResult({
        category: "emergency_hospital",
        placeType: "hospital",
        source: "manual_verified",
        emergencyCapability: "upu_verified",
      }),
      "ro",
    ),
  ).toBe("UPU verificat");

  expect(
    getMedicalCareStatusBadgeLabel(
      foundResult({
        category: "emergency_hospital",
        placeType: "hospital",
        source: "osm_fallback",
        emergencyCapability: "upu_verified",
        confidence: "low",
      }),
      "ro",
    ),
  ).toBe("Spital apropiat");

  expect(
    getMedicalCareStatusBadgeLabel(
      foundResult({
        category: "emergency_hospital",
        placeType: "hospital",
        source: "osm_fallback",
        emergencyCapability: "probable_emergency",
        confidence: "low",
      }),
      "ro",
    ),
  ).toBe("Urgențe probabile");
});

test("nearby care safety note does not add a 112 button or aggressive emergency copy", () => {
  const note = getMedicalCareSafetyNote("ro");

  expect(note).toContain("Santix oferă orientare educațională");
  expect(note).toContain("contactează serviciile de urgență");
  expect(note).not.toContain("112");
});

function foundResult(overrides: Partial<MedicalCareFoundResult> = {}): MedicalCareFoundResult {
  return {
    available: true,
    id: "test-location",
    category: "open_pharmacy",
    placeType: "pharmacy",
    name: "Locatie medicala test",
    lat: 44.4268,
    lng: 26.1025,
    distanceMeters: 450,
    address: "Adresa test",
    phone: null,
    openingHours: "Mo-Su 08:00-22:00",
    status: "open_now",
    source: "manual_verified",
    sourceLabel: "Test",
    sourceUrl: "https://example.com",
    confidence: "high",
    emergencyCapability: "none",
    ...overrides,
  };
}
