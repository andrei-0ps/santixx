import {
  buildPolicyTriageAnswer,
  buildTriageOrientation,
  strongerRedFlagLevel,
  type TriageRedFlagLevel,
} from "./conversationalPolicy";
import {
  normalizeAnswer as normalizeConversationAnswer,
  TRAUMA_TRIGGER_OPTIONS,
} from "./conversation/answerNormalizers";
import {
  isExplicitConversationTopicChange,
  processActiveQuestionAnswer,
} from "./conversation/conversationEngine";
import {
  CONVERSATION_STATE_VERSION,
  validateConversationState,
  type ConversationStateV1,
} from "./conversation/conversationState";
import type {
  ConversationQuestionDefinition,
  ConversationQuestionType,
  MedicalConversationFlowId,
  QuestionSemanticMetadata,
} from "./conversation/questionTypes";
import { conceptPlaceholder, type SemanticConceptId } from "./conversation/conceptRegistry";
import {
  buildAnatomicalContext,
  buildQuestionPlan,
  type AnatomicalContext,
} from "./conversation/anatomicalQuestionPlan";

export type MedicalIntent = MedicalConversationFlowId;

export type TriageConfidence = "low" | "medium" | "high";
export type TriageAnswerKind = "yes_no" | "choice" | "text";
export type TriageQuestionKind =
  | TriageAnswerKind
  | "pain_severity"
  | "depth_or_intensity"
  | "movement_status"
  | "sensation_status"
  | "trauma_trigger"
  | "duration";

export type MedicalIntentDetection = {
  intent: MedicalIntent;
  confidence: TriageConfidence;
  matchedKeywords: string[];
  whetherSelectedStructureMatchesIntent: boolean;
  suggestedRedirect: "skin_soft_tissue" | "musculoskeletal" | "organs" | "neuro" | null;
};

export type TriageQuestion = {
  id: string;
  labelRo: string;
  labelEn: string;
  promptRo: string;
  promptEn: string;
  answerKind: TriageAnswerKind;
  answerType?: TriageQuestionKind;
  options?: Array<{
    value: string;
    labelRo: string;
    labelEn: string;
    terms: string[];
  }>;
  semantic?: QuestionSemanticMetadata;
  placeholder?: { ro: string; en: string };
  skipWhen?: (answers: Record<string, string>) => boolean;
};

type RedFlagRule = {
  questionId: string;
  values: string[];
  flagRo: string;
  flagEn: string;
  level: Exclude<TriageRedFlagLevel, "none">;
};

export type TriageFlow = {
  id: MedicalIntent;
  intent: MedicalIntent;
  labelRo: string;
  labelEn: string;
  mismatchRo: string;
  mismatchEn: string;
  introRo: string;
  introEn: string;
  questions: TriageQuestion[];
  redFlagRules: RedFlagRule[];
  urgentRo?: string;
  urgentEn?: string;
};

export type GenericTriageState = ConversationStateV1;

type SelectionContext = {
  selectedStructure: string;
  selectedStructureId?: string | null;
  technicalStructureName?: string | null;
  selectedMode?: string | null;
  selectedTissue?: string | null;
  bodyRegion?: string | null;
};

type NormalizedQuestionAnswer = {
  value: string;
  acknowledgementRo: string;
  acknowledgementEn: string;
};

function normalize(value: string | undefined | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesTerm(text: string, term: string) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  return ` ${text} `.includes(` ${normalizedTerm} `);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function matchTerms(text: string, terms: string[]) {
  return unique(terms.filter((term) => includesTerm(text, term)));
}

function hasAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => includesTerm(text, term));
}

function hasSeveritySignal(text: string) {
  return hasAnyTerm(text, [
    "usoara",
    "usor",
    "moderata",
    "moderat",
    "medie",
    "suportabila",
    "suportabil",
    "tare",
    "mare",
    "destul de tare",
    "foarte tare",
    "foarte rau",
    "spre severa",
    "severa",
    "sever",
    "mild",
    "moderate",
    "severe",
    "very bad",
    "very strong",
  ]);
}

function selectedStructureSuggestsKidneyOrUrinary(value: string) {
  return hasAnyTerm(normalize(value), ["rinichi", "renal", "kidney", "vezica", "bladder"]);
}

function selectedStructureSuggestsAbdomen(value: string) {
  return hasAnyTerm(normalize(value), [
    "stomac",
    "abdomen",
    "burta",
    "ficat",
    "intestin",
    "splina",
    "pancreas",
    "stomach",
    "liver",
    "intestine",
    "spleen",
    "pancreas",
  ]);
}

const intentPatterns: Array<{
  intent: MedicalIntent;
  redirect: MedicalIntentDetection["suggestedRedirect"];
  targetModes: string[];
  terms: string[];
}> = [
  {
    intent: "breathing_problem",
    redirect: "organs",
    targetModes: ["organ", "organs"],
    terms: [
      "respir greu",
      "nu pot respira",
      "respiratie grea",
      "respiratie dificila",
      "ma sufoc",
      "shortness of breath",
      "can't breathe",
      "cant breathe",
      "difficulty breathing",
    ],
  },
  {
    intent: "chest_pain",
    redirect: "organs",
    targetModes: ["organ", "organs"],
    terms: [
      "durere in piept",
      "ma doare pieptul",
      "ma doare in piept",
      "presiune in piept",
      "durere toracica",
      "chest pain",
      "chest pressure",
    ],
  },
  {
    intent: "numbness_weakness",
    redirect: "neuro",
    targetModes: [],
    terms: [
      "amorteste",
      "amorteala",
      "mana amortita",
      "furnicaturi",
      "slabiciune",
      "nu am forta",
      "numb",
      "numbness",
      "tingling",
      "weakness",
    ],
  },
  {
    intent: "headache_neuro",
    redirect: "neuro",
    targetModes: [],
    terms: [
      "durere de cap",
      "ma doare capul",
      "ametesc",
      "ameteala",
      "confuzie",
      "confuz",
      "lesin",
      "headache",
      "dizzy",
      "confused",
      "faint",
    ],
  },
  {
    intent: "wound_cut",
    redirect: "skin_soft_tissue",
    targetModes: [],
    terms: [
      "taiat",
      "taietura",
      "m am taiat",
      "m am intepat",
      "intepatura",
      "rana",
      "plaga",
      "sangerare",
      "sangerez",
      "cutit",
      "ciob",
      "sticla",
      "ruginit",
      "cut",
      "wound",
      "bleeding",
      "knife",
      "glass",
      "rusty",
    ],
  },
  {
    intent: "burn",
    redirect: "skin_soft_tissue",
    targetModes: [],
    terms: [
      "m am ars",
      "arsura",
      "ars",
      "m arde pielea",
      "piele arsa",
      "oparit",
      "burn",
      "burned",
      "scald",
    ],
  },
  {
    intent: "abdominal_pain",
    redirect: "organs",
    targetModes: ["organ", "organs"],
    terms: [
      "ma doare burta",
      "durere de burta",
      "burta",
      "durere abdominala",
      "abdomen",
      "stomac",
      "ficat",
      "crampe abdominale",
      "belly pain",
      "abdominal pain",
      "stomach pain",
    ],
  },
  {
    intent: "digestive_symptom",
    redirect: "organs",
    targetModes: ["organ", "organs"],
    terms: ["greata", "varsaturi", "vomit", "diaree", "diarrhea", "nausea", "vomiting"],
  },
  {
    intent: "urinary_kidney",
    redirect: "organs",
    targetModes: ["organ", "organs"],
    terms: [
      "urinare",
      "ma ustura cand urinez",
      "durere la urinare",
      "ma dor rinichii",
      "ma doare rinichiul",
      "rinichi",
      "rinichii",
      "durere rinichi",
      "vezica",
      "urina",
      "urinating",
      "kidney",
      "bladder",
    ],
  },
  {
    intent: "trauma_fall_hit",
    redirect: "musculoskeletal",
    targetModes: ["os", "muschi", "skeleton", "muscular"],
    terms: [
      "am cazut",
      "cazatura",
      "lovitura",
      "m am lovit",
      "accident",
      "impact",
      "fell",
      "fall",
      "hit",
      "accident",
    ],
  },
  {
    intent: "musculoskeletal_pain",
    redirect: "musculoskeletal",
    targetModes: ["os", "muschi", "skeleton", "muscular"],
    terms: [
      "ma doare",
      "durere",
      "genunchi",
      "genunchiul",
      "incheietura",
      "glezna",
      "umar",
      "cot",
      "spate",
      "muschi",
      "os",
      "articulatie",
      "indoiesc",
      "indoi",
      "merg",
      "movement",
      "joint",
      "muscle",
      "bone",
      "pain",
      "hurts",
    ],
  },
];

function selectedMatchesIntent(
  selectedMode: string,
  selectedTissue: string,
  targetModes: string[],
  redirect: MedicalIntentDetection["suggestedRedirect"],
) {
  const mode = normalize(selectedMode);
  const tissue = normalize(selectedTissue);
  if (redirect === "skin_soft_tissue" || redirect === "neuro") return false;
  if (!targetModes.length) return true;
  return targetModes.some(
    (target) => mode === target || tissue === target || mode.includes(target),
  );
}

