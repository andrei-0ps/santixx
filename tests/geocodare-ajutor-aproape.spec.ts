import { expect, test } from "@playwright/test";
import { buildMedicalCareDecisionContext } from "../src/lib/contextAjutorAproape";
import {
  normalizeMedicalCareGeocodeHits,
  type NominatimHit,
} from "../src/lib/medical-care.functions";
import type { Coordinates } from "../src/lib/medical-care.types";

const mondayNoonInBucharest = new Date("2026-06-22T09:00:00Z");

test("manual geocoding keeps multiple candidates for explicit user choice", () => {
  const hits: NominatimHit[] = [
    {
      place_id: 101,
      lat: "45.696219",
      lon: "27.186034",
      name: "Colegiul National Unirea",
      display_name: "Colegiul National Unirea, Strada Alexandru Golescu, Focsani, Vrancea, Romania",
      addresstype: "school",
      address: {
        city: "Focsani",
        county: "Vrancea",
      },
    },
    {
      place_id: 102,
      lat: "45.700016",
      lon: "27.181842",
      name: "Strada Republicii",
      display_name: "Strada Republicii, Focsani, Vrancea, Romania",
      addresstype: "road",
      address: {
        city: "Focsani",
        county: "Vrancea",
      },
    },
  ];

  const results = normalizeMedicalCareGeocodeHits("Unirea Focsani", hits);

  expect(results).toHaveLength(2);
  expect(results[0]).toMatchObject({
    id: "101",
    label: "Colegiul National Unirea",
    cityOrCounty: "Focsani, Vrancea",
    resultType: "school",
    lat: 45.696219,
    lng: 27.186034,
  });
  expect(results[1]).toMatchObject({
    id: "102",
    label: "Strada Republicii",
    resultType: "road",
  });
});

test("manual geocoding ignores invalid or duplicate coordinates", () => {
  const hits: NominatimHit[] = [
    {
      place_id: 201,
      lat: "not-a-number",
      lon: "27.186034",
      display_name: "Rezultat invalid",
    },
    {
      place_id: 202,
      lat: "45.696219",
      lon: "27.186034",
      display_name: "Colegiul National Unirea, Focsani, Romania",
    },
    {
      place_id: 203,
      lat: "45.6962191",
      lon: "27.1860341",
      display_name: "Colegiul National Unirea, Focsani, Romania",
    },
  ];

  expect(normalizeMedicalCareGeocodeHits("Unirea Focsani", hits)).toHaveLength(1);
});

test("manual search context stores the chosen geocoded result in activeCenter", async () => {
  const chosenCoordinates: Coordinates = { lat: 45.696219, lng: 27.186034 };

  const context = await buildMedicalCareDecisionContext(chosenCoordinates, {
    centerSource: "manual_search",
    manualSearchText: "White Wedding Florarie Focsani",
    geocodedLabel: "Colegiul National Unirea",
    geocodedAddress:
      "Colegiul National Unirea, Strada Alexandru Golescu, Focsani, Vrancea, Romania",
    fetcher: async () => [],
    now: mondayNoonInBucharest,
    radiiMeters: [3000],
    timeoutMs: 50,
  });

  expect(context.activeCenter).toMatchObject({
    coordinates: chosenCoordinates,
    source: "manual_search",
    searchText: "White Wedding Florarie Focsani",
    geocodedLabel: "Colegiul National Unirea",
    geocodedAddress:
      "Colegiul National Unirea, Strada Alexandru Golescu, Focsani, Vrancea, Romania",
  });
});

test("manual map click context stores source manual_map without browser accuracy metadata", async () => {
  const clickedCoordinates: Coordinates = { lat: 45.6971, lng: 27.1849 };

  const context = await buildMedicalCareDecisionContext(clickedCoordinates, {
    centerSource: "manual_map",
    fetcher: async () => [],
    now: mondayNoonInBucharest,
    radiiMeters: [3000],
    timeoutMs: 50,
  });

  expect(context.activeCenter).toMatchObject({
    coordinates: clickedCoordinates,
    source: "manual_map",
    searchText: null,
    geocodedLabel: null,
    geocodedAddress: null,
  });
});
