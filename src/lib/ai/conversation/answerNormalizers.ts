import type {
  AnswerNormalizationResult,
  AnswerPolarity,
  ConceptEvidenceValue,
  ConversationLocale,
  ConversationQuestionOption,
  ConversationQuestionDefinition,
  ConversationQuestionType,
  NormalizedAnswerValue,
  NormalizedDuration,
  TraumaTrigger,
} from "./questionTypes";
import {
  SEMANTIC_CONCEPTS,
  conceptLabels,
  conceptTerms,
  type SemanticConceptId,
} from "./conceptRegistry";

export function normalizeUserText(value: string) {
  return value
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalizeUserText(phrase);
  if (!normalizedPhrase) return false;
  if (!normalizedPhrase.includes(" ")) {
    return text.split(" ").includes(normalizedPhrase);
  }
  return text === normalizedPhrase || text.includes(normalizedPhrase);
}

function containsAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => containsPhrase(text, phrase));
}

function result(
  rawValue: string,
  normalizedValue: NormalizedAnswerValue,
  storageValue: string,
  confidence: number,
  acknowledgement: { ro: string; en: string },
  semantic: Partial<
    Pick<
      AnswerNormalizationResult,
      "detectedConcepts" | "polarity" | "uncertain" | "clarificationReason"
    >
  > = {},
): AnswerNormalizationResult {
  const inferredPolarity: AnswerPolarity =
    storageValue === "yes"
      ? "positive"
      : storageValue === "no"
        ? "negative"
        : storageValue === "unknown"
          ? "unknown"
          : "positive";
  return {
    status: "valid",
    normalizedValue,
    storageValue,
    rawValue,
    detectedConcepts: semantic.detectedConcepts ?? [],
    polarity: semantic.polarity ?? inferredPolarity,
    confidence,
    uncertain: semantic.uncertain ?? false,
    clarificationReason: semantic.clarificationReason,
    acknowledgement,
  };
}

function ambiguous(
  rawValue: string,
  clarificationText: { ro: string; en: string },
): AnswerNormalizationResult {
  return {
    status: "ambiguous",
    rawValue,
    detectedConcepts: [],
    polarity: "unknown",
    confidence: 0.35,
    uncertain: true,
    clarificationReason: "multiple_or_incomplete_meanings",
    clarificationText,
  };
}

function invalid(rawValue: string): AnswerNormalizationResult {
  return {
    status: "invalid",
    rawValue,
    detectedConcepts: [],
    polarity: "unknown",
    confidence: 0,
    uncertain: false,
    clarificationReason: "no_relevant_signal",
  };
}

const UNKNOWN_TERMS = [
  "nu stiu",
  "nu stiu sigur",
  "nush",
  "habar n am",
  "habar nu am",
  "nu sunt sigur",
  "nu sunt sigura",
  "not sure",
  "i don t know",
  "i dont know",
];

const UNCERTAINTY_TERMS = [
  "cred ca",
  "cred",
  "probabil",
  "poate",
  "posibil",
  "se pare",
  "i think",
  "probably",
  "maybe",
  "possibly",
  "seems",
];

const UNIVERSAL_NEGATIVE_TERMS = [
  "nu am nimic",
  "nu are nimic",
  "nimic din astea",
  "nimic din cele enumerate",
  "niciuna dintre acestea",
  "nici una dintre acestea",
  "none of these",
  "nothing listed",
  "nothing like that",
];

const DIRECT_NEGATIVE_TERMS = [
  "nu",
  "nup",
  "no",
  "nope",
  "nah",
  "niciuna",
  "niciunul",
  "niciunu",
  "cu niciunul",
  "cu niciunu",
  "none",
  "neither",
];
const DIRECT_POSITIVE_TERMS = ["da", "dap", "yes", "yeah", "yep"];
const CLAUSE_BOUNDARY = /\b(?:dar|insa|ci|doar|but|however|only)\b/g;
const LOCAL_NEGATORS = new Set(["nu", "nici", "niciun", "nicio", "fara", "not", "no", "without"]);

