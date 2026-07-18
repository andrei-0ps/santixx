import { expect, test } from "@playwright/test";
import {
  completeWithOsmFallback,
  OSM_FALLBACK_RADII_METERS,
  type OverpassFetcher,
} from "../src/lib/fallbackOsmAjutorAproape";
import type { MedicalCareFoundResult, OverpassElement } from "../src/lib/medical-care.logic";
import type { Coordinates } from "../src/lib/medical-care.types";
import { buildVerifiedMedicalCareResults } from "../src/lib/selectareLocatiiVerificate";

const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");

function found(category: MedicalCareFoundResult["category"], results: Awaited<ReturnType<typeof completeWithOsmFallback>>) {
  const result = results.find((item) => item.category === category);
  return result?.available ? result : null;
}

test("osm fallback keeps the configured progressive radii", () => {
  expect(OSM_FALLBACK_RADII_METERS).toEqual([3000, 7000, 15000]);
});

test("osm fallback does not replace complete Santix verified results", async () => {
  const center: Coordinates = { lat: 44.4268, lng: 26.1025 };
  const verifiedResults = buildVerifiedMedicalCareResults(center, mondayNoonInBucharest);
  const calls: number[] = [];

  const results = await completeWithOsmFallback(center, verifiedResults, {
    fetcher: async (_center, radiusMeters) => {
      calls.push(radiusMeters);
      return osmDemoElements(center);
    },
    now: mondayNoonInBucharest,
  });

  expect(calls).toEqual([]);
  expect(results.every((result) => result.available)).toBe(true);
  expect(results.every((result) => !result.available || result.source === "manual_verified")).toBe(
    true,
  );
});

test("osm fallback expands radius until it can fill the missing slots", async () => {
  const center: Coordinates = { lat: 46.7712, lng: 23.6236 };
  const verifiedResults = buildVerifiedMedicalCareResults(center, mondayNoonInBucharest);
  const calls: number[] = [];

  const fetcher: OverpassFetcher = async (_center, radiusMeters) => {
    calls.push(radiusMeters);
    return radiusMeters === 3000 ? [] : osmDemoElements(center);
  };

  const results = await completeWithOsmFallback(center, verifiedResults, {
    fetcher,
    now: mondayNoonInBucharest,
    timeoutMs: 200,
  });

  expect(calls).toEqual([3000, 7000]);
  expect(results.every((result) => result.available)).toBe(true);
  expect(results.every((result) => !result.available || result.source === "osm_fallback")).toBe(
    true,
  );
  expect(results.every((result) => !result.available || result.confidence === "low")).toBe(true);
  expect(found("emergency_hospital", results)?.status).toBe("emergency_unit");
  expect(found("emergency_hospital", results)?.emergencyCapability).toBe("probable_emergency");
});

test("osm fallback can fill the missing Focsani alternative non-stop slot", async () => {
  const center: Coordinates = { lat: 45.699, lng: 27.186 };
  const verifiedResults = buildVerifiedMedicalCareResults(center, mondayNoonInBucharest);
  const verifiedHospital = found("emergency_hospital", verifiedResults);

  const results = await completeWithOsmFallback(center, verifiedResults, {
    fetcher: async () => [
      {
        type: "node",
        id: 101,
        lat: center.lat + 0.002,
        lon: center.lng + 0.001,
        tags: {
          amenity: "pharmacy",
          name: "Farmacia OSM deschisa",
          opening_hours: "Mo-Su 08:00-22:00",
        },
      },
      {
        type: "node",
        id: 102,
        lat: center.lat + 0.0002,
        lon: center.lng + 0.0002,
        tags: {
          amenity: "pharmacy",
          name: "Farmacia OSM Non Stop",
          opening_hours: "24/7",
        },
      },
      {
        type: "node",
        id: 201,
        lat: center.lat + 0.0001,
        lon: center.lng + 0.0001,
        tags: {
          amenity: "hospital",
          name: "Spital Clinic de Urgenta OSM",
        },
      },
    ],
    now: mondayNoonInBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });

  const openPharmacy = found("open_pharmacy", results);
  const nonstopPharmacy = found("nonstop_pharmacy", results);
  const emergencyHospital = found("emergency_hospital", results);

  expect(openPharmacy).toMatchObject({
    name: "Farmacia Ropharma nr. 17",
    source: "manual_verified",
  });
  expect(nonstopPharmacy).toMatchObject({
    name: "Farmacia OSM Non Stop",
    source: "osm_fallback",
    confidence: "low",
    category: "nonstop_pharmacy",
  });
  expect(emergencyHospital?.id).toBe(verifiedHospital?.id);
});

test("osm fallback does not use a duplicate of a verified non-stop pharmacy for the open slot", async () => {
  const center: Coordinates = { lat: 45.699, lng: 27.186 };
  const verifiedResults = buildVerifiedMedicalCareResults(center, mondayNoonInBucharest);

  const results = await completeWithOsmFallback(center, verifiedResults, {
    fetcher: async () => [
      {
        type: "node",
        id: 301,
        lat: 45.6979792,
        lon: 27.1826228,
        tags: {
          amenity: "pharmacy",
          name: "Farmacia Ropharma nr. 17",
          opening_hours: "Mo-Su 08:00-22:00",
        },
      },
    ],
    now: mondayNoonInBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });

  const openPharmacy = found("open_pharmacy", results);
  const nonstopPharmacy = results.find((result) => result.category === "nonstop_pharmacy");

  expect(openPharmacy).toMatchObject({
    name: "Farmacia Ropharma nr. 17",
    source: "manual_verified",
  });
  expect(nonstopPharmacy).toMatchObject({
    available: false,
    status: "not_found",
    reason: "no_different_nonstop_pharmacy",
    fallbackReason: "osm_no_results",
    fallbackRadiusMeters: 3000,
  });
});

test("osm fallback marks missing slots when Overpass times out", async () => {
  const center: Coordinates = { lat: 46.7712, lng: 23.6236 };
  const verifiedResults = buildVerifiedMedicalCareResults(center, mondayNoonInBucharest);
  const calls: number[] = [];

  const results = await completeWithOsmFallback(center, verifiedResults, {
    fetcher: async (_center, radiusMeters) => {
      calls.push(radiusMeters);
      return new Promise<never>(() => undefined);
    },
    now: mondayNoonInBucharest,
    radiiMeters: [3000, 7000],
    timeoutMs: 5,
  });

  expect(calls).toEqual([3000]);
  expect(results.every((result) => !result.available)).toBe(true);
  expect(results.every((result) => !result.available && result.fallbackReason === "osm_timeout")).toBe(
    true,
  );
});

function osmDemoElements(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 1,
      lat: center.lat + 0.001,
      lon: center.lng + 0.001,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia deschisa OSM",
        opening_hours: "Mo-Su 08:00-22:00",
        phone: "+40 700 000 001",
      },
    },
    {
      type: "node",
      id: 2,
      lat: center.lat + 0.002,
      lon: center.lng + 0.002,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia Non Stop OSM",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 3,
      lat: center.lat + 0.003,
      lon: center.lng + 0.003,
      tags: {
        amenity: "hospital",
        name: "Spital Clinic de Urgenta OSM",
      },
    },
  ];
}
