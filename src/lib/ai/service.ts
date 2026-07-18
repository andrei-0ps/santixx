import { classifyConversationMessage } from "./classifier";
import { normalizeSantixMessage } from "./normalizer";
import { resolveNextStep } from "./next-step";
import { normalizeConversationLanguage, type ConversationLanguage } from "./conversationLanguage";
import {
  applyNextStepToState,
  createInitialConversationState,
  mergeConversationState,
} from "./state";
import { extractSignals } from "./signal-extractor";
import type { AIProvider, ConversationState, RetrievalContext, StructuredAIOutput } from "./types";

export type SantixAiServiceInput = {
  message: string;
  language?: ConversationLanguage;
  state?: Partial<ConversationState>;
  provider?: AIProvider;
  retrievalContext?: RetrievalContext;
};

export async function runSantixAiTurn(input: SantixAiServiceInput): Promise<StructuredAIOutput> {
  const language = normalizeConversationLanguage(input.language);
  const stateBefore = createInitialConversationState(input.state);
  const normalized = normalizeSantixMessage(input.message);
  const signals = extractSignals(normalized, {
    lastQuestionIntent: stateBefore.last_question_intent,
  });
  const classification = classifyConversationMessage(normalized, signals);
  const mergedState = mergeConversationState(stateBefore, signals);
  const decision = resolveNextStep(mergedState, classification, language);
  const stateAfter = applyNextStepToState(
    mergedState,
    decision.nextStep,
    decision.lastQuestionIntent,
  );

  return {
    reply: decision.reply,
    classification,
    signals,
    state_before: stateBefore,
    state_after: stateAfter,
    next_step: decision.nextStep,
    last_question_intent: decision.lastQuestionIntent,
    red_flags_detected: stateAfter.red_flags_detected,
    should_switch_context: stateAfter.should_switch_context,
    target_layer: stateAfter.target_layer,
    target_structure_slug: stateAfter.target_structure_slug,
    confidence: stateAfter.confidence,
    reply_source: "deterministic",
    retrieval_context: input.retrievalContext,
  };
}
