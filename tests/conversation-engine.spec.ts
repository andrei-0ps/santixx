import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  normalizeAnswer,
  normalizeAnswerForQuestion,
  normalizeTraumaTrigger,
  normalizeUserText,
} from "../src/lib/ai/conversation/answerNormalizers";
import {
  MAX_CLARIFICATIONS_PER_QUESTION,
  processActiveQuestionAnswer,
} from "../src/lib/ai/conversation/conversationEngine";
import {
  selectConversationState,
  shouldAcceptConversationStateResponse,
  validateConversationState,
  type ConversationStateV1,
} from "../src/lib/ai/conversation/conversationState";
import {
  getConversationQuestionPlaceholder,
  type ConversationQuestionDefinition,
} from "../src/lib/ai/conversation/questionTypes";
import {
  createAuthenticatedConversationAdapter,
  createGuestSessionAdapter,
} from "../src/lib/ai/conversation/persistenceAdapter";
import {
  applyMessageToTriageState,
  buildTriageAnswerText,
  createGenericTriageState,
  detectMedicalIntent,
  type GenericTriageState,
} from "../src/lib/ai/triageFlows";

const semanticQuestions = {
  visibleSigns: {
    id: "visibleSigns",
    type: "yes_no",
    answerKey: "visibleSigns",
    text: { ro: "Ai observat semne vizibile?", en: "Have you noticed visible signs?" },
    required: true,
    semantic: {
      answerKind: "any_of_concepts",
      expectedConcepts: ["swelling", "bruising", "deformity"],
    },
  },
  sensation: {
    id: "sensation",
    type: "sensation_status",
    answerKey: "sensation",
    text: { ro: "Cum este sensibilitatea?", en: "How does sensation feel?" },
    required: true,
    semantic: { answerKind: "sensation_status" },
  },
  movement: {
    id: "movement",
    type: "movement_status",
    answerKey: "movement",
    text: { ro: "Cum este miscarea?", en: "How is movement?" },
    required: true,
    semantic: { answerKind: "movement_status" },
  },
  trauma: {
    id: "trauma",
    type: "trauma_trigger",
    answerKey: "trauma",
    text: { ro: "Care a fost mecanismul?", en: "What was the mechanism?" },
    required: true,
    semantic: { answerKind: "trauma_mechanism" },
  },
  duration: {
    id: "duration",
    type: "duration",
    answerKey: "duration",
    text: { ro: "De cand?", en: "For how long?" },
    required: true,
    semantic: { answerKind: "duration" },
  },
  severity: {
    id: "severity",
    type: "severity",
    answerKey: "severity",
    text: { ro: "Cat de tare?", en: "How severe?" },
    required: true,
    semantic: { answerKind: "severity" },
  },
} satisfies Record<string, ConversationQuestionDefinition>;

const semanticAnswerCases = [
  ["visibleSigns", "umflare", "valid", "yes", ["swelling"]],
  ["visibleSigns", "cred ca o umflatura", "valid", "yes", ["swelling"]],
  ["visibleSigns", "are o vanataie", "valid", "yes", ["bruising"]],
  ["visibleSigns", "pare stramb", "valid", "yes", ["deformity"]],
  ["visibleSigns", "nu are nimic", "valid", "no", []],
  ["visibleSigns", "nu stiu", "valid", "unknown", []],
  ["visibleSigns", "nu e umflat, dar e vanat", "valid", "yes", ["bruising"]],
  ["visibleSigns", "it is not swollen, but it is bruised", "valid", "yes", ["bruising"]],
  ["sensation", "am furnicaturi", "valid", "altered", ["tingling"]],
  ["sensation", "amorțeală", "valid", "altered", ["numbness"]],
  ["sensation", "nu simt nimic neobisnuit", "valid", "normal", ["sensation_normal"]],
  ["sensation", "I have pins and needles", "valid", "altered", ["tingling"]],
  ["movement", "normal", "valid", "yes", ["movement_normal"]],
  ["movement", "pot putin", "valid", "partial", ["movement_partial"]],
  ["movement", "nu pot", "valid", "no", ["movement_none"]],
  ["movement", "I can move normally", "valid", "yes", ["movement_normal"]],
  ["trauma", "cazatura", "valid", "fall", ["fall"]],
  ["trauma", "lovitură", "valid", "impact", ["impact"]],
  ["trauma", "dupa efort", "valid", "effort", ["effort"]],
  ["trauma", "I fell", "valid", "fall", ["fall"]],
  ["duration", "de 2 zile", "valid", "de 2 zile", ["duration"]],
  ["duration", "a aparut acum zece zile", "valid", "a aparut acum zece zile", ["duration"]],
  ["severity", "moderata", "valid", "moderate", ["severity:moderate"]],
  ["severity", "foarte tare", "valid", "severe", ["severity:severe"]],
] as const;

