import type { SantixStructuredAiOutput } from "./structured-output";
import {
  buildTriageOrientation,
  normalizeTriageRedFlagLevel,
} from "./conversationalPolicy";

export type PdfLanguage = "ro" | "en";
type TriagePdfAnswer = {
  questionId: string;
  questionText: string;
  rawAnswer: string | null;
  normalizedValue: string;
  displayAnswer: string;
  detailLabel: string;
};
export type ConsultationSheetModel = {
  locale: PdfLanguage;
  generatedAt: string;
  selectedStructure: {
    displayName: string;
    scientificName?: string;
    mode?: string;
  };
  initialDescription: string;
  reportedDetails: Array<{
    label: string;
    value: string;
  }>;
  questionsAndAnswers: Array<{
    question: string;
    answer: string;
  }>;
  missingInformation: string[];
  importantDetails: string[];
  consultationSummary: string;
  educationalGuidance: string;
  disclaimer: string;
};

export type ConsultationSheetValidation = {
  valid: boolean;
  reasons: string[];
};

export type RenderedConsultationSheetPdf = {
  bytes: Uint8Array;
  pageCount: number;
  textBlockCount: number;
};

export class ConsultationSheetValidationError extends Error {
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super("Consultation sheet data is incomplete");
    this.name = "ConsultationSheetValidationError";
    this.reasons = reasons;
  }
}

export type SantixTriagePdfReport = {
  generatedAt: Date | string;
  selectedArea: string;
  problem: string;
  summary: string;
  detectedIntent?: string | null;
  triageState?: Record<string, unknown> | null;
  lang?: PdfLanguage;
  selectedStructure?: {
    displayName?: string | null;
    scientificName?: string | null;
    mode?: string | null;
  };
};

type PdfTranslations = {
  title: string;
  subtitle: string;
  dateAndTime: string;
  exploredArea: string;
  anatomicalTerm: string;
  mode: string;
  userDescription: string;
  reportedSymptoms: string;
  questionsAndAnswers: string;
  missingInformation: string;
  importantDetails: string;
  summaryForClinician: string;
  recommendation: string;
  importantNotice: string;
  notSpecified: string;
  none: string;
  yes: string;
  no: string;
  unknown: string;
  page: string;
  of: string;
  fields: Record<string, string>;
  values: Record<string, string>;
  recommendationText: string;
  disclaimer: string;
  defaultSummary: string;
  defaultImportant: string;
};