type ConceptMatch = {
  concept: SemanticConceptId;
  polarity: AnswerPolarity;
  uncertain: boolean;
};

function splitSemanticClauses(text: string) {
  return text
    .split(CLAUSE_BOUNDARY)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function phraseIndex(text: string, phrase: string) {
  const normalizedPhrase = normalizeUserText(phrase);
  if (!normalizedPhrase) return -1;
  return ` ${text} `.indexOf(` ${normalizedPhrase} `);
}

function phraseIsLocallyNegated(clause: string, phrase: string) {
  const index = phraseIndex(clause, phrase);
  if (index < 0) return false;
  const before = clause.slice(0, index).trim().split(" ").filter(Boolean).slice(-4);
  return before.some((token) => LOCAL_NEGATORS.has(token));
}

function detectConceptMatches(message: string, expectedConcepts: readonly SemanticConceptId[]) {
  const text = normalizeUserText(message);
  const clauses = splitSemanticClauses(text);
  const matches: ConceptMatch[] = [];

  for (const clause of clauses) {
    const hardUnknown = containsAny(clause, UNKNOWN_TERMS);
    const uncertain = hardUnknown || containsAny(clause, UNCERTAINTY_TERMS);
    for (const concept of expectedConcepts) {
      const matchingTerms = SEMANTIC_CONCEPTS[concept].terms.filter((term) =>
        containsPhrase(clause, term),
      );
      if (!matchingTerms.length) continue;
      const positiveTerm = matchingTerms.find((term) => !phraseIsLocallyNegated(clause, term));
      matches.push({
        concept,
        polarity: hardUnknown ? "unknown" : positiveTerm ? "positive" : "negative",
        uncertain,
      });
    }
  }

  return matches;
}

function isDirectTerm(text: string, terms: readonly string[]) {
  return terms.some((term) => text === normalizeUserText(term));
}

function conceptClarification(
  expectedConcepts: readonly SemanticConceptId[],
  locale: ConversationLocale,
) {
  const labels = conceptLabels(expectedConcepts, locale);
  if (!labels.length) return locale === "ro" ? "Poti reformula raspunsul?" : "Could you rephrase?";
  const joined =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} ${locale === "ro" ? "sau" : "or"} ${labels.at(-1)}`;
  return locale === "ro" ? `Te referi la ${joined}?` : `Do you mean ${joined}?`;
}

function normalizeConceptEvidence(
  question: ConversationQuestionDefinition,
  message: string,
  locale: ConversationLocale,
): AnswerNormalizationResult {
  const expectedConcepts = (question.semantic?.expectedConcepts ?? []).filter(
    (concept): concept is SemanticConceptId => concept in SEMANTIC_CONCEPTS,
  );
  const text = normalizeUserText(message);
  if (!text) return invalid(message);

  const universalNegative = containsAny(text, UNIVERSAL_NEGATIVE_TERMS);
  const hardUnknown = containsAny(text, UNKNOWN_TERMS);
  const directNegative = universalNegative || isDirectTerm(text, DIRECT_NEGATIVE_TERMS);
  const directPositive = isDirectTerm(text, DIRECT_POSITIVE_TERMS);
  const matches = detectConceptMatches(message, expectedConcepts);
  const positiveConcepts = Array.from(
    new Set(matches.filter((match) => match.polarity === "positive").map((match) => match.concept)),
  );
  const negativeConcepts = Array.from(
    new Set(matches.filter((match) => match.polarity === "negative").map((match) => match.concept)),
  );
  const uncertain = hardUnknown || matches.some((match) => match.uncertain);

  if (hardUnknown && !positiveConcepts.length) {
    const value: ConceptEvidenceValue = { present: null, uncertain: true };
    for (const concept of expectedConcepts) value[concept] = null;
    return result(
      message,
      value,
      "unknown",
      0.9,
      { ro: "Am notat ca nu esti sigur.", en: "I noted that you are unsure." },
      { polarity: "unknown", uncertain: true },
    );
  }

  if (directNegative) {
    const value: ConceptEvidenceValue = { present: false };
    for (const concept of expectedConcepts) value[concept] = false;
    return result(
      message,
      value,
      "no",
      0.98,
      {
        ro: "Am notat ca nu ai observat aceste semne.",
        en: "I noted that you have not noticed these signs.",
      },
      { polarity: "negative" },
    );
  }

  if (positiveConcepts.length) {
    const value: ConceptEvidenceValue = { present: true, uncertain };
    for (const concept of expectedConcepts) {
      value[concept] = positiveConcepts.includes(concept)
        ? true
        : negativeConcepts.includes(concept)
          ? false
          : false;
    }
    const labels = conceptLabels(positiveConcepts, locale).join(", ");
    return result(
      message,
      value,
      "yes",
      uncertain ? 0.82 : 0.97,
      locale === "ro"
        ? {
            ro: `Am notat: ${labels}.`,
            en: `I noted: ${conceptLabels(positiveConcepts, "en").join(", ")}.`,
          }
        : {
            ro: `Am notat: ${conceptLabels(positiveConcepts, "ro").join(", ")}.`,
            en: `I noted: ${labels}.`,
          },
      { detectedConcepts: positiveConcepts, polarity: "positive", uncertain },
    );
  }

  if (directPositive) {
    if (question.semantic?.detailsRequired && expectedConcepts.length > 1) {
      return {
        ...ambiguous(message, {
          ro: conceptClarification(expectedConcepts, "ro"),
          en: conceptClarification(expectedConcepts, "en"),
        }),
        clarificationReason: "evidence_details_required",
      };
    }
    const value: ConceptEvidenceValue = { present: true, detailsUnspecified: true };
    for (const concept of expectedConcepts) value[concept] = null;
    return result(
      message,
      value,
      "yes",
      0.9,
      { ro: "Am notat raspunsul afirmativ.", en: "I noted the affirmative answer." },
      { polarity: "positive" },
    );
  }

  if (negativeConcepts.length === expectedConcepts.length && expectedConcepts.length > 0) {
    const value: ConceptEvidenceValue = { present: false };
    for (const concept of expectedConcepts) value[concept] = false;
    return result(
      message,
      value,
      "no",
      0.92,
      { ro: "Am notat raspunsul negativ.", en: "I noted the negative answer." },
      { polarity: "negative" },
    );
  }

  if (negativeConcepts.length) {
    const clarification = {
      ro: conceptClarification(
        expectedConcepts.filter((concept) => !negativeConcepts.includes(concept)),
        "ro",
      ),
      en: conceptClarification(
        expectedConcepts.filter((concept) => !negativeConcepts.includes(concept)),
        "en",
      ),
    };
    return {
      ...ambiguous(message, clarification),
      detectedConcepts: negativeConcepts,
      clarificationReason: "remaining_concepts_unspecified",
    };
  }

  return {
    ...invalid(message),
    clarificationText: {
      ro: conceptClarification(expectedConcepts, "ro"),
      en: conceptClarification(expectedConcepts, "en"),
    },
  };
}

export const TRAUMA_TRIGGER_OPTIONS: ConversationQuestionOption[] = [
  {
    value: "fall",
    labelRo: "căzătură",
    labelEn: "fall",
    terms: conceptTerms("fall"),
  },
  {
    value: "impact",
    labelRo: "lovitură / impact",
    labelEn: "hit / impact",
    terms: conceptTerms("impact"),
  },
  {
    value: "repetitive_effort",
    labelRo: "efort repetitiv / suprasolicitare",
    labelEn: "repetitive effort / overuse",
    terms: conceptTerms("repetitive_effort"),
  },
  {
    value: "effort",
    labelRo: "efort",
    labelEn: "exertion",
    terms: conceptTerms("effort"),
  },
  {
    value: "other",
    labelRo: "altceva",
    labelEn: "something else",
    terms: ["altceva", "altă cauză", "alta cauza", "other", "something else"],
  },
  {
    value: "none",
    labelRo: "niciuna dintre acestea",
    labelEn: "none of these",
    terms: ["nu", "nu a fost", "niciuna", "nici una", "fără", "fara", "no", "none", "neither"],
  },
  {
    value: "unknown",
    labelRo: "nu știu",
    labelEn: "not sure",
    terms: UNKNOWN_TERMS,
  },
];

function traumaTriggerResult(message: string, trigger: TraumaTrigger) {
  const option = TRAUMA_TRIGGER_OPTIONS.find((candidate) => candidate.value === trigger);
  return result(
    message,
    trigger,
    trigger,
    0.97,
    {
      ro: `Am notat: ${option?.labelRo ?? trigger}.`,
      en: `I noted: ${option?.labelEn ?? trigger}.`,
    },
    {
      detectedConcepts:
        trigger === "fall" ||
        trigger === "impact" ||
        trigger === "effort" ||
        trigger === "repetitive_effort"
          ? [trigger]
          : [],
      polarity: trigger === "none" ? "negative" : trigger === "unknown" ? "unknown" : "positive",
      uncertain: trigger === "unknown",
    },
  );
}

export function normalizeTraumaTrigger(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (!text) return invalid(message);
  if (containsAny(text, UNKNOWN_TERMS)) return traumaTriggerResult(message, "unknown");

  const repetitive = TRAUMA_TRIGGER_OPTIONS.find((option) => option.value === "repetitive_effort");
  if (repetitive && containsAny(text, repetitive.terms)) {
    return traumaTriggerResult(message, "repetitive_effort");
  }

  const matches = TRAUMA_TRIGGER_OPTIONS.filter(
    (option) =>
      option.value !== "unknown" &&
      option.value !== "repetitive_effort" &&
      containsAny(text, option.terms),
  );
  const distinctMatches = Array.from(
    new Set(matches.map((option) => option.value as TraumaTrigger)),
  );
  if (distinctMatches.length === 1) return traumaTriggerResult(message, distinctMatches[0]);

  return ambiguous(message, {
    ro: "A fost o căzătură, o lovitură, un efort, o suprasolicitare repetitivă sau niciuna dintre acestea?",
    en: "Was it a fall, a hit, exertion, repetitive overuse, or none of these?",
  });
}

export function normalizeYesNo(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (!text) return invalid(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că nu ești sigur.",
      en: "I noted that you are unsure.",
    });
  }
  if (
    containsAny(text, [
      "nu cred",
      "cred ca nu",
      "nu",
      "no",
      "nup",
      "nope",
      "nah",
      "fara",
      "deloc",
      "niciunul",
      "niciunu",
      "niciuna",
      "nici un",
      "nici o",
      "cu niciunu",
      "cu niciunul",
      "none",
      "neither",
    ])
  ) {
    return result(message, "no", "no", 0.95, {
      ro: "Am notat răspunsul negativ.",
      en: "I noted the negative answer.",
    });
  }
  if (
    containsAny(text, [
      "cred ca da",
      "cam da",
      "probabil da",
      "da",
      "dap",
      "yes",
      "yeah",
      "probably yes",
    ])
  ) {
    return result(message, "yes", "yes", 0.95, {
      ro: "Am notat răspunsul afirmativ.",
      en: "I noted the affirmative answer.",
    });
  }
  if (containsAny(text, ["posibil", "poate", "maybe", "possibly"])) {
    return ambiguous(message, {
      ro: "Vrei să spui mai degrabă da, mai degrabă nu sau că nu știi?",
      en: "Do you mean closer to yes, closer to no, or that you are unsure?",
    });
  }
  return invalid(message);
}

export function normalizeSeverity(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că intensitatea nu este clară.",
      en: "I noted that the intensity is unclear.",
    });
  }
  if (
    containsAny(text, [
      "spre severa",
      "spre sever",
      "destul de tare",
      "destul tare",
      "destul de puternica",
      "cam severa",
      "aproape severa",
      "moderate to severe",
      "quite bad",
    ])
  ) {
    return result(message, "moderate_to_severe", "moderate_to_severe", 0.95, {
      ro: "Am notat că durerea este destul de puternică.",
      en: "I noted the pain as fairly strong.",
    });
  }
  if (
    containsAny(text, [
      "severa",
      "sever",
      "foarte tare",
      "foarte rau",
      "foarte puternica",
      "mare",
      "insuportabila",
      "insuportabil",
      "severe",
      "unbearable",
    ])
  ) {
    return result(message, "severe", "severe", 0.95, {
      ro: "Am notat durerea ca severă.",
      en: "I noted the pain as severe.",
    });
  }
  if (
    containsAny(text, [
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
    return result(message, "moderate", "moderate", 0.95, {
      ro: "Am notat durerea ca moderată.",
      en: "I noted the pain as moderate.",
    });
  }
  if (containsAny(text, ["usoara", "usor", "mica", "mic", "putin", "mild", "light", "slight"])) {
    return result(message, "mild", "mild", 0.95, {
      ro: "Am notat durerea ca ușoară.",
      en: "I noted the pain as mild.",
    });
  }
  if (containsAny(text, ["intepatoare", "inteapa", "ascutita", "stabbing", "sharp"])) {
    return ambiguous(message, {
      ro: "Am notat că durerea este înțepătoare. Este ușoară, moderată sau foarte puternică?",
      en: "I noted that the pain is stabbing. Is it mild, moderate, or very strong?",
    });
  }
  return ambiguous(message, {
    ro: "Vrei să spui că este ușoară, moderată sau severă?",
    en: "Would you describe it as mild, moderate, or severe?",
  });
}

const NUMBER_WORDS: Record<string, number> = {
  o: 1,
  un: 1,
  una: 1,
  unu: 1,
  one: 1,
  doua: 2,
  doi: 2,
  two: 2,
  trei: 3,
  three: 3,
  patru: 4,
  four: 4,
  cinci: 5,
  five: 5,
  sase: 6,
  six: 6,
  sapte: 7,
  seven: 7,
  opt: 8,
  eight: 8,
  noua: 9,
  nine: 9,
  zece: 10,
  ten: 10,
};

function durationUnit(value: string): "minute" | "hour" | "day" | "week" | "month" | "year" | null {
  if (/minut/.test(value)) return "minute";
  if (/\b(or[ae]?|hour)/.test(value)) return "hour";
  if (/\b(zi|zile|day)/.test(value)) return "day";
  if (/saptaman|week/.test(value)) return "week";
  if (/\b(luna|luni|month)/.test(value)) return "month";
  if (/\b(an|ani|year)/.test(value)) return "year";
  return null;
}

export function normalizeDuration(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (!text) return invalid(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, { unknown: true }, "unknown", 0.98, {
      ro: "Am notat că durata nu este cunoscută.",
      en: "I noted that the duration is unknown.",
    });
  }
  const relative: Array<[string[], "today" | "yesterday" | "sudden" | "gradual"]> = [
    [["azi", "astazi", "today"], "today"],
    [["de ieri", "ieri", "since yesterday", "yesterday"], "yesterday"],
    [["brusc", "dintr o data", "suddenly"], "sudden"],
    [["treptat", "gradual", "gradually"], "gradual"],
  ];
  for (const [terms, value] of relative) {
    if (containsAny(text, terms)) {
      return result(message, { relative: value }, value, 0.95, {
        ro: "Am notat durata.",
        en: "I noted the duration.",
      });
    }
  }

  const numericMatch = text.match(/\b(\d+(?:[.,]\d+)?)\s*([a-z]+)\b/);
  const wordMatch = text.match(
    /\b(o|un|una|unu|one|doua|doi|two|trei|three|patru|four|cinci|five|sase|six|sapte|seven|opt|eight|noua|nine|zece|ten)\s+(minute|minut|ora|ore|hour|hours|zi|zile|day|days|saptamana|saptamani|week|weeks|luna|luni|month|months|an|ani|year|years)\b/,
  );
  const amount = numericMatch
    ? Number(numericMatch[1].replace(",", "."))
    : wordMatch
      ? NUMBER_WORDS[wordMatch[1]]
      : undefined;
  const unitSource = numericMatch?.[2] ?? wordMatch?.[2] ?? "";
  const unit = durationUnit(unitSource);
  if (Number.isFinite(amount) && amount! > 0 && unit) {
    const value: NormalizedDuration = {
      amount: amount!,
      unit,
      approximate: containsAny(text, ["cam", "aproximativ", "vreo", "about", "around"]),
    };
    return result(message, value, message.trim().slice(0, 120), 0.98, {
      ro: "Am notat durata.",
      en: "I noted the duration.",
    });
  }
  if (containsAny(text, ["cateva zile", "de cateva zile", "a few days", "few days"])) {
    return result(
      message,
      { amount: 3, unit: "day", approximate: true },
      message.trim().slice(0, 120),
      0.8,
      { ro: "Am notat durata aproximativă.", en: "I noted the approximate duration." },
    );
  }
  return ambiguous(message, {
    ro: "Poți spune durata în minute, ore, zile sau săptămâni?",
    en: "Can you give the duration in minutes, hours, days, or weeks?",
  });
}

export function normalizeMovement(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că mișcarea nu este clară.",
      en: "I noted that movement is unclear.",
    });
  }
  const matches = detectConceptMatches(message, [
    "movement_none",
    "movement_partial",
    "movement_normal",
  ]);
  const positive = matches.filter((match) => match.polarity === "positive");
  const movement = ["movement_none", "movement_partial", "movement_normal"].find((concept) =>
    positive.some((match) => match.concept === concept),
  );
  if (movement === "movement_none") {
    return result(
      message,
      "none",
      "no",
      0.98,
      {
        ro: "Am notat că nu poți mișca sau sprijini zona normal.",
        en: "I noted that you cannot move or support the area normally.",
      },
      {
        detectedConcepts: [movement],
        polarity: "negative",
      },
    );
  }
  if (movement === "movement_partial") {
    return result(
      message,
      "partial",
      "partial",
      0.95,
      {
        ro: "Am notat că mișcarea este parțial afectată.",
        en: "I noted that movement is partially affected.",
      },
      {
        detectedConcepts: [movement],
        polarity: "positive",
      },
    );
  }
  if (movement === "movement_normal") {
    return result(
      message,
      "normal",
      "yes",
      0.98,
      {
        ro: "Am notat că poți mișca zona normal.",
        en: "I noted that you can move the area normally.",
      },
      {
        detectedConcepts: [movement],
        polarity: "positive",
      },
    );
  }
  const yesNo = normalizeYesNo(message);
  if (yesNo.status === "valid") return yesNo;
  return ambiguous(message, {
    ro: "Poți mișca sau sprijini zona normal, parțial sau deloc?",
    en: "Can you move or support the area normally, partially, or not at all?",
  });
}

export function normalizeSensation(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că sensibilitatea nu este clară.",
      en: "I noted that sensation is unclear.",
    });
  }
  const normalMatches = detectConceptMatches(message, ["sensation_normal"]);
  if (normalMatches.some((match) => match.polarity === "positive")) {
    return result(
      message,
      "normal",
      "normal",
      0.98,
      {
        ro: "Am notat că sensibilitatea este normală.",
        en: "I noted normal sensation.",
      },
      {
        detectedConcepts: ["sensation_normal"],
        polarity: "negative",
      },
    );
  }
  const alteredMatches = detectConceptMatches(message, ["tingling", "numbness", "weakness"]);
  const altered = Array.from(
    new Set(
      alteredMatches.filter((match) => match.polarity === "positive").map((match) => match.concept),
    ),
  );
  if (altered.length) {
    return result(
      message,
      "altered",
      "altered",
      0.98,
      {
        ro: "Am notat amorțeala sau furnicăturile.",
        en: "I noted numbness or tingling.",
      },
      {
        detectedConcepts: altered,
        polarity: "positive",
      },
    );
  }
  if (alteredMatches.some((match) => match.polarity === "negative")) {
    return result(
      message,
      "normal",
      "normal",
      0.94,
      {
        ro: "Am notat că nu ai amorțeală, furnicături sau slăbiciune.",
        en: "I noted no numbness, tingling, or weakness.",
      },
      {
        detectedConcepts: ["sensation_normal"],
        polarity: "negative",
      },
    );
  }
  const yesNo = normalizeYesNo(message);
  if (yesNo.status === "valid") return yesNo;
  return ambiguous(message, {
    ro: "Simți normal sau ai amorțeală ori furnicături?",
    en: "Does sensation feel normal, or do you have numbness or tingling?",
  });
}

export function normalizeDepthOrIntensity(message: string): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că profunzimea nu este clară.",
      en: "I noted that the depth is unclear.",
    });
  }
  if (
    containsAny(text, [
      "superficiala",
      "superficial",
      "la suprafata",
      "zgarietura",
      "nu pare adanca",
      "scratch",
    ])
  ) {
    return result(message, "superficial", "superficial", 0.98, {
      ro: "Am notat că pare superficială.",
      en: "I noted it as superficial.",
    });
  }
  if (containsAny(text, ["adanca", "adanc", "pare adanca", "profunda", "deep", "gaping"])) {
    return result(message, "deep", "deep", 0.98, {
      ro: "Am notat că pare adâncă.",
      en: "I noted it as deep.",
    });
  }
  return ambiguous(message, {
    ro: "Rana pare superficială, adâncă sau nu poți aprecia?",
    en: "Does the wound look superficial, deep, or are you unsure?",
  });
}

function normalizeChoice(
  question: ConversationQuestionDefinition,
  message: string,
): AnswerNormalizationResult {
  const text = normalizeUserText(message);
  if (containsAny(text, UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că nu ești sigur.",
      en: "I noted that you are unsure.",
    });
  }
  const matches = (question.options ?? []).filter((option) =>
    [option.value, option.labelRo, option.labelEn, ...option.terms].some((term) =>
      containsPhrase(text, term),
    ),
  );
  if (matches.length === 1) {
    const option = matches[0];
    return result(message, option.value, option.value, 0.98, {
      ro: `Am notat: ${option.labelRo}.`,
      en: `I noted: ${option.labelEn}.`,
    });
  }
  const choicesRo = (question.options ?? []).map((option) => option.labelRo).join(" sau ");
  const choicesEn = (question.options ?? []).map((option) => option.labelEn).join(" or ");
  return ambiguous(message, {
    ro: choicesRo ? `Te referi la ${choicesRo}?` : question.text.ro,
    en: choicesEn ? `Do you mean ${choicesEn}?` : question.text.en,
  });
}

function normalizeFreeText(message: string): AnswerNormalizationResult {
  const value = message.trim().replace(/\s+/g, " ").slice(0, 160);
  if (!value) return invalid(message);
  if (containsAny(normalizeUserText(value), UNKNOWN_TERMS)) {
    return result(message, "unknown", "unknown", 0.95, {
      ro: "Am notat că nu ești sigur.",
      en: "I noted that you are unsure.",
    });
  }
  return result(message, value, value, 0.85, {
    ro: "Am notat răspunsul.",
    en: "I noted the answer.",
  });
}

function defaultAnswerKind(question: ConversationQuestionDefinition) {
  if (question.semantic?.answerKind) return question.semantic.answerKind;
  const defaults: Record<
    ConversationQuestionType,
    NonNullable<typeof question.semantic>["answerKind"]
  > = {
    yes_no: "boolean",
    trauma_trigger: "trauma_mechanism",
    severity: "severity",
    duration: "duration",
    single_choice: "single_choice",
    movement_status: "movement_status",
    sensation_status: "sensation_status",
    free_text_short: "free_text_short",
    location_confirmation: "single_choice",
    numeric_optional: "numeric_optional",
    depth_or_intensity: "single_choice",
  };
  return defaults[question.type];
}

export function normalizeAnswerForQuestion(
  question: ConversationQuestionDefinition,
  message: string,
  locale: ConversationLocale = "ro",
): AnswerNormalizationResult {
  const answerKind = defaultAnswerKind(question);
  let normalized: AnswerNormalizationResult;

  switch (answerKind) {
    case "boolean_with_evidence":
    case "any_of_concepts":
      normalized = normalizeConceptEvidence(question, message, locale);
      break;
    case "boolean":
      normalized = question.semantic?.expectedConcepts?.length
        ? normalizeConceptEvidence(question, message, locale)
        : normalizeYesNo(message);
      break;
    case "trauma_mechanism":
      normalized = normalizeTraumaTrigger(message);
      break;
    case "severity":
      normalized = normalizeSeverity(message);
      break;
    case "duration":
      normalized = normalizeDuration(message);
      break;
    case "movement_status":
      normalized = normalizeMovement(message);
      break;
    case "sensation_status":
      normalized = normalizeSensation(message);
      break;
    case "numeric_optional": {
      const number = Number(normalizeUserText(message).replace(",", "."));
      normalized = Number.isFinite(number)
        ? result(message, number, String(number), 0.98, {
            ro: "Am notat valoarea.",
            en: "I noted the value.",
          })
        : normalizeFreeText(message);
      break;
    }
    case "single_choice":
      normalized = question.options?.length
        ? normalizeChoice(question, message)
        : normalizeDepthOrIntensity(message);
      break;
    case "frequency":
    case "free_text_short":
      normalized = normalizeFreeText(message);
      break;
  }

  const enrichDeterministicCategory = (answer: AnswerNormalizationResult) => {
    if (answer.status !== "valid" || answer.detectedConcepts.length) return answer;
    if (
      answerKind !== "severity" &&
      answerKind !== "duration" &&
      answerKind !== "single_choice" &&
      answerKind !== "frequency" &&
      answerKind !== "numeric_optional"
    ) {
      return answer;
    }
    const category =
      typeof answer.normalizedValue === "string"
        ? `${answerKind}:${answer.normalizedValue}`
        : answerKind;
    return { ...answer, detectedConcepts: [category] };
  };

  if (normalized.status === "valid" || !question.options?.length) {
    return enrichDeterministicCategory(normalized);
  }

  const text = normalizeUserText(message);
  const optionMatches = question.options.filter((option) =>
    [option.value, option.labelRo, option.labelEn, ...option.terms].some((term) =>
      containsPhrase(text, term),
    ),
  );
  if (optionMatches.length !== 1) return normalized;
  const option = optionMatches[0];
  return enrichDeterministicCategory(
    result(message, option.value, option.value, 0.95, {
      ro: `Am notat: ${option.labelRo}.`,
      en: `I noted: ${option.labelEn}.`,
    }),
  );
}

export const normalizeAnswer = normalizeAnswerForQuestion;

export function storageValueForNormalizedAnswer(answer: AnswerNormalizationResult) {
  if (answer.storageValue) return answer.storageValue;
  if (typeof answer.normalizedValue === "string") return answer.normalizedValue;
  if (typeof answer.normalizedValue === "number") return String(answer.normalizedValue);
  if (typeof answer.normalizedValue === "boolean") return answer.normalizedValue ? "yes" : "no";
  if (answer.normalizedValue && typeof answer.normalizedValue === "object") {
    return JSON.stringify(answer.normalizedValue);
  }
  return answer.rawValue.trim().slice(0, 160) || "unknown";
}
