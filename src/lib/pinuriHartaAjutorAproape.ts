import { orderMedicalCareCardResults } from "@/lib/carduriAjutorAproape";
import { distanceMeters, type MedicalCareFoundResult, type MedicalCareResult } from "@/lib/medical-care.logic";
import type { Coordinates } from "@/lib/medical-care.types";

export type MedicalCareMapPin = {
  cardIndex: number;
  result: MedicalCareFoundResult;
  lat: number;
  lng: number;
};

export type MedicalCareMapPoint = [number, number];

const DUPLICATE_PIN_DISTANCE_METERS = 30;

type MedicalCareMapPinOptions = {
  limit?: number;
  preserveOrder?: boolean;
};

export function getMedicalCareMapPins(
  results: MedicalCareResult[],
  options: MedicalCareMapPinOptions = {},
) {
  const orderedCardResults = options.preserveOrder ? results : orderMedicalCareCardResults(results);
  const pins: MedicalCareMapPin[] = [];

  orderedCardResults.forEach((result, cardIndex) => {
    if (!result.available || !hasValidCoordinates(result)) return;

    if (pins.some((pin) => isSameMapPlace(pin.result, result))) {
      return;
    }

    pins.push({
      cardIndex,
      result,
      lat: result.lat,
      lng: result.lng,
    });
  });

  return pins.slice(0, options.limit ?? 3);
}

export function getMedicalCareMapFitPoints(
  center: Coordinates | null,
  pins: MedicalCareMapPin[],
): MedicalCareMapPoint[] {
  const points: MedicalCareMapPoint[] = [];

  if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
    points.push([center.lat, center.lng]);
  }

  for (const pin of pins) {
    points.push([pin.lat, pin.lng]);
  }

  return points;
}

function hasValidCoordinates(result: MedicalCareFoundResult) {
  return Number.isFinite(result.lat) && Number.isFinite(result.lng);
}

function isSameMapPlace(first: MedicalCareFoundResult, second: MedicalCareFoundResult) {
  if (first.id === second.id) return true;

  return (
    distanceMeters(
      { lat: first.lat, lng: first.lng },
      { lat: second.lat, lng: second.lng },
    ) <= DUPLICATE_PIN_DISTANCE_METERS
  );
}