export function detectMedicalIntent(
  message: string,
  selectedStructure = "",
  selectedMode = "",
  selectedTissue = "",
): MedicalIntentDetection {
  const text = normalize([message, selectedStructure].join(" "));
  const messageOnly = normalize(message);

  for (const pattern of intentPatterns) {
    const matchedKeywords = matchTerms(messageOnly, pattern.terms);
    if (!matchedKeywords.length) continue;
    const onlyGenericPain =
      pattern.intent === "musculoskeletal_pain" &&
      matchedKeywords.every((term) =>
        ["ma doare", "durere", "pain", "hurts"].includes(normalize(term)),
      );
    return {
      intent: pattern.intent,
      confidence: onlyGenericPain ? "low" : matchedKeywords.length >= 2 ? "high" : "medium",
      matchedKeywords,
      whetherSelectedStructureMatchesIntent: selectedMatchesIntent(
        selectedMode,
        selectedTissue,
        pattern.targetModes,
        pattern.redirect,
      ),
      suggestedRedirect: pattern.redirect,
    };
  }

  if (
    selectedStructureSuggestsKidneyOrUrinary(selectedStructure) &&
    (hasSeveritySignal(messageOnly) ||
      hasAnyTerm(messageOnly, ["lombar", "spate", "urina", "urinare", "usturime"]))
  ) {
    return {
      intent: "urinary_kidney",
      confidence: "medium",
      matchedKeywords: ["selected_kidney_context"],
      whetherSelectedStructureMatchesIntent: selectedMatchesIntent(
        selectedMode,
        selectedTissue,
        ["organ", "organs"],
        "organs",
      ),
      suggestedRedirect: "organs",
    };
  }

  if (
    selectedStructureSuggestsAbdomen(selectedStructure) &&
    (hasSeveritySignal(messageOnly) || hasAnyTerm(messageOnly, ["greata", "varsaturi", "crampe"]))
  ) {
    return {
      intent: "abdominal_pain",
      confidence: "medium",
      matchedKeywords: ["selected_abdominal_context"],
      whetherSelectedStructureMatchesIntent: selectedMatchesIntent(
        selectedMode,
        selectedTissue,
        ["organ", "organs"],
        "organs",
      ),
      suggestedRedirect: "organs",
    };
  }

  if (hasAnyTerm(messageOnly, ["nu ma simt bine", "ma simt rau", "nu sunt bine", "not well"])) {
    return {
      intent: "unknown",
      confidence: "medium",
      matchedKeywords: ["vague_symptom"],
      whetherSelectedStructureMatchesIntent: true,
      suggestedRedirect: null,
    };
  }

  const hasPain = includesTerm(text, "durere") || includesTerm(text, "ma doare");
  return {
    intent: hasPain ? "musculoskeletal_pain" : "unknown",
    confidence: hasPain ? "low" : "low",
    matchedKeywords: hasPain ? ["durere"] : [],
    whetherSelectedStructureMatchesIntent: hasPain,
    suggestedRedirect: hasPain ? "musculoskeletal" : null,
  };
}

function yesNoQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
): TriageQuestion {
  return {
    id,
    labelRo,
    labelEn,
    promptRo,
    promptEn,
    answerKind: "yes_no",
    semantic: { answerKind: "boolean" },
  };
}

function evidenceQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
  expectedConcepts: SemanticConceptId[],
  answerKind: "boolean_with_evidence" | "any_of_concepts" = expectedConcepts.length > 1
    ? "any_of_concepts"
    : "boolean_with_evidence",
): TriageQuestion {
  return {
    ...yesNoQuestion(id, labelRo, labelEn, promptRo, promptEn),
    semantic: { answerKind, expectedConcepts },
    placeholder: conceptPlaceholder(expectedConcepts),
  };
}

function textQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
): TriageQuestion {
  return {
    id,
    labelRo,
    labelEn,
    promptRo,
    promptEn,
    answerKind: "text",
    semantic: { answerKind: "free_text_short" },
  };
}

function choiceQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
  options: TriageQuestion["options"],
): TriageQuestion {
  return {
    id,
    labelRo,
    labelEn,
    promptRo,
    promptEn,
    answerKind: "choice",
    options,
    semantic: { answerKind: "single_choice" },
  };
}

function severityQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
  options: TriageQuestion["options"],
): TriageQuestion {
  return {
    ...choiceQuestion(id, labelRo, labelEn, promptRo, promptEn, options),
    answerType: "pain_severity",
    semantic: { answerKind: "severity" },
  };
}

function durationQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
): TriageQuestion {
  return {
    ...textQuestion(id, labelRo, labelEn, promptRo, promptEn),
    answerType: "duration",
    semantic: { answerKind: "duration" },
  };
}

function traumaTriggerQuestion(
  id: string,
  labelRo: string,
  labelEn: string,
  promptRo: string,
  promptEn: string,
): TriageQuestion {
  return {
    id,
    labelRo,
    labelEn,
    promptRo,
    promptEn,
    answerKind: "choice",
    answerType: "trauma_trigger",
    semantic: { answerKind: "trauma_mechanism" },
    options: TRAUMA_TRIGGER_OPTIONS.map((option) => ({
      ...option,
      terms: [...option.terms],
    })),
  };
}

const ANATOMICAL_CONTEXT_QUESTIONS: Record<string, TriageQuestion> = {
  chestBreathingChange: evidenceQuestion(
    "chestBreathingChange",
    "Legătură cu respirația sau mișcarea",
    "Change with breathing or movement",
    "Durerea se modifică la inspirație profundă, tuse sau mișcarea trunchiului?",
    "Does the pain change with a deep breath, cough, or trunk movement?",
    ["breathing_change", "movement_or_posture_change"],
  ),
  chestLocalTenderness: evidenceQuestion(
    "chestLocalTenderness",
    "Sensibilitate locală",
    "Local tenderness",
    "Zona sternului sau toracelui este sensibilă când o atingi ușor?",
    "Is the stern or chest area tender when you touch it gently?",
    ["local_tenderness"],
  ),
  chestPressureOrBreathingDifficulty: evidenceQuestion(
    "chestPressureOrBreathingDifficulty",
    "Respirație dificilă sau presiune toracică",
    "Breathing difficulty or chest pressure",
    "Ai și respirație dificilă sau o senzație de presiune în piept?",
    "Do you also have difficulty breathing or a feeling of pressure in the chest?",
    ["breathing_difficulty", "chest_pressure"],
  ),
  spineMovement: {
    ...yesNoQuestion(
      "spineMovement",
      "Mișcarea coloanei",
      "Spine movement",
      "Poți mișca trunchiul sau gâtul aproape normal?",
      "Can you move your trunk or neck almost normally?",
    ),
    answerType: "movement_status",
  },
  spineNeurologicalSigns: evidenceQuestion(
    "spineNeurologicalSigns",
    "Semne neurologice",
    "Neurological signs",
    "Ai amorțeală, furnicături sau slăbiciune într-un braț ori picior?",
    "Do you have numbness, tingling, or weakness in an arm or leg?",
    ["numbness", "tingling", "weakness"],
  ),
  upperLimbJointMovement: {
    ...yesNoQuestion(
      "upperLimbJointMovement",
      "Mișcarea umărului și cotului",
      "Shoulder and elbow movement",
      "Poți mișca umărul și cotul aproape normal?",
      "Can you move your shoulder and elbow almost normally?",
    ),
    answerType: "movement_status",
  },
  upperLimbSwellingOrDeformity: evidenceQuestion(
    "upperLimbSwellingOrDeformity",
    "Umflare, vânătaie sau deformare",
    "Swelling, bruising, or deformity",
    "Ai observat umflare mare, vânătaie sau o poziție neobișnuită a brațului?",
    "Have you noticed major swelling, bruising, or an unusual arm position?",
    ["swelling", "bruising", "deformity"],
  ),
  upperLimbNeurologicalSigns: evidenceQuestion(
    "upperLimbNeurologicalSigns",
    "Sensibilitate și forță în braț",
    "Arm sensation and strength",
    "Ai amorțeală, furnicături sau slăbiciune în braț ori mână?",
    "Do you have numbness, tingling, or weakness in the arm or hand?",
    ["numbness", "tingling", "weakness"],
  ),
  lowerLimbWeightBearing: {
    ...yesNoQuestion(
      "lowerLimbWeightBearing",
      "Sprijin pe picior",
      "Weight bearing",
      "Poți sprijini greutatea pe picior și face câțiva pași?",
      "Can you put weight on the leg and take a few steps?",
    ),
    answerType: "movement_status",
  },
  lowerLimbSwellingOrDeformity: evidenceQuestion(
    "lowerLimbSwellingOrDeformity",
    "Umflare, vânătaie sau deformare",
    "Swelling, bruising, or deformity",
    "Ai observat umflare mare, vânătaie sau o poziție neobișnuită a piciorului?",
    "Have you noticed major swelling, bruising, or an unusual leg position?",
    ["swelling", "bruising", "deformity"],
  ),
  lowerLimbSensationOrCirculation: evidenceQuestion(
    "lowerLimbSensationOrCirculation",
    "Sensibilitate și circulație",
    "Sensation and circulation",
    "Ai amorțeală sau piciorul pare neobișnuit de rece ori palid?",
    "Do you have numbness, or does the foot seem unusually cold or pale?",
    ["numbness", "cold_limb", "pallor"],
  ),
  fingerConcernType: choiceQuestion(
    "fingerConcernType",
    "Tipul problemei la deget",
    "Type of finger concern",
    "Este o tăietură/rană, o durere în interiorul degetului sau ambele?",
    "Is this a cut/wound, pain inside the finger, or both?",
    [
      {
        value: "wound",
        labelRo: "tăietură sau rană",
        labelEn: "cut or wound",
        terms: ["taietura", "rana", "m am taiat", "cut", "wound"],
      },
      {
        value: "internal_pain",
        labelRo: "durere internă",
        labelEn: "internal pain",
        terms: ["durere interna", "ma doare in interior", "internal pain", "inside"],
      },
      {
        value: "both",
        labelRo: "ambele",
        labelEn: "both",
        terms: ["ambele", "si rana si durere", "both"],
      },
    ],
  ),
  fingerMovement: {
    ...yesNoQuestion(
      "fingerMovement",
      "Mișcarea degetului",
      "Finger movement",
      "Poți îndoi și întinde degetul aproape normal?",
      "Can you bend and straighten the finger almost normally?",
    ),
    answerType: "movement_status",
  },
  fingerSwellingOrDeformity: evidenceQuestion(
    "fingerSwellingOrDeformity",
    "Umflare sau deformare",
    "Swelling or deformity",
    "Degetul este mult umflat sau pare într-o poziție neobișnuită?",
    "Is the finger very swollen or in an unusual position?",
    ["swelling", "deformity"],
  ),
  fingerSensation: {
    ...yesNoQuestion(
      "fingerSensation",
      "Sensibilitatea degetului",
      "Finger sensation",
      "Simți degetul normal, fără amorțeală sau furnicături?",
      "Does the finger feel normal, without numbness or tingling?",
    ),
    answerType: "sensation_status",
  },
  toeWeightBearing: {
    ...yesNoQuestion(
      "toeWeightBearing",
      "Sprijin și mers",
      "Weight bearing and walking",
      "Poți sprijini piciorul și merge câțiva pași?",
      "Can you put weight on the foot and walk a few steps?",
    ),
    answerType: "movement_status",
  },
  toeSwellingOrBruising: evidenceQuestion(
    "toeSwellingOrBruising",
    "Umflare sau vânătaie",
    "Swelling or bruising",
    "Degetul este mult umflat sau învinețit?",
    "Is the toe very swollen or bruised?",
    ["swelling", "bruising"],
  ),
  toeShapeOrWound: evidenceQuestion(
    "toeShapeOrWound",
    "Poziție, rană sau unghie afectată",
    "Position, wound, or nail injury",
    "Degetul pare strâmb ori există o rană sau o unghie afectată?",
    "Does the toe look crooked, or is there a wound or nail injury?",
    ["deformity", "wound", "nail_injury"],
  ),
  toeSensationOrCirculation: evidenceQuestion(
    "toeSensationOrCirculation",
    "Sensibilitate și circulație",
    "Sensation and circulation",
    "Ai amorțeală sau degetul pare neobișnuit de rece ori palid?",
    "Is the toe numb, unusually cold, or pale?",
    ["numbness", "cold_limb", "pallor"],
  ),
  jointMovement: {
    ...yesNoQuestion(
      "jointMovement",
      "Mișcarea articulației",
      "Joint movement",
      "Poți mișca articulația aproape normal?",
      "Can you move the joint almost normally?",
    ),
    answerType: "movement_status",
  },
  jointSwellingOrInstability: evidenceQuestion(
    "jointSwellingOrInstability",
    "Umflare sau instabilitate",
    "Swelling or instability",
    "Articulația este umflată sau simți că nu este stabilă?",
    "Is the joint swollen, or does it feel unstable?",
    ["swelling", "instability"],
  ),
  muscleLoadChange: evidenceQuestion(
    "muscleLoadChange",
    "Durere la contracție sau întindere",
    "Pain with contraction or stretch",
    "Durerea crește când încordezi sau întinzi mușchiul?",
    "Does the pain increase when you contract or stretch the muscle?",
    ["pain_with_load"],
  ),
  deepMuscleMovementOrBreathingChange: evidenceQuestion(
    "deepMuscleMovementOrBreathingChange",
    "Legătură cu mișcarea sau respirația",
    "Change with movement or breathing",
    "Durerea se schimbă la mișcare profundă, postură sau respirație?",
    "Does the pain change with deep movement, posture, or breathing?",
    ["movement_or_posture_change", "breathing_change"],
  ),
};

