const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const LONG_REPEATED_CHAR = /(.)\1{80,}/;
const TOO_MANY_NEWLINES = /(?:.*\n){30,}/;

const PROMPT_INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore all previous",
  "system prompt",
  "developer message",
  "jailbreak",
  "prompt injection",
  "reveal your prompt",
  "show your instructions",
  "ignora instructiunile",
  "ignora instrucțiunile",
  "ignora regulile",
  "dezvaluie prompt",
  "dezvăluie prompt",
  "arata instructiunile",
  "arată instrucțiunile",
];

export type SafeTextResult = {
  text: string;
  rejectedReason: string | null;
};

export function sanitizeTextForStorage(value: string, maxLength = 1_200) {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function detectPromptInjectionAttempt(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return PROMPT_INJECTION_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function validateAiUserText(value: string, maxLength = 900): SafeTextResult {
  const text = sanitizeTextForStorage(value, maxLength);

  if (text.length < 2) {
    return { text, rejectedReason: "Mesajul este prea scurt." };
  }

  if (LONG_REPEATED_CHAR.test(text) || TOO_MANY_NEWLINES.test(text)) {
    return {
      text,
      rejectedReason: "Mesajul pare generat automat sau abuziv. Reformulează mai scurt.",
    };
  }

  if (detectPromptInjectionAttempt(text)) {
    return {
      text,
      rejectedReason:
        "Mesajul pare să ceară modificarea instrucțiunilor interne ale asistentului. Pune o întrebare medicală educațională despre zona selectată.",
    };
  }

  return { text, rejectedReason: null };
}
