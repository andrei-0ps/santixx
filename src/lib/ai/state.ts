import type { ConversationState, ExtractedSignals, NextStep, YesNoUnknown } from "./types";

const UNKNOWN = "unknown";

export function createInitialConversationState(
  partial: Partial<ConversationState> = {},
): ConversationState {
  return {
    conversation_id: null,
    user_id: null,
    selected_structure_slug: null,
    selected_structure_name: null,
    selected_structure_type: "unknown",
    visual_layer: "skeleton",
    ai_layer: "skeleton",
    current_topic: "unclear",
    pain_present: "unknown",
    pain_quality: "unknown",
    trauma_or_effort: "unknown",
    trauma_type: "unknown",
    onset: "unknown",
    movement_ok: "unknown",
    severity: "unknown",
    swelling: "unknown",
    bruising: "unknown",
    numbness: "unknown",
    weakness: "unknown",
    deformity: "unknown",
    duration: "unknown",
    red_flags_detected: false,
    asked_questions: [],
    answered_fields: [],
    last_question_intent: null,
    next_step: null,
    should_switch_context: false,
    target_layer: null,
    target_structure_slug: null,
    confidence: "low",
    ...partial,
  };
}

function setIfKnown<T extends string>(state: Record<string, unknown>, field: keyof ConversationState, value: T) {
  if (value !== UNKNOWN) {
    state[field] = value;
  }
}

function markAnswered(state: ConversationState, field: string) {
  if (!state.answered_fields.includes(field)) {
    state.answered_fields.push(field);
  }
}

function syncAnsweredFields(state: ConversationState) {
  const fields: Array<keyof ConversationState> = [
    "pain_present",
    "pain_quality",
    "trauma_or_effort",
    "trauma_type",
    "onset",
    "movement_ok",
    "severity",
    "swelling",
    "bruising",
    "numbness",
    "weakness",
    "deformity",
    "duration",
  ];

  for (const field of fields) {
    const value = state[field];
    if (value !== UNKNOWN && value !== null && value !== false) {
      markAnswered(state, field);
    }
  }
}

export function mergeConversationState(
  previousState: ConversationState,
  signals: ExtractedSignals,
): ConversationState {
  const state: ConversationState = {
    ...previousState,
    asked_questions: [...previousState.asked_questions],
    answered_fields: [...previousState.answered_fields],
  };

  if (signals.pain_present === "yes") state.pain_present = "yes";
  setIfKnown(state, "pain_quality", signals.pain_quality);
  setIfKnown(state, "severity", signals.severity);
  setIfKnown(state, "movement_ok", signals.movement_ok);
  setIfKnown(state, "trauma_or_effort", signals.trauma_or_effort);
  setIfKnown(state, "trauma_type", signals.trauma_type);
  setIfKnown(state, "onset", signals.onset);
  setIfKnown(state, "duration", signals.duration);
  setIfKnown(state, "swelling", signals.swelling);
  setIfKnown(state, "bruising", signals.bruising);
  setIfKnown(state, "numbness", signals.numbness);
  setIfKnown(state, "weakness", signals.weakness);
  setIfKnown(state, "deformity", signals.deformity);

  if (state.last_question_intent === "movement_ok" && signals.affirmation === "yes") {
    state.movement_ok = "yes";
  }

  if (state.last_question_intent === "associated_signs" && signals.negation === "no") {
    state.swelling = "no";
    state.bruising = "no";
    state.numbness = "no";
  }

  if (state.last_question_intent === "trauma_or_effort" && signals.negation === "no") {
    state.trauma_or_effort = "no";
    state.trauma_type = "none";
  }

  if (signals.body_region) {
    state.target_structure_slug = signals.structure_slug;
  }

  state.red_flags_detected =
    signals.red_flags_detected ||
    state.movement_ok === "no" ||
    state.numbness === "yes" ||
    state.weakness === "yes" ||
    state.deformity === "yes";

  if (state.pain_present === "yes") {
    state.current_topic = state.trauma_or_effort === "yes" ? "injury" : "pain";
  }

  syncAnsweredFields(state);
  return state;
}

export function applyNextStepToState(
  state: ConversationState,
  nextStep: NextStep,
  lastQuestionIntent: string | null,
) {
  return {
    ...state,
    next_step: nextStep,
    last_question_intent: lastQuestionIntent,
    asked_questions: lastQuestionIntent
      ? Array.from(new Set([...state.asked_questions, lastQuestionIntent]))
      : state.asked_questions,
  };
}

export function mergePersistedStateIntoLegacy<T extends Record<string, unknown>>(
  current: T,
  persisted: unknown,
): T {
  if (!persisted || typeof persisted !== "object") return current;
  const persistedState = persisted as Record<string, unknown>;
  const next: Record<string, unknown> = { ...current };
  const fields = [
    "pain_quality",
    "trauma_or_effort",
    "trauma_type",
    "onset",
    "movement_ok",
    "severity",
    "swelling",
    "bruising",
    "numbness",
    "weakness",
    "deformity",
    "duration",
    "last_question_intent",
    "next_step",
    "should_switch_context",
    "target_layer",
    "target_structure_slug",
    "confidence",
  ];

  for (const field of fields) {
    const currentValue = next[field];
    const persistedValue = persistedState[field];
    if (
      (currentValue === undefined || currentValue === null || currentValue === "unknown") &&
      persistedValue !== undefined &&
      persistedValue !== null &&
      persistedValue !== "unknown"
    ) {
      next[field] = persistedValue;
    }
  }

  if (persistedState.pain_present === true && next.pain_present === false) {
    next.pain_present = true;
  }

  if (
    !next.wound_triage &&
    persistedState.wound_triage &&
    typeof persistedState.wound_triage === "object"
  ) {
    next.wound_triage = persistedState.wound_triage;
  }

  if (
    !next.generic_triage &&
    persistedState.generic_triage &&
    typeof persistedState.generic_triage === "object"
  ) {
    next.generic_triage = persistedState.generic_triage;
  }

  for (const field of ["asked_questions", "answered_fields", "red_flag_reasons"]) {
    const currentList = Array.isArray(next[field]) ? (next[field] as unknown[]) : [];
    const persistedList = Array.isArray(persistedState[field]) ? persistedState[field] : [];
    next[field] = Array.from(new Set([...currentList, ...persistedList]));
  }

  return next as T;
}

export function toPersistableState(state: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
}

export function isUnknown(value: YesNoUnknown) {
  return value === "unknown";
}
