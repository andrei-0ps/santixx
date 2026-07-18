import { expect, test } from "@playwright/test";
import {
  getMedicalCareMapFitPoints,
  getMedicalCareMapPins,
} from "../src/lib/pinuriHartaAjutorAproape";
import type { MedicalCareFoundResult, MedicalCareResult } from "../src/lib/medical-care.logic";

test("nearby care map pins follow the three visible card slots", () => {
  const results: MedicalCareResult[] = [
    foundResult({
      category: "emergency_hospital",
      placeType: "hospital",
      id: "hospital-1",
      name: "Spital relevant",
      lat: 44.43,
      lng: 26.11,
    }),
    {
      available: false,
      category: "nonstop_pharmacy",
      placeType: "pharmacy",
      status: "not_found",
      reason: "no_nonstop_pharmacy",
    },
    foundResult({
      category: "open_pharmacy",
      placeType: "pharmacy",
      id: "pharmacy-open",
      name: "Farmacie deschisa",
      lat: 44.42,
      lng: 26.1,
    }),
  ];

  const pins = getMedicalCareMapPins(results);

  expect(pins).toHaveLength(2);
  expect(pins.map((pin) => pin.result.category)).toEqual([
    "open_pharmacy",
    "emergency_hospital",
  ]);
  expect(pins.map((pin) => pin.cardIndex)).toEqual([0, 2]);
});

test("nearby care map never creates more than three result pins", () => {
  const pins = getMedicalCareMapPins([
    foundResult({ category: "open_pharmacy", id: "open", lat: 44.42, lng: 26.1 }),
    foundResult({ category: "nonstop_pharmacy", id: "nonstop", lat: 44.43, lng: 26.11 }),
    foundResult({
      category: "emergency_hospital",
      placeType: "hospital",
      id: "hospital",
      lat: 44.44,
      lng: 26.12,
    }),
    foundResult({
      category: "open_pharmacy",
      id: "raw-extra-osm-that-is-not-a-card",
      lat: 44.45,
      lng: 26.13,
    }),
  ]);

  expect(pins).toHaveLength(3);
  expect(pins.map((pin) => pin.result.id)).toEqual(["open", "nonstop", "hospital"]);
});

test("nearby care map deduplicates pins for the same location", () => {
  const pins = getMedicalCareMapPins([
    foundResult({
      category: "open_pharmacy",
      id: "same-place",
      lat: 44.4268,
      lng: 26.1025,
    }),
    foundResult({
      category: "nonstop_pharmacy",
      id: "same-place",
      lat: 44.4268,
      lng: 26.1025,
    }),
    foundResult({
      category: "emergency_hospital",
      placeType: "hospital",
      id: "hospital",
      lat: 44.44,
      lng: 26.12,
    }),
  ]);

  expect(pins).toHaveLength(2);
  expect(pins.map((pin) => pin.result.category)).toEqual([
    "open_pharmacy",
    "emergency_hospital",
  ]);
});

test("nearby care map fit points include user first and then available pins", () => {
  const center = { lat: 44.4268, lng: 26.1025 };
  const pins = getMedicalCareMapPins([
    foundResult({ category: "open_pharmacy", id: "open", lat: 44.42, lng: 26.1 }),
    {
      available: false,
      category: "emergency_hospital",
      placeType: "hospital",
      status: "not_found",
      reason: "no_emergency_hospital",
    },
  ]);

  expect(getMedicalCareMapFitPoints(center, pins)).toEqual([
    [44.4268, 26.1025],
    [44.42, 26.1],
  ]);
  expect(getMedicalCareMapFitPoints(center, [])).toEqual([[44.4268, 26.1025]]);
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
