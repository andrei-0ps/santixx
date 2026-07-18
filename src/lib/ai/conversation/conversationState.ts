import type { TriageRedFlagLevel } from "../conversationalPolicy";
import type {
  ActiveAnswerClarification,
  ConversationMessageIntent,
  ConversationPhase,
  ConversationQuestionType,
  MedicalConversationFlowId,
  StoredNormalizedAnswer,
} from "./questionTypes";
import type {
  AnatomicalContext,
  AnatomicalStructureGroup,
  QuestionPlan,
} from "./anatomicalQuestionPlan";

export const CONVERSATION_STATE_VERSION = 1 as const;

export type ConversationStateV1 = {
  version: typeof CONVERSATION_STATE_VERSION;
  conversationId: string | null;
  requestId: string | null;
  revision: number;
  activeFlow: MedicalConversationFlowId;
  detectedIntent: MedicalConversationFlowId;
  messageIntent: ConversationMessageIntent;
  selectedStructureId: string | null;
  selectedStructure: string;
  selectedStructureName: string;
  selectedMode: string;
  anatomicalContext: AnatomicalContext | null;
  questionPlan: QuestionPlan | null;
  originalProblem: string | null;
  intentConfidence: "low" | "medium" | "high";
  matchedKeywords: string[];
  whetherSelectedStructureMatchesIntent: boolean;
  suggestedRedirect: "skin_soft_tissue" | "musculoskeletal" | "organs" | "neuro" | null;
  phase: ConversationPhase;
  currentQuestionId: string | null;
  currentQuestionType: ConversationQuestionType | null;
  currentQuestionPlaceholder: { ro: string; en: string } | null;
  completedQuestionIds: string[];
  completedQuestions: string[];
  answers: Record<string, string>;
  normalizedAnswers: Record<string, StoredNormalizedAnswer>;
  questionLabels: Record<string, { ro: string; en: string }>;
  clarification: ActiveAnswerClarification | null;
  redFlags: string[];
  redFlagLevel: TriageRedFlagLevel;
  step: number;
  totalSteps: number;
  isReadyForSummary: boolean;
  summaryFinalized: boolean;
  canGeneratePdf: boolean;
  redirectNoticeShown: boolean;
  needsCurrentQuestionClarification: boolean;
  lastAnswerAcknowledgementRo: string | null;
  lastAnswerAcknowledgementEn: string | null;
};

export type ConversationStateContext = {
  selectedStructure?: string | null;
  selectedStructureId?: string | null;
  selectedMode?: string | null;
  conversationId?: string | null;
};

export type ConversationStateSource = "request" | "conversation" | "message";

export type ConversationStateSelection = {
  state: ConversationStateV1 | null;
  source: ConversationStateSource | null;
  reason: "no_valid_state" | "highest_revision" | "request_wins_revision_tie";
  revisions: Partial<Record<ConversationStateSource, number>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string")))
    : [];
}

