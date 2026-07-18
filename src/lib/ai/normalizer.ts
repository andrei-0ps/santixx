import type { NormalizedMessage } from "./types";

const ADDRESS_TERMS = [
  "frate",
  "bro",
  "boss",
  "vere",
  "man",
  "sefu",
  "șefu",
  "unchiule",
  "ba",
  "bă",
];

const PAIN_AFTER_MA_TERMS = [
  "doare",
  "dor",
  "durea",
  "inteapa",
  "ințeapa",
  "înțeapă",
  "tine",
  "arde",
  "lovit",
  "cazut",
  "căzut",
];

export function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeSantixMessage(originalMessage: string | undefined): NormalizedMessage {
  const original = (originalMessage ?? "").trim();
  let matchMessage = stripDiacritics(original)
    .toLowerCase()
    .replace(/[?.!,;:"'()[\]{}]/g, " ")
    .replace(/[-_/]+/g, " ");

  matchMessage = matchMessage.replace(new RegExp(`\\b(${ADDRESS_TERMS.map(stripDiacritics).join("|")})\\b`, "g"), " ");
  matchMessage = matchMessage.replace(/\b(ma)\b/g, (term, _match, offset, fullText: string) => {
    const after = fullText.slice(offset + term.length).trimStart();
    return PAIN_AFTER_MA_TERMS.some((painTerm) => after.startsWith(stripDiacritics(painTerm))) ? term : " ";
  });
  matchMessage = matchMessage.replace(/\s+/g, " ").trim();

  const tokens = matchMessage ? matchMessage.split(/\s+/g) : [];

  return {
    originalMessage: original,
    normalizedMessage: matchMessage,
    matchMessage,
    tokens,
  };
}

export function normalizeMedicalText(value: string | undefined) {
  return normalizeSantixMessage(value).normalizedMessage;
}