const ANATOMICAL_CONTEXT_RED_FLAGS: RedFlagRule[] = [
  {
    questionId: "chestPressureOrBreathingDifficulty",
    values: ["yes"],
    flagRo: "respirație dificilă sau presiune toracică raportată",
    flagEn: "reported breathing difficulty or chest pressure",
    level: "medical_attention",
  },
  ...[
    "upperLimbSwellingOrDeformity",
    "lowerLimbSwellingOrDeformity",
    "fingerSwellingOrDeformity",
    "toeShapeOrWound",
  ].map<RedFlagRule>((questionId) => ({
    questionId,
    values: ["yes"],
    flagRo: "umflare importantă, deformare sau rană raportată",
    flagEn: "significant swelling, deformity, or wound reported",
    level: "medical_attention",
  })),
  ...[
    "spineNeurologicalSigns",
    "upperLimbNeurologicalSigns",
    "lowerLimbSensationOrCirculation",
    "toeSensationOrCirculation",
  ].map<RedFlagRule>((questionId) => ({
    questionId,
    values: ["yes"],
    flagRo: "sensibilitate, forță sau circulație percepută anormal",
    flagEn: "altered sensation, strength, or perceived circulation",
    level: "medical_attention",
  })),
  {
    questionId: "fingerSensation",
    values: ["altered", "no"],
    flagRo: "sensibilitate schimbată la deget",
    flagEn: "altered finger sensation",
    level: "medical_attention",
  },
];