const armContext = {
  selectedStructure: "Humerus",
  selectedMode: "skeleton",
  selectedTissue: "os",
};

function start(message: string, context = armContext) {
  return applyMessageToTriageState(null, message, context) as GenericTriageState;
}

function answer(state: GenericTriageState, message: string, context = armContext) {
  return applyMessageToTriageState(state, message, context) as GenericTriageState;
}

function reachMusculoskeletalDuration() {
  let state = start("mă doare brațul");
  for (const value of ["nu", "pot să mișc normal", "nu", "nu", "moderată"]) {
    state = answer(state, value);
  }
  expect(state.currentQuestionId).toBe("duration");
  return state;
}

test("semantic answer matrix is interpreted through question metadata", () => {
  for (const [
    questionKey,
    input,
    expectedStatus,
    expectedStorage,
    expectedConcepts,
  ] of semanticAnswerCases) {
    const normalized = normalizeAnswerForQuestion(semanticQuestions[questionKey], input, "ro");
    expect(normalized.status, input).toBe(expectedStatus);
    expect(normalized.storageValue, input).toBe(expectedStorage);
    expect(normalized.detectedConcepts, input).toEqual(expectedConcepts);
    expect(normalized.rawValue, input).toBe(input);
  }
});

test("visible-sign evidence preserves local negation and uncertainty", () => {
  const mixed = normalizeAnswerForQuestion(
    semanticQuestions.visibleSigns,
    "nu e umflat, dar e vanat",
    "ro",
  );
  expect(mixed.normalizedValue).toMatchObject({
    present: true,
    swelling: false,
    bruising: true,
    deformity: false,
  });
  expect(mixed.polarity).toBe("positive");

  const uncertain = normalizeAnswerForQuestion(
    semanticQuestions.visibleSigns,
    "nu stiu daca e umflat",
    "ro",
  );
  expect(uncertain.normalizedValue).toMatchObject({ present: null, uncertain: true });
  expect(uncertain.polarity).toBe("unknown");
  expect(uncertain.uncertain).toBe(true);
});

test("evidence answers are stored as compatible JSON and advance without duplication", () => {
  let state = start("ma doare humerusul");
  state = answer(state, "cazatura");
  state = answer(state, "normal");
  expect(state.currentQuestionId).toBe("upperLimbSwellingOrDeformity");

  state = answer(state, "nu e umflat dar e vanat");
  expect(state.answers.upperLimbSwellingOrDeformity).toBe("yes");
  expect(state.normalizedAnswers.upperLimbSwellingOrDeformity).toMatchObject({
    rawValue: "nu e umflat dar e vanat",
    detectedConcepts: ["bruising"],
    polarity: "positive",
    uncertain: false,
    normalizedValue: {
      present: true,
      swelling: false,
      bruising: true,
      deformity: false,
    },
  });
  expect(state.completedQuestionIds).toContain("upperLimbSwellingOrDeformity");
  expect(state.currentQuestionId).not.toBe("upperLimbSwellingOrDeformity");
});

test("one rich answer can complete later planned questions only from semantic evidence", () => {
  const initial = start("ma doare humerusul");
  const state = answer(initial, "am cazut, pot misca normal, dar e vanat");

  expect(state.answers.trauma).toBe("fall");
  expect(state.answers.upperLimbJointMovement).toBe("yes");
  expect(state.answers.upperLimbSwellingOrDeformity).toBe("yes");
  expect(state.completedQuestionIds).toEqual(
    expect.arrayContaining(["trauma", "upperLimbJointMovement", "upperLimbSwellingOrDeformity"]),
  );
  expect(state.currentQuestionId).not.toBe("trauma");
  expect(state.currentQuestionId).not.toBe("upperLimbJointMovement");
  expect(state.currentQuestionId).not.toBe("upperLimbSwellingOrDeformity");
});

