import { expect, test } from "@playwright/test";
import {
  buildConsultationSheetModel,
  buildConsultationSheetTextBlocks,
  buildTriagePdfBytes,
  renderConsultationSheetPdf,
  validateConsultationSheetModel,
  type ConsultationSheetModel,
  type SantixTriagePdfReport,
} from "../src/lib/ai/triagePdf";
import {
  applyMessageToTriageState,
  buildGenericTriageSummary,
  type GenericTriageState,
} from "../src/lib/ai/triageFlows";
import { buildTriageOrientation } from "../src/lib/ai/conversationalPolicy";

const kidneyContext = {
  selectedStructure: "Rinichi",
  selectedStructureId: "organ:rinichi",
  technicalStructureName: "Kidney",
  selectedMode: "organs",
  selectedTissue: "organ",
  bodyRegion: "Abdomen și pelvis",
};

function completedKidneyState() {
  let state = applyMessageToTriageState(
    null,
    "mă doare rinichiul de ieri",
    kidneyContext,
  ) as GenericTriageState;
  for (const answer of ["moderată", "nu", "nu", "nu"]) {
    state = applyMessageToTriageState(state, answer, kidneyContext) as GenericTriageState;
  }
  return {
    ...state,
    phase: "completed" as const,
    summaryFinalized: true,
    canGeneratePdf: true,
  };
}

function reportFor(
  state: GenericTriageState,
  lang: "ro" | "en" = "ro",
): SantixTriagePdfReport {
  return {
    generatedAt: "2026-07-18T09:30:00.000Z",
    selectedArea: lang === "en" ? "Kidneys" : "Rinichi",
    problem: lang === "en" ? "kidney pain since yesterday" : "mă doare rinichiul de ieri",
    summary: buildGenericTriageSummary(state, lang),
    triageState: state as unknown as Record<string, unknown>,
    lang,
    selectedStructure: {
      displayName: lang === "en" ? "Kidneys" : "Rinichi",
      scientificName: "Ren",
      mode: "organs",
    },
  };
}

test("completed ConversationState builds a non-empty Romanian consultation model", async () => {
  const state = completedKidneyState();
  const model = buildConsultationSheetModel(reportFor(state, "ro"), "ro");
  const validation = validateConsultationSheetModel(model);

  expect(validation).toEqual({ valid: true, reasons: [] });
  expect(model.locale).toBe("ro");
  expect(model.selectedStructure.displayName).toBe("Rinichi");
  expect(model.initialDescription).toContain("rinichiul");
  expect(model.questionsAndAnswers.length).toBeGreaterThan(0);
  expect(model.questionsAndAnswers.some((row) => row.answer === "moderată")).toBe(true);
  expect(model.consultationSummary).toBeTruthy();
  expect(model.educationalGuidance).toContain("Orientare Santix");
  expect(model.disclaimer).toContain("nu reprezintă un diagnostic");
  const rendered = await renderConsultationSheetPdf(model);
  expect(new TextDecoder().decode(rendered.bytes)).toContain("Orientare Santix");
});

test("final summary explains the concern level without claiming a diagnosis", () => {
  expect(buildTriageOrientation("none", "ro")).toContain("nu au indicat un semn de alarmă");
  expect(buildTriageOrientation("medical_attention", "ro")).toContain("consult medical");
  expect(buildTriageOrientation("urgent", "ro")).toContain("ajutor medical urgent");
  expect(buildTriageOrientation("urgent", "en")).toContain("urgent medical help");
});

test("English consultation model and title are fully localized", () => {
  const model = buildConsultationSheetModel(reportFor(completedKidneyState(), "en"), "en");
  const blocks = buildConsultationSheetTextBlocks(model);

  expect(model.locale).toBe("en");
  expect(blocks.at(0)?.text).toBe("Symptom Summary for Medical Consultation");
  expect(blocks.some((block) => block.text === "Questions and answers")).toBe(true);
  expect(JSON.stringify(model)).not.toContain("Fișă de simptome");
});

test("minimal renderer creates a visible one-page PDF with text blocks", async () => {
  const model: ConsultationSheetModel = {
    locale: "ro",
    generatedAt: "18 iulie 2026, 12:30",
    selectedStructure: { displayName: "Stern", scientificName: "Sternum", mode: "Schelet" },
    initialDescription: "Test fișă Santix",
    reportedDetails: [{ label: "Localizare", value: "Stern" }],
    questionsAndAnswers: [{ question: "Durerea se schimbă la respirație?", answer: "Nu" }],
    missingInformation: [],
    importantDetails: ["Nu au fost declarate semne de alarmă."],
    consultationSummary: "Test fișă Santix pentru verificarea rendererului.",
    educationalGuidance: "Urmărește evoluția simptomelor.",
    disclaimer: "Acest document nu reprezintă un diagnostic.",
  };
  const rendered = await renderConsultationSheetPdf(model);
  const raw = new TextDecoder().decode(rendered.bytes);

  expect(rendered.pageCount).toBe(1);
  expect(rendered.textBlockCount).toBeGreaterThan(8);
  expect(rendered.bytes.byteLength).toBeGreaterThan(1_000);
  expect(raw.startsWith("%PDF-1.4")).toBe(true);
  expect(raw).toContain("/Type /Page");
});

test("invalid state is rejected instead of producing an empty PDF", () => {
  const invalidReport: SantixTriagePdfReport = {
    generatedAt: "2026-07-18T09:30:00.000Z",
    selectedArea: "",
    problem: "",
    summary: "",
    triageState: { answers: {} },
    lang: "ro",
  };
  const model = buildConsultationSheetModel(invalidReport, "ro");
  const validation = validateConsultationSheetModel(model);

  expect(validation.valid).toBe(false);
  expect(validation.reasons).toContain("missing_selected_structure");
  expect(validation.reasons).toContain("missing_conversation_content");
  expect(() => buildTriagePdfBytes(invalidReport)).toThrow(/incomplete/i);
});

test("guest and authenticated state produce the same consultation sheet", () => {
  const state = completedKidneyState();
  const guestModel = buildConsultationSheetModel(
    reportFor({ ...state, conversationId: null }, "ro"),
    "ro",
  );
  const authenticatedModel = buildConsultationSheetModel(
    reportFor({ ...state, conversationId: "conversation-1" }, "ro"),
    "ro",
  );

  expect(guestModel).toEqual(authenticatedModel);
});
