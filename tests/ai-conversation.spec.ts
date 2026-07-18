import { expect, test } from "@playwright/test";
import {
  buildClarifyingAnswer,
  classifyQuestion,
  evaluateSelectedContextFit,
  extractQuestionEntities,
  inferSymptomState,
  normalizeMedicalText,
} from "../src/lib/ai-chat.functions";
import {
  keywordSearchKnowledge,
  semanticSearchKnowledge,
  type KnowledgeEntry,
} from "../src/lib/ai/retrieval";

const baseInput = {
  accessToken: "test-access-token-1234567890",
  tissue: "os",
  structureName: "Humerus",
  structureSlug: "humerus",
  modelSelectionId: "humerus",
  bodyRegion: "brat",
  visualLayer: "skeleton",
  aiLayer: "skeleton",
};

function input(question: string) {
  return { ...baseInput, question } as Parameters<typeof inferSymptomState>[0];
}

function assistant(content_ro: string) {
  return { role: "assistant" as const, content_ro };
}

function user(content_ro: string) {
  return { role: "user" as const, content_ro };
}

test("movement answer does not repeat movement question", () => {
  const state = inferSymptomState(input("pot mișca zona normal"), [
    assistant("Poți mișca zona normal?"),
  ]);
  const answer = buildClarifyingAnswer(input("pot mișca zona normal"), state);

  expect(state.movement_ok).toBe("yes");
  expect(state.answered_fields).toContain("movement_ok");
  expect(answer).not.toContain("Poți mișca zona normal?");
});

test("movement plus severe pain updates both fields", () => {
  const state = inferSymptomState(input("da dar mă doare foarte rău"), [
    user("mă doare"),
    assistant("A apărut după o lovitură, căzătură sau efort?"),
    user("nu"),
    assistant("A început brusc sau treptat?"),
    user("brusc"),
    assistant("Poți mișca zona normal?"),
  ]);
  const answer = buildClarifyingAnswer(input("da dar mă doare foarte rău"), state);

  expect(state.movement_ok).toBe("yes");
  expect(state.severity).toBe("severe");
  expect(answer).not.toContain("Poți mișca zona normal?");
  expect(answer).toMatch(/umflare|vânătaie|poziție neobișnuită/i);
});

test("negative associated signs are not red flags", () => {
  const state = inferSymptomState(input("nu"), [
    user("mă doare"),
    assistant("A apărut după o lovitură, căzătură sau efort?"),
    user("nu"),
    assistant("A început brusc sau treptat?"),
    user("brusc"),
    assistant("Poți mișca zona normal?"),
    user("pot mișca normal"),
    assistant("Durerea este ușoară, moderată sau foarte puternică?"),
    user("ușoară"),
    assistant("Ai observat umflătură, amorțeală sau vânătaie?"),
  ]);

  expect(state.swelling).toBe("no");
  expect(state.numbness).toBe("no");
  expect(state.bruising).toBe("no");
  expect(state.red_flags_detected).toBe(false);
});

test("negative trauma answer advances to the structure-specific movement question", () => {
  const state = inferSymptomState(input("după niciuna din ele"), [
    user("mă doare"),
    assistant("A apărut după o lovitură, căzătură sau efort?"),
  ]);
  const answer = buildClarifyingAnswer(input("după niciuna din ele"), state);

  expect(state.trauma_or_effort).toBe("no");
  expect(state.trauma_type).toBe("none");
  expect(answer).toMatch(/umărul și cotul/i);
});

test("colloquial structure clarification ignores address terms", () => {
  const state = inferSymptomState(input("la humerus unchiule"), [
    assistant("Te referi la Humerus sau la o durere în zona Membru superior?"),
  ]);

  expect(state.last_question_intent).toBe("structure_or_pain_clarification");
});

test("different body region triggers context switch target", () => {
  const bicepsInput = {
    ...baseInput,
    tissue: "muschi",
    structureName: "Biceps brahial",
    structureSlug: "muschi:biceps-brahial",
    modelSelectionId: "muschi:biceps-brahial",
    bodyRegion: "brat",
    visualLayer: "muscular",
    aiLayer: "muscular",
    question: "mă doare genunchiul când alerg",
  } as Parameters<typeof inferSymptomState>[0];
  const route = classifyQuestion(bicepsInput);
  const state = inferSymptomState(bicepsInput, []);
  const contextSwitch = evaluateSelectedContextFit(bicepsInput, route, state);

  expect(route.category).toBe("symptom_or_injury");
  expect(contextSwitch.selected_context_fit).toBe("different_body_region_detected");
  expect(contextSwitch.target_body_region).toBe("genunchi");
  expect(contextSwitch.target_structure_slug).not.toContain("biceps");
});

