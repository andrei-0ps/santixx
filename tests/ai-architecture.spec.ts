import { expect, test } from "@playwright/test";
import { classifyConversationMessage } from "../src/lib/ai/classifier";
import { toPgVectorLiteral, validateEmbeddingVector } from "../src/lib/ai/embeddings";
import { normalizeSantixMessage } from "../src/lib/ai/normalizer";
import { resolveNextStep } from "../src/lib/ai/next-step";
import { createAiProvider } from "../src/lib/ai/provider";
import { runSantixAiTurn } from "../src/lib/ai/service";
import { extractSignals } from "../src/lib/ai/signal-extractor";
import { createInitialConversationState, mergeConversationState } from "../src/lib/ai/state";
import { validateStructuredAiOutput } from "../src/lib/ai/structured-output";

test("normalizer removes address terms and preserves medical intent", () => {
  expect(normalizeSantixMessage("la humerus unchiule").normalizedMessage).toBe("la humerus");
  expect(normalizeSantixMessage("mă înțeapă, frate").normalizedMessage).toBe("ma inteapa");
});

test("signal extractor captures multiple facts from one message", () => {
  const signals = extractSignals("da dar mă doare foarte rău când încordez");

  expect(signals.affirmation).toBe("yes");
  expect(signals.pain_present).toBe("yes");
  expect(signals.severity).toBe("severe");
  expect(signals.trauma_or_effort).toBe("yes");
  expect(signals.trauma_type).toBe("effort");
});

test("signal extractor captures English trauma, swelling, numbness, and blocked movement", () => {
  const signals = extractSignals(
    "I fell and now my ankle is swollen, numb, and I can't walk on it.",
  );

  expect(signals.trauma_type).toBe("fall");
  expect(signals.body_region).toBe("glezna");
  expect(signals.swelling).toBe("yes");
  expect(signals.numbness).toBe("yes");
  expect(signals.movement_ok).toBe("no");
  expect(signals.red_flags_detected).toBe(true);
});

test("signal extractor captures English severity, onset, and duration", () => {
  const signals = extractSignals("The pain is mild and started gradually three days ago.");

  expect(signals.pain_present).toBe("yes");
  expect(signals.severity).toBe("mild");
  expect(signals.onset).toBe("gradual");
  expect(signals.duration).toBe("days");
});

test("signal extractor detects English chest and breathing warning signs", () => {
  const signals = extractSignals("I have chest pain and difficulty breathing.");

  expect(signals.red_flags_detected).toBe(true);
  expect(signals.red_flag_reasons).toEqual(
    expect.arrayContaining(["durere toracică", "dificultăți de respirație"]),
  );
});

test("movement typo is interpreted as normal movement", () => {
  const signals = extractSignals("pot mișca norma");

  expect(signals.movement_ok).toBe("yes");
});

test("state merge updates fall and onset without resetting movement", () => {
  const state = createInitialConversationState({ movement_ok: "yes" });
  const merged = mergeConversationState(state, extractSignals("brusc, după căzătură"));

  expect(merged.onset).toBe("sudden");
  expect(merged.trauma_or_effort).toBe("yes");
  expect(merged.trauma_type).toBe("fall");
  expect(merged.movement_ok).toBe("yes");
});

test("last movement question maps short affirmation plus severe pain", () => {
  const state = createInitialConversationState({ last_question_intent: "movement_ok" });
  const merged = mergeConversationState(state, extractSignals("da dar mă doare foarte rău"));

  expect(merged.movement_ok).toBe("yes");
  expect(merged.severity).toBe("severe");
});

test("pain quality after severity question is not treated as unclear", () => {
  const signals = extractSignals("înțepătoare");
  const classification = classifyConversationMessage(
    normalizeSantixMessage("înțepătoare"),
    signals,
  );

  expect(signals.pain_quality).toBe("stabbing");
  expect(classification).not.toBe("unclear");
});

test("negative associated signs answer clears red flag signs", () => {
  const state = createInitialConversationState({ last_question_intent: "associated_signs" });
  const merged = mergeConversationState(
    state,
    extractSignals("nu", { lastQuestionIntent: "associated_signs" }),
  );

  expect(merged.swelling).toBe("no");
  expect(merged.numbness).toBe("no");
  expect(merged.bruising).toBe("no");
  expect(merged.red_flags_detected).toBe(false);
});

test("out of scope request is classified deterministically", () => {
  const normalized = normalizeSantixMessage("fă-mi un plan de investiții");
  const signals = extractSignals(normalized);

  expect(classifyConversationMessage(normalized, signals)).toBe("out_of_scope");
});

test("next step resolver does not ask completed fields again", () => {
  const state = createInitialConversationState({
    pain_present: "yes",
    trauma_or_effort: "no",
    onset: "sudden",
    movement_ok: "yes",
    severity: "severe",
    pain_quality: "stabbing",
  });
  const decision = resolveNextStep(state, "pain_flow");

  expect(decision.nextStep).toBe("ask_associated_signs");
});

test("provider factory keeps Ollama as current provider", () => {
  const previous = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = "ollama";
  const provider = createAiProvider();
  process.env.AI_PROVIDER = previous;

  expect(provider.providerName).toBe("ollama");
  expect(provider.supportsStructuredOutput).toBe(false);
});

test("provider factory creates the implemented OpenAI provider when configured", () => {
  const previousProvider = process.env.AI_PROVIDER;
  const previousApiKey = process.env.OPENAI_API_KEY;
  process.env.AI_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-openai-key";
  const provider = createAiProvider();
  if (previousProvider === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = previousProvider;
  if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousApiKey;

  expect(provider.providerName).toBe("openai");
  expect(provider.supportsStructuredOutput).toBe(true);
});

test("structured output validation rejects invalid payloads and accepts valid ones", () => {
  expect(validateStructuredAiOutput({ reply: "ok" })).toBeNull();
  expect(
    validateStructuredAiOutput({
      reply: "ok",
      intent: "pain",
      classification: "pain_flow",
      red_flags_detected: false,
      next_question_intent: null,
      should_switch_context: false,
      target_layer: null,
      target_structure_slug: null,
      confidence: "high",
      needs_medical_attention: false,
      used_context: [],
    }),
  )?.toMatchObject({ reply: "ok", confidence: "high" });
});

test("embedding helpers validate dimensions and format pgvector literals", () => {
  expect(validateEmbeddingVector([0.1, 0.2], 3)).toBeNull();
  expect(validateEmbeddingVector([0.1, 0.2], 2)).toEqual([0.1, 0.2]);
  expect(toPgVectorLiteral([0.1, -0.25])).toBe("[0.10000000,-0.25000000]");
});

test("service orchestrates normalize, signals, state and next step", async () => {
  const result = await runSantixAiTurn({ message: "mă doare" });

  expect(result.reply_source).toBe("deterministic");
  expect(result.classification).toBe("pain_flow");
  expect(result.next_step).toBe("ask_trauma_or_effort");
  expect(result.state_after.last_question_intent).toBe("trauma_or_effort");
});