export const TRIAGE_FLOWS: Record<MedicalIntent, TriageFlow> = {
  wound_cut: {
    id: "wound_cut",
    intent: "wound_cut",
    labelRo: "rană / tăietură",
    labelEn: "cut / wound",
    mismatchRo: "o rană la piele",
    mismatchEn: "a skin wound",
    introRo: "Pare o tăietură/rană. Ca să te orientez pas cu pas:",
    introEn: "This sounds like a cut/wound. To guide you step by step:",
    questions: [
      evidenceQuestion(
        "bleedingNow",
        "Sângerează acum",
        "Bleeding now",
        "Sângerează încă?",
        "Is it still bleeding?",
        ["bleeding"],
      ),
      {
        ...evidenceQuestion(
          "bleedingStopsWithPressure",
          "Se oprește la presiune",
          "Stops with pressure",
          "Se oprește la presiune?",
          "Does the bleeding stop with pressure?",
          ["bleeding_stopped"],
        ),
        skipWhen: (answers) => answers.bleedingNow === "no",
      },
      choiceQuestion(
        "depth",
        "Adâncime",
        "Depth",
        "Rana pare superficială sau adâncă?",
        "Does the wound look superficial or deep?",
        [
          {
            value: "superficial",
            labelRo: "superficială",
            labelEn: "superficial",
            terms: ["superficiala", "superficial", "putin", "mica", "scratch"],
          },
          {
            value: "deep",
            labelRo: "adâncă",
            labelEn: "deep",
            terms: ["adanca", "adanc", "profunda", "profund", "deep", "gaping"],
          },
        ],
      ),
      {
        ...yesNoQuestion(
          "movementNormal",
          "Mișcarea degetului",
          "Finger movement",
          "Poți mișca degetul normal?",
          "Can you move the finger normally?",
        ),
        answerType: "movement_status",
      },
      {
        ...yesNoQuestion(
          "sensationNormal",
          "Sensibilitatea vârfului",
          "Fingertip sensation",
          "Simți normal vârful degetului?",
          "Do you feel the fingertip normally?",
        ),
        answerType: "sensation_status",
        semantic: {
          answerKind: "sensation_status",
          storageMap: { normal: "yes", altered: "no" },
        },
      },
      evidenceQuestion(
        "dirtyObject",
        "Obiect murdar/ruginit",
        "Dirty/rusty object",
        "A fost cu obiect murdar/ruginit, ciob sau mușcătură?",
        "Was it caused by a dirty/rusty object, glass, or a bite?",
        ["dirty_object", "rust", "glass", "bite"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "bleedingStopsWithPressure",
        values: ["no"],
        flagRo: "sângerare care nu se oprește",
        flagEn: "bleeding that does not stop",
        level: "medical_attention",
      },
      {
        questionId: "depth",
        values: ["deep"],
        flagRo: "rană adâncă",
        flagEn: "deep wound",
        level: "medical_attention",
      },
      {
        questionId: "movementNormal",
        values: ["no"],
        flagRo: "mișcare limitată",
        flagEn: "limited movement",
        level: "medical_attention",
      },
      {
        questionId: "sensationNormal",
        values: ["no"],
        flagRo: "amorțeală sau sensibilitate schimbată",
        flagEn: "numbness or altered sensation",
        level: "medical_attention",
      },
      {
        questionId: "dirtyObject",
        values: ["yes"],
        flagRo: "obiect murdar/ruginit, ciob sau mușcătură",
        flagEn: "dirty/rusty object, glass, or bite",
        level: "watch",
      },
    ],
  },
  musculoskeletal_pain: {
    id: "musculoskeletal_pain",
    intent: "musculoskeletal_pain",
    labelRo: "durere musculo-scheletală",
    labelEn: "musculoskeletal pain",
    mismatchRo: "o problemă de os, mușchi sau articulație",
    mismatchEn: "a bone, muscle, or joint concern",
    introRo: "Vreau să clarific pe rând, fără diagnostic:",
    introEn: "I want to clarify this step by step, without diagnosis:",
    questions: [
      traumaTriggerQuestion(
        "trauma",
        "Traumă / efort",
        "Trauma / effort",
        "A apărut după căzătură, lovitură sau efort?",
        "Did it start after a fall, hit, or exertion?",
      ),
      choiceQuestion(
        "onset",
        "Debut",
        "Onset",
        "A început brusc sau treptat?",
        "Did it start suddenly or gradually?",
        [
          {
            value: "sudden",
            labelRo: "brusc",
            labelEn: "suddenly",
            terms: ["brusc", "dintr-o dată", "dintr o data", "suddenly"],
          },
          {
            value: "gradual",
            labelRo: "treptat",
            labelEn: "gradually",
            terms: ["treptat", "încet", "incet", "gradually"],
          },
        ],
      ),
      {
        ...yesNoQuestion(
          "movementLimitation",
          "Mișcare limitată",
          "Limited movement",
          "Poți mișca sau sprijini zona normal?",
          "Can you move or support the area normally?",
        ),
        answerType: "movement_status",
      },
      severityQuestion(
        "severity",
        "Intensitate",
        "Severity",
        "Durerea este usoara, moderata sau severa?",
        "Is the pain mild, moderate, or severe?",
        [
          { value: "mild", labelRo: "usoara", labelEn: "mild", terms: ["usoara", "mica", "mild"] },
          {
            value: "moderate",
            labelRo: "moderata",
            labelEn: "moderate",
            terms: ["moderata", "medie", "suportabila", "moderate"],
          },
          {
            value: "moderate_to_severe",
            labelRo: "spre severa",
            labelEn: "closer to severe",
            terms: ["spre severa", "destul de tare", "moderate to severe"],
          },
          {
            value: "severe",
            labelRo: "severa",
            labelEn: "severe",
            terms: ["severa", "foarte tare", "mare", "severe"],
          },
        ],
      ),
      evidenceQuestion(
        "associatedSigns",
        "Semne asociate",
        "Associated signs",
        "Ai observat umflătură, amorțeală sau vânătaie?",
        "Have you noticed swelling, numbness, or bruising?",
        ["swelling", "numbness", "bruising"],
      ),
      durationQuestion(
        "duration",
        "Durată",
        "Duration",
        "De cât timp simți durerea?",
        "How long have you had the pain?",
      ),
    ],
    redFlagRules: [
      {
        questionId: "movementLimitation",
        values: ["no"],
        flagRo: "nu poate mișca/sprijini zona normal",
        flagEn: "cannot move/support normally",
        level: "medical_attention",
      },
      {
        questionId: "associatedSigns",
        values: ["yes"],
        flagRo: "umflătură, amorțeală sau vânătaie",
        flagEn: "swelling, numbness, or bruising",
        level: "medical_attention",
      },
      {
        questionId: "severity",
        values: ["moderate_to_severe", "severe"],
        flagRo: "durere puternica",
        flagEn: "strong pain",
        level: "watch",
      },
    ],
  },
  trauma_fall_hit: {
    id: "trauma_fall_hit",
    intent: "trauma_fall_hit",
    labelRo: "căzătură / lovitură",
    labelEn: "fall / hit",
    mismatchRo: "o accidentare",
    mismatchEn: "an injury",
    introRo: "După o căzătură sau lovitură, verificăm întâi siguranța:",
    introEn: "After a fall or hit, safety comes first:",
    questions: [
      {
        ...yesNoQuestion(
          "movementLimitation",
          "Mișcare / sprijin",
          "Movement / support",
          "Poți mișca sau sprijini zona normal?",
          "Can you move or support the area normally?",
        ),
        answerType: "movement_status",
      },
      evidenceQuestion(
        "deformity",
        "Deformare",
        "Deformity",
        "Zona pare deformată?",
        "Does the area look deformed?",
        ["deformity"],
      ),
      severityQuestion(
        "severity",
        "Intensitate",
        "Severity",
        "Durerea este ușoară, moderată sau foarte puternică?",
        "Is the pain mild, moderate, or very strong?",
        [
          { value: "mild", labelRo: "ușoară", labelEn: "mild", terms: ["usoara", "putin", "mild"] },
          {
            value: "moderate",
            labelRo: "moderată",
            labelEn: "moderate",
            terms: ["moderata", "medie", "moderate"],
          },
          {
            value: "severe",
            labelRo: "foarte puternică",
            labelEn: "very strong",
            terms: ["foarte puternica", "severa", "insuportabil", "severe", "unbearable"],
          },
        ],
      ),
      {
        ...yesNoQuestion(
          "numbness",
          "Amorțeală",
          "Numbness",
          "Ai amorțeală sau slăbiciune?",
          "Do you have numbness or weakness?",
        ),
        answerType: "sensation_status",
        semantic: {
          answerKind: "sensation_status",
          storageMap: { normal: "no", altered: "yes" },
        },
      },
    ],
    redFlagRules: [
      {
        questionId: "movementLimitation",
        values: ["no"],
        flagRo: "nu poate mișca/sprijini zona",
        flagEn: "cannot move/support the area",
        level: "medical_attention",
      },
      {
        questionId: "deformity",
        values: ["yes"],
        flagRo: "deformare vizibilă",
        flagEn: "visible deformity",
        level: "medical_attention",
      },
      {
        questionId: "severity",
        values: ["severe"],
        flagRo: "durere foarte puternică",
        flagEn: "very strong pain",
        level: "watch",
      },
      {
        questionId: "numbness",
        values: ["yes"],
        flagRo: "amorțeală/slăbiciune",
        flagEn: "numbness/weakness",
        level: "medical_attention",
      },
    ],
  },
  burn: {
    id: "burn",
    intent: "burn",
    labelRo: "arsură",
    labelEn: "burn",
    mismatchRo: "o arsură la piele",
    mismatchEn: "a skin burn",
    introRo: "Pare o arsură la piele, nu o problemă de os:",
    introEn: "This sounds like a skin burn, not a bone problem:",
    questions: [
      evidenceQuestion(
        "blistersOrDeep",
        "Bășici / profunzime",
        "Blisters / depth",
        "Au apărut bășici sau arsura pare profundă?",
        "Are there blisters, or does the burn look deep?",
        ["blisters", "deep_injury"],
      ),
      textQuestion(
        "size",
        "Mărime",
        "Size",
        "Cam cât de mare este zona arsă?",
        "About how large is the burned area?",
      ),
      evidenceQuestion(
        "sensitiveArea",
        "Zonă sensibilă",
        "Sensitive area",
        "Este pe față, mână, articulație sau lângă ochi?",
        "Is it on the face, hand, joint, or near an eye?",
        ["sensitive_area"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "blistersOrDeep",
        values: ["yes"],
        flagRo: "bășici sau arsură profundă",
        flagEn: "blisters or deep burn",
        level: "medical_attention",
      },
      {
        questionId: "sensitiveArea",
        values: ["yes"],
        flagRo: "arsură pe zonă sensibilă",
        flagEn: "burn on sensitive area",
        level: "watch",
      },
    ],
  },
  numbness_weakness: {
    id: "numbness_weakness",
    intent: "numbness_weakness",
    labelRo: "amorțeală / slăbiciune",
    labelEn: "numbness / weakness",
    mismatchRo: "un simptom de sensibilitate sau forță",
    mismatchEn: "a sensation or strength symptom",
    introRo: "Amorțeala sau slăbiciunea merită clarificată rapid:",
    introEn: "Numbness or weakness needs quick clarification:",
    questions: [
      evidenceQuestion(
        "sudden",
        "Debut brusc",
        "Sudden onset",
        "A apărut brusc?",
        "Did it start suddenly?",
        ["sudden_onset"],
      ),
      evidenceQuestion(
        "oneSide",
        "O singură parte",
        "One side",
        "Este pe o singură parte a corpului?",
        "Is it on one side of the body?",
        ["one_side"],
      ),
      evidenceQuestion(
        "speechFace",
        "Vorbire/față",
        "Speech/face",
        "Ai probleme de vorbire, față căzută sau confuzie?",
        "Do you have speech trouble, facial droop, or confusion?",
        ["speech_trouble", "facial_droop", "confusion"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "sudden",
        values: ["yes"],
        flagRo: "debut brusc",
        flagEn: "sudden onset",
        level: "watch",
      },
      {
        questionId: "speechFace",
        values: ["yes"],
        flagRo: "vorbire/față/confuzie afectată",
        flagEn: "speech/face/confusion affected",
        level: "urgent",
      },
    ],
  },
  abdominal_pain: {
    id: "abdominal_pain",
    intent: "abdominal_pain",
    labelRo: "durere abdominală",
    labelEn: "abdominal pain",
    mismatchRo: "un simptom abdominal",
    mismatchEn: "an abdominal symptom",
    introRo: "Pentru durerea abdominală, începem cu localizarea:",
    introEn: "For abdominal pain, we start with location:",
    questions: [
      textQuestion(
        "location",
        "Localizare",
        "Location",
        "Unde doare cel mai tare?",
        "Where does it hurt the most?",
      ),
      severityQuestion(
        "severity",
        "Intensitate",
        "Severity",
        "Durerea este ușoară, moderată sau foarte puternică?",
        "Is the pain mild, moderate, or very strong?",
        [
          { value: "mild", labelRo: "ușoară", labelEn: "mild", terms: ["usoara", "mild"] },
          {
            value: "moderate",
            labelRo: "moderată",
            labelEn: "moderate",
            terms: ["moderata", "medie", "moderate"],
          },
          {
            value: "severe",
            labelRo: "foarte puternică",
            labelEn: "very strong",
            terms: ["tare", "foarte tare", "severa", "severe", "unbearable"],
          },
        ],
      ),
      evidenceQuestion(
        "feverVomiting",
        "Febră/vărsături",
        "Fever/vomiting",
        "Ai febră sau vărsături persistente?",
        "Do you have fever or persistent vomiting?",
        ["fever", "vomiting"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "severity",
        values: ["severe"],
        flagRo: "durere abdominală foarte puternică",
        flagEn: "very strong abdominal pain",
        level: "watch",
      },
      {
        questionId: "feverVomiting",
        values: ["yes"],
        flagRo: "febră sau vărsături persistente",
        flagEn: "fever or persistent vomiting",
        level: "medical_attention",
      },
    ],
  },
  chest_pain: {
    id: "chest_pain",
    intent: "chest_pain",
    labelRo: "durere în piept",
    labelEn: "chest pain",
    mismatchRo: "un simptom toracic",
    mismatchEn: "a chest symptom",
    introRo: "Durerea în piept poate necesita atenție rapidă:",
    introEn: "Chest pain may need prompt attention:",
    urgentRo: "Asta poate necesita ajutor medical rapid. Santix nu poate evalua urgențe.",
    urgentEn: "This may need prompt medical help. Santix cannot assess emergencies.",
    questions: [
      evidenceQuestion(
        "breathingNow",
        "Respirație dificilă",
        "Breathing difficulty",
        "Respiri greu acum?",
        "Are you having trouble breathing now?",
        ["breathing_difficulty"],
      ),
      evidenceQuestion(
        "faintingConfusion",
        "Leșin/confuzie",
        "Fainting/confusion",
        "Ai leșin, confuzie sau transpirații reci?",
        "Do you have fainting, confusion, or cold sweats?",
        ["fainting", "confusion", "cold_sweats"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "breathingNow",
        values: ["yes"],
        flagRo: "dificultate de respirație",
        flagEn: "breathing difficulty",
        level: "urgent",
      },
      {
        questionId: "faintingConfusion",
        values: ["yes"],
        flagRo: "leșin/confuzie/transpirații reci",
        flagEn: "fainting/confusion/cold sweats",
        level: "urgent",
      },
    ],
  },
  breathing_problem: {
    id: "breathing_problem",
    intent: "breathing_problem",
    labelRo: "respirație dificilă",
    labelEn: "breathing problem",
    mismatchRo: "un simptom respirator",
    mismatchEn: "a breathing symptom",
    introRo: "Respirația dificilă este un semn important:",
    introEn: "Breathing difficulty is important:",
    urgentRo: "Asta poate necesita ajutor medical rapid. Santix nu poate evalua urgențe.",
    urgentEn: "This may need prompt medical help. Santix cannot assess emergencies.",
    questions: [
      evidenceQuestion(
        "atRest",
        "În repaus",
        "At rest",
        "Respiri greu și în repaus?",
        "Is breathing difficult even at rest?",
        ["breathing_at_rest"],
      ),
      evidenceQuestion(
        "blueLipsConfusion",
        "Buze/confuzie",
        "Lips/confusion",
        "Ai buze albăstrui, leșin sau confuzie?",
        "Do you have blue lips, fainting, or confusion?",
        ["blue_lips", "fainting", "confusion"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "atRest",
        values: ["yes"],
        flagRo: "respirație dificilă în repaus",
        flagEn: "breathing difficulty at rest",
        level: "urgent",
      },
      {
        questionId: "blueLipsConfusion",
        values: ["yes"],
        flagRo: "buze albăstrui/leșin/confuzie",
        flagEn: "blue lips/fainting/confusion",
        level: "urgent",
      },
    ],
  },
  headache_neuro: {
    id: "headache_neuro",
    intent: "headache_neuro",
    labelRo: "simptom neurologic / durere de cap",
    labelEn: "neurological symptom / headache",
    mismatchRo: "un simptom neurologic",
    mismatchEn: "a neurological symptom",
    introRo: "Pentru simptome neurologice, verificăm întâi debutul:",
    introEn: "For neurological symptoms, first clarify onset:",
    questions: [
      evidenceQuestion(
        "suddenSevere",
        "Brusc/sever",
        "Sudden/severe",
        "A apărut brusc și foarte intens?",
        "Did it start suddenly and very intensely?",
        ["sudden_onset", "severe_intensity"],
      ),
      evidenceQuestion(
        "confusionWeakness",
        "Confuzie/slăbiciune",
        "Confusion/weakness",
        "Ai confuzie, slăbiciune sau tulburări de vorbire?",
        "Do you have confusion, weakness, or speech trouble?",
        ["confusion", "weakness", "speech_trouble"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "suddenSevere",
        values: ["yes"],
        flagRo: "debut brusc și intens",
        flagEn: "sudden intense onset",
        level: "urgent",
      },
      {
        questionId: "confusionWeakness",
        values: ["yes"],
        flagRo: "confuzie/slăbiciune/vorbire afectată",
        flagEn: "confusion/weakness/speech affected",
        level: "urgent",
      },
    ],
  },
  digestive_symptom: {
    id: "digestive_symptom",
    intent: "digestive_symptom",
    labelRo: "simptom digestiv",
    labelEn: "digestive symptom",
    mismatchRo: "un simptom digestiv",
    mismatchEn: "a digestive symptom",
    introRo: "Pentru simptome digestive, clarificăm severitatea:",
    introEn: "For digestive symptoms, clarify severity:",
    questions: [
      evidenceQuestion(
        "persistentVomiting",
        "Vărsături persistente",
        "Persistent vomiting",
        "Ai vărsături persistente?",
        "Do you have persistent vomiting?",
        ["vomiting"],
      ),
      durationQuestion(
        "duration",
        "Durată",
        "Duration",
        "De cât timp se întâmplă?",
        "How long has this been happening?",
      ),
    ],
    redFlagRules: [
      {
        questionId: "persistentVomiting",
        values: ["yes"],
        flagRo: "vărsături persistente",
        flagEn: "persistent vomiting",
        level: "medical_attention",
      },
    ],
  },
  urinary_kidney: {
    id: "urinary_kidney",
    intent: "urinary_kidney",
    labelRo: "rinichi / aparat urinar",
    labelEn: "kidney / urinary symptom",
    mismatchRo: "un simptom urinar sau renal",
    mismatchEn: "a kidney or urinary symptom",
    introRo: "Pentru zona rinichilor, conteaza simptomele urinare sau febra:",
    introEn: "For the kidney area, urinary symptoms or fever matter:",
    questions: [
      severityQuestion(
        "severity",
        "Intensitate",
        "Severity",
        "Durerea este usoara, moderata sau spre severa?",
        "Is the pain mild, moderate, or closer to severe?",
        [
          { value: "mild", labelRo: "usoara", labelEn: "mild", terms: ["usoara", "usor", "mild"] },
          {
            value: "moderate",
            labelRo: "moderata",
            labelEn: "moderate",
            terms: ["moderata", "moderat", "medie", "suportabila", "suportabil", "moderate"],
          },
          {
            value: "moderate_to_severe",
            labelRo: "spre severa",
            labelEn: "closer to severe",
            terms: ["spre severa", "destul de tare", "destul tare", "moderate to severe"],
          },
          {
            value: "severe",
            labelRo: "severa",
            labelEn: "severe",
            terms: ["severa", "sever", "tare", "foarte tare", "mare", "very bad", "severe"],
          },
        ],
      ),
      evidenceQuestion(
        "feverChillsBurning",
        "Febra/frisoane/usturime",
        "Fever/chills/burning",
        "Ai febra, frisoane sau usturime la urinare?",
        "Do you have fever, chills, or burning when urinating?",
        ["fever", "chills", "burning_urination"],
      ),
      evidenceQuestion(
        "bloodUrine",
        "Sânge în urină",
        "Blood in urine",
        "Ai observat sânge în urină?",
        "Have you noticed blood in urine?",
        ["blood_in_urine"],
      ),
      evidenceQuestion(
        "nauseaCannotUrinate",
        "Greata/urinare blocata",
        "Nausea/cannot urinate",
        "Ai greata puternica, varsaturi sau nu poti urina?",
        "Do you have strong nausea, vomiting, or trouble urinating?",
        ["nausea", "vomiting", "cannot_urinate"],
      ),
    ],
    redFlagRules: [
      {
        questionId: "severity",
        values: ["moderate_to_severe", "severe"],
        flagRo: "durere spre severa",
        flagEn: "pain closer to severe",
        level: "watch",
      },
      {
        questionId: "feverChillsBurning",
        values: ["yes"],
        flagRo: "febra/frisoane/usturime la urinare",
        flagEn: "fever/chills/burning when urinating",
        level: "medical_attention",
      },
      {
        questionId: "bloodUrine",
        values: ["yes"],
        flagRo: "sânge în urină",
        flagEn: "blood in urine",
        level: "medical_attention",
      },
      {
        questionId: "nauseaCannotUrinate",
        values: ["yes"],
        flagRo: "varsaturi sau urinare blocata",
        flagEn: "vomiting or trouble urinating",
        level: "medical_attention",
      },
    ],
  },
  unknown: {
    id: "unknown",
    intent: "unknown",
    labelRo: "mesaj neclar",
    labelEn: "unclear message",
    mismatchRo: "un simptom neclar",
    mismatchEn: "an unclear symptom",
    introRo: "Ca să te pot ghida corect:",
    introEn: "To guide you correctly:",
    questions: [
      textQuestion(
        "mainConcern",
        "Problema principală",
        "Main concern",
        "Ce simți cel mai clar: durere, rană, arsură, amorțeală sau alt simptom?",
        "What do you feel most clearly: pain, wound, burn, numbness, or another symptom?",
      ),
    ],
    redFlagRules: [],
  },
};

function flowForIntent(intent: MedicalIntent) {
  return TRIAGE_FLOWS[intent] ?? TRIAGE_FLOWS.unknown;
}

function questionLabels(questions: TriageQuestion[]) {
  return Object.fromEntries(
    questions.map((question) => [question.id, { ro: question.promptRo, en: question.promptEn }]),
  );
}

function contextQuestionsForState(state: GenericTriageState) {
  const flow = flowForIntent(state.activeFlow);
  const available = new Map(
    [...flow.questions, ...Object.values(ANATOMICAL_CONTEXT_QUESTIONS)].map((question) => [
      question.id,
      question,
    ]),
  );
  const ids = state.questionPlan?.questionIds ?? flow.questions.map((question) => question.id);
  return ids
    .map((id) => available.get(id))
    .filter((question): question is TriageQuestion => Boolean(question));
}

function buildStateAnatomicalContext(context: SelectionContext): AnatomicalContext {
  return buildAnatomicalContext({
    structureId: context.selectedStructureId,
    displayName: context.selectedStructure,
    technicalName: context.technicalStructureName,
    tissue: context.selectedTissue,
    bodyRegion: context.bodyRegion,
  });
}

function ensureQuestionPlan(
  state: GenericTriageState,
  context?: SelectionContext,
): GenericTriageState {
  const flow = flowForIntent(state.activeFlow);
  const anatomicalContext =
    state.anatomicalContext ??
    buildStateAnatomicalContext(
      context ?? {
        selectedStructure: state.selectedStructure,
        selectedStructureId: state.selectedStructureId,
        selectedMode: state.selectedMode,
        selectedTissue: state.selectedMode,
      },
    );
  const questionPlan =
    state.questionPlan?.activeFlow === state.activeFlow
      ? state.questionPlan
      : buildQuestionPlan({
          activeFlow: state.activeFlow,
          anatomicalContext,
          initialMessage: state.originalProblem ?? "",
          existingAnswers: state.answers,
          availableQuestionIds: flow.questions.map((question) => question.id),
        });
  state.anatomicalContext = anatomicalContext;
  state.questionPlan = questionPlan;
  return state;
}

function conversationQuestionType(question: TriageQuestion): ConversationQuestionType {
  const type = questionAnswerType(question);
  if (type === "pain_severity") return "severity";
  if (type === "choice") return "single_choice";
  if (type === "text") return "free_text_short";
  return type;
}

function conversationQuestionSemantic(question: TriageQuestion): QuestionSemanticMetadata {
  if (question.answerType === "movement_status") {
    return { ...question.semantic, answerKind: "movement_status" };
  }
  if (question.answerType === "sensation_status") {
    return { ...question.semantic, answerKind: "sensation_status" };
  }
  if (question.answerType === "trauma_trigger") {
    return { ...question.semantic, answerKind: "trauma_mechanism" };
  }
  if (question.answerType === "duration") {
    return { ...question.semantic, answerKind: "duration" };
  }
  if (question.answerType === "pain_severity") {
    return { ...question.semantic, answerKind: "severity" };
  }
  if (question.answerType === "depth_or_intensity") {
    return { ...question.semantic, answerKind: "single_choice" };
  }
  return (
    question.semantic ?? {
      answerKind:
        question.answerKind === "yes_no"
          ? "boolean"
          : question.answerKind === "choice"
            ? "single_choice"
            : "free_text_short",
    }
  );
}

function toConversationQuestion(question: TriageQuestion): ConversationQuestionDefinition {
  const semantic = conversationQuestionSemantic(question);
  const expectedConcepts = (semantic.expectedConcepts ?? []).filter(
    (concept): concept is SemanticConceptId => Boolean(concept),
  );
  return {
    id: question.id,
    type: conversationQuestionType(question),
    answerKey: question.id,
    text: { ro: question.promptRo, en: question.promptEn },
    required: true,
    options: question.options,
    semantic,
    placeholder: question.placeholder ?? conceptPlaceholder(expectedConcepts),
  };
}

export function createGenericTriageState(
  detection: MedicalIntentDetection,
  context: SelectionContext,
  originalProblem: string,
): GenericTriageState {
  const flow = flowForIntent(detection.intent);
  const answers: Record<string, string> = {};
  const anatomicalContext = buildStateAnatomicalContext(context);
  const plan = buildQuestionPlan({
    activeFlow: flow.id,
    anatomicalContext,
    initialMessage: originalProblem,
    existingAnswers: answers,
    availableQuestionIds: flow.questions.map((question) => question.id),
  });
  const questionMap = new Map(
    [...flow.questions, ...Object.values(ANATOMICAL_CONTEXT_QUESTIONS)].map((question) => [
      question.id,
      question,
    ]),
  );
  const questions = plan.questionIds
    .map((id) => questionMap.get(id))
    .filter((question): question is TriageQuestion => Boolean(question))
    .filter((question) => !question.skipWhen?.(answers));
  const totalSteps = flow.id === "wound_cut" ? 5 : Math.max(1, questions.length);
  const state: GenericTriageState = {
    version: CONVERSATION_STATE_VERSION,
    conversationId: null,
    requestId: null,
    revision: 0,
    activeFlow: flow.id,
    detectedIntent: detection.intent,
    messageIntent:
      detection.intent === "wound_cut" ||
      detection.intent === "burn" ||
      detection.intent === "trauma_fall_hit"
        ? "injury_report"
        : detection.intent === "unknown"
          ? "unclear"
          : "symptom_report",
    selectedStructureId: context.selectedStructureId ?? null,
    selectedStructure: context.selectedStructure,
    selectedStructureName: context.selectedStructure,
    selectedMode: context.selectedMode ?? context.selectedTissue ?? "unknown",
    anatomicalContext,
    questionPlan: plan,
    originalProblem: originalProblem.trim() || null,
    intentConfidence: detection.confidence,
    matchedKeywords: detection.matchedKeywords,
    whetherSelectedStructureMatchesIntent: detection.whetherSelectedStructureMatchesIntent,
    suggestedRedirect: detection.suggestedRedirect,
    answers,
    questionLabels: questionLabels(questions),
    normalizedAnswers: {},
    redFlags: [],
    redFlagLevel: "none",
    currentQuestionId: questions[0]?.id ?? null,
    currentQuestionType: questions[0] ? conversationQuestionType(questions[0]) : null,
    currentQuestionPlaceholder: questions[0]
      ? (toConversationQuestion(questions[0]).placeholder ?? null)
      : null,
    phase: questions.length ? "collecting" : "ready_for_summary",
    completedQuestionIds: [],
    completedQuestions: [],
    step: 1,
    totalSteps,
    isReadyForSummary: questions.length === 0,
    summaryFinalized: false,
    canGeneratePdf: false,
    redirectNoticeShown: false,
    needsCurrentQuestionClarification: false,
    clarification: null,
    lastAnswerAcknowledgementRo: null,
    lastAnswerAcknowledgementEn: null,
  };
  return updateGenericTriageProgress(state);
}

type ContextualShortAnswer = "yes" | "no" | "unknown" | null;

export function normalizeContextualShortAnswer(text: string): ContextualShortAnswer {
  const normalized = normalize(text);
  if (
    [
      "nu stiu",
      "nu stiu sigur",
      "nush",
      "habar n am",
      "habar nu am",
      "nu sunt sigur",
      "nu sunt sigura",
      "posibil",
      "not sure",
      "i don t know",
      "i dont know",
    ].some((term) => includesTerm(normalized, term))
  ) {
    return "unknown";
  }
  if (
    [
      "nu",
      "nu cred",
      "cred ca nu",
      "no",
      "nope",
      "nup",
      "nah",
      "fara",
      "deloc",
      "niciunul",
      "niciunu",
      "niciuna",
      "nici una",
      "niciun",
      "nicio",
      "cu niciunu",
      "cu niciunul",
      "nu pot",
      "nu se opreste",
      "nu simt",
      "none",
      "neither",
    ].some((term) => includesTerm(normalized, term))
  ) {
    return "no";
  }
  if (
    [
      "da",
      "dap",
      "cam da",
      "cred ca da",
      "probabil da",
      "yes",
      "yeah",
      "probably yes",
      "pot",
      "normal",
      "se opreste",
      "simt normal",
    ].some((term) => includesTerm(normalized, term))
  ) {
    return "yes";
  }
  return null;
}

function questionAnswerType(question: TriageQuestion): TriageQuestionKind {
  if (question.answerType) return question.answerType;
  if (question.semantic?.answerKind === "severity") return "pain_severity";
  if (question.semantic?.answerKind === "duration") return "duration";
  if (question.semantic?.answerKind === "movement_status") return "movement_status";
  if (question.semantic?.answerKind === "sensation_status") return "sensation_status";
  if (question.semantic?.answerKind === "trauma_mechanism") return "trauma_trigger";
  return question.answerKind;
}

function acknowledged(value: string, acknowledgementRo: string, acknowledgementEn: string) {
  return { value, acknowledgementRo, acknowledgementEn };
}

function normalizePainSeverityAnswer(message: string): NormalizedQuestionAnswer | null {
  const normalized = normalize(message);
  const contextualAnswer = normalizeContextualShortAnswer(message);
  if (contextualAnswer === "unknown") {
    return acknowledged(
      "unknown",
      "Am notat că intensitatea nu este clară.",
      "I noted that the intensity is unclear.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "spre severa",
      "spre sever",
      "destul de tare",
      "destul tare",
      "destul de puternica",
      "destul de puternic",
      "cam severa",
      "aproape severa",
      "pretty bad",
      "quite bad",
      "moderate to severe",
    ])
  ) {
    return acknowledged(
      "moderate_to_severe",
      "Am notat că durerea este destul de puternică.",
      "I noted the pain as fairly strong.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "severa",
      "sever",
      "foarte tare",
      "foarte puternica",
      "foarte puternic",
      "mare",
      "insuportabila",
      "insuportabil",
      "very bad",
      "very strong",
      "severe",
      "unbearable",
    ])
  ) {
    return acknowledged("severe", "Am notat durerea ca severă.", "I noted the pain as severe.");
  }
  if (
    hasAnyTerm(normalized, [
      "moderata",
      "moderat",
      "medie",
      "mijlocie",
      "suportabila",
      "suportabil",
      "moderate",
      "medium",
      "manageable",
      "bearable",
    ])
  ) {
    return acknowledged(
      "moderate",
      "Am notat durerea ca moderată.",
      "I noted the pain as moderate.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "usoara",
      "usor",
      "mica",
      "mic",
      "putin",
      "mild",
      "light",
      "slight",
      "a little",
      "a bit",
    ])
  ) {
    return acknowledged("mild", "Am notat durerea ca ușoară.", "I noted the pain as mild.");
  }
  return null;
}

function normalizeDepthOrIntensityAnswer(message: string): NormalizedQuestionAnswer | null {
  const normalized = normalize(message);
  const contextualAnswer = normalizeContextualShortAnswer(message);
  if (contextualAnswer === "unknown") {
    return acknowledged(
      "unknown",
      "Am notat că profunzimea nu este clară.",
      "I noted that the depth is unclear.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "nu pare adanca",
      "nu e adanca",
      "nu este adanca",
      "superficiala",
      "superficial",
      "la suprafata",
      "zgarietura",
      "scratch",
    ])
  ) {
    return acknowledged(
      "superficial",
      "Am notat că pare superficială.",
      "I noted it as superficial.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "adanca",
      "adanc",
      "pare adanca",
      "profunda",
      "profund",
      "deep",
      "gaping",
    ])
  ) {
    return acknowledged("deep", "Am notat că pare adâncă.", "I noted it as deep.");
  }
  return null;
}

function normalizeMovementStatusAnswer(message: string): NormalizedQuestionAnswer | null {
  const normalized = normalize(message);
  const contextualAnswer = normalizeContextualShortAnswer(message);
  if (contextualAnswer === "unknown") {
    return acknowledged(
      "unknown",
      "Am notat că mișcarea nu este clară.",
      "I noted that movement is unclear.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "nu pot misca",
      "nu pot sa misc",
      "nu pot folosi",
      "nu pot sprijini",
      "nu se misca",
      "deloc",
      "can't move",
      "cannot move",
      "can't use",
      "cannot use",
    ])
  ) {
    return acknowledged(
      "no",
      "Am notat că nu poți mișca sau folosi normal zona.",
      "I noted that you cannot move or use the area normally.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "partial",
      "partial",
      "putin",
      "ma doare cand misc",
      "doare cand misc",
      "ma doare la miscare",
      "pain when moving",
      "hurts when moving",
    ])
  ) {
    return acknowledged(
      "partial",
      "Am notat că mișcarea este parțial afectată.",
      "I noted that movement is partially affected.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "pot misca",
      "pot sa misc",
      "misc normal",
      "miscarea e normala",
      "miscarea este normala",
      "pot sprijini",
      "normal",
      "can move",
      "move normally",
    ]) ||
    contextualAnswer === "yes"
  ) {
    return acknowledged(
      "yes",
      "Am notat că poți mișca zona normal.",
      "I noted that you can move the area normally.",
    );
  }
  if (contextualAnswer === "no") {
    return acknowledged(
      "no",
      "Am notat că nu poți mișca sau folosi normal zona.",
      "I noted that you cannot move or use the area normally.",
    );
  }
  return null;
}