test("English symptom, context, and body-region entities are detected", () => {
  const entities = extractQuestionEntities(
    "My left ankle is swollen and bruised after I fell while running.",
    "en",
  );

  expect(entities.bodyRegionLabel).toBe("ankle");
  expect(entities.symptoms).toEqual(expect.arrayContaining(["umflare", "vânătaie"]));
  expect(entities.contexts).toEqual(expect.arrayContaining(["căzătură", "alergare"]));
});

test("English breathing difficulty and chest pain are treated as warning signs", () => {
  const englishInput = {
    ...baseInput,
    lang: "en",
    question: "I have severe chest pain and I can't breathe.",
  } as Parameters<typeof inferSymptomState>[0];
  const route = classifyQuestion(englishInput);

  expect(route.category).toBe("red_flag_or_urgent");
  expect(route.entities.redFlags).toEqual(
    expect.arrayContaining(["durere toracică", "dificultăți de respirație"]),
  );
});

test("ordinary urination symptoms do not imply loss of bladder control", () => {
  const entities = extractQuestionEntities("I have pain when urinating.", "en");

  expect(entities.redFlags).not.toContain("control urinar/fecal afectat");
});

test("explicit loss of bladder or bowel control remains a warning sign", () => {
  const entities = extractQuestionEntities(
    "I suddenly can't control my bladder or my bowels.",
    "en",
  );

  expect(entities.redFlags).toContain("control urinar/fecal afectat");
});

test("English organ context uses an English redirect label", () => {
  const englishInput = {
    ...baseInput,
    lang: "en",
    question: "My heart hurts and I have chest pain.",
  } as Parameters<typeof inferSymptomState>[0];
  const route = classifyQuestion(englishInput);
  const state = inferSymptomState(englishInput, []);
  const contextSwitch = evaluateSelectedContextFit(englishInput, route, state);

  expect(contextSwitch.target_layer).toBe("organs");
  expect(contextSwitch.target_structure_slug).toBe("organ:inima");
  expect(contextSwitch.target_display_name).toBe("heart");
  expect(contextSwitch.switch_reason).toContain("heart");
});

test("lower-back pain alone does not redirect to the kidneys", () => {
  const backInput = {
    ...baseInput,
    question: "mă doare zona lombară",
  } as Parameters<typeof inferSymptomState>[0];
  const route = classifyQuestion(backInput);
  const state = inferSymptomState(backInput, []);
  const contextSwitch = evaluateSelectedContextFit(backInput, route, state);

  expect(contextSwitch.target_structure_slug).not.toBe("organ:rinichi");
});

test("chest muscle wording does not redirect to the heart", () => {
  const chestInput = {
    ...baseInput,
    lang: "en",
    tissue: "muschi",
    structureName: "Pectoralis major",
    structureSlug: "muschi:pectoralis-major",
    modelSelectionId: "muschi:pectoralis-major",
    bodyRegion: "torace",
    visualLayer: "muscular",
    aiLayer: "muscular",
    question: "My chest muscle hurts after lifting weights.",
  } as Parameters<typeof inferSymptomState>[0];
  const route = classifyQuestion(chestInput);
  const state = inferSymptomState(chestInput, []);
  const contextSwitch = evaluateSelectedContextFit(chestInput, route, state);

  expect(contextSwitch.target_structure_slug).not.toBe("organ:inima");
});

test("word fragments do not create a false fall context", () => {
  const entities = extractQuestionEntities("The pain started following exercise.", "en");

  expect(entities.contexts).not.toContain("căzătură");
});

test("out of scope investment request is refused by classification", () => {
  const route = classifyQuestion(input("fă-mi un plan de investiții"));

  expect(route.category).toBe("out_of_scope");
});