test("the initial symptom message can pre-complete planned answer keys", () => {
  const state = start("ma doare humerusul de doua zile si este vanat");

  expect(state.answers.duration).toBe("ma doare humerusul de doua zile si este vanat");
  expect(state.answers.upperLimbSwellingOrDeformity).toBe("yes");
  expect(state.normalizedAnswers.upperLimbSwellingOrDeformity.detectedConcepts).toEqual([
    "bruising",
  ]);
  expect(state.completedQuestionIds).toEqual(
    expect.arrayContaining(["duration", "upperLimbSwellingOrDeformity"]),
  );
  expect(state.currentQuestionId).toBe("trauma");
});

test("active duration question accepts a numeric colloquial answer before global intent routing", () => {
  const before = reachMusculoskeletalDuration();
  const after = answer(before, "2 zile");

  expect(after.answers.duration).toBe("2 zile");
  expect(after.normalizedAnswers.duration.normalizedValue).toEqual({
    amount: 2,
    unit: "day",
    approximate: false,
  });
  expect(after.completedQuestionIds).toContain("duration");
  expect(after.currentQuestionId).toBeNull();
  expect(after.phase).toBe("ready_for_summary");
});

test("duration extracts a full Romanian sentence and ignores additional frequency detail", () => {
  const shortAnswer = answer(reachMusculoskeletalDuration(), "simt durerea de 2 zile");
  expect(shortAnswer.normalizedAnswers.duration.normalizedValue).toEqual({
    amount: 2,
    unit: "day",
    approximate: false,
  });

  const longAnswer = answer(
    reachMusculoskeletalDuration(),
    "prima oară a apărut acum 10 zile și tot o simt în fiecare zi de câteva ori pe zi",
  );
  expect(longAnswer.normalizedAnswers.duration.normalizedValue).toEqual({
    amount: 10,
    unit: "day",
    approximate: false,
  });
  expect(longAnswer.phase).toBe("ready_for_summary");
});

test("natural English breathing reply is affirmative for the active ribs question", () => {
  const ribsContext = {
    selectedStructure: "Ribs",
    selectedStructureId: "ribs",
    technicalStructureName: "Costae",
    selectedMode: "skeleton",
    selectedTissue: "os",
    bodyRegion: "Chest",
  };
  let state = start("Mă doare aici", ribsContext);
  state = answer(state, "no", ribsContext);
  expect(state.currentQuestionId).toBe("chestBreathingChange");

  state = answer(state, "when i take a deep breath it hurts worse", ribsContext);
  expect(state.answers.chestBreathingChange).toBe("yes");
  expect(state.completedQuestionIds).toContain("chestBreathingChange");
  expect(state.currentQuestionId).not.toBe("chestBreathingChange");
});

test("duration accepts uncertainty as a completed answer", () => {
  const after = answer(reachMusculoskeletalDuration(), "nu știu");
  expect(after.answers.duration).toBe("unknown");
  expect(after.completedQuestionIds).toContain("duration");
  expect(after.phase).toBe("ready_for_summary");
});

test("severity normalization is centralized and diacritic insensitive", () => {
  const severityQuestion: ConversationQuestionDefinition = {
    id: "severity",
    type: "severity",
    answerKey: "severity",
    text: { ro: "Cât de tare doare?", en: "How severe is it?" },
    required: true,
  };

  expect(normalizeAnswer(severityQuestion, "moderată", "ro").storageValue).toBe("moderate");
  expect(normalizeAnswer(severityQuestion, "moderata", "ro").storageValue).toBe("moderate");
  expect(normalizeAnswer(severityQuestion, "spre severă", "ro").storageValue).toBe(
    "moderate_to_severe",
  );
});

test("trauma trigger normalizes mechanism categories in Romanian and English", () => {
  const cases = [
    ["căzătură", "fall"],
    ["cazatura", "fall"],
    ["am cazut", "fall"],
    ["fell", "fall"],
    ["lovitură", "impact"],
    ["m-am lovit", "impact"],
    ["hit", "impact"],
    ["după sală", "effort"],
    ["exertion", "effort"],
    ["efort repetitiv", "repetitive_effort"],
    ["overuse", "repetitive_effort"],
    ["altceva", "other"],
    ["nu", "none"],
    ["nu știu", "unknown"],
  ] as const;

  for (const [message, expected] of cases) {
    const normalized = normalizeTraumaTrigger(message);
    expect(normalized.status, message).toBe("valid");
    expect(normalized.storageValue, message).toBe(expected);
    expect(normalized.rawValue, message).toBe(message);
  }
  expect(normalizeTraumaTrigger("da").status).toBe("ambiguous");
});