function normalizeSensationStatusAnswer(
  question: TriageQuestion,
  message: string,
): NormalizedQuestionAnswer | null {
  const normalized = normalize(message);
  const contextualAnswer = normalizeContextualShortAnswer(message);
  const asksNormalSensation = question.semantic?.storageMap?.altered === "no";
  if (contextualAnswer === "unknown") {
    return acknowledged(
      "unknown",
      "Am notat că sensibilitatea nu este clară.",
      "I noted that sensation is unclear.",
    );
  }
  if (
    hasAnyTerm(normalized, [
      "simt normal",
      "simt bine",
      "sensibilitate normala",
      "normal sensation",
      "feels normal",
    ]) ||
    contextualAnswer === "yes"
  ) {
    return asksNormalSensation
      ? acknowledged("yes", "Am notat că simți normal.", "I noted normal sensation.")
      : acknowledged("no", "Am notat că nu ai amorțeală.", "I noted no numbness.");
  }
  if (
    hasAnyTerm(normalized, [
      "amortit",
      "amorteala",
      "furnicaturi",
      "nu simt bine",
      "nu simt",
      "simt ciudat",
      "numb",
      "numbness",
      "tingling",
    ]) ||
    contextualAnswer === "no"
  ) {
    return asksNormalSensation
      ? acknowledged("no", "Am notat sensibilitate schimbată.", "I noted changed sensation.")
      : acknowledged("yes", "Am notat amorțeală sau furnicături.", "I noted numbness or tingling.");
  }
  return null;
}

