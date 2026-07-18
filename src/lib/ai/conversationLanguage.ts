export type ConversationLanguage = "ro" | "en";

export type LocalizedMessageContent = {
  content_ro?: string | null;
  content_en?: string | null;
};

export function normalizeConversationLanguage(value: unknown): ConversationLanguage {
  return value === "en" ? "en" : "ro";
}

export function lockConversationLanguage(
  requestedLanguage: unknown,
  storedLanguage?: unknown,
): ConversationLanguage {
  return normalizeConversationLanguage(storedLanguage ?? requestedLanguage);
}

export function localizedMessageContent(
  message: LocalizedMessageContent | null | undefined,
  language: ConversationLanguage,
) {
  if (!message) return "";
  const preferred = language === "en" ? message.content_en : message.content_ro;
  const fallback = language === "en" ? message.content_ro : message.content_en;
  return preferred?.trim() || fallback?.trim() || "";
}

export function localizedMessageColumns(content: string, language: ConversationLanguage) {
  return {
    content_ro: language === "ro" ? content : null,
    content_en: language === "en" ? content : null,
  };
}
