import { expect, test } from "@playwright/test";
import {
  formatLocationAccuracy,
  getLocationAccuracyLabel,
  getVeryWeakLocationAccuracyMessage,
  getWeakLocationAccuracyMessage,
  isVeryWeakLocationAccuracy,
  isWeakLocationAccuracy,
  sanitizeLocationAccuracy,
  VERY_WEAK_LOCATION_ACCURACY_METERS,
  WEAK_LOCATION_ACCURACY_METERS,
} from "../src/lib/locatieUtilizatorAjutorAproape";

test("nearby care location accuracy is sanitized before display", () => {
  expect(sanitizeLocationAccuracy(42)).toBe(42);
  expect(sanitizeLocationAccuracy(0)).toBeNull();
  expect(sanitizeLocationAccuracy(Number.NaN)).toBeNull();
  expect(sanitizeLocationAccuracy(undefined)).toBeNull();
});

test("nearby care location accuracy marks weak browser locations", () => {
  expect(WEAK_LOCATION_ACCURACY_METERS).toBe(300);
  expect(isWeakLocationAccuracy(300)).toBe(false);
  expect(isWeakLocationAccuracy(301)).toBe(true);
});

test("nearby care location accuracy marks very weak browser locations", () => {
  expect(VERY_WEAK_LOCATION_ACCURACY_METERS).toBe(1000);
  expect(isVeryWeakLocationAccuracy(1000)).toBe(false);
  expect(isVeryWeakLocationAccuracy(1001)).toBe(true);
});

test("nearby care location accuracy has compact Romanian copy", () => {
  expect(formatLocationAccuracy(298, "ro")).toBe("300 m");
  expect(formatLocationAccuracy(1250, "ro")).toBe("1.3 km");
  expect(formatLocationAccuracy(20000, "ro")).toBe("20 km");
  expect(getLocationAccuracyLabel(298, "ro")).toBe("Locație aproximativă: ±300 m");
  expect(getLocationAccuracyLabel(20000, "ro")).toBe("Locație aproximativă: ±20 km");
  expect(getWeakLocationAccuracyMessage("ro")).toBe(
    "Locația pare aproximativă. Poți reîncerca sau introduce zona manual.",
  );
  expect(getVeryWeakLocationAccuracyMessage("ro")).toBe(
    "Locația este foarte aproximativă. Introdu o adresă sau alege o zonă pentru rezultate mai bune.",
  );
});