function normalizeDurationAnswer(message: string): NormalizedQuestionAnswer | null {
  const normalized = normalize(message);
  if (!normalized) return null;
  if (
    hasAnyTerm(normalized, [
      "azi",
      "astazi",
      "de ieri",
      "ieri",
      "de cateva zile",
      "cateva zile",
      "de o saptamana",
      "o saptamana",
      "brusc",
      "treptat",
      "today",
      "yesterday",
      "few days",
      "one week",
      "suddenly",
      "gradually",
    ]) ||
    /\b(de )?\d+\s*(ore|ora|zile|zi|saptamani|saptamana|luni|minute|hours?|days?|weeks?)\b/.test(
      normalized,
    )
  ) {
    return acknowledged(message.trim().slice(0, 120), "Am notat durata.", "I noted the duration.");
  }
  return null;
}

export function normalizeAnswerForQuestion(
  question: TriageQuestion,
  message: string,
): NormalizedQuestionAnswer | null {
  const normalized = normalizeConversationAnswer(toConversationQuestion(question), message, "ro");
  if (normalized.status !== "valid") return null;
  const value = normalized.storageValue ?? String(normalized.normalizedValue ?? "unknown");
  return acknowledged(
    value,
    normalized.acknowledgement?.ro ?? "Am notat răspunsul.",
    normalized.acknowledgement?.en ?? "I noted the answer.",
  );
}