const PDF_TRANSLATIONS: Record<PdfLanguage, PdfTranslations> = {
  ro: {
    title: "Fișă de simptome pentru consultație",
    subtitle: "Generată pe baza informațiilor introduse de utilizator în Santix",
    dateAndTime: "Data și ora",
    exploredArea: "Zona explorată",
    anatomicalTerm: "Denumire anatomică",
    mode: "Mod",
    userDescription: "Problema descrisă",
    reportedSymptoms: "Simptome și detalii raportate",
    questionsAndAnswers: "Întrebări și răspunsuri",
    missingInformation: "Informații neprecizate",
    importantDetails: "Elemente importante pentru consultație",
    summaryForClinician: "Rezumat pentru medic",
    recommendation: "Recomandare educațională",
    importantNotice: "Notă importantă",
    notSpecified: "neprecizat",
    none: "niciuna",
    yes: "Da",
    no: "Nu",
    unknown: "Nu știu",
    page: "Pagina",
    of: "din",
    fields: {
      location: "Localizare",
      severity: "Intensitate",
      onset: "Debut",
      trauma: "Traumă/efort",
      movementNormal: "Mișcare normală",
      swelling: "Umflare",
      bruising: "Vânătaie",
      numbness: "Amorțeală/furnicături",
      weakness: "Slăbiciune",
      deformity: "Deformare",
      duration: "Durată",
      woundDepth: "Profunzimea rănii",
      bleeding: "Sângerare",
      sensationNormal: "Sensibilitate normală",
      dirtyObject: "Obiect murdar/ruginit, ciob sau mușcătură",
      urinarySigns: "Febră, frisoane sau usturime la urinare",
      bloodUrine: "Sânge în urină",
      nauseaCannotUrinate: "Greață sau dificultate la urinare",
      mainConcern: "Problemă principală",
    },
    values: {
      mild: "ușoară",
      moderate: "moderată",
      moderate_to_severe: "destul de puternică",
      severe: "severă",
      superficial: "superficială",
      deep: "adâncă",
      partial: "parțial",
      sudden: "brusc",
      gradual: "treptat",
      minutes: "minute",
      hours: "ore",
      days: "zile",
      week_plus: "o săptămână sau mai mult",
      chronic: "cronic",
      fall: "căzătură",
      hit: "lovitură",
      sport: "sport",
      effort: "efort",
      none: "nu",
    },
    recommendationText:
      "Urmărește evoluția simptomelor și notează orice schimbare. Solicită evaluare medicală dacă simptomele se agravează, persistă sau apar manifestări noi care te îngrijorează.",
    disclaimer:
      "Santix organizează informațiile introduse de utilizator în scop educațional. Această fișă nu reprezintă un diagnostic, o prescripție sau un document medical și nu înlocuiește consultația unui profesionist medical.",
    defaultSummary:
      "Utilizatorul a oferit informații despre o problemă de sănătate, iar fișa sintetizează răspunsurile declarate pentru a sprijini discuția cu un profesionist medical.",
    defaultImportant:
      "Nu au fost declarate elemente suplimentare importante în răspunsurile disponibile.",
  },
  en: {
    title: "Symptom Summary for Medical Consultation",
    subtitle: "Generated from the information provided by the user in Santix",
    dateAndTime: "Date and time",
    exploredArea: "Explored area",
    anatomicalTerm: "Anatomical term",
    mode: "Mode",
    userDescription: "User description",
    reportedSymptoms: "Reported symptoms and details",
    questionsAndAnswers: "Questions and answers",
    missingInformation: "Missing information",
    importantDetails: "Important details for the consultation",
    summaryForClinician: "Summary for the clinician",
    recommendation: "Educational guidance",
    importantNotice: "Important notice",
    notSpecified: "not specified",
    none: "none",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    page: "Page",
    of: "of",
    fields: {
      location: "Location",
      severity: "Intensity",
      onset: "Onset",
      trauma: "Trauma/exertion",
      movementNormal: "Normal movement",
      swelling: "Swelling",
      bruising: "Bruising",
      numbness: "Numbness/tingling",
      weakness: "Weakness",
      deformity: "Deformity",
      duration: "Duration",
      woundDepth: "Wound depth",
      bleeding: "Bleeding",
      sensationNormal: "Normal sensation",
      dirtyObject: "Dirty/rusty object, glass, or bite",
      urinarySigns: "Fever, chills, or burning during urination",
      bloodUrine: "Blood in urine",
      nauseaCannotUrinate: "Nausea or difficulty urinating",
      mainConcern: "Main concern",
    },
    values: {
      mild: "mild",
      moderate: "moderate",
      moderate_to_severe: "fairly strong",
      severe: "severe",
      superficial: "superficial",
      deep: "deep",
      partial: "partial",
      sudden: "sudden",
      gradual: "gradual",
      minutes: "minutes",
      hours: "hours",
      days: "days",
      week_plus: "one week or more",
      chronic: "chronic",
      fall: "fall",
      hit: "hit",
      sport: "sport",
      effort: "exertion",
      none: "no",
    },
    recommendationText:
      "Monitor how the symptoms evolve and note any changes. Seek medical assessment if the symptoms worsen, persist, or new concerning symptoms appear.",
    disclaimer:
      "Santix organizes user-provided information for educational purposes. This document is not a diagnosis, prescription, or medical record and does not replace consultation with a healthcare professional.",
    defaultSummary:
      "The user provided information about a health concern, and this sheet summarizes the reported answers to support discussion with a healthcare professional.",
    defaultImportant:
      "No additional important details were declared in the available answers.",
  },
};

