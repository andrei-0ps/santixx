import type { AIProvider, GenerateStructuredInput } from "../types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const REQUEST_TIMEOUT_MS = 45_000;

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

function parseStructured<T>(text: string, fallback: T, validate?: (value: unknown) => T | null) {
  const jsonText = extractJsonObject(text);
  if (!jsonText) return fallback;

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return validate?.(parsed) ?? (parsed as T);
  } catch {
    return fallback;
  }
}

export function createOpenAiProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("Lipsește OPENAI_API_KEY pentru providerul AI OpenAI.");
  }

  async function callChatCompletions(
    input: GenerateStructuredInput<unknown> | Parameters<AIProvider["generateText"]>[0],
    jsonMode: boolean,
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: input.messages,
          temperature: input.temperature ?? 0.35,
          top_p: input.topP ?? 0.9,
          max_tokens: input.maxTokens ?? 420,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

      if (!response.ok) {
        throw new Error(
          `OpenAI error ${response.status}: ${payload.error?.message ?? "răspuns invalid"}`,
        );
      }

      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error("OpenAI nu a întors conținut.");
      return answer;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    providerName: "openai",
    name: "openai",
    supportsStructuredOutput: true,
    async generateText(input) {
      return callChatCompletions(input, false);
    },
    async generateStructured<T>(input: GenerateStructuredInput<T>) {
      // response_format JSON e disponibil pe modelele recente; dacă modelul
      // configurat nu îl acceptă, reîncercăm fără el și extragem obiectul.
      try {
        const text = await callChatCompletions(input, true);
        return parseStructured(text, input.fallback, input.validate);
      } catch {
        const text = await callChatCompletions(input, false);
        return parseStructured(text, input.fallback, input.validate);
      }
    },
  };
}
