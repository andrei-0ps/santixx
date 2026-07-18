import { expect, test } from "@playwright/test";
import { classifyConversationMessage } from "../src/lib/ai/classifier";
import { normalizeSantixMessage } from "../src/lib/ai/normalizer";
import { resolveNextStep } from "../src/lib/ai/next-step";
import { runSantixAiTurn } from "../src/lib/ai/service";
import { extractSignals } from "../src/lib/ai/signal-extractor";
import { createInitialConversationState, mergeConversationState } from "../src/lib/ai/state";

test.describe("AI tester scenarios - limbaj natural despre durere", () => {
  const signalCases = [
    {
      message: "mă doare genunchiul când alerg",
      expected: { pain_present: "yes", body_region: "genunchi", trauma_or_effort: "yes" },
    },
    {
      message: "mă doare în spatele genunchiului după fotbal",
      expected: { pain_present: "yes", body_region: "genunchi", trauma_type: "sport" },
    },
    {
      message: "simt o înțepătură în spatele genunchiului",
      expected: { pain_present: "yes", body_region: "genunchi", pain_quality: "stabbing" },
    },
    {
      message: "mă doare spatele jos de ieri",
      expected: { pain_present: "yes", body_region: "spate", duration: "days" },
    },
    {
      message: "mă ține ceafa după sală",
      expected: { pain_present: "yes", body_region: "spate", trauma_type: "effort" },
    },
    {
      message: "am febră musculară după sală la biceps",
      expected: { pain_present: "yes", body_region: "biceps", trauma_type: "effort" },
    },
    {
      message: "mă doare bicepsul când încordez",
      expected: { pain_present: "yes", body_region: "biceps", trauma_type: "effort" },
    },
    {
      message: "am crampe la gambă după alergare",
      expected: { pain_present: "yes", body_region: "gamba", pain_quality: "cramp" },
    },
    {
      message: "am căzut pe umăr și e umflat",
      expected: { trauma_type: "fall", body_region: "umar", swelling: "yes" },
    },
    {
      message: "m-am lovit la humerus și am vânătaie",
      expected: { trauma_type: "hit", body_region: "humerus", bruising: "yes" },
    },
    {
      message: "nu pot călca pe gleznă",
      expected: { movement_ok: "no", body_region: "glezna", red_flags_detected: true },
    },
    {
      message: "mă arde în piept",
      expected: { pain_present: "yes", body_region: "torace", pain_quality: "burning" },
    },
    {
      message: "durere surdă la șold de câteva zile",
      expected: { pain_present: "yes", body_region: "sold", pain_quality: "dull", duration: "days" },
    },
    {
      message: "durere foarte tare după accident",
      expected: { pain_present: "yes", severity: "severe", trauma_type: "accident" },
    },
    {
      message: "simt amorțeală și slăbiciune în mână",
      expected: { body_region: "mana", numbness: "yes", weakness: "yes", red_flags_detected: true },
    },
    {
      message: "mă doare puțin, pot mișca normal",
      expected: { pain_present: "yes", severity: "mild", movement_ok: "yes" },
    },
  ] as const;

  for (const scenario of signalCases) {
    test(`extrage semnale: ${scenario.message}`, () => {
      const signals = extractSignals(scenario.message);

      for (const [field, value] of Object.entries(scenario.expected)) {
        expect(signals[field as keyof typeof signals]).toBe(value);
      }
    });
  }
});

test.describe("AI tester scenarios - conversații scurte în flow", () => {
  test("genunchi la alergare pornește flow de durere și întreabă trauma/efort", async () => {
    const result = await runSantixAiTurn({ message: "mă doare genunchiul când alerg" });

    expect(result.classification).toBe("pain_flow");
    expect(result.signals.body_region).toBe("genunchi");
    expect(result.state_after.trauma_or_effort).toBe("yes");
    expect(result.next_step).toBe("ask_onset");
  });

  test("spatele genunchiului după fotbal este interpretat ca genunchi + sport", async () => {
    const result = await runSantixAiTurn({ message: "mă doare în spatele genunchiului după fotbal" });

    expect(result.signals.body_region).toBe("genunchi");
    expect(result.signals.trauma_type).toBe("sport");
    expect(result.next_step).toBe("ask_onset");
  });

  test("răspuns scurt 'nu' după semne asociate nu produce red flag", () => {
    const state = createInitialConversationState({
      pain_present: "yes",
      trauma_or_effort: "no",
      onset: "sudden",
      movement_ok: "yes",
      severity: "mild",
      pain_quality: "stabbing",
      last_question_intent: "associated_signs",
    });
    const merged = mergeConversationState(
      state,
      extractSignals("nu", { lastQuestionIntent: "associated_signs" }),
    );
    const decision = resolveNextStep(merged, "pain_flow");

    expect(merged.swelling).toBe("no");
    expect(merged.bruising).toBe("no");
    expect(merged.numbness).toBe("no");
    expect(merged.red_flags_detected).toBe(false);
    expect(decision.nextStep).toBe("ask_duration");
  });

  test("typo-ul 'pot misca norma' completează mișcarea și continuă cu severitatea", () => {
    const state = createInitialConversationState({
      pain_present: "yes",
      trauma_or_effort: "no",
      onset: "gradual",
      last_question_intent: "movement_ok",
    });
    const merged = mergeConversationState(state, extractSignals("pot misca norma"));
    const decision = resolveNextStep(merged, "pain_flow");

    expect(merged.movement_ok).toBe("yes");
    expect(decision.nextStep).toBe("ask_severity");
  });

  test("durere severă + nu pot călca duce la recomandare urgentă", async () => {
    const result = await runSantixAiTurn({ message: "mă doare foarte tare glezna și nu pot călca" });

    expect(result.red_flags_detected).toBe(true);
    expect(result.next_step).toBe("urgent");
    expect(result.reply).toContain("evaluare medicală rapidă");
  });
});

test.describe("AI tester scenarios - clasificare și normalizare", () => {
  test("apelativele nu strică structura menționată", () => {
    const normalized = normalizeSantixMessage("la humerus unchiule");
    const signals = extractSignals(normalized);
    const classification = classifyConversationMessage(normalized, signals);

    expect(normalized.normalizedMessage).toBe("la humerus");
    expect(signals.body_region).toBe("humerus");
    expect(classification).toBe("anatomy_question");
  });

  test("întrebările non-medicale sunt out of scope", () => {
    const normalized = normalizeSantixMessage("fă-mi un plan de investiții pe crypto");
    const signals = extractSignals(normalized);

    expect(classifyConversationMessage(normalized, signals)).toBe("out_of_scope");
  });

  test("întrebare de anatomie despre rotulă rămâne anatomie, nu durere", () => {
    const normalized = normalizeSantixMessage("ce rol are rotula?");
    const signals = extractSignals(normalized);

    expect(signals.body_region).toBe("genunchi");
    expect(classifyConversationMessage(normalized, signals)).toBe("anatomy_question");
  });
});