test("trauma trigger uses the central diacritic-insensitive user-text normalizer", () => {
  expect(normalizeUserText("  CĂZĂTURĂ!!!  ")).toBe("cazatura");
  expect(normalizeUserText("Ș/Ş și Ț/Ţ")).toBe("s s si t t");
});

test("active trauma question stores the mechanism and original browser text", () => {
  const before = start("mă doare brațul");
  expect(before.currentQuestionId).toBe("trauma");
  expect(before.currentQuestionType).toBe("trauma_trigger");

  const after = answer(before, "cazatura");
  expect(after.answers.trauma).toBe("fall");
  expect(after.normalizedAnswers.trauma).toMatchObject({
    questionId: "trauma",
    questionType: "trauma_trigger",
    rawValue: "cazatura",
    normalizedValue: "fall",
  });
  expect(after.currentQuestionId).not.toBe("trauma");
  expect(after.phase).toBe("collecting");
});

test("dirty object keeps the active yes/no context for cu niciunu", () => {
  const context = {
    selectedStructure: "Degetele mâinii",
    selectedMode: "skeleton",
    selectedTissue: "os",
  };
  let state = start("m-am tăiat la deget", context);
  for (const value of ["nu", "superficială", "da", "da"]) {
    state = answer(state, value, context);
  }
  expect(state.currentQuestionId).toBe("dirtyObject");
  state = answer(state, "cu niciunu", context);
  expect(state.answers.dirtyObject).toBe("no");
  expect(state.completedQuestionIds).toContain("dirtyObject");
});

test("location confirmation maps one of the offered areas instead of repeating the question", () => {
  const question: ConversationQuestionDefinition = {
    id: "locationConfirmation",
    type: "location_confirmation",
    answerKey: "location",
    text: {
      ro: "Te referi la os sau la durerea din membrul superior?",
      en: "Do you mean the bone or the upper-limb area?",
    },
    required: true,
    options: [
      { value: "selected_bone", labelRo: "os", labelEn: "bone", terms: ["os", "humerus"] },
      {
        value: "upper_limb",
        labelRo: "membrul superior",
        labelEn: "upper limb",
        terms: ["membrul superior", "zona bratului", "upper limb"],
      },
    ],
  };
  const normalized = normalizeAnswer(question, "membrul superior", "ro");
  expect(normalized.status).toBe("valid");
  expect(normalized.storageValue).toBe("upper_limb");
});

test("movement and sensation use their own typed normalizers", () => {
  const movement: ConversationQuestionDefinition = {
    id: "movementLimitation",
    type: "movement_status",
    answerKey: "movementLimitation",
    text: { ro: "Poți mișca zona?", en: "Can you move the area?" },
    required: true,
  };
  const sensation: ConversationQuestionDefinition = {
    id: "numbness",
    type: "sensation_status",
    answerKey: "numbness",
    text: { ro: "Ai amorțeală?", en: "Do you have numbness?" },
    required: true,
  };

  expect(normalizeAnswer(movement, "pot să mișc normal", "ro").storageValue).toBe("yes");
  expect(normalizeAnswer(sensation, "am furnicături", "ro").storageValue).toBe("altered");
});

test("ambiguous answers keep the flow and question and use a local clarification", () => {
  const state = start("mă dor rinichii", {
    selectedStructure: "Rinichi",
    selectedMode: "organs",
    selectedTissue: "organ",
  });
  const after = answer(state, "poate cumva", {
    selectedStructure: "Rinichi",
    selectedMode: "organs",
    selectedTissue: "organ",
  });

  expect(after.activeFlow).toBe("urinary_kidney");
  expect(after.currentQuestionId).toBe("severity");
  expect(after.phase).toBe("clarifying_current_answer");
  expect(after.clarification?.questionId).toBe("severity");
  expect(buildTriageAnswerText(after, "ro")).toMatch(/u[sș]oar[aă].*moderat[aă].*sever/i);
  expect(buildTriageAnswerText(after, "ro")).not.toContain("Rinichi sau");
});