const DEFAULT_QUESTION_LABELS: Record<string, { ro: string; en: string }> = {
  pain_present: { ro: "Durere raportată?", en: "Pain reported?" },
  pain_quality: { ro: "Tipul durerii", en: "Pain quality" },
  trauma_or_effort: {
    ro: "A apărut după lovitură, căzătură sau efort?",
    en: "Did it start after a hit, fall, or exertion?",
  },
  trauma: {
    ro: "A apărut după căzătură, lovitură sau efort?",
    en: "Did it start after a fall, hit, or exertion?",
  },
  trauma_type: { ro: "Context traumatic / efort", en: "Trauma / exertion context" },
  onset: { ro: "Debut", en: "Onset" },
  movement_ok: { ro: "Poți mișca zona normal?", en: "Can you move the area normally?" },
  movementNormal: { ro: "Poți mișca zona normal?", en: "Can you move the area normally?" },
  movementLimitation: {
    ro: "Poți mișca sau sprijini zona normal?",
    en: "Can you move or support the area normally?",
  },
  severity: { ro: "Intensitatea durerii", en: "Pain intensity" },
  swelling: { ro: "Ai observat umflare?", en: "Have you noticed swelling?" },
  bruising: { ro: "Vânătaie", en: "Bruising" },
  numbness: {
    ro: "Ai amorțeală, slăbiciune sau furnicături?",
    en: "Do you have numbness, weakness, or tingling?",
  },
  weakness: { ro: "Slăbiciune", en: "Weakness" },
  deformity: { ro: "Zona pare deformată?", en: "Does the area look deformed?" },
  duration: { ro: "Durată", en: "Duration" },
  bleedingNow: { ro: "Sângerează acum?", en: "Is it still bleeding?" },
  bleedingStopsWithPressure: {
    ro: "Sângerarea se oprește la presiune?",
    en: "Does bleeding stop with pressure?",
  },
  depth: { ro: "Rana pare superficială sau adâncă?", en: "Is the wound superficial or deep?" },
  sensationNormal: {
    ro: "Simți normal vârful degetului?",
    en: "Is fingertip sensation normal?",
  },
  dirtyObject: {
    ro: "A fost cu obiect murdar/ruginit, ciob sau mușcătură?",
    en: "Was it caused by a dirty/rusty object, glass, or bite?",
  },
  timeSinceInjury: { ro: "De cât timp s-a întâmplat?", en: "How long ago did it happen?" },
  feverChillsBurning: {
    ro: "Ai febră, frisoane sau usturime la urinare?",
    en: "Do you have fever, chills, or burning during urination?",
  },
  bloodUrine: { ro: "Ai observat sânge în urină?", en: "Have you noticed blood in urine?" },
  nauseaCannotUrinate: {
    ro: "Ai greață sau dificultate la urinare?",
    en: "Do you have nausea or difficulty urinating?",
  },
};

const DETAIL_LABEL_BY_QUESTION: Record<string, keyof PdfTranslations["fields"]> = {
  location: "location",
  severity: "severity",
  painSeverity: "severity",
  onset: "onset",
  sudden: "onset",
  trauma: "trauma",
  trauma_or_effort: "trauma",
  trauma_type: "trauma",
  movement_ok: "movementNormal",
  movementNormal: "movementNormal",
  movementLimitation: "movementNormal",
  swelling: "swelling",
  bruising: "bruising",
  numbness: "numbness",
  sensationNormal: "sensationNormal",
  weakness: "weakness",
  deformity: "deformity",
  duration: "duration",
  timeSinceInjury: "duration",
  depth: "woundDepth",
  blistersOrDeep: "woundDepth",
  bleedingNow: "bleeding",
  bleedingStopsWithPressure: "bleeding",
  dirtyObject: "dirtyObject",
  feverChillsBurning: "urinarySigns",
  bloodUrine: "bloodUrine",
  nauseaCannotUrinate: "nauseaCannotUrinate",
  mainConcern: "mainConcern",
};

export function getTriagePdfTranslations(language: PdfLanguage = "ro") {
  return PDF_TRANSLATIONS[language];
}

export function canGenerateTriagePdf(
  summaryFinalized: boolean,
  structured?: SantixStructuredAiOutput | null,
) {
  if (!structured || structured.classification === "informational_anatomy") return false;
  const triageState = stateRecord(structured.triageState);
  const answers = stateRecord(triageState.answers);
  const completedQuestions = Array.isArray(triageState.completedQuestions)
    ? triageState.completedQuestions
    : [];
  const hasTriageData =
    Object.keys(answers).length > 0 ||
    completedQuestions.length > 0 ||
    typeof triageState.activeFlow === "string" ||
    typeof triageState.detectedIntent === "string";
  const stateAllowsPdf = triageState.summaryFinalized === true || triageState.isCompleted === true;

  return Boolean(
    hasTriageData &&
      (summaryFinalized || structured.canGeneratePdf === true || stateAllowsPdf) &&
      structured.summary &&
      structured.triageState,
  );
}

function stateRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function selectedModeLabel(value: string | null, lang: PdfLanguage) {
  const normalized = (value ?? "").toLowerCase();
  if (!normalized) return null;
  const labels: Record<string, { ro: string; en: string }> = {
    skeleton: { ro: "Schelet", en: "Skeleton" },
    os: { ro: "Schelet", en: "Skeleton" },
    muscular: { ro: "Mușchi", en: "Muscles" },
    muschi: { ro: "Mușchi", en: "Muscles" },
    organs: { ro: "Organe", en: "Organs" },
    organ: { ro: "Organe", en: "Organs" },
    complete: { ro: "Anatomie completă", en: "Complete anatomy" },
  };
  return labels[normalized]?.[lang] ?? value;
}

function formatPdfDate(value: Date | string, lang: PdfLanguage) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: lang === "en",
    timeZone: "Europe/Bucharest",
  }).format(date);
}

function localizedValue(value: unknown, lang: PdfLanguage) {
  const t = getTriagePdfTranslations(lang);
  if (value === true || value === "yes") return t.yes;
  if (value === false || value === "no") return t.no;
  if (value === null || value === undefined || value === "" || value === "unknown") {
    return t.unknown;
  }
  const text = String(value).trim();
  return t.values[text] ?? text;
}

function isSpecifiedValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "" && value !== "unknown";
}

function questionLabel(
  key: string,
  labelSet: unknown,
  fallbackLabelSet: { ro: string; en: string } | undefined,
  lang: PdfLanguage,
) {
  const labelRecord = stateRecord(labelSet);
  const candidate = lang === "en" ? labelRecord.en : labelRecord.ro;
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  const fallback = lang === "en" ? fallbackLabelSet?.en : fallbackLabelSet?.ro;
  return fallback ?? key;
}

function extractStateParts(state: Record<string, unknown> | null | undefined) {
  const source = stateRecord(state);
  const answers = stateRecord(source.answers);
  const normalizedAnswers = stateRecord(source.normalizedAnswers);
  const labelsFromState = stateRecord(source.questionLabels) as Record<
    string,
    { ro?: unknown; en?: unknown }
  >;
  const questionLabels = Object.keys(labelsFromState).length > 0 ? labelsFromState : {};
  const redFlags = Array.isArray(source.redFlags)
    ? source.redFlags.filter((item): item is string => typeof item === "string")
    : [];
  return { source, answers, normalizedAnswers, questionLabels, redFlags };
}

function answerRowsFromState(
  state: Record<string, unknown> | null | undefined,
  lang: PdfLanguage,
): TriagePdfAnswer[] {
  const { answers, normalizedAnswers, questionLabels } = extractStateParts(state);
  const keys = Array.from(
    new Set([...Object.keys(questionLabels), ...Object.keys(DEFAULT_QUESTION_LABELS), ...Object.keys(answers)]),
  ).filter((key) => key in answers || key in questionLabels);
  const t = getTriagePdfTranslations(lang);

  return keys.map((key) => {
    const value = answers[key];
    const normalizedRow = stateRecord(normalizedAnswers[key]);
    const userAnswer = cleanText(normalizedRow.rawValue);
    const detailKey = DETAIL_LABEL_BY_QUESTION[key];
    return {
      questionId: key,
      questionText: questionLabel(key, questionLabels[key], DEFAULT_QUESTION_LABELS[key], lang),
      rawAnswer: userAnswer || (isSpecifiedValue(value) ? String(value) : null),
      normalizedValue: isSpecifiedValue(value) ? String(value) : "unknown",
      displayAnswer:
        userAnswer || (isSpecifiedValue(value) ? localizedValue(value, lang) : t.notSpecified),
      detailLabel: detailKey ? t.fields[detailKey] : questionLabel(key, questionLabels[key], DEFAULT_QUESTION_LABELS[key], lang),
    };
  });
}

function pushDetail(
  details: Array<{ label: string; value: string }>,
  labelsSeen: Set<string>,
  label: string,
  value: string,
  t: PdfTranslations,
) {
  if (labelsSeen.has(label)) return;
  labelsSeen.add(label);
  details.push({ label, value: value || t.notSpecified });
}

function reportedDetailsFromAnswers(
  report: SantixTriagePdfReport,
  answers: TriagePdfAnswer[],
  lang: PdfLanguage,
) {
  const t = getTriagePdfTranslations(lang);
  const details: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();
  if (report.selectedArea) pushDetail(details, seen, t.fields.location, report.selectedArea, t);

  const preferredOrder = [
    "severity",
    "painSeverity",
    "onset",
    "sudden",
    "trauma",
    "trauma_or_effort",
    "trauma_type",
    "movement_ok",
    "movementNormal",
    "movementLimitation",
    "swelling",
    "bruising",
    "numbness",
    "sensationNormal",
    "weakness",
    "deformity",
    "duration",
    "timeSinceInjury",
    "depth",
    "bleedingNow",
    "bleedingStopsWithPressure",
    "dirtyObject",
    "feverChillsBurning",
    "bloodUrine",
    "nauseaCannotUrinate",
    "mainConcern",
  ];
  for (const key of preferredOrder) {
    const row = answers.find((item) => item.questionId === key && item.rawAnswer);
    if (row) pushDetail(details, seen, row.detailLabel, row.displayAnswer, t);
  }
  return details.length ? details : [{ label: t.fields.location, value: t.notSpecified }];
}