test("duration reply after duration question reaches a recommendation", () => {
  const state = inferSymptomState(input("o zi"), [
    user("mă doare"),
    assistant("A apărut după o lovitură, căzătură sau efort?"),
    user("nu"),
    assistant("Poți mișca umărul și cotul aproape normal?"),
    user("pot mișca normal"),
    assistant("Ai observat umflare mare, vânătaie sau o poziție neobișnuită a brațului?"),
    user("nu"),
    assistant("Ai amorțeală, furnicături sau slăbiciune în braț ori mână?"),
    user("nu"),
    assistant("Durerea este ușoară, moderată sau foarte puternică?"),
    user("ușoară"),
    assistant("De cât timp simți durerea?"),
  ]);
  const answer = buildClarifyingAnswer(input("o zi"), state);

  expect(state.duration).toBe("days");
  expect(state.answered_fields).toContain("duration");
  expect(state.generic_triage?.phase).toBe("ready_for_summary");
  expect(answer).toMatch(/Finalizeaza rezumatul|Finalizează rezumatul/i);
  expect(answer).not.toContain("Nu am înțeles");
});

test("pain quality with diacritics is normalized and parsed as stabbing", () => {
  const route = classifyQuestion(input("înțepătoare"));
  const state = inferSymptomState(input("înțepătoare"), [user("mă doare")]);

  expect(normalizeMedicalText("înțepătoare")).toBe("intepatoare");
  expect(state.pain_quality).toBe("stabbing");
  expect(route.category).not.toBe("unclear_message");
});

test("pain quality without diacritics is parsed as stabbing", () => {
  const state = inferSymptomState(input("intepatoare"), [user("mă doare")]);

  expect(state.pain_quality).toBe("stabbing");
});

test("ma inteapa marks pain present and stabbing quality", () => {
  const state = inferSymptomState(input("mă înțeapă"), []);

  expect(state.pain_present).toBe(true);
  expect(state.pain_quality).toBe("stabbing");
});

test("burning pain quality is parsed", () => {
  const state = inferSymptomState(input("arsură"), [user("mă doare")]);

  expect(state.pain_quality).toBe("burning");
});

test("dull pain and moderate severity are parsed together", () => {
  const state = inferSymptomState(input("durere surdă moderată"), []);

  expect(state.pain_quality).toBe("dull");
  expect(state.severity).toBe("moderate");
});

test("burning pain and severe intensity are parsed together", () => {
  const state = inferSymptomState(input("arde foarte rău"), []);

  expect(state.pain_quality).toBe("burning");
  expect(state.severity).toBe("severe");
});

test("pain quality cannot bypass the active anatomical question", () => {
  const state = inferSymptomState(input("înțepătoare"), [
    user("mă doare"),
    assistant("A apărut după o lovitură, căzătură sau efort?"),
    user("nu"),
    assistant("A început brusc sau treptat?"),
    user("brusc"),
    assistant("Poți mișca zona normal?"),
    user("pot mișca normal"),
    assistant("Durerea este ușoară, moderată sau foarte puternică?"),
  ]);
  const answer = buildClarifyingAnswer(input("înțepătoare"), state);

  expect(state.pain_quality).toBe("stabbing");
  expect(answer).toMatch(/întrebarea curentă|umflare mare|vânătaie/i);
  expect(answer).not.toMatch(/Humerus sau|zona Corp/i);
});

