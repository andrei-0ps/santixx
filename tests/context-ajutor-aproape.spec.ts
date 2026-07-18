import { expect, test } from "@playwright/test";
import { buildMedicalCareDecisionContext } from "../src/lib/contextAjutorAproape";
import {
  isNonStopOpeningHours,
  ROMANIA_TIME_ZONE,
  type OverpassElement,
} from "../src/lib/medical-care.logic";
import type { Coordinates } from "../src/lib/medical-care.types";
import type { OverpassFetcher } from "../src/lib/fallbackOsmAjutorAproape";
import { getMedicalCareMapPins } from "../src/lib/pinuriHartaAjutorAproape";

const bucharestSouth: Coordinates = { lat: 44.396, lng: 26.102 };
const clujCenter: Coordinates = { lat: 46.7712, lng: 23.6236 };
const monday1627InBucharest = new Date("2026-06-22T13:27:00Z");
const monday2358InBucharest = new Date("2026-06-22T20:58:00Z");
const monday0027InBucharest = new Date("2026-06-21T21:27:00Z");
const monday1300InBucharest = new Date("2026-06-22T10:00:00Z");

test("nearby care context keeps the three selected slots and exposes all candidates", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    centerSource: "manual_search",
    manualSearchText: "Bucuresti sud",
    geocodedLabel: "Bucuresti sud",
    geocodedAddress: "Bucuresti sud, Romania",
    fetcher: async () => [],
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 50,
  });

  expect(context.timeZone).toBe(ROMANIA_TIME_ZONE);
  expect(context.activeCenter).toMatchObject({
    coordinates: bucharestSouth,
    source: "manual_search",
    searchText: "Bucuresti sud",
    geocodedLabel: "Bucuresti sud",
    geocodedAddress: "Bucuresti sud, Romania",
  });
  expect(context.results).toBe(context.selectedSlots);
  expect(context.selectedSlots).toHaveLength(3);
  expect(context.summary.analyzedLocations).toBe(context.allCandidates.length);
  expect(context.osmFallback).toMatchObject({
    fallbackReason: "osm_no_results",
    rawElements: 0,
    timeoutMs: 50,
  });
  expect(
    context.selectedSlots.every((result) => !result.available || Boolean(result.selectionReason)),
  ).toBe(true);
  expect(context.auditCandidates).toBe(context.allCandidates);
});

test("nearby care rebuilds candidates, slots, tabs and pins after a generic zone change", async () => {
  const addressA: Coordinates = { lat: 46.7712, lng: 23.6236 };
  const addressB: Coordinates = { lat: 47.05, lng: 24.12 };
  const fetcher: OverpassFetcher = async (center) =>
    center.lat === addressA.lat ? zoneAElements(addressA) : zoneBElements(addressB);

  const firstContext = await buildMedicalCareDecisionContext(addressA, {
    centerSource: "manual_search",
    fetcher,
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const secondContext = await buildMedicalCareDecisionContext(addressB, {
    centerSource: "manual_search",
    fetcher,
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const secondPins = getMedicalCareMapPins(secondContext.visibleItemsByMode.recommended);

  expect(firstContext.selectedSlots.some((result) => result.available && result.id === "node-401")).toBe(
    true,
  );
  expect(secondContext.activeCenter).toMatchObject({
    coordinates: addressB,
    source: "manual_search",
  });
  expect(secondContext.allCandidates.some((candidate) => candidate.id === "node-401")).toBe(false);
  expect(secondContext.selectedSlots.some((result) => result.available && result.id === "node-501")).toBe(
    true,
  );
  expect(secondContext.visibleItemsByMode.open_pharmacies.every(
    (result) => result.available && result.id.startsWith("node-5"),
  )).toBe(true);
  expect(secondPins.every((pin) => pin.result.id.startsWith("node-5"))).toBe(true);
});

test("nearby care marks OSM timeout and explains farther Santix fallback results", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    centerSource: "manual_search",
    fetcher: async () => new Promise<never>(() => undefined),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 5,
  });
  const farSantixResult = context.selectedSlots.find(
    (result) =>
      result.available &&
      result.source === "manual_verified" &&
      result.distanceMeters >= 3000,
  );

  expect(context.osmFallback).toMatchObject({
    fallbackReason: "osm_timeout",
    rawElements: 0,
    timedOut: true,
    externalDataAvailable: false,
  });
  expect(farSantixResult?.available && farSantixResult.selectionReason).toContain(
    "Datele externe nu au răspuns la timp",
  );
});

test("open pharmacy scoring lets a nearby OSM open pharmacy beat a far Santix pharmacy", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    fetcher: async () => nearOpenPharmacyElements(bucharestSouth),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const openPharmacy = context.selectedSlots.find((result) => result.category === "open_pharmacy");
  const osmCandidate = context.allCandidates.find((candidate) => candidate.id === "node-101");
  const santixOpenCandidates = context.allCandidates.filter(
    (candidate) =>
      candidate.source === "manual_verified" &&
      candidate.placeType === "pharmacy" &&
      candidate.scores.open_pharmacy,
  );

  expect(openPharmacy).toMatchObject({
    available: true,
    id: "node-101",
    source: "osm_fallback",
    name: "Farmacia OSM aproape deschisa",
  });
  expect(openPharmacy?.available && openPharmacy.distanceMeters).toBeLessThan(500);
  expect(osmCandidate?.sourceLabel).toBe("Date OSM / parțial verificate");
  expect(osmCandidate?.scores.open_pharmacy?.rank).toBe(1);
  expect(santixOpenCandidates.some((candidate) => (candidate.distanceMeters ?? 0) > 5000)).toBe(
    true,
  );
});

