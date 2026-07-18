export type LocationAccuracyLanguage = "ro" | "en";

export const WEAK_LOCATION_ACCURACY_METERS = 300;
export const VERY_WEAK_LOCATION_ACCURACY_METERS = 1000;

export function sanitizeLocationAccuracy(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function isWeakLocationAccuracy(accuracyMeters: number | null | undefined) {
  const cleanAccuracy = sanitizeLocationAccuracy(accuracyMeters);
  return cleanAccuracy !== null && cleanAccuracy > WEAK_LOCATION_ACCURACY_METERS;
}

export function isVeryWeakLocationAccuracy(accuracyMeters: number | null | undefined) {
  const cleanAccuracy = sanitizeLocationAccuracy(accuracyMeters);
  return cleanAccuracy !== null && cleanAccuracy > VERY_WEAK_LOCATION_ACCURACY_METERS;
}

export function formatLocationAccuracy(accuracyMeters: number, lang: LocationAccuracyLanguage) {
  if (accuracyMeters < 1000) {
    return `${Math.max(5, Math.round(accuracyMeters / 10) * 10)} m`;
  }

  const kilometers = accuracyMeters / 1000;
  const formattedKilometers =
    kilometers >= 10 || Number.isInteger(kilometers)
      ? kilometers.toFixed(0)
      : kilometers.toFixed(1);

  return `${formattedKilometers} ${lang === "ro" ? "km" : "km"}`;
}

export function getLocationAccuracyLabel(
  accuracyMeters: number,
  lang: LocationAccuracyLanguage,
) {
  const formattedAccuracy = formatLocationAccuracy(accuracyMeters, lang);
  return lang === "ro"
    ? `Locație aproximativă: ±${formattedAccuracy}`
    : `Approximate location: ±${formattedAccuracy}`;
}

export function getWeakLocationAccuracyMessage(lang: LocationAccuracyLanguage) {
  return lang === "ro"
    ? "Locația pare aproximativă. Poți reîncerca sau introduce zona manual."
    : "The location seems approximate. You can retry or enter the area manually.";
}

export function getVeryWeakLocationAccuracyMessage(lang: LocationAccuracyLanguage) {
  return lang === "ro"
    ? "Locația este foarte aproximativă. Introdu o adresă sau alege o zonă pentru rezultate mai bune."
    : "The location is very approximate. Enter an address or choose an area for better results.";
}
