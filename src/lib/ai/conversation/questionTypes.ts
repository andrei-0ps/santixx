export type ConversationLocale = "ro" | "en";

export type ConversationPhase =
  | "initial"
  | "collecting"
  | "clarifying_current_answer"
  | "ready_for_summary"
  | "completed";

export type ConversationMessageIntent =
  | "informational_anatomy"
  | "symptom_report"
  | "injury_report"
  | "follow_up_answer"
  | "correction"
  | "unclear";

export type ConversationFlowId =
  | "wound_cut"
  | "burn"
  | "musculoskeletal_pain"
  | "trauma_fall_hit"
  | "numbness_weakness"
  | "abdominal_pain"
  | "chest_pain"
  | "breathing_problem"
  | "headache_neuro"
  | "digestive_symptom"
  | "urinary_kidney"
  | "informational_anatomy"
  | "unknown";

export type MedicalConversationFlowId = Exclude<ConversationFlowId, "informational_anatomy">;

export type ConversationQuestionType =
  | "yes_no"
  | "trauma_trigger"
  | "severity"
  | "duration"
  | "single_choice"
  | "movement_status"
  | "sensation_status"
  | "free_text_short"
  | "location_confirmation"
  | "numeric_optional"
  | "depth_or_intensity";

export type ConversationAnswerKind =
  | "boolean"
  | "boolean_with_evidence"
  | "any_of_concepts"
  | "single_choice"
  | "duration"
  | "severity"
  | "movement_status"
  | "trauma_mechanism"
  | "sensation_status"
  | "frequency"
  | "numeric_optional"
  | "free_text_short";

export type AnswerPolarity = "positive" | "negative" | "unknown";

export type ConceptEvidenceValue = {
  present: boolean | null;
  detailsUnspecified?: boolean;
  uncertain?: boolean;
  [concept: string]: boolean | null | undefined;
};

export type QuestionSemanticMetadata = {
  answerKind: ConversationAnswerKind;
  expectedConcepts?: string[];
  detailsRequired?: boolean;
  storageMap?: Record<string, string>;
};

export type TraumaTrigger =
  | "fall"
  | "impact"
  | "effort"
  | "repetitive_effort"
  | "other"
  | "none"
  | "unknown";

export type ConversationQuestionOption = {
  value: string;
  labelRo: string;
  labelEn: string;
  terms: string[];
};

export type ConversationQuestionDefinition = {
  id: string;
  type: ConversationQuestionType;
  answerKey: string;
  text: { ro: string; en: string };
  required: boolean;
  options?: ConversationQuestionOption[];
  semantic?: QuestionSemanticMetadata;
  placeholder?: { ro: string; en: string };
};

export type NormalizedDuration =
  | {
      amount: number;
      unit: "minute" | "hour" | "day" | "week" | "month" | "year";
      approximate: boolean;
    }
  | { relative: "today" | "yesterday" | "sudden" | "gradual" }
  | { unknown: true };

export type NormalizedAnswerValue =
  | string
  | number
  | boolean
  | NormalizedDuration
  | ConceptEvidenceValue;

export type AnswerNormalizationResult = {
  status: "valid" | "ambiguous" | "invalid";
  normalizedValue?: NormalizedAnswerValue;
  storageValue?: string;
  rawValue: string;
  detectedConcepts: string[];
  polarity: AnswerPolarity;
  confidence: number;
  uncertain: boolean;
  clarificationReason?: string;
  acknowledgement?: { ro: string; en: string };
  clarificationText?: { ro: string; en: string };
};

export type StoredNormalizedAnswer = {
  questionId: string;
  questionType: ConversationQuestionType;
  rawValue: string;
  normalizedValue: NormalizedAnswerValue;
  detectedConcepts: string[];
  polarity: AnswerPolarity;
  confidence: number;
  uncertain: boolean;
  answeredAt: string;
};

export type ActiveAnswerClarification = {
  questionId: string;
  attempts: number;
  text: { ro: string; en: string };
};

const QUESTION_PLACEHOLDERS: Record<string, { ro: string; en: string }> = {
  duration: { ro: "Ex.: De două zile", en: "E.g. For two days" },
  chestBreathingChange: {
    ro: "Ex.: Da, mă doare mai tare când inspir",
    en: "E.g. Yes, it hurts more when I breathe in",
  },
  deepMuscleMovementOrBreathingChange: {
    ro: "Ex.: Da, se schimbă atunci când respir",
    en: "E.g. Yes, it changes when I breathe",
  },
};

const QUESTION_TYPE_PLACEHOLDERS: Record<ConversationQuestionType, { ro: string; en: string }> = {
  yes_no: { ro: "Ex.: Da, nu sau nu știu", en: "E.g. Yes, no, or not sure" },
  trauma_trigger: {
    ro: "Ex.: Căzătură, lovitură sau efort",
    en: "E.g. A fall, hit, or exertion",
  },
  severity: { ro: "Ex.: Moderată", en: "E.g. Moderate" },
  duration: QUESTION_PLACEHOLDERS.duration,
  single_choice: { ro: "Ex.: Prima variantă", en: "E.g. The first option" },
  movement_status: { ro: "Ex.: Pot mișca normal", en: "E.g. I can move normally" },
  sensation_status: { ro: "Ex.: Simt normal", en: "E.g. Sensation feels normal" },
  free_text_short: { ro: "Scrie un răspuns scurt", en: "Write a short answer" },
  location_confirmation: { ro: "Ex.: În zona selectată", en: "E.g. In the selected area" },
  numeric_optional: { ro: "Ex.: 3", en: "E.g. 3" },
  depth_or_intensity: { ro: "Ex.: Pare superficială", en: "E.g. It seems superficial" },
};

export function getConversationQuestionPlaceholder(input: {
  questionId?: string | null;
  questionType?: ConversationQuestionType | null;
  locale: ConversationLocale;
  fallback: string;
  questionPlaceholder?: { ro: string; en: string } | null;
}) {
  const localized =
    input.questionPlaceholder ??
    (input.questionId ? QUESTION_PLACEHOLDERS[input.questionId] : undefined) ??
    (input.questionType ? QUESTION_TYPE_PLACEHOLDERS[input.questionType] : undefined);
  return localized?.[input.locale] ?? input.fallback;
}