test("non-stop scoring lets a nearby OSM non-stop pharmacy beat a far Santix non-stop pharmacy", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    fetcher: async () => nearOpenPharmacyElements(bucharestSouth),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const nonstopPharmacy = context.selectedSlots.find(
    (result) => result.category === "nonstop_pharmacy",
  );
  const osmNonstop = context.allCandidates.find((candidate) => candidate.id === "node-102");

  expect(nonstopPharmacy).toMatchObject({
    available: true,
    id: "node-102",
    source: "osm_fallback",
    name: "Farmacia OSM Non Stop",
  });
  expect(nonstopPharmacy?.available && nonstopPharmacy.distanceMeters).toBeLessThan(700);
  expect(osmNonstop?.scores.nonstop_pharmacy?.rank).toBe(1);
});

test("at 16:27 a normal nearby open pharmacy can beat a far verified non-stop pharmacy", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    fetcher: async () => nearOpenPharmacyElements(bucharestSouth),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const openPharmacy = context.selectedSlots.find((result) => result.category === "open_pharmacy");
  const selectedNonstop = context.selectedSlots.find(
    (result) => result.category === "nonstop_pharmacy",
  );

  expect(openPharmacy).toMatchObject({
    available: true,
    id: "node-101",
    status: "open_now",
  });
  expect(selectedNonstop?.available && selectedNonstop.id).not.toBe(
    openPharmacy?.available ? openPharmacy.id : null,
  );
});