function applyRedFlags(state: GenericTriageState) {
  const flow = flowForIntent(state.activeFlow);
  const flags: string[] = [];
  let level: TriageRedFlagLevel = "none";

  if (state.detectedIntent === "breathing_problem") {
    flags.push("simptom care poate necesita ajutor medical rapid");
    level = "urgent";
  }

  for (const rule of [...flow.redFlagRules, ...ANATOMICAL_CONTEXT_RED_FLAGS]) {
    const answer = state.answers[rule.questionId];
    if (!answer || !rule.values.includes(answer)) continue;
    flags.push(rule.flagRo);
    level = strongerRedFlagLevel(level, rule.level);
  }

  if (
    state.activeFlow === "numbness_weakness" &&
    state.answers.sudden === "yes" &&
    (state.answers.oneSide === "yes" || state.answers.speechFace === "yes")
  ) {
    flags.push("amorțeală/slăbiciune bruscă cu semn neurologic asociat");
    level = strongerRedFlagLevel(level, "urgent");
  }

  if (
    state.activeFlow === "urinary_kidney" &&
    state.answers.severity === "severe" &&
    (state.answers.feverChillsBurning === "yes" ||
      state.answers.bloodUrine === "yes" ||
      state.answers.nauseaCannotUrinate === "yes")
  ) {
    flags.push("durere renală puternică cu simptom asociat");
    level = strongerRedFlagLevel(level, "medical_attention");
  }

  state.redFlags = unique(flags);
  if (
    state.activeFlow === "urinary_kidney" &&
    state.answers.severity &&
    level === "none" &&
    !state.isReadyForSummary
  ) {
    level = "needs_more_info";
  }
  state.redFlagLevel = state.redFlags.length || level === "needs_more_info" ? level : "none";
}