function importantDetailsFromState(
  state: Record<string, unknown> | null | undefined,
  answers: TriagePdfAnswer[],
  lang: PdfLanguage,
) {
  const t = getTriagePdfTranslations(lang);
  const { redFlags } = extractStateParts(state);
  const important = new Set<string>();
  const answerValue = (id: string) => answers.find((item) => item.questionId === id)?.normalizedValue;

  if (answerValue("movementLimitation") === "no" || answerValue("movementNormal") === "no") {
    important.add(
      lang === "en"
        ? "The user reported that normal movement/support is not preserved."
        : "Utilizatorul a menționat că mișcarea/sprijinul normal nu este păstrat.",
    );
  }
  if (answerValue("numbness") === "yes" || answerValue("sensationNormal") === "no") {
    important.add(
      lang === "en"
        ? "The user mentioned numbness, weakness, tingling, or altered sensation."
        : "Utilizatorul a menționat amorțeală, slăbiciune, furnicături sau sensibilitate schimbată.",
    );
  }
  if (answerValue("deformity") === "yes") {
    important.add(lang === "en" ? "Visible deformity was reported." : "A fost raportată deformare vizibilă.");
  }
  if (answerValue("severity") === "severe" || answerValue("severity") === "moderate_to_severe") {
    important.add(
      lang === "en"
        ? "The pain was described as strong or close to severe."
        : "Durerea a fost descrisă ca puternică sau aproape severă.",
    );
  }
  if (answerValue("dirtyObject") === "yes") {
    important.add(
      lang === "en"
        ? "The wound may have involved a dirty/rusty object, glass, or a bite."
        : "Rana poate fi legată de obiect murdar/ruginit, ciob sau mușcătură.",
    );
  }
  for (const flag of redFlags) {
    const normalized = flag.toLowerCase();
    if (normalized.includes("intent") || normalized.includes("flow")) continue;
    important.add(flag);
  }
  return important.size ? Array.from(important) : [t.defaultImportant];
}

function missingInformationFromAnswers(answers: TriagePdfAnswer[], lang: PdfLanguage) {
  const t = getTriagePdfTranslations(lang);
  const missing = answers
    .filter((answer) => !answer.rawAnswer || answer.normalizedValue === "unknown")
    .map((answer) => answer.detailLabel || answer.questionText);
  return Array.from(new Set(missing)).slice(0, 10);
}

function sanitizeSummary(value: string, lang: PdfLanguage) {
  const internalLine = /\b(intent detectat|detected intent|activeFlow|detectedIntent|questionId|currentQuestionId|redFlagLevel|structured output|RAG|confidence|rank|API key|OPENAI)\b/i;
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter((line) => line && !internalLine.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, lang === "en" ? 700 : 760);
}

function buildNaturalSummary(
  report: SantixTriagePdfReport,
  answers: TriagePdfAnswer[],
  lang: PdfLanguage,
) {
  const t = getTriagePdfTranslations(lang);
  const details = reportedDetailsFromAnswers(report, answers, lang).filter(
    (detail) => detail.value !== t.notSpecified,
  );
  if (details.length > 1) {
    const joined = details
      .slice(0, 7)
      .map((detail) => `${detail.label}: ${detail.value}`)
      .join("; ");
    return lang === "en"
      ? `The user described ${report.problem || "a health concern"} in the explored area. Reported details: ${joined}. This summary uses only the information provided by the user.`
      : `Utilizatorul a descris ${report.problem || "o problemă de sănătate"} în zona explorată. Detalii raportate: ${joined}. Rezumatul folosește doar informațiile furnizate de utilizator.`;
  }
  const cleanSummary = sanitizeSummary(report.summary, lang);
  return cleanSummary || t.defaultSummary;
}

function buildEducationalGuidance(
  report: SantixTriagePdfReport,
  lang: PdfLanguage,
) {
  const state = stateRecord(report.triageState);
  const level = normalizeTriageRedFlagLevel(state.redFlagLevel) ?? "needs_more_info";
  return buildTriageOrientation(level, lang);
}

export function buildConsultationSheetModel(
  report: SantixTriagePdfReport,
  locale: PdfLanguage = report.lang ?? "ro",
): ConsultationSheetModel {
  const lang = locale;
  const t = getTriagePdfTranslations(lang);
  const answers = answerRowsFromState(report.triageState, lang);
  const scientificName = cleanText(report.selectedStructure?.scientificName);
  const mode = selectedModeLabel(cleanText(report.selectedStructure?.mode), lang);

  return {
    locale: lang,
    generatedAt: formatPdfDate(report.generatedAt, lang),
    selectedStructure: {
      displayName:
        cleanText(report.selectedStructure?.displayName) || cleanText(report.selectedArea) || t.notSpecified,
      ...(scientificName ? { scientificName } : {}),
      ...(mode ? { mode } : {}),
    },
    initialDescription: cleanText(report.problem) || t.notSpecified,
    reportedDetails: reportedDetailsFromAnswers(report, answers, lang),
    questionsAndAnswers: answers.map((answer) => ({
      question: answer.questionText,
      answer: answer.displayAnswer,
    })),
    missingInformation: missingInformationFromAnswers(answers, lang),
    importantDetails: importantDetailsFromState(report.triageState, answers, lang),
    consultationSummary: buildNaturalSummary(report, answers, lang),
    educationalGuidance: buildEducationalGuidance(report, lang),
    disclaimer: t.disclaimer,
  };
}