test("at 00:27 the closest non-stop pharmacy becomes the primary open recommendation", async () => {
  const context = await buildMedicalCareDecisionContext(clujCenter, {
    fetcher: async () => nightNonstopPharmacies(clujCenter),
    now: monday0027InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const openPharmacy = context.selectedSlots.find((result) => result.category === "open_pharmacy");
  const nonstopPharmacy = context.selectedSlots.find(
    (result) => result.category === "nonstop_pharmacy",
  );

  expect(openPharmacy).toMatchObject({
    available: true,
    id: "node-601",
    name: "Help Net",
    status: "open_now",
  });
  expect(nonstopPharmacy).toMatchObject({
    available: true,
    id: "node-602",
    name: "Farmacia Dona",
    status: "nonstop",
  });
  expect(openPharmacy?.available && openPharmacy.selectionReason).toContain(
    "cea mai apropiată farmacie Non-Stop deschisă acum",
  );
  expect(nonstopPharmacy?.available && nonstopPharmacy.selectionReason).toContain(
    "alternativă Non-Stop diferită",
  );
});

test("at 13:00 a nearby normal open pharmacy stays primary before a farther non-stop pharmacy", async () => {
  const context = await buildMedicalCareDecisionContext(clujCenter, {
    fetcher: async () => dayOpenAndNonstopPharmacies(clujCenter),
    now: monday1300InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const openPharmacy = context.selectedSlots.find((result) => result.category === "open_pharmacy");
  const nonstopPharmacy = context.selectedSlots.find(
    (result) => result.category === "nonstop_pharmacy",
  );

  expect(openPharmacy).toMatchObject({
    available: true,
    id: "node-701",
    name: "Farmacie normală deschisă",
  });
  expect(nonstopPharmacy).toMatchObject({
    available: true,
    id: "node-702",
    name: "Farmacie Non-Stop",
  });
});

test("at 00:27 a single non-stop pharmacy is primary and the alternative slot is unavailable", async () => {
  const context = await buildMedicalCareDecisionContext(clujCenter, {
    fetcher: async () => singleNightNonstopPharmacy(clujCenter),
    now: monday0027InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const openPharmacy = context.selectedSlots.find((result) => result.category === "open_pharmacy");
  const nonstopPharmacy = context.selectedSlots.find(
    (result) => result.category === "nonstop_pharmacy",
  );

  expect(openPharmacy).toMatchObject({
    available: true,
    id: "node-801",
    name: "Singura farmacie Non-Stop",
  });
  expect(nonstopPharmacy).toMatchObject({
    available: false,
    category: "nonstop_pharmacy",
    status: "not_found",
    reason: "no_different_nonstop_pharmacy",
  });
});

test("at 23:58 normal closed pharmacies are not eligible but non-stop pharmacies are", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    fetcher: async () => nearOpenPharmacyElements(bucharestSouth),
    now: monday2358InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });
  const normalPharmacy = context.allCandidates.find((candidate) => candidate.id === "node-101");
  const osmNonstop = context.allCandidates.find((candidate) => candidate.id === "node-102");

  expect(normalPharmacy?.openNow).toBe(false);
  expect(normalPharmacy?.scores.open_pharmacy).toBeUndefined();
  expect(osmNonstop?.isNonStop).toBe(true);
  expect(osmNonstop?.openNow).toBe(true);
  expect(osmNonstop?.scores.open_pharmacy).toBeTruthy();
});

test("open pharmacies tab shows only open pharmacies, sorted and limited", async () => {
  const context = await buildMedicalCareDecisionContext(clujCenter, {
    fetcher: async () => manyOpenPharmacies(clujCenter),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });

  expect(context.summary.pharmaciesOpenNow).toBeGreaterThanOrEqual(7);
  expect(context.visibleItemsByMode.open_pharmacies).toHaveLength(5);
  expect(
    context.visibleItemsByMode.open_pharmacies.every(
      (result) => result.available && result.placeType === "pharmacy" && result.status === "open_now",
    ),
  ).toBe(true);
  expect(context.visibleItemsByMode.open_pharmacies.map((result) => result.available && result.id)).toEqual([
    "node-201",
    "node-202",
    "node-203",
    "node-204",
    "node-205",
  ]);
  expect(
    context.visibleItemsByMode.open_pharmacies.every(
      (result) => result.available && result.selectionReason.startsWith("Candidat #"),
    ),
  ).toBe(true);
});

test("non-stop and hospital tabs do not mix categories", async () => {
  const context = await buildMedicalCareDecisionContext(bucharestSouth, {
    fetcher: async () => nearOpenPharmacyElements(bucharestSouth),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });

  expect(
    context.visibleItemsByMode.nonstop_pharmacies.every(
      (result) =>
        result.available &&
        result.placeType === "pharmacy" &&
        isNonStopOpeningHours(result.openingHours),
    ),
  ).toBe(true);
  expect(
    context.auditCandidatesByMode.nonstop_pharmacies.every(
      (candidate) => candidate.placeType === "pharmacy" && candidate.isNonStop,
    ),
  ).toBe(true);
  expect(
    context.visibleItemsByMode.emergency_hospitals.every(
      (result) => result.available && result.placeType === "hospital",
    ),
  ).toBe(true);
  expect(
    context.auditCandidatesByMode.emergency_hospitals.every(
      (candidate) => candidate.placeType === "hospital",
    ),
  ).toBe(true);
});

test("audit includes accepted and rejected candidates with score and reason", async () => {
  const context = await buildMedicalCareDecisionContext(clujCenter, {
    fetcher: async () => auditElementsWithRejectedCandidates(clujCenter),
    now: monday1627InBucharest,
    radiiMeters: [3000],
    timeoutMs: 200,
  });

  expect(context.allCandidates.some((candidate) => candidate.accepted)).toBe(true);
  expect(context.allCandidates.some((candidate) => candidate.rejectionReason)).toBe(true);
  expect(
    context.allCandidates.some(
      (candidate) => candidate.score !== null && candidate.rank !== null && candidate.reason,
    ),
  ).toBe(true);
  expect(
    context.allCandidates.some((candidate) => candidate.reason.includes("online sau veterinar")),
  ).toBe(true);
});

function nearOpenPharmacyElements(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 101,
      lat: center.lat + 0.002,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia OSM aproape deschisa",
        opening_hours: "Mo-Su 08:00-22:00",
        phone: "+40 700 000 101",
      },
    },
    {
      type: "node",
      id: 102,
      lat: center.lat + 0.004,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia OSM Non Stop",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 103,
      lat: center.lat + 0.006,
      lon: center.lng,
      tags: {
        amenity: "hospital",
        name: "Spital Municipal de Urgenta OSM",
      },
    },
  ];
}

