import { expect, test } from "@playwright/test";
import {
  formatMedicalCareDecisionTime,
  getMedicalCareDecisionTimeLabel,
  getNightPriorityMessage,
  isEveningOrNightInTimeZone,
} from "../src/lib/oraAjutorAproape";
import { ROMANIA_TIME_ZONE } from "../src/lib/medical-care.logic";

test("nearby care time display uses Europe/Bucharest explicitly", () => {
  const lateEvening = "2026-06-22T20:58:00.000Z";

  expect(formatMedicalCareDecisionTime(lateEvening, ROMANIA_TIME_ZONE, "ro")).toBe("23:58");
  expect(getMedicalCareDecisionTimeLabel(lateEvening, ROMANIA_TIME_ZONE, "ro")).toBe(
    "Rezultate calculate pentru ora 23:58, Europe/Bucharest.",
  );
});

test("nearby care marks evening and night as priority hours", () => {
  expect(isEveningOrNightInTimeZone("2026-06-22T20:58:00.000Z", ROMANIA_TIME_ZONE)).toBe(
    true,
  );
  expect(isEveningOrNightInTimeZone("2026-06-22T09:00:00.000Z", ROMANIA_TIME_ZONE)).toBe(
    false,
  );
  expect(getNightPriorityMessage("ro")).toBe(
    "La această oră, prioritizăm farmacii deschise acum și locații Non-Stop.",
  );
});