const knowledgeFixture: KnowledgeEntry[] = [
  {
    id: "sport-trauma",
    tissue: "os",
    structure_slug: "carp",
    body_region: "mana",
    category: "cauze_posibile",
    title_ro: "Durere după fotbal sau căzătură",
    content_ro:
      "Durerea după sport, fotbal, lovitură sau căzătură poate fi asociată cu contuzie, entorsă, luxație sau fractură.",
    title_en: "Pain after football or a fall",
    content_en:
      "Pain after sport, football, an impact, or a fall may be associated with a contusion, sprain, dislocation, or fracture.",
    priority: 8,
    tags: ["sport", "trauma", "durere"],
  },
  {
    id: "muscle-arm-effort",
    tissue: "muschi",
    structure_slug: "muschi:muschii-bratului",
    body_region: "brat",
    category: "simptome",
    title_ro: "Durere musculară la încordarea brațului",
    content_ro:
      "Durerea când încordezi brațul sau după efort poate sugera suprasolicitare musculară, întindere sau crampă.",
    priority: 8,
    tags: ["efort", "incordare", "brat"],
  },
  {
    id: "red-flag-fingers",
    tissue: "os",
    structure_slug: "carp",
    body_region: "mana",
    category: "semne_alarma",
    title_ro: "Nu pot mișca degetele",
    content_ro:
      "Imposibilitatea de a mișca degetele, amorțeala sau pierderea sensibilității pot fi semne de alarmă și necesită consult rapid.",
    priority: 10,
    tags: ["red-flag", "degete", "miscare"],
  },
  {
    id: "knee-running",
    tissue: "muschi",
    structure_slug: "muschi:muschii-coapsei",
    body_region: "genunchi",
    category: "simptome",
    title_ro: "Durere de genunchi la alergare",
    content_ro:
      "Durerea de genunchi când alergi poate fi legată de efort, suprasolicitare musculară, tendon sau articulație.",
    priority: 8,
    tags: ["genunchi", "alergare", "efort"],
  },
  {
    id: "ankle-swelling",
    tissue: "os",
    structure_slug: "tars",
    body_region: "glezna",
    category: "semne_alarma",
    title_ro: "Gleznă umflată",
    content_ro:
      "Umflarea gleznei după traumatism sau imposibilitatea de a călca poate indica entorsă, fractură sau altă leziune care necesită evaluare.",
    priority: 9,
    tags: ["glezna", "umflare", "trauma"],
  },
];

class FakeQueryBuilder {
  constructor(private rows: KnowledgeEntry[]) {}
  eq() {
    return this;
  }
  in() {
    return this;
  }
  or() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  then(resolve: (value: { data: KnowledgeEntry[]; error: null }) => void) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

const fakeSupabase = {
  rpc: async () => ({ data: [], error: null }),
  from: () => ({
    select: () => new FakeQueryBuilder(knowledgeFixture),
  }),
};

const fakeSemanticSupabase = {
  rpc: async () => ({
    data: [{ ...knowledgeFixture[1], similarity: 0.91 }],
    error: null,
  }),
  from: () => ({
    select: () => new FakeQueryBuilder(knowledgeFixture),
  }),
};

test("keyword retrieval finds sport and trauma context", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "mă doare după fotbal", {
    aiLayer: "skeleton",
    tags: ["sport", "trauma"],
  });

  expect(results[0].id).toBe("sport-trauma");
});

test("keyword retrieval finds fall and hand trauma context", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "am căzut și mă doare mâna", {
    aiLayer: "skeleton",
    bodyRegion: "mana",
    tags: ["trauma"],
  });

  expect(results[0].id).toBe("sport-trauma");
});

test("keyword retrieval searches the English medical content for English conversations", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "pain after a football impact", {
    language: "en",
    aiLayer: "skeleton",
    bodyRegion: "mana",
  });

  expect(results[0].id).toBe("sport-trauma");
  expect(results[0].content_en).toContain("sprain");
});

test("keyword retrieval finds muscular arm effort context", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "mă doare când încordez brațul", {
    aiLayer: "muscular",
    bodyRegion: "brat",
    tags: ["incordare", "efort"],
  });

  expect(results[0].id).toBe("muscle-arm-effort");
});

test("semantic retrieval uses embedding RPC when embedder is available", async () => {
  const results = await semanticSearchKnowledge(
    fakeSemanticSupabase,
    "mă doare când încordez brațul",
    { aiLayer: "muscular", bodyRegion: "brat" },
    async () => Array.from({ length: 1536 }, () => 0.01),
  );

  expect(results[0].id).toBe("muscle-arm-effort");
  expect(results[0].retrieval_source).toBe("semantic");
});

test("keyword retrieval finds red flag context for fingers", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "nu pot mișca degetele", {
    aiLayer: "skeleton",
    bodyRegion: "mana",
    categories: ["semne_alarma"],
  });

  expect(results[0].id).toBe("red-flag-fingers");
});

test("keyword retrieval finds knee running context", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "mă doare genunchiul când alerg", {
    aiLayer: "muscular",
    bodyRegion: "genunchi",
    tags: ["alergare"],
  });

  expect(results[0].id).toBe("knee-running");
});

test("keyword retrieval finds ankle swelling context", async () => {
  const results = await keywordSearchKnowledge(fakeSupabase, "mi s-a umflat glezna", {
    aiLayer: "skeleton",
    bodyRegion: "glezna",
    tags: ["umflare"],
  });

  expect(results[0].id).toBe("ankle-swelling");
});
