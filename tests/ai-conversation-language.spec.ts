import { expect, test } from "@playwright/test";
import {
  localizedMessageColumns,
  localizedMessageContent,
  lockConversationLanguage,
  normalizeConversationLanguage,
} from "../src/lib/ai/conversationLanguage";

test.describe("AI conversation language", () => {
  test("accepts only Romanian and English, defaulting safely to Romanian", () => {
    expect(normalizeConversationLanguage("ro")).toBe("ro");
    expect(normalizeConversationLanguage("en")).toBe("en");
    expect(normalizeConversationLanguage("de")).toBe("ro");
    expect(normalizeConversationLanguage(null)).toBe("ro");
  });

  test("keeps the stored conversation language when the interface language changes", () => {
    expect(lockConversationLanguage("en", "ro")).toBe("ro");
    expect(lockConversationLanguage("ro", "en")).toBe("en");
    expect(lockConversationLanguage("en")).toBe("en");
  });

  test("writes new messages only to the column matching the conversation language", () => {
    expect(localizedMessageColumns("Mă doare umărul.", "ro")).toEqual({
      content_ro: "Mă doare umărul.",
      content_en: null,
    });
    expect(localizedMessageColumns("My shoulder hurts.", "en")).toEqual({
      content_ro: null,
      content_en: "My shoulder hurts.",
    });
  });

  test("reads the preferred language and uses the other column only for legacy fallback", () => {
    const bilingual = {
      content_ro: "Mesaj în română",
      content_en: "Message in English",
    };

    expect(localizedMessageContent(bilingual, "ro")).toBe("Mesaj în română");
    expect(localizedMessageContent(bilingual, "en")).toBe("Message in English");
    expect(localizedMessageContent({ content_ro: "Mesaj vechi", content_en: null }, "en")).toBe(
      "Mesaj vechi",
    );
  });
});