function nightNonstopPharmacies(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 601,
      lat: center.lat + 0.00135,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Help Net",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 602,
      lat: center.lat + 0.0144,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia Dona",
        opening_hours: "24/7",
      },
    },
  ];
}

function dayOpenAndNonstopPharmacies(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 701,
      lat: center.lat + 0.0018,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie normală deschisă",
        opening_hours: "Mo-Su 08:00-22:00",
      },
    },
    {
      type: "node",
      id: 702,
      lat: center.lat + 0.0045,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Non-Stop",
        opening_hours: "24/7",
      },
    },
  ];
}

function singleNightNonstopPharmacy(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 801,
      lat: center.lat + 0.00135,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Singura farmacie Non-Stop",
        opening_hours: "24/7",
      },
    },
  ];
}

function manyOpenPharmacies(center: Coordinates): OverpassElement[] {
  return Array.from({ length: 7 }, (_, index) => ({
    type: "node" as const,
    id: 201 + index,
    lat: center.lat + 0.001 * (index + 1),
    lon: center.lng,
    tags: {
      amenity: "pharmacy",
      name: `Farmacia deschisa ${index + 1}`,
      opening_hours: "Mo-Su 08:00-22:00",
    },
  }));
}

function auditElementsWithRejectedCandidates(center: Coordinates): OverpassElement[] {
  return [
    ...nearOpenPharmacyElements(center),
    {
      type: "node",
      id: 301,
      lat: center.lat + 0.001,
      lon: center.lng + 0.001,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Online Cluj",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 302,
      lat: center.lat + 0.001,
      lon: center.lng + 0.001,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Veterinara Cluj",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 303,
      lat: center.lat + 0.002,
      lon: center.lng + 0.002,
      tags: {
        amenity: "hospital",
        name: "Clinica Stomatologica de Urgenta",
      },
    },
  ];
}

function zoneAElements(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 401,
      lat: center.lat + 0.001,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia zona A deschisa",
        opening_hours: "Mo-Su 08:00-22:00",
      },
    },
    {
      type: "node",
      id: 402,
      lat: center.lat + 0.002,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia zona A Non Stop",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 403,
      lat: center.lat + 0.003,
      lon: center.lng,
      tags: {
        amenity: "hospital",
        name: "Spital de Urgenta zona A",
      },
    },
  ];
}

function zoneBElements(center: Coordinates): OverpassElement[] {
  return [
    {
      type: "node",
      id: 501,
      lat: center.lat + 0.001,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia zona B deschisa",
        opening_hours: "Mo-Su 08:00-22:00",
      },
    },
    {
      type: "node",
      id: 502,
      lat: center.lat + 0.002,
      lon: center.lng,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia zona B Non Stop",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 503,
      lat: center.lat + 0.003,
      lon: center.lng,
      tags: {
        amenity: "hospital",
        name: "Spital de Urgenta zona B",
      },
    },
  ];
}
