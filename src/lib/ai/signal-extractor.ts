import { normalizeSantixMessage } from "./normalizer";
import type {
  Duration,
  ExtractedSignals,
  NormalizedMessage,
  Onset,
  PainQuality,
  Severity,
  TraumaType,
  YesNoUnknown,
} from "./types";

const BODY_REGION_TERMS: Array<[string, string[]]> = [
  ["humerus", ["humerus", "brat", "bratul", "upper arm", "arm"]],
  ["genunchi", ["genunchi", "rotula", "patela", "knee", "kneecap", "patella"]],
  [
    "mana",
    [
      "mana",
      "palma",
      "deget",
      "degete",
      "pumn",
      "incheietura",
      "hand",
      "palm",
      "finger",
      "fingers",
      "wrist",
      "knuckle",
    ],
  ],
  ["umar", ["umar", "scapula", "omoplat", "clavicula", "shoulder", "shoulder blade", "collarbone"]],
  [
    "spate",
    [
      "spate",
      "coloana",
      "lombar",
      "cervical",
      "ceafa",
      "back",
      "spine",
      "lower back",
      "upper back",
    ],
  ],
  ["glezna", ["glezna", "tars", "ankle"]],
  ["sold", ["sold", "bazin", "hip", "pelvis", "groin"]],
  ["torace", ["torace", "piept", "stern", "coaste", "chest", "sternum", "ribs", "rib cage"]],
  ["gamba", ["gamba", "gambă", "calf", "lower leg"]],
  ["biceps", ["biceps"]],
  ["antebrat", ["antebrat", "brahioradial", "pronator", "forearm"]],
  ["abdomen", ["abdomen", "burta", "stomac", "belly", "stomach", "tummy"]],
  ["cap", ["cap", "fata", "frunte", "head", "face", "forehead", "jaw"]],
  ["gat", ["gat", "ceafa", "neck", "nape"]],
  ["picior", ["picior", "talpa", "degetele piciorului", "foot", "feet", "toes", "sole"]],
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function detectAffirmation(text: string): YesNoUnknown {
  if (
    /\b(da|sigur|normal|pot|merge|cred ca da|yes|yeah|yep|sure|correct|right|i can|can move|moves normally)\b/.test(
      text,
    )
  )
    return "yes";
  return "unknown";
}

function detectNegation(text: string): YesNoUnknown {
  if (
    /\b(nu|deloc|niciuna|niciun|nicio|fara|no|nope|not|none|without|cannot|cant|can t|don t|doesn t|never)\b/.test(
      text,
    )
  )
    return "no";
  return "unknown";
}

function detectSeverity(text: string): Severity {
  if (
    includesAny(text, [
      "insuportabil",
      "nu suport",
      "foarte rau",
      "foarte tare",
      "tare",
      "sever",
      "durere mare",
      "severe",
      "unbearable",
      "excruciating",
      "very painful",
      "very bad",
      "intense",
    ])
  ) {
    return "severe";
  }
  if (includesAny(text, ["moderat", "moderata", "mediu", "destul", "moderate", "manageable"]))
    return "moderate";
  if (
    includesAny(text, [
      "usor",
      "usoara",
      "putin",
      "suportabil",
      "slab",
      "mild",
      "slight",
      "bearable",
      "a little",
      "a bit",
    ])
  )
    return "mild";
  return "unknown";
}

function detectPainQuality(text: string): PainQuality {
  if (
    includesAny(text, [
      "intepatoare",
      "inteapa",
      "intepatura",
      "intepaturi",
      "junghi",
      "stabbing",
      "stinging",
      "pins",
    ])
  )
    return "stabbing";
  if (includesAny(text, ["arsura", "arde", "arzatoare", "ustura", "burning", "burns"]))
    return "burning";
  if (includesAny(text, ["pulseaza", "pulsatila", "zvacneste", "throbbing", "pulsing"]))
    return "throbbing";
  if (includesAny(text, ["surda", "apasatoare", "disconfort", "dull", "aching"])) return "dull";
  if (includesAny(text, ["ascutita", "taioasa", "sharp"])) return "sharp";
  if (includesAny(text, ["presiune", "apasa", "pressure", "tightness"])) return "pressure";
  if (includesAny(text, ["trage", "tragere", "intinde", "pulling", "stretching"])) return "pulling";
  if (includesAny(text, ["crampa", "crampe", "carcel", "spasm", "cramp", "cramping"]))
    return "cramp";
  return "unknown";
}

function detectMovement(text: string): YesNoUnknown {
  if (
    includesAny(text, [
      "nu pot misca",
      "nu se misca",
      "nu pot calca",
      "nu pot merge",
      "nu pot sprijini",
      "blocat",
      "deloc",
      "cannot move",
      "cant move",
      "can t move",
      "cannot walk",
      "cant walk",
      "can t walk",
      "cannot use",
      "cant use",
      "can t use",
      "cannot bear weight",
      "cant bear weight",
      "can t bear weight",
      "stuck",
      "locked",
    ])
  ) {
    return "no";
  }
  if (
    includesAny(text, [
      "pot misca normal",
      "pot misca norma",
      "se misca normal",
      "pot misca",
      "can move normally",
      "can move it",
      "moves normally",
      "move normally",
    ]) ||
    text === "pot"
  ) {
    return "yes";
  }
  return "unknown";
}

function detectTraumaType(text: string): TraumaType {
  if (
    includesAny(text, [
      "dupa niciuna",
      "niciuna din",
      "fara lovitura",
      "fara efort",
      "no injury",
      "without injury",
      "no trauma",
      "no impact",
    ])
  )
    return "none";
  if (includesAny(text, ["cazatura", "cazut", "cadere", "fell", "fall", "tripped", "slipped"]))
    return "fall";
  if (includesAny(text, ["lovitura", "lovit", "izbit", "hit", "struck", "impact", "blow"]))
    return "hit";
  if (
    includesAny(text, [
      "fotbal",
      "sport",
      "alergare",
      "alerg",
      "alergat",
      "football",
      "soccer",
      "running",
      "training",
      "workout",
    ])
  )
    return "sport";
  if (
    includesAny(text, [
      "sala",
      "efort",
      "ridicat greutati",
      "incordare",
      "incordez",
      "incordat",
      "exertion",
      "lifting",
      "lifted",
      "overuse",
      "repetitive strain",
    ])
  )
    return "effort";
  if (includesAny(text, ["accident"])) return "accident";
  return "unknown";
}

function detectOnset(text: string): Onset {
  if (
    includesAny(text, [
      "brusc",
      "dintr o data",
      "deodata",
      "suddenly",
      "sudden",
      "all of a sudden",
      "out of nowhere",
    ])
  )
    return "sudden";
  if (includesAny(text, ["treptat", "incet", "gradually", "gradual", "slowly", "over time"]))
    return "gradual";
  return "unknown";
}

function detectDuration(text: string): Duration {
  if (includesAny(text, ["minute", "minutele", "minutes", "just now"])) return "minutes";
  if (includesAny(text, ["ore", "cateva ore", "hours", "a few hours"])) return "hours";
  if (
    includesAny(text, [
      "de azi",
      "de ieri",
      "o zi",
      "cateva zile",
      "zile",
      "today",
      "yesterday",
      "one day",
      "days",
      "a few days",
    ])
  )
    return "days";
  if (includesAny(text, ["saptamana", "o saptamana", "week", "weeks"])) return "week_plus";
  if (includesAny(text, ["de mult", "luni", "cronic", "months", "chronic", "a long time"]))
    return "chronic";
  return "unknown";
}

function detectBodyRegion(text: string) {
  return (
    BODY_REGION_TERMS.flatMap(([region, terms]) =>
      terms.filter((term) => text.includes(term)).map((term) => ({ region, term })),
    ).sort((a, b) => b.term.length - a.term.length)[0]?.region ?? null
  );
}

function yesIf(text: string, terms: string[]): YesNoUnknown {
  return includesAny(text, terms) ? "yes" : "unknown";
}

export function extractSignals(
  input: string | NormalizedMessage,
  options: { lastQuestionIntent?: string | null } = {},
): ExtractedSignals {
  const normalized = typeof input === "string" ? normalizeSantixMessage(input) : input;
  const text = normalized.matchMessage;
  const traumaType = detectTraumaType(text);
  const contexts = [
    traumaType !== "unknown" && traumaType !== "none" ? traumaType : "",
    includesAny(text, [
      "sala",
      "efort",
      "incordare",
      "incordez",
      "incordat",
      "ridicat greutati",
      "gym",
      "exertion",
      "lifting",
      "overuse",
    ])
      ? "effort"
      : "",
    includesAny(text, ["crampa", "crampe", "carcel", "spasm", "cramp", "cramping"]) ? "cramp" : "",
  ].filter(Boolean);
  const swelling = yesIf(text, ["umflat", "umflatura", "swelling", "swollen", "puffy"]);
  const bruising = yesIf(text, ["vanataie", "invinetit", "bruise", "bruising", "bruised"]);
  const numbness = yesIf(text, [
    "amorteala",
    "amorteste",
    "pierdere sensibilitate",
    "numbness",
    "numb",
    "tingling",
    "pins and needles",
    "loss of sensation",
  ]);
  const weakness = yesIf(text, ["slabiciune", "weakness", "weak", "loss of strength"]);
  const deformity = yesIf(text, ["deformare", "deformat", "deformity", "deformed", "misshapen"]);
  const movement = detectMovement(text);
  const negation = detectNegation(text);
  const painQuality = detectPainQuality(text);
  const severity = detectSeverity(text);
  const painPresent = includesAny(text, [
    "ma doare",
    "ma dor",
    "durere",
    "doare",
    "ma tine",
    "tine",
    "ma inteapa",
    "intepatura",
    "arde",
    "trage",
    "febra musculara",
    "crampa",
    "crampe",
    "pain",
    "hurts",
    "hurt",
    "aching",
    "ache",
    "sore",
    "painful",
    "burning",
    "stabbing",
    "cramp",
  ])
    ? "yes"
    : painQuality !== "unknown"
      ? "yes"
      : "unknown";

  const redFlagReasons = [
    movement === "no" ? "imposibilitate de mișcare" : "",
    numbness === "yes" ? "amorțeală" : "",
    weakness === "yes" ? "slăbiciune" : "",
    deformity === "yes" ? "deformare" : "",
    severity === "severe" ? "durere severă" : "",
    includesAny(text, [
      "dificultate de respiratie",
      "nu pot respira",
      "difficulty breathing",
      "trouble breathing",
      "shortness of breath",
      "cannot breathe",
      "cant breathe",
      "can t breathe",
    ])
      ? "dificultăți de respirație"
      : "",
    includesAny(text, ["durere in piept", "durere toracica", "chest pain", "chest pressure"])
      ? "durere toracică"
      : "",
    includesAny(text, ["lesin", "confuzie", "fainting", "fainted", "confusion", "confused"])
      ? "leșin sau confuzie"
      : "",
    includesAny(text, [
      "nu pot controla urina",
      "nu pot controla scaunul",
      "pierd controlul vezicii",
      "loss of bladder control",
      "loss of bowel control",
      "cannot control my bladder",
      "cannot control my bowels",
      "cant control my bladder",
      "cant control my bowels",
    ])
      ? "pierderea controlului vezicii sau intestinului"
      : "",
  ].filter(Boolean);

  const associatedNo = options.lastQuestionIntent === "associated_signs" && negation === "no";

  return {
    affirmation: detectAffirmation(text),
    negation,
    pain_present: painPresent,
    pain_quality: painQuality,
    severity,
    movement_ok: movement,
    trauma_or_effort: traumaType === "none" ? "no" : traumaType !== "unknown" ? "yes" : "unknown",
    trauma_type: traumaType,
    onset: detectOnset(text),
    duration: detectDuration(text),
    swelling: associatedNo ? "no" : swelling,
    bruising: associatedNo ? "no" : bruising,
    numbness: associatedNo ? "no" : numbness,
    weakness,
    deformity,
    contexts,
    body_region: detectBodyRegion(text),
    structure_slug: null,
    red_flags_detected: redFlagReasons.length > 0,
    red_flag_reasons: redFlagReasons,
    unclear: normalized.tokens.length === 0,
  };
}
