import { normalizeTriageRedFlagLevel, type TriageRedFlagLevel } from "./conversationalPolicy";

export type SantixAiConfidence = "low" | "medium" | "high";

export type SantixJsonValue =
  string | number | boolean | null | SantixJsonValue[] | { [key: string]: SantixJsonValue };

export type SantixJsonObject = { [key: string]: SantixJsonValue };

export type SantixStructuredAiOutput = {
  reply: string;
  shortAnswer?: string | null;
  followUpQuestion?: string | null;
  details?: string | null;
  triageState?: SantixJsonObject | null;
  summary?: string | null;
  canFinalizeSummary?: boolean;
  canGeneratePdf?: boolean;
  progressLabel?: string | null;
  redFlagLevel?: TriageRedFlagLevel | null;
  showDetailsCollapsed?: boolean;
  intent: string;
  classification: string;
  red_flags_detected: boolean;
  next_question_intent: string | null;
  should_switch_context: boolean;
  target_layer: "skeleton" | "muscular" | "organs" | null;
  target_structure_slug: string | null;
  confidence: SantixAiConfidence;
  needs_medical_attention: boolean;
  used_context: string[];
};

export function buildStructuredAiOutput(input: SantixStructuredAiOutput): SantixStructuredAiOutput {
  return input;
}

export function validateStructuredAiOutput(value: unknown): SantixStructuredAiOutput | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SantixStructuredAiOutput>;
  if (typeof candidate.reply !== "string") return null;
  if (typeof candidate.intent !== "string") return null;
  if (typeof candidate.classification !== "string") return null;
  if (typeof candidate.red_flags_detected !== "boolean") return null;
  if (typeof candidate.should_switch_context !== "boolean") return null;
  if (typeof candidate.needs_medical_attention !== "boolean") return null;
  if (!Array.isArray(candidate.used_context)) return null;

  return {
    reply: candidate.reply,
    shortAnswer: typeof candidate.shortAnswer === "string" ? candidate.shortAnswer : null,
    followUpQuestion:
      typeof candidate.followUpQuestion === "string" ? candidate.followUpQuestion : null,
    details: typeof candidate.details === "string" ? candidate.details : null,
    triageState:
      candidate.triageState && typeof candidate.triageState === "object"
        ? (candidate.triageState as SantixJsonObject)
        : null,
    summary: typeof candidate.summary === "string" ? candidate.summary : null,
    canFinalizeSummary: candidate.canFinalizeSummary === true,
    canGeneratePdf: candidate.canGeneratePdf === true,
    progressLabel: typeof candidate.progressLabel === "string" ? candidate.progressLabel : null,
    redFlagLevel: normalizeTriageRedFlagLevel(candidate.redFlagLevel),
    showDetailsCollapsed: candidate.showDetailsCollapsed === true,
    intent: candidate.intent,
    classification: candidate.classification,
    red_flags_detected: candidate.red_flags_detected,
    next_question_intent: candidate.next_question_intent ?? null,
    should_switch_context: candidate.should_switch_context,
    target_layer:
      candidate.target_layer === "skeleton" ||
      candidate.target_layer === "muscular" ||
      candidate.target_layer === "organs"
        ? candidate.target_layer
        : null,
    target_structure_slug: candidate.target_structure_slug ?? null,
    confidence:
      candidate.confidence === "high" ||
      candidate.confidence === "medium" ||
      candidate.confidence === "low"
        ? candidate.confidence
        : "low",
    needs_medical_attention: candidate.needs_medical_attention,
    used_context: candidate.used_context.filter((item): item is string => typeof item === "string"),
  };
}
