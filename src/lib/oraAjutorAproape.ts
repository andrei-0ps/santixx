import { ROMANIA_TIME_ZONE } from "@/lib/medical-care.logic";

export type MedicalCareTimeLanguage = "ro" | "en";

export function formatMedicalCareDecisionTime(
  iso: string,
  timeZone = ROMANIA_TIME_ZONE,
  lang: MedicalCareTimeLanguage = "ro",
) {
  return new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

export function getMedicalCareDecisionTimeLabel(
  iso: string,
  timeZone = ROMANIA_TIME_ZONE,
  lang: MedicalCareTimeLanguage = "ro",
) {
  const time = formatMedicalCareDecisionTime(iso, timeZone, lang);
  return lang === "ro"
    ? `Rezultate calculate pentru ora ${time}, ${timeZone}.`
    : `Results calculated for ${time}, ${timeZone}.`;
}

export function isEveningOrNightInTimeZone(iso: string, timeZone = ROMANIA_TIME_ZONE) {
  const hourText = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
  const hour = Number(hourText);

  return Number.isFinite(hour) && (hour >= 20 || hour < 7);
}

export function getNightPriorityMessage(lang: MedicalCareTimeLanguage = "ro") {
  return lang === "ro"
    ? "La această oră, prioritizăm farmacii deschise acum și locații Non-Stop."
    : "At this hour, we prioritize currently open pharmacies and 24/7 locations.";
}