function stringMap(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function questionLabelMap(value: unknown) {
  if (!isRecord(value)) return {};
  const labels: Record<string, { ro: string; en: string }> = {};
  for (const [key, row] of Object.entries(value)) {
    if (!isRecord(row)) continue;
    const ro = stringOrNull(row.ro);
    const en = stringOrNull(row.en);
    if (ro && en) labels[key] = { ro, en };
  }
  return labels;
}

function normalizedAnswerMap(value: unknown) {
  if (!isRecord(value)) return {};
  const answers: Record<string, StoredNormalizedAnswer> = {};
  for (const [key, row] of Object.entries(value)) {
    if (!isRecord(row)) continue;
    if (
      typeof row.questionId !== "string" ||
      typeof row.questionType !== "string" ||
      typeof row.rawValue !== "string" ||
      typeof row.confidence !== "number" ||
      typeof row.answeredAt !== "string" ||
      row.normalizedValue === undefined
    ) {
      continue;
    }
    answers[key] = {
      ...(row as unknown as StoredNormalizedAnswer),
      detectedConcepts: stringArray(row.detectedConcepts),
      polarity:
        row.polarity === "positive" || row.polarity === "negative" ? row.polarity : "unknown",
      uncertain: row.uncertain === true,
    };
  }
  return answers;
}

function anatomicalStructureGroup(value: unknown): AnatomicalStructureGroup | null {
  const groups: AnatomicalStructureGroup[] = [
    "axial_chest_bone",
    "spine",
    "upper_limb_long_bone",
    "lower_limb_long_bone",
    "hand_or_finger",
    "foot_or_toe",
    "joint",
    "superficial_muscle",
    "deep_muscle",
    "abdominal_organ",
    "urinary_organ",
    "respiratory_organ",
    "cardiovascular_organ",
    "unknown_structure_context",
  ];
  return groups.includes(value as AnatomicalStructureGroup)
    ? (value as AnatomicalStructureGroup)
    : null;
}

function anatomicalContextFromState(value: unknown): AnatomicalContext | null {
  if (!isRecord(value)) return null;
  const structureGroup = anatomicalStructureGroup(value.structureGroup);
  const displayName = stringOrNull(value.displayName);
  if (!structureGroup || !displayName) return null;
  return {
    structureId: stringOrNull(value.structureId),
    displayName,
    technicalName: stringOrNull(value.technicalName),
    tissue: stringOrNull(value.tissue) ?? "unknown",
    bodyRegion: stringOrNull(value.bodyRegion),
    anatomySystem: stringOrNull(value.anatomySystem) ?? "",
    anatomySegment: stringOrNull(value.anatomySegment) ?? "",
    anatomyGroup: stringOrNull(value.anatomyGroup) ?? "",
    anatomySubgroup: stringOrNull(value.anatomySubgroup),
    structureGroup,
    functionalContext: stringArray(value.functionalContext),
  };
}

function questionPlanFromState(
  value: unknown,
  anatomicalContext: AnatomicalContext | null,
): QuestionPlan | null {
  if (!isRecord(value) || !anatomicalContext) return null;
  const activeFlow = flowId(value.activeFlow);
  const completionCriteria = isRecord(value.completionCriteria) ? value.completionCriteria : null;
  if (!activeFlow || !completionCriteria) return null;
  const questionIds = stringArray(value.questionIds);
  return {
    activeFlow,
    anatomicalContext,
    questionIds,
    commonQuestionIds: stringArray(value.commonQuestionIds),
    contextualQuestionIds: stringArray(value.contextualQuestionIds),
    omittedQuestionIds: stringArray(value.omittedQuestionIds),
    completionCriteria: {
      requiredQuestionIds: stringArray(completionCriteria.requiredQuestionIds),
      minimumAnswered:
        typeof completionCriteria.minimumAnswered === "number" &&
        Number.isFinite(completionCriteria.minimumAnswered)
          ? Math.max(0, Math.floor(completionCriteria.minimumAnswered))
          : questionIds.length,
    },
  };
}

function flowId(value: unknown): MedicalConversationFlowId | null {
  const flows: MedicalConversationFlowId[] = [
    "wound_cut",
    "burn",
    "musculoskeletal_pain",
    "trauma_fall_hit",
    "numbness_weakness",
    "abdominal_pain",
    "chest_pain",
    "breathing_problem",
    "headache_neuro",
    "digestive_symptom",
    "urinary_kidney",
    "unknown",
  ];
  return flows.includes(value as MedicalConversationFlowId)
    ? (value as MedicalConversationFlowId)
    : null;
}

function phaseFromState(row: Record<string, unknown>): ConversationPhase {
  if (row.phase === "completed" || row.summaryFinalized === true || row.isCompleted === true) {
    return "completed";
  }
  if (row.phase === "clarifying_current_answer" || row.needsCurrentQuestionClarification === true) {
    return "clarifying_current_answer";
  }
  if (row.phase === "ready_for_summary" || row.isReadyForSummary === true) {
    return "ready_for_summary";
  }
  if (row.phase === "collecting" || stringOrNull(row.currentQuestionId)) return "collecting";
  return "initial";
}

function clarificationFromState(value: unknown): ActiveAnswerClarification | null {
  if (!isRecord(value)) return null;
  const questionId = stringOrNull(value.questionId);
  const text = isRecord(value.text) ? value.text : null;
  const ro = stringOrNull(text?.ro);
  const en = stringOrNull(text?.en);
  if (!questionId || !ro || !en) return null;
  return {
    questionId,
    attempts: typeof value.attempts === "number" ? Math.max(0, Math.floor(value.attempts)) : 0,
    text: { ro, en },
  };
}

export function extractConversationStateCandidate(value: unknown): unknown {
  if (!isRecord(value)) return null;
  if (flowId(value.activeFlow)) return value;
  if (isRecord(value.conversation_state)) return value.conversation_state;
  if (isRecord(value.generic_triage)) return value.generic_triage;
  if (isRecord(value.triageState)) return value.triageState;
  if (isRecord(value.symptom_state)) return extractConversationStateCandidate(value.symptom_state);
  if (isRecord(value.structured_output)) {
    return extractConversationStateCandidate(value.structured_output);
  }
  return null;
}

export function validateConversationState(
  value: unknown,
  context: ConversationStateContext = {},
): ConversationStateV1 | null {
  const candidate = extractConversationStateCandidate(value);
  if (!isRecord(candidate)) return null;
  const activeFlow = flowId(candidate.activeFlow ?? candidate.detectedIntent);
  if (!activeFlow) return null;

  const completed = stringArray(candidate.completedQuestionIds ?? candidate.completedQuestions);
  const currentQuestionId = stringOrNull(candidate.currentQuestionId);
  const selectedStructure =
    stringOrNull(candidate.selectedStructureName) ??
    stringOrNull(candidate.selectedStructure) ??
    stringOrNull(context.selectedStructure) ??
    "unknown";
  const ready = candidate.isReadyForSummary === true || !currentQuestionId;
  const summaryFinalized = candidate.summaryFinalized === true || candidate.isCompleted === true;
  const phase = phaseFromState(candidate);
  const anatomicalContext = anatomicalContextFromState(candidate.anatomicalContext);
  const questionPlan = questionPlanFromState(candidate.questionPlan, anatomicalContext);

  return {
    version: CONVERSATION_STATE_VERSION,
    conversationId:
      stringOrNull(candidate.conversationId) ?? stringOrNull(context.conversationId) ?? null,
    requestId: stringOrNull(candidate.requestId),
    revision:
      typeof candidate.revision === "number" && Number.isFinite(candidate.revision)
        ? Math.max(0, Math.floor(candidate.revision))
        : 0,
    activeFlow,
    detectedIntent: flowId(candidate.detectedIntent) ?? activeFlow,
    messageIntent:
      candidate.messageIntent === "injury_report" ||
      candidate.messageIntent === "follow_up_answer" ||
      candidate.messageIntent === "correction" ||
      candidate.messageIntent === "informational_anatomy" ||
      candidate.messageIntent === "unclear"
        ? candidate.messageIntent
        : "symptom_report",
    selectedStructureId:
      stringOrNull(candidate.selectedStructureId) ??
      stringOrNull(context.selectedStructureId) ??
      null,
    selectedStructure,
    selectedStructureName: selectedStructure,
    selectedMode:
      stringOrNull(candidate.selectedMode) ?? stringOrNull(context.selectedMode) ?? "unknown",
    anatomicalContext,
    questionPlan,
    originalProblem: stringOrNull(candidate.originalProblem),
    intentConfidence:
      candidate.intentConfidence === "high" || candidate.intentConfidence === "medium"
        ? candidate.intentConfidence
        : "low",
    matchedKeywords: stringArray(candidate.matchedKeywords),
    whetherSelectedStructureMatchesIntent:
      candidate.whetherSelectedStructureMatchesIntent !== false,
    suggestedRedirect:
      candidate.suggestedRedirect === "skin_soft_tissue" ||
      candidate.suggestedRedirect === "musculoskeletal" ||
      candidate.suggestedRedirect === "organs" ||
      candidate.suggestedRedirect === "neuro"
        ? candidate.suggestedRedirect
        : null,
    phase,
    currentQuestionId,
    currentQuestionType:
      typeof candidate.currentQuestionType === "string"
        ? (candidate.currentQuestionType as ConversationQuestionType)
        : null,
    currentQuestionPlaceholder: (() => {
      if (!isRecord(candidate.currentQuestionPlaceholder)) return null;
      const ro = stringOrNull(candidate.currentQuestionPlaceholder.ro);
      const en = stringOrNull(candidate.currentQuestionPlaceholder.en);
      return ro && en ? { ro, en } : null;
    })(),
    completedQuestionIds: completed,
    completedQuestions: completed,
    answers: stringMap(candidate.answers),
    normalizedAnswers: normalizedAnswerMap(candidate.normalizedAnswers),
    questionLabels: questionLabelMap(candidate.questionLabels),
    clarification: clarificationFromState(candidate.clarification),
    redFlags: stringArray(candidate.redFlags),
    redFlagLevel:
      candidate.redFlagLevel === "urgent" ||
      candidate.redFlagLevel === "medical_attention" ||
      candidate.redFlagLevel === "watch" ||
      candidate.redFlagLevel === "needs_more_info"
        ? candidate.redFlagLevel
        : "none",
    step:
      typeof candidate.step === "number" && Number.isFinite(candidate.step)
        ? Math.max(1, Math.floor(candidate.step))
        : Math.max(1, completed.length + 1),
    totalSteps:
      typeof candidate.totalSteps === "number" && Number.isFinite(candidate.totalSteps)
        ? Math.max(1, Math.floor(candidate.totalSteps))
        : Math.max(1, completed.length + (currentQuestionId ? 1 : 0)),
    isReadyForSummary: ready,
    summaryFinalized,
    canGeneratePdf: candidate.canGeneratePdf === true || summaryFinalized,
    redirectNoticeShown: candidate.redirectNoticeShown === true,
    needsCurrentQuestionClarification: phase === "clarifying_current_answer",
    lastAnswerAcknowledgementRo: stringOrNull(candidate.lastAnswerAcknowledgementRo),
    lastAnswerAcknowledgementEn: stringOrNull(candidate.lastAnswerAcknowledgementEn),
  };
}

export function hasActiveQuestion(
  state: ConversationStateV1 | null | undefined,
): state is ConversationStateV1 {
  return Boolean(
    state?.currentQuestionId &&
    (state.phase === "collecting" || state.phase === "clarifying_current_answer"),
  );
}

export function selectConversationState(input: {
  requestState?: unknown;
  persistedConversationState?: unknown;
  storedMessageState?: unknown;
  context?: ConversationStateContext;
}): ConversationStateSelection {
  const context = input.context ?? {};
  const candidates: Array<{
    source: ConversationStateSource;
    state: ConversationStateV1;
    priority: number;
  }> = [];

  const addCandidate = (source: ConversationStateSource, value: unknown, priority: number) => {
    const state = validateConversationState(value, context);
    if (!state) return;
    if (
      source === "request" &&
      context.conversationId &&
      state.conversationId &&
      state.conversationId !== context.conversationId
    ) {
      return;
    }
    candidates.push({ source, state, priority });
  };

  addCandidate("request", input.requestState, 3);
  addCandidate("conversation", input.persistedConversationState, 2);
  addCandidate("message", input.storedMessageState, 1);

  const revisions = Object.fromEntries(
    candidates.map((candidate) => [candidate.source, candidate.state.revision]),
  ) as Partial<Record<ConversationStateSource, number>>;

  if (candidates.length === 0) {
    return { state: null, source: null, reason: "no_valid_state", revisions };
  }

  candidates.sort(
    (first, second) =>
      second.state.revision - first.state.revision || second.priority - first.priority,
  );
  const selected = candidates[0];
  const tied = candidates.some(
    (candidate, index) => index > 0 && candidate.state.revision === selected.state.revision,
  );

  return {
    state: selected.state,
    source: selected.source,
    reason:
      selected.source === "request" && tied ? "request_wins_revision_tie" : "highest_revision",
    revisions,
  };
}

export function shouldAcceptConversationStateResponse(input: {
  currentState?: unknown;
  responseState?: unknown;
  context?: ConversationStateContext;
}) {
  const current = validateConversationState(input.currentState, input.context);
  const response = validateConversationState(input.responseState, input.context);
  if (!response || !current) return true;
  return response.revision >= current.revision;
}