test("clarification cannot loop forever and stores unknown after the limit", () => {
  const detection = detectMedicalIntent("mă dor rinichii", "Rinichi", "organs", "organ");
  let state = createGenericTriageState(
    detection,
    { selectedStructure: "Rinichi", selectedMode: "organs", selectedTissue: "organ" },
    "mă dor rinichii",
  );
  const question: ConversationQuestionDefinition = {
    id: "severity",
    type: "severity",
    answerKey: "severity",
    text: {
      ro: "Durerea este ușoară, moderată sau severă?",
      en: "Is it mild, moderate or severe?",
    },
    required: true,
  };

  for (let index = 0; index < MAX_CLARIFICATIONS_PER_QUESTION; index += 1) {
    const transition = processActiveQuestionAnswer({
      state,
      question,
      message: "hmm",
      locale: "ro",
    });
    state = transition.state;
    expect(transition.answered).toBe(false);
  }
  const finalTransition = processActiveQuestionAnswer({
    state,
    question,
    message: "hmm",
    locale: "ro",
  });
  expect(finalTransition.answered).toBe(true);
  expect(finalTransition.forcedUnknown).toBe(true);
  expect(finalTransition.state.answers.severity).toBe("unknown");
});

test("state validation migrates direct guest state and nested authenticated state equally", () => {
  const guest = start("mă doare brațul");
  const authenticated = { generic_triage: { ...guest, conversationId: "conversation-1" } };
  const guestRestored = validateConversationState(guest, armContext);
  const authRestored = validateConversationState(authenticated, armContext);

  expect(guestRestored?.activeFlow).toBe(authRestored?.activeFlow);
  expect(guestRestored?.currentQuestionId).toBe(authRestored?.currentQuestionId);
  expect(guestRestored?.answers).toEqual(authRestored?.answers);
  expect(guestRestored?.conversationId).toBeNull();
  expect(authRestored?.conversationId).toBe("conversation-1");
});

test("state precedence uses the highest revision and request wins a revision tie", () => {
  const base = reachMusculoskeletalDuration();
  const oldDatabaseState = { ...base, revision: 3, conversationId: "conversation-1" };
  const newerRequestState = { ...base, revision: 4, conversationId: "conversation-1" };
  const newest = selectConversationState({
    requestState: newerRequestState,
    persistedConversationState: oldDatabaseState,
    context: { conversationId: "conversation-1" },
  });
  expect(newest.source).toBe("request");
  expect(newest.state?.revision).toBe(4);

  const tied = selectConversationState({
    requestState: { ...newerRequestState, revision: 5 },
    persistedConversationState: { ...oldDatabaseState, revision: 5 },
    storedMessageState: { generic_triage: { ...oldDatabaseState, revision: 5 } },
    context: { conversationId: "conversation-1" },
  });
  expect(tied.source).toBe("request");
  expect(tied.reason).toBe("request_wins_revision_tie");
});

test("a legacy state without revision migrates to zero without replacing newer state", () => {
  const base = reachMusculoskeletalDuration();
  const legacy = { ...base } as Partial<ConversationStateV1>;
  delete legacy.revision;
  const selected = selectConversationState({
    persistedConversationState: legacy,
    storedMessageState: { generic_triage: { ...base, revision: 2 } },
  });
  expect(validateConversationState(legacy)?.revision).toBe(0);
  expect(selected.source).toBe("message");
  expect(selected.state?.revision).toBe(2);
});

test("an older server response cannot replace a newer browser question state", () => {
  const base = reachMusculoskeletalDuration();
  expect(
    shouldAcceptConversationStateResponse({
      currentState: { ...base, revision: 8 },
      responseState: { ...base, revision: 7, currentQuestionId: "severity" },
    }),
  ).toBe(false);
  expect(
    shouldAcceptConversationStateResponse({
      currentState: { ...base, revision: 8 },
      responseState: { ...base, revision: 9, currentQuestionId: null },
    }),
  ).toBe(true);
});