export function buildTriagePdfModel(report: SantixTriagePdfReport) {
  return buildConsultationSheetModel(report, report.lang ?? "ro");
}

export function validateConsultationSheetModel(
  model: ConsultationSheetModel,
): ConsultationSheetValidation {
  const t = getTriagePdfTranslations(model.locale);
  const reasons: string[] = [];
  if (!cleanText(t.title)) reasons.push("missing_title");
  if (
    !cleanText(model.selectedStructure.displayName) ||
    cleanText(model.selectedStructure.displayName) === t.notSpecified
  ) {
    reasons.push("missing_selected_structure");
  }
  const hasInitialDescription =
    cleanText(model.initialDescription) !== "" && cleanText(model.initialDescription) !== t.notSpecified;
  const hasAnswer = model.questionsAndAnswers.some(
    (row) => cleanText(row.answer) !== "" && cleanText(row.answer) !== t.notSpecified,
  );
  if (!hasInitialDescription && !hasAnswer) reasons.push("missing_conversation_content");
  const hasSectionContent =
    model.reportedDetails.some((detail) => cleanText(detail.value) !== t.notSpecified) ||
    hasAnswer ||
    model.importantDetails.some((detail) => cleanText(detail) !== "") ||
    cleanText(model.consultationSummary) !== "" ||
    cleanText(model.educationalGuidance) !== "";
  if (!hasSectionContent) reasons.push("missing_sections");
  if (!cleanText(model.disclaimer)) reasons.push("missing_disclaimer");
  return { valid: reasons.length === 0, reasons };
}

function sectionLines(title: string, lines: string[]) {
  return ["", title, ...lines];
}

export function buildTriagePdfText(report: SantixTriagePdfReport) {
  const model = buildConsultationSheetModel(report, report.lang ?? "ro");
  const t = getTriagePdfTranslations(model.locale);
  const areaLines = [
    `${t.exploredArea}: ${model.selectedStructure.displayName}`,
    ...(model.selectedStructure.scientificName
      ? [`${t.anatomicalTerm}: ${model.selectedStructure.scientificName}`]
      : []),
    ...(model.selectedStructure.mode ? [`${t.mode}: ${model.selectedStructure.mode}`] : []),
  ];
  const answerLines = model.questionsAndAnswers.length
    ? model.questionsAndAnswers.map((answer) => `${answer.question}: ${answer.answer}`)
    : [t.notSpecified];

  return [
    t.title,
    t.subtitle,
    "",
    `${t.dateAndTime}: ${model.generatedAt}`,
    ...sectionLines(t.exploredArea, areaLines),
    ...sectionLines(t.userDescription, [model.initialDescription]),
    ...sectionLines(
      t.reportedSymptoms,
      model.reportedDetails.map((detail) => `• ${detail.label}: ${detail.value}`),
    ),
    ...sectionLines(t.questionsAndAnswers, answerLines),
    ...sectionLines(
      t.missingInformation,
      (model.missingInformation.length ? model.missingInformation : [t.none]).map(
        (line) => `• ${line}`,
      ),
    ),
    ...sectionLines(
      t.importantDetails,
      model.importantDetails.map((line) => `• ${line}`),
    ),
    ...sectionLines(t.summaryForClinician, [model.consultationSummary]),
    ...sectionLines(t.recommendation, [model.educationalGuidance]),
    ...sectionLines(t.importantNotice, [model.disclaimer]),
  ].join("\n");
}

export type ConsultationSheetTextBlock = {
  kind: "title" | "subtitle" | "meta" | "section" | "body" | "row" | "bullet" | "notice";
  text: string;
};

