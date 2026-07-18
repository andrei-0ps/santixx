import { expect, test } from "@playwright/test";
import {
  verifiedMedicalLocations,
  verifiedMedicalLocationsBucharest,
  verifiedMedicalLocationsVrancea,
  verifiedMedicalRegions,
} from "../src/data/locatiiMedicaleVerificate";

test("verified medical locations are split into Bucharest and Vrancea datasets", () => {
  expect(verifiedMedicalLocationsBucharest.length).toBeGreaterThanOrEqual(10);
  expect(verifiedMedicalLocationsVrancea.length).toBeGreaterThanOrEqual(2);
  expect(verifiedMedicalLocationsBucharest.every((location) => location.regionId === "bucharest")).toBe(true);
  expect(verifiedMedicalLocationsVrancea.every((location) => location.regionId === "vrancea")).toBe(true);
});

test("verified medical location ids and sources are usable for future selection logic", () => {
  const ids = new Set<string>();

  for (const location of verifiedMedicalLocations) {
    expect(ids.has(location.id), `Duplicate id: ${location.id}`).toBe(false);
    ids.add(location.id);

    expect(location.name.trim()).not.toBe("");
    expect(location.address.trim()).not.toBe("");
    expect(Number.isFinite(location.coordinates.lat)).toBe(true);
    expect(Number.isFinite(location.coordinates.lng)).toBe(true);
    expect(location.sourceUrl).toMatch(/^https:\/\//);
    expect(location.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(location.capabilities.length).toBeGreaterThan(0);
    expect(location.evidence.length).toBeGreaterThan(0);
    expect(location.evidence.every((evidence) => evidence.url.startsWith("https://"))).toBe(true);
    expect(location.evidence.every((evidence) => /^\d{4}-\d{2}-\d{2}$/.test(evidence.checkedAt))).toBe(true);
  }
});

test("non-stop pharmacy and emergency labels stay conservative", () => {
  const nonstopPharmacies = verifiedMedicalLocations.filter((location) =>
    location.capabilities.includes("nonstop_pharmacy"),
  );
  const verifiedEmergencyHospitals = verifiedMedicalLocations.filter(
    (location) => location.emergencyCapability === "upu_verified" || location.emergencyCapability === "cpu_verified",
  );

  expect(nonstopPharmacies.length).toBeGreaterThanOrEqual(6);
  expect(nonstopPharmacies.every((location) => location.type === "pharmacy")).toBe(true);
  expect(nonstopPharmacies.every((location) => location.isNonStop)).toBe(true);
  expect(nonstopPharmacies.every((location) => location.openingHours === "24/7")).toBe(true);

  expect(verifiedEmergencyHospitals.length).toBeGreaterThanOrEqual(3);
  expect(verifiedEmergencyHospitals.every((location) => location.type === "hospital")).toBe(true);
  expect(verifiedEmergencyHospitals.every((location) => location.confidence === "high")).toBe(true);
  expect(verifiedEmergencyHospitals.every((location) => location.source !== "osm_fallback")).toBe(true);
});

test("manual and official evidence are not mixed into ambiguous primary sources", () => {
  const pharmaCare = verifiedMedicalLocations.find(
    (location) => location.id === "bucharest-pharmacy-pharma-care-stefan-cel-mare",
  );
  const vranceaHospitals = verifiedMedicalLocationsVrancea.filter(
    (location) => location.type === "hospital",
  );

  expect(pharmaCare?.phone).toBe("+40738763126");
  expect(pharmaCare?.confidence).toBe("high");

  for (const hospital of vranceaHospitals) {
    expect(hospital.source).toBe("manual_verified");
    expect(hospital.sourceUrl).not.toContain("ms.ro");
    expect(hospital.evidence.some((evidence) => evidence.source === "official_registry")).toBe(true);
  }
});

test("region aliases support future city fallback without mixing Bucharest and Vrancea", () => {
  const bucharest = verifiedMedicalRegions.find((region) => region.id === "bucharest");
  const vrancea = verifiedMedicalRegions.find((region) => region.id === "vrancea");

  expect(bucharest?.aliases).toContain("bucuresti");
  expect(vrancea?.aliases).toContain("focsani");
  expect(bucharest?.aliases).not.toContain("focsani");
  expect(vrancea?.aliases).not.toContain("bucuresti");
});
