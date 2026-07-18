import { expect, test } from "@playwright/test";
import {
  buildMedicalCareResults,
  isNonStopOpeningHours,
  isOpenAt,
  ROMANIA_TIME_ZONE,
  type OverpassElement,
} from "../src/lib/medical-care.logic";
import type { Coordinates } from "../src/lib/medical-care.types";

test("opening-hours parser confirms 24/7 and normal open intervals", () => {
  const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");
  const saturdayNoonInBucharest = new Date("2026-06-27T09:00:00Z");

  expect(isNonStopOpeningHours("24/7")).toBe(true);
  expect(isNonStopOpeningHours("Mo-Su 00:00-24:00")).toBe(true);
  expect(isOpenAt("Mo-Fr 08:00-20:00", mondayNoonInBucharest)).toBe(true);
  expect(isOpenAt("Mo-Fr 08:00-20:00", saturdayNoonInBucharest)).toBe(false);
});

test("opening-hours parser uses Romania timezone explicitly", () => {
  const mondayMorningInBucharest = new Date("2026-06-22T05:30:00Z");

  expect(ROMANIA_TIME_ZONE).toBe("Europe/Bucharest");
  expect(isOpenAt("Mo-Fr 08:00-09:00", mondayMorningInBucharest)).toBe(true);
  expect(isOpenAt("Mo-Fr 08:00-09:00", mondayMorningInBucharest, ROMANIA_TIME_ZONE)).toBe(
    true,
  );
  expect(isOpenAt("Mo-Fr 08:00-09:00", mondayMorningInBucharest, "UTC")).toBe(false);
});

test("opening-hours parser covers closed intervals and weekend schedules", () => {
  const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");
  const saturdayNoonInBucharest = new Date("2026-06-27T09:00:00Z");

  expect(isOpenAt("Mo-Fr 08:00-20:00", mondayNoonInBucharest)).toBe(true);
  expect(isOpenAt("Mo-Fr 08:00-20:00", saturdayNoonInBucharest)).toBe(false);
  expect(isOpenAt("Sa-Su 10:00-14:00", saturdayNoonInBucharest)).toBe(true);
  expect(isOpenAt("Sa-Su 10:00-14:00", mondayNoonInBucharest)).toBe(false);
});

test("opening-hours parser handles overnight intervals", () => {
  const fridayLateInBucharest = new Date("2026-06-26T20:30:00Z");
  const saturdayEarlyInBucharest = new Date("2026-06-26T22:30:00Z");

  expect(isOpenAt("Fr 20:00-02:00", fridayLateInBucharest)).toBe(true);
  expect(isOpenAt("Fr 20:00-02:00", saturdayEarlyInBucharest)).toBe(true);
});

test("opening-hours parser handles 22:00-06:00 overnight schedules", () => {
  const mondayLateInBucharest = new Date("2026-06-22T20:30:00Z");
  const tuesdayEarlyInBucharest = new Date("2026-06-23T02:30:00Z");
  const tuesdayMorningInBucharest = new Date("2026-06-23T04:00:00Z");

  expect(isOpenAt("Mo-Su 22:00-06:00", mondayLateInBucharest)).toBe(true);
  expect(isOpenAt("Mo-Su 22:00-06:00", tuesdayEarlyInBucharest)).toBe(true);
  expect(isOpenAt("Mo-Su 22:00-06:00", tuesdayMorningInBucharest)).toBe(false);
});

test("medical-care selection returns only the three strict result slots", () => {
  const center: Coordinates = { lat: 44.4268, lng: 26.1025 };
  const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");
  const elements: OverpassElement[] = [
    {
      type: "node",
      id: 1,
      lat: 44.427,
      lon: 26.103,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia închisă",
        opening_hours: "Mo-Fr 08:00-09:00",
      },
    },
    {
      type: "node",
      id: 2,
      lat: 44.428,
      lon: 26.104,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia deschisă",
        opening_hours: "Mo-Fr 08:00-20:00",
        phone: "+40 21 000 0000",
      },
    },
    {
      type: "node",
      id: 3,
      lat: 44.429,
      lon: 26.105,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia Non Stop",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 4,
      lat: 44.43,
      lon: 26.106,
      tags: {
        amenity: "hospital",
        name: "Spital Clinic de Urgență",
      },
    },
    {
      type: "node",
      id: 6,
      lat: 44.4272,
      lon: 26.1032,
      tags: {
        amenity: "hospital",
        name: "Spital privat generic",
        emergency: "yes",
      },
    },
    {
      type: "node",
      id: 5,
      lat: 44.421,
      lon: 26.1,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Veterinară",
        veterinary: "yes",
        opening_hours: "24/7",
      },
    },
  ];

  const results = buildMedicalCareResults(center, elements, mondayNoonInBucharest);

  expect(results).toHaveLength(3);
  expect(results.map((result) => result.category)).toEqual([
    "open_pharmacy",
    "nonstop_pharmacy",
    "emergency_hospital",
  ]);
  expect(results[0]).toMatchObject({
    available: true,
    name: "Farmacia deschisă",
    status: "open_now",
  });
  expect(results[1]).toMatchObject({
    available: true,
    name: "Farmacia Non Stop",
    status: "nonstop",
  });
  expect(results[2]).toMatchObject({
    available: true,
    name: "Spital Clinic de Urgență",
    status: "emergency_unit",
    source: "osm_fallback",
    confidence: "low",
  });
});

test("medical-care selection filters noisy OSM fallback results", () => {
  const center: Coordinates = { lat: 44.4268, lng: 26.1025 };
  const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");
  const elements: OverpassElement[] = [
    {
      type: "node",
      id: 10,
      lat: 44.4269,
      lon: 26.1026,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Online Bucuresti",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 11,
      lat: 44.427,
      lon: 26.1027,
      tags: {
        amenity: "pharmacy",
        name: "Farmacie Veterinara Non Stop",
        veterinary: "yes",
        opening_hours: "24/7",
      },
    },
    {
      type: "node",
      id: 12,
      lat: 44.428,
      lon: 26.104,
      tags: {
        amenity: "pharmacy",
        name: "Farmacia umana deschisa",
        opening_hours: "Mo-Su 08:00-22:00",
      },
    },
    {
      type: "node",
      id: 20,
      lat: 44.4271,
      lon: 26.1028,
      tags: {
        amenity: "hospital",
        name: "Clinica Stomatologica de Urgenta",
      },
    },
    {
      type: "node",
      id: 21,
      lat: 44.429,
      lon: 26.105,
      tags: {
        amenity: "hospital",
        name: "Spital Municipal de Urgenta",
      },
    },
  ];

  const results = buildMedicalCareResults(center, elements, mondayNoonInBucharest);

  expect(results[0]).toMatchObject({
    available: true,
    name: "Farmacia umana deschisa",
    source: "osm_fallback",
  });
  expect(results[1]).toMatchObject({
    available: false,
    reason: "no_nonstop_pharmacy",
  });
  expect(results[2]).toMatchObject({
    available: true,
    name: "Spital Municipal de Urgenta",
    source: "osm_fallback",
  });
});