export function buildConsultationSheetTextBlocks(
  model: ConsultationSheetModel,
): ConsultationSheetTextBlock[] {
  const t = getTriagePdfTranslations(model.locale);
  const blocks: ConsultationSheetTextBlock[] = [
    { kind: "title", text: t.title },
    { kind: "subtitle", text: t.subtitle },
    { kind: "meta", text: `${t.dateAndTime}: ${model.generatedAt}` },
    { kind: "section", text: t.exploredArea },
    { kind: "row", text: `${t.exploredArea}: ${model.selectedStructure.displayName}` },
  ];
  if (model.selectedStructure.scientificName) {
    blocks.push({
      kind: "row",
      text: `${t.anatomicalTerm}: ${model.selectedStructure.scientificName}`,
    });
  }
  if (model.selectedStructure.mode) {
    blocks.push({ kind: "row", text: `${t.mode}: ${model.selectedStructure.mode}` });
  }
  blocks.push(
    { kind: "section", text: t.userDescription },
    { kind: "body", text: model.initialDescription },
    { kind: "section", text: t.reportedSymptoms },
    ...model.reportedDetails.map<ConsultationSheetTextBlock>((detail) => ({
      kind: "bullet",
      text: `${detail.label}: ${detail.value}`,
    })),
    { kind: "section", text: t.questionsAndAnswers },
    ...(model.questionsAndAnswers.length
      ? model.questionsAndAnswers.map<ConsultationSheetTextBlock>((row) => ({
          kind: "row",
          text: `${row.question}: ${row.answer}`,
        }))
      : [{ kind: "row" as const, text: t.notSpecified }]),
    { kind: "section", text: t.missingInformation },
    ...(model.missingInformation.length
      ? model.missingInformation.map<ConsultationSheetTextBlock>((text) => ({
          kind: "bullet",
          text,
        }))
      : [{ kind: "bullet" as const, text: t.none }]),
    { kind: "section", text: t.importantDetails },
    ...model.importantDetails.map<ConsultationSheetTextBlock>((text) => ({ kind: "bullet", text })),
    { kind: "section", text: t.summaryForClinician },
    { kind: "body", text: model.consultationSummary },
    { kind: "section", text: t.recommendation },
    { kind: "body", text: model.educationalGuidance },
    { kind: "section", text: t.importantNotice },
    { kind: "notice", text: model.disclaimer },
  );
  return blocks.filter((block) => cleanText(block.text));
}