test("active-question placeholders follow question id, type and locale", () => {
  expect(
    getConversationQuestionPlaceholder({
      questionId: "duration",
      questionType: "duration",
      locale: "ro",
      fallback: "fallback",
    }),
  ).toBe("Ex.: De două zile");
  expect(
    getConversationQuestionPlaceholder({
      questionId: "trauma",
      questionType: "trauma_trigger",
      locale: "ro",
      fallback: "fallback",
    }),
  ).toBe("Ex.: Căzătură, lovitură sau efort");
  expect(
    getConversationQuestionPlaceholder({
      questionId: "trauma",
      questionType: "trauma_trigger",
      locale: "en",
      fallback: "fallback",
    }),
  ).toBe("E.g. A fall, hit, or exertion");
  expect(
    getConversationQuestionPlaceholder({
      questionId: "chestBreathingChange",
      questionType: "yes_no",
      locale: "en",
      fallback: "fallback",
    }),
  ).toBe("E.g. Yes, it hurts more when I breathe in");
});

test("the same sequence produces the same medical state for guest and authenticated users", () => {
  const initial = start("mă doare brațul");
  let guest: ConversationStateV1 = { ...initial, conversationId: null };
  let authenticated: ConversationStateV1 = { ...initial, conversationId: "conversation-1" };
  for (const message of ["nu", "pot să mișc normal", "nu", "nu", "moderata"]) {
    guest = answer(guest, message);
    authenticated = answer(authenticated, message);
  }

  expect(guest.answers).toEqual(authenticated.answers);
  expect(guest.activeFlow).toBe(authenticated.activeFlow);
  expect(guest.currentQuestionId).toBe(authenticated.currentQuestionId);
  expect(guest.redFlagLevel).toBe(authenticated.redFlagLevel);
  expect(guest.conversationId).toBeNull();
  expect(authenticated.conversationId).toBe("conversation-1");
});

test("guest and authenticated persistence adapters store the same versioned state", async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const state = answer(start("mă doare brațul"), "nu");
  const guest = createGuestSessionAdapter({ storage, key: "conversation" });
  let authenticatedValue: unknown = null;
  const authenticated = createAuthenticatedConversationAdapter({
    loadState: async () => authenticatedValue,
    saveState: async (next) => {
      authenticatedValue = next;
    },
  });

  await guest.save(state);
  await authenticated.save({ ...state, conversationId: "conversation-1" });

  expect(validateConversationState(await guest.load())?.version).toBe(1);
  expect(validateConversationState(await authenticated.load())?.answers).toEqual(state.answers);
  expect(guest.kind).toBe("guest");
  expect(authenticated.kind).toBe("authenticated");
});

test("an explicit topic change can replace a completed or active flow", () => {
  const kidneyContext = {
    selectedStructure: "Rinichi",
    selectedMode: "organs",
    selectedTissue: "organ",
  };
  const kidney = start("mă dor rinichii", kidneyContext);
  const changed = answer(kidney, "schimb subiectul, m-am tăiat la deget", kidneyContext);
  expect(changed.activeFlow).toBe("wound_cut");
  expect(changed.currentQuestionId).toBe("bleedingNow");
});

test("the chat guards one active request and sends requestId to the server", () => {
  const source = readFileSync(
    new URL("../src/components/skeleton/BoneInfoPanel.tsx", import.meta.url),
    "utf8",
  );
  expect(source).toContain("activeRequestRef");
  expect(source).toContain("requestId,");
  expect(source).toContain("activeRequestRef.current !== requestId");
  expect(source).toMatch(/disabled=\{aiLoading \|\| !aiInput\.trim\(\)\}/);
});

test("an active guest flow restores its selection and current question after refresh", () => {
  const source = readFileSync(new URL("../src/routes/explorator.tsx", import.meta.url), "utf8");
  expect(source).toContain("readGuestAiSession");
  expect(source).toContain("hasActiveQuestion(restoredState)");
  expect(source).toContain("guestRestoreAttemptedRef");
  expect(source).toContain("setSelection({");
});

test("changing structure during an active question requires confirmation", () => {
  const panelSource = readFileSync(
    new URL("../src/components/skeleton/BoneInfoPanel.tsx", import.meta.url),
    "utf8",
  );
  const explorerSource = readFileSync(
    new URL("../src/routes/explorator.tsx", import.meta.url),
    "utf8",
  );
  expect(panelSource).toContain("onActiveFlowChange?.(hasActiveConversationFlow)");
  expect(explorerSource).toContain("confirmContextChange(nextSelection)");
  expect(explorerSource).toContain("window.confirm(");
});