function updateGenericTriageProgress(state: GenericTriageState) {
  ensureQuestionPlan(state);
  const flow = flowForIntent(state.activeFlow);
  const questions = contextQuestionsForState(state).filter(
    (question) => !question.skipWhen?.(state.answers),
  );
  state.questionLabels = questionLabels(questions);
  state.totalSteps = flow.id === "wound_cut" ? 5 : Math.max(1, questions.length);
  const answeredQuestionIds = questions
    .filter((question) => state.answers[toConversationQuestion(question).answerKey] !== undefined)
    .map((question) => question.id);
  state.completedQuestionIds = unique([
    ...state.completedQuestionIds.filter((id) => questions.some((question) => question.id === id)),
    ...answeredQuestionIds,
  ]);
  state.completedQuestions = [...state.completedQuestionIds];
  state.currentQuestionId =
    questions.find((question) => !state.completedQuestionIds.includes(question.id))?.id ?? null;
  const currentQuestion = questions.find((question) => question.id === state.currentQuestionId);
  state.currentQuestionType = currentQuestion ? conversationQuestionType(currentQuestion) : null;
  state.currentQuestionPlaceholder = currentQuestion
    ? (toConversationQuestion(currentQuestion).placeholder ?? null)
    : null;
  state.isReadyForSummary = !state.currentQuestionId;
  state.phase = state.isReadyForSummary
    ? state.summaryFinalized
      ? "completed"
      : "ready_for_summary"
    : state.clarification?.questionId === state.currentQuestionId
      ? "clarifying_current_answer"
      : "collecting";
  state.canGeneratePdf = state.summaryFinalized;
  state.step = state.isReadyForSummary
    ? state.totalSteps
    : Math.min(state.totalSteps, state.completedQuestionIds.length + 1);
  applyRedFlags(state);
  return state;
}

function applySupplementalAnswerSignals(
  state: GenericTriageState,
  message: string,
  locale: "ro" | "en" = "ro",
) {
  let progressed = updateGenericTriageProgress(state);
  const questions = contextQuestionsForState(progressed);

  for (const question of questions) {
    if (progressed.completedQuestionIds.includes(question.id)) continue;
    const definition = toConversationQuestion(question);
    if (definition.semantic?.answerKind === "free_text_short") continue;
    const normalization = normalizeConversationAnswer(definition, message, locale);
    if (
      normalization.status !== "valid" ||
      normalization.confidence < 0.8 ||
      normalization.detectedConcepts.length === 0 ||
      normalization.storageValue === "unknown"
    ) {
      continue;
    }
    progressed = updateGenericTriageProgress(
      processActiveQuestionAnswer({
        state: progressed,
        question: definition,
        message,
        locale,
      }).state,
    );
  }

  return progressed;
}

export function applyMessageToTriageState(
  current: GenericTriageState | null | undefined,
  message: string,
  context: SelectionContext,
) {
  const restored = validateConversationState(current, {
    selectedStructure: context.selectedStructure,
    selectedStructureId: context.selectedStructureId,
    selectedMode: context.selectedMode ?? context.selectedTissue,
  });
  if (restored) ensureQuestionPlan(restored, context);

  if (restored?.currentQuestionId && !isExplicitConversationTopicChange(message)) {
    const questions = contextQuestionsForState(restored);
    const question = questions.find((item) => item.id === restored.currentQuestionId);
    if (!question) return updateGenericTriageProgress(restored);
    const transition = processActiveQuestionAnswer({
      state: restored,
      question: toConversationQuestion(question),
      message,
      locale: "ro",
    });
    return transition.answered
      ? applySupplementalAnswerSignals(transition.state, message, "ro")
      : updateGenericTriageProgress(transition.state);
  }

  if (restored && !isExplicitConversationTopicChange(message)) {
    return updateGenericTriageProgress(restored);
  }

  const detection = detectMedicalIntent(
    message,
    context.selectedStructure,
    context.selectedMode ?? "",
    context.selectedTissue ?? "",
  );
  if (detection.confidence === "low" && detection.intent === "unknown") return restored;
  const created = createGenericTriageState(detection, context, message);
  const question = contextQuestionsForState(created).find(
    (item) => item.id === created.currentQuestionId,
  );
  if (!question) return created;
  const conversationQuestion = toConversationQuestion(question);
  if (conversationQuestion.type === "free_text_short") {
    return applySupplementalAnswerSignals(created, message, "ro");
  }
  const initialNormalization = normalizeConversationAnswer(conversationQuestion, message, "ro");
  if (initialNormalization.status !== "valid") {
    return applySupplementalAnswerSignals(created, message, "ro");
  }
  const transition = processActiveQuestionAnswer({
    state: created,
    question: conversationQuestion,
    message,
    locale: "ro",
  });
  return applySupplementalAnswerSignals(transition.state, message, "ro");
}

export function getTriageQuestion(state: GenericTriageState, lang: "ro" | "en") {
  ensureQuestionPlan(state);
  const question = contextQuestionsForState(state).find(
    (item) => item.id === state.currentQuestionId,
  );
  if (!question) return null;
  return lang === "en" ? question.promptEn : question.promptRo;
}

export function buildTriageProgressLabel(state: GenericTriageState, lang: "ro" | "en") {
  return lang === "en"
    ? `Step ${state.step} of ${state.totalSteps}`
    : `Pasul ${state.step} din ${state.totalSteps}`;
}

export function buildTriageAnswerText(state: GenericTriageState, lang: "ro" | "en") {
  const flow = flowForIntent(state.activeFlow);
  const question = getTriageQuestion(state, lang);
  if (
    question &&
    state.phase === "clarifying_current_answer" &&
    state.clarification?.questionId === state.currentQuestionId
  ) {
    return lang === "en" ? state.clarification.text.en : state.clarification.text.ro;
  }
  const showContextRedirect =
    !state.whetherSelectedStructureMatchesIntent && state.redirectNoticeShown !== true;
  const acknowledgement =
    lang === "en" ? state.lastAnswerAcknowledgementEn : state.lastAnswerAcknowledgementRo;
  if (
    question &&
    acknowledgement &&
    state.needsCurrentQuestionClarification !== true &&
    !showContextRedirect
  ) {
    return `${acknowledgement} ${question}`.replace(/\s+/g, " ").trim();
  }
  const answer = buildPolicyTriageAnswer({
    lang,
    selectedStructure: state.selectedStructure,
    selectedStructureMatchesIntent: state.whetherSelectedStructureMatchesIntent,
    showContextRedirect,
    clarifyCurrentQuestion: state.needsCurrentQuestionClarification === true,
    mismatchRo: flow.mismatchRo,
    mismatchEn: flow.mismatchEn,
    introRo: flow.introRo,
    introEn: flow.introEn,
    urgentRo: flow.urgentRo,
    urgentEn: flow.urgentEn,
    redFlagLevel: state.redFlagLevel,
    question,
  });
  if (showContextRedirect) state.redirectNoticeShown = true;
  return answer;
}

function answerDisplayValue(
  question: TriageQuestion | undefined,
  value: string,
  lang: "ro" | "en",
) {
  if (!question) return value;
  if (question.answerKind === "yes_no") {
    if (value === "yes") return lang === "en" ? "yes" : "da";
    if (value === "no") return lang === "en" ? "no" : "nu";
    if (value === "unknown") return lang === "en" ? "I don't know" : "nu știu";
  }
  if (value === "partial") return lang === "en" ? "partial" : "partial";
  if (value === "moderate_to_severe") {
    return lang === "en" ? "closer to severe" : "spre severa";
  }
  const option = question.options?.find((item) => item.value === value);
  if (option) return lang === "en" ? option.labelEn : option.labelRo;
  return value;
}

export function buildGenericTriageSummary(state: GenericTriageState, lang: "ro" | "en" = "ro") {
  const flow = flowForIntent(state.activeFlow);
  ensureQuestionPlan(state);
  const questions = contextQuestionsForState(state);
  const lines =
    lang === "en"
      ? [
          "From what you described:",
          `- detected intent: ${flow.labelEn};`,
          `- selected area: ${state.selectedStructure};`,
          `- problem: ${state.originalProblem ?? "-"};`,
        ]
      : [
          "Din ce ai spus:",
          `- intent detectat: ${flow.labelRo};`,
          `- zona selectată: ${state.selectedStructure};`,
          `- problemă: ${state.originalProblem ?? "-"};`,
        ];

  for (const [questionId, answer] of Object.entries(state.answers)) {
    const question = questions.find((item) => item.id === questionId);
    const label = lang === "en" ? question?.labelEn : question?.labelRo;
    lines.push(`- ${label ?? questionId}: ${answerDisplayValue(question, answer, lang)};`);
  }

  lines.push(
    lang === "en"
      ? `- warning signs: ${state.redFlags.length ? state.redFlags.join(", ") : "none detected"}.`
      : `- semne de alarmă: ${state.redFlags.length ? state.redFlags.join(", ") : "nu au fost detectate"}.`,
  );
  lines.push(buildTriageOrientation(state.redFlagLevel, lang));
  lines.push(
    lang === "en"
      ? "Santix does not make a diagnosis, but this summary can help if you talk to a doctor."
      : "Santix nu pune diagnostic, dar acest rezumat poate fi util dacă vorbești cu un medic.",
  );
  return lines.join("\n");
}

export function shouldUseGuidedTriage(
  state: GenericTriageState | null | undefined,
): state is GenericTriageState {
  return Boolean(state);
}