function wrapByCharacterCount(text: string, maxLength = 86) {
  if (!text.trim()) return [""];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function portablePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[•–—]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

const encoder = new TextEncoder();

function byteLength(value: string) {
  return encoder.encode(value).length;
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function assemblePdfObjects(objects: Uint8Array[]) {
  const header = encoder.encode("%PDF-1.4\n");
  const chunks: Uint8Array[] = [header];
  const offsets = [0];
  let offset = header.length;
  for (let index = 1; index < objects.length; index += 1) {
    const prefix = encoder.encode(`${index} 0 obj\n`);
    const suffix = encoder.encode("\nendobj\n");
    offsets[index] = offset;
    chunks.push(prefix, objects[index], suffix);
    offset += prefix.length + objects[index].length + suffix.length;
  }
  const xrefStart = offset;
  const xref = [
    `xref\n0 ${objects.length}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  ].join("");
  chunks.push(encoder.encode(xref));
  return concatBytes(chunks);
}

function buildPortableTextPdf(model: ConsultationSheetModel): RenderedConsultationSheetPdf {
  const t = getTriagePdfTranslations(model.locale);
  const blocks = buildConsultationSheetTextBlocks(model);
  const lines = blocks.flatMap((block) => wrapByCharacterCount(block.text));
  const pages: string[][] = [[]];
  for (const line of lines) {
    if (pages.at(-1)!.length >= 48) pages.push([]);
    pages.at(-1)!.push(line);
  }
  const objects: Uint8Array[] = new Array(4 + pages.length * 2);
  objects[1] = encoder.encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encoder.encode(
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  objects[3] = encoder.encode(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  );
  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 4 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const contentLines = pageLines.map(
      (line, lineIndex) =>
        `BT /F1 9 Tf 42 ${792 - lineIndex * 15} Td (${portablePdfText(line)}) Tj ET`,
    );
    contentLines.push(
      `BT /F1 8 Tf 42 34 Td (${portablePdfText(`${t.page} ${index + 1} ${t.of} ${pages.length}`)}) Tj ET`,
    );
    const content = contentLines.join("\n");
    objects[pageObjectNumber] = encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects[contentObjectNumber] = encoder.encode(
      `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`,
    );
  });
  return { bytes: assemblePdfObjects(objects), pageCount: pages.length, textBlockCount: blocks.length };
}

function canvasStyle(block: ConsultationSheetTextBlock) {
  switch (block.kind) {
    case "title":
      return { font: "700 40px Arial, sans-serif", color: "#0f172a", lineHeight: 50, before: 6, after: 10 };
    case "subtitle":
      return { font: "400 21px Arial, sans-serif", color: "#475569", lineHeight: 30, before: 0, after: 24 };
    case "section":
      return { font: "700 24px Arial, sans-serif", color: "#0e7490", lineHeight: 32, before: 24, after: 8 };
    case "meta":
      return { font: "400 18px Arial, sans-serif", color: "#475569", lineHeight: 27, before: 0, after: 10 };
    case "notice":
      return { font: "400 17px Arial, sans-serif", color: "#334155", lineHeight: 27, before: 4, after: 10 };
    case "bullet":
      return { font: "400 18px Arial, sans-serif", color: "#1e293b", lineHeight: 28, before: 2, after: 4 };
    default:
      return { font: "400 18px Arial, sans-serif", color: "#1e293b", lineHeight: 28, before: 2, after: 6 };
  }
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function jpegBytesFromCanvas(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function streamObject(dictionary: string, stream: Uint8Array) {
  return concatBytes([
    encoder.encode(`<< ${dictionary} /Length ${stream.length} >>\nstream\n`),
    stream,
    encoder.encode("\nendstream"),
  ]);
}

function buildImagePdf(
  pageImages: Array<{ bytes: Uint8Array; width: number; height: number }>,
) {
  const objects: Uint8Array[] = new Array(3 + pageImages.length * 3);
  objects[1] = encoder.encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encoder.encode(
    `<< /Type /Pages /Kids [${pageImages.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] /Count ${pageImages.length} >>`,
  );
  pageImages.forEach((image, index) => {
    const pageObjectNumber = 3 + index * 3;
    const contentObjectNumber = pageObjectNumber + 1;
    const imageObjectNumber = pageObjectNumber + 2;
    const content = encoder.encode("q 595 0 0 842 0 0 cm /SheetPage Do Q");
    objects[pageObjectNumber] = encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /SheetPage ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects[contentObjectNumber] = streamObject("", content);
    objects[imageObjectNumber] = streamObject(
      `/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
      image.bytes,
    );
  });
  return assemblePdfObjects(objects);
}

export async function renderConsultationSheetPdf(
  model: ConsultationSheetModel,
): Promise<RenderedConsultationSheetPdf> {
  const validation = validateConsultationSheetModel(model);
  if (!validation.valid) throw new ConsultationSheetValidationError(validation.reasons);
  const blocks = buildConsultationSheetTextBlocks(model);
  if (typeof document === "undefined") return buildPortableTextPdf(model);
  if (document.fonts?.ready) await document.fonts.ready;

  const pageWidth = 1240;
  const pageHeight = 1754;
  const margin = 94;
  const footerSpace = 88;
  const contentWidth = pageWidth - margin * 2;
  const canvases: HTMLCanvasElement[] = [];
  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let y = margin;

  const startPage = () => {
    canvas = document.createElement("canvas");
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const nextContext = canvas.getContext("2d");
    if (!nextContext) throw new Error("consultation_sheet_canvas_unavailable");
    context = nextContext;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageWidth, pageHeight);
    context.fillStyle = "#0891b2";
    context.fillRect(margin, 54, 150, 8);
    y = margin;
    canvases.push(canvas);
  };
  startPage();

  for (const block of blocks) {
    const style = canvasStyle(block);
    context.font = style.font;
    const prefix = block.kind === "bullet" ? "• " : "";
    const lines = wrapCanvasText(context, `${prefix}${block.text}`, contentWidth);
    const requiredHeight = style.before + lines.length * style.lineHeight + style.after;
    const sectionNeedsRoom = block.kind === "section" ? style.lineHeight + 50 : 0;
    if (y + Math.max(requiredHeight, sectionNeedsRoom) > pageHeight - footerSpace) startPage();
    context.font = style.font;
    context.fillStyle = style.color;
    y += style.before;
    for (const line of lines) {
      context.fillText(line, margin, y + style.lineHeight);
      y += style.lineHeight;
    }
    y += style.after;
  }

  const t = getTriagePdfTranslations(model.locale);
  canvases.forEach((page, index) => {
    const pageContext = page.getContext("2d");
    if (!pageContext) return;
    pageContext.strokeStyle = "#cbd5e1";
    pageContext.beginPath();
    pageContext.moveTo(margin, pageHeight - 68);
    pageContext.lineTo(pageWidth - margin, pageHeight - 68);
    pageContext.stroke();
    pageContext.font = "400 15px Arial, sans-serif";
    pageContext.fillStyle = "#64748b";
    pageContext.fillText(
      `${t.page} ${index + 1} ${t.of} ${canvases.length}`,
      margin,
      pageHeight - 38,
    );
  });
  const images = canvases.map((page) => ({
    bytes: jpegBytesFromCanvas(page),
    width: page.width,
    height: page.height,
  }));
  return {
    bytes: buildImagePdf(images),
    pageCount: images.length,
    textBlockCount: blocks.length,
  };
}

export function buildTriagePdfBytes(report: SantixTriagePdfReport) {
  const model = buildConsultationSheetModel(report, report.lang ?? "ro");
  const validation = validateConsultationSheetModel(model);
  if (!validation.valid) throw new ConsultationSheetValidationError(validation.reasons);
  return buildPortableTextPdf(model).bytes;
}
