import {
  normalizeAnswer,
  normalizeUserText,
  storageValueForNormalizedAnswer,
} from "./answerNormalizers";
import type { ConversationStateV1 } from "./conversationState";
import type {
  AnswerNormalizationResult,
  ConversationLocale,
  ConversationQuestionDefinition,
} from "./questionTypes";

export const MAX_CLARIFICATIONS_PER_QUESTION = 2;

export type ConversationTransition = {
  state: ConversationStateV1;
  normalization: AnswerNormalizationResult;
  answered: boolean;
  forcedUnknown: boolean;
};

function canonicalStorageValue(
  question: ConversationQuestionDefinition,
  answer: AnswerNormalizationResult,
) {
  const value = storageValueForNormalizedAnswer(answer);
  return question.semantic?.storageMap?.[value] ?? value;
}

function cloneState(state: ConversationStateV1): ConversationStateV1 {
  return {
    ...state,
    answers: { ...state.answers },
    normalizedAnswers: { ...state.normalizedAnswers },
    completedQuestionIds: [...state.completedQuestionIds],
    completedQuestions: [...state.completedQuestions],
    questionLabels: { ...state.questionLabels },
    redFlags: [...state.redFlags],
    anatomicalContext: state.anatomicalContext
      ? {
          ...state.anatomicalContext,
          functionalContext: [...state.anatomicalContext.functionalContext],
        }
      : null,
    questionPlan: state.questionPlan
      ? {
          ...state.questionPlan,
          anatomicalContext: {
            ...state.questionPlan.anatomicalContext,
            functionalContext: [...state.questionPlan.anatomicalContext.functionalContext],
          },
          questionIds: [...state.questionPlan.questionIds],
          commonQuestionIds: [...state.questionPlan.commonQuestionIds],
          contextualQuestionIds: [...state.questionPlan.contextualQuestionIds],
          omittedQuestionIds: [...state.questionPlan.omittedQuestionIds],
          completionCriteria: {
            ...state.questionPlan.completionCriteria,
            requiredQuestionIds: [...state.questionPlan.completionCriteria.requiredQuestionIds],
          },
        }
      : null,
    clarification: state.clarification
      ? { ...state.clarification, text: { ...state.clarification.text } }
      : null,
    currentQuestionPlaceholder: state.currentQuestionPlaceholder
      ? { ...state.currentQuestionPlaceholder }
      : null,
  };
}

function completeAnswer(
  state: ConversationStateV1,
  question: ConversationQuestionDefinition,
  answer: AnswerNormalizationResult,
  forcedUnknown: boolean,
) {
  const storageValue = forcedUnknown ? "unknown" : canonicalStorageValue(question, answer);
  state.answers[question.answerKey] = storageValue;
  state.normalizedAnswers[question.answerKey] = {
    questionId: question.id,
    questionType: question.type,
    rawValue: answer.rawValue,
    normalizedValue: forcedUnknown ? "unknown" : (answer.normalizedValue ?? storageValue),
    detectedConcepts: forcedUnknown ? [] : answer.detectedConcepts,
    polarity: forcedUnknown ? "unknown" : answer.polarity,
    confidence: forcedUnknown ? 0 : answer.confidence,
    uncertain: forcedUnknown || answer.uncertain,
    answeredAt: new Date().toISOString(),
  };
  if (!state.completedQuestionIds.includes(question.id)) {
    state.completedQuestionIds.push(question.id);
  }
  state.completedQuestions = [...state.completedQuestionIds];
  state.phase = "collecting";
  state.clarification = null;
  state.needsCurrentQuestionClarification = false;
  state.lastAnswerAcknowledgementRo = forcedUnknown
    ? "Am notat răspunsul ca neprecizat."
    : (answer.acknowledgement?.ro ?? "Am notat răspunsul.");
  state.lastAnswerAcknowledgementEn = forcedUnknown
    ? "I recorded the answer as unspecified."
    : (answer.acknowledgement?.en ?? "I noted the answer.");
  state.messageIntent = "follow_up_answer";
  state.revision += 1;
}

export function processActiveQuestionAnswer(input: {
  state: ConversationStateV1;
  question: ConversationQuestionDefinition;
  message: string;
  locale?: ConversationLocale;
}): ConversationTransition {
  const state = cloneState(input.state);
  const normalization = normalizeAnswer(input.question, input.message, input.locale ?? "ro");

  if (normalization.status === "valid") {
    completeAnswer(state, input.question, normalization, false);
    return { state, normalization, answered: true, forcedUnknown: false };
  }

  const previousAttempts =
    state.clarification?.questionId === input.question.id ? state.clarification.attempts : 0;
  if (previousAttempts >= MAX_CLARIFICATIONS_PER_QUESTION) {
    completeAnswer(state, input.question, normalization, true);
    return { state, normalization, answered: true, forcedUnknown: true };
  }

  const fallbackText = normalization.clarificationText
    ? normalization.clarificationText
    : {
        ro: `Nu am putut interpreta răspunsul la întrebarea curentă. ${input.question.text.ro}`,
        en: `I could not interpret the answer to the current question. ${input.question.text.en}`,
      };
  state.phase = "clarifying_current_answer";
  state.clarification = {
    questionId: input.question.id,
    attempts: previousAttempts + 1,
    text: fallbackText,
  };
  state.needsCurrentQuestionClarification = true;
  state.lastAnswerAcknowledgementRo = null;
  state.lastAnswerAcknowledgementEn = null;
  state.messageIntent = "follow_up_answer";
  state.revision += 1;
  return { state, normalization, answered: false, forcedUnknown: false };
}

export function isExplicitConversationTopicChange(message: string) {
  const normalized = normalizeUserText(message);
  return [
    "schimb subiectul",
    "alta problema",
    "am alta problema",
    "de fapt vreau sa intreb",
    "new topic",
    "another problem",
    "different issue",
  ].some((term) => normalized.includes(term));
}
