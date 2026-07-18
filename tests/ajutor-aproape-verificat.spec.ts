import { expect, test } from "@playwright/test";
import { buildVerifiedMedicalCareResults } from "../src/lib/selectareLocatiiVerificate";

test("verified backend returns the three expected slots for Bucharest", () => {
  const results = buildVerifiedMedicalCareResults({ lat: 44.4268, lng: 26.1025 });
  const openPharmacy = results.find((result) => result.category === "open_pharmacy");
  const nonstopPharmacy = results.find((result) => result.category === "nonstop_pharmacy");

  expect(results).toHaveLength(3);
  expect(results.map((result) => result.category)).toEqual([
    "open_pharmacy",
    "nonstop_pharmacy",
    "emergency_hospital",
  ]);
  expect(results.every((result) => result.available)).toBe(true);
  expect(results.every((result) => !result.available || result.source === "manual_verified")).toBe(true);
  expect(results.every((result) => !result.available || result.confidence !== "low")).toBe(true);
  expect(openPharmacy?.available).toBe(true);
  expect(nonstopPharmacy?.available).toBe(true);
  expect(openPharmacy?.available && nonstopPharmacy?.available && openPharmacy.id).not.toBe(
    nonstopPharmacy?.available ? nonstopPharmacy.id : null,
  );
});

test("verified backend keeps the single verified Focsani non-stop pharmacy as the primary open slot", () => {
  const results = buildVerifiedMedicalCareResults({ lat: 45.699, lng: 27.186 });
  const openPharmacy = results.find((result) => result.category === "open_pharmacy");
  const nonstopPharmacy = results.find((result) => result.category === "nonstop_pharmacy");
  const emergencyHospital = results.find((result) => result.category === "emergency_hospital");

  expect(results).toHaveLength(3);
  expect(openPharmacy).toMatchObject({
    available: true,
    category: "open_pharmacy",
    name: "Farmacia Ropharma nr. 17",
    source: "manual_verified",
  });
  expect(nonstopPharmacy).toMatchObject({
    available: false,
    category: "nonstop_pharmacy",
    status: "not_found",
    reason: "no_different_nonstop_pharmacy",
  });
  expect(emergencyHospital).toMatchObject({
    available: true,
    category: "emergency_hospital",
    name: "Spitalul Judetean de Urgenta Sfantul Pantelimon Focsani",
    emergencyCapability: "upu_verified",
  });
});

test("verified backend does not invent distant results outside verified demo regions", () => {
  const results = buildVerifiedMedicalCareResults({ lat: 46.7712, lng: 23.6236 });

  expect(results).toHaveLength(3);
  expect(results.every((result) => !result.available)).toBe(true);
});

test("verified backend prefers UPU verified hospitals before probable emergency hospitals", () => {
  const results = buildVerifiedMedicalCareResults({ lat: 45.6968, lng: 27.1906 });
  const emergencyHospital = results.find((result) => result.category === "emergency_hospital");

  expect(emergencyHospital).toMatchObject({
    available: true,
    category: "emergency_hospital",
    name: "Spitalul Judetean de Urgenta Sfantul Pantelimon Focsani",
  });
  expect(emergencyHospital?.available && emergencyHospital.name).not.toContain("Spitalul Militar");
});
