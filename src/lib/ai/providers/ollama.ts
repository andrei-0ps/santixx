import type { AIProvider, GenerateStructuredInput } from "../types";

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

export function createOllamaProvider(): AIProvider {
  const ollamaUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

  return {
    providerName: "ollama",
    name: "ollama",
    supportsStructuredOutput: false,
    async generateText(input) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      try {
        const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            stream: false,
            messages: input.messages,
            options: {
              temperature: input.temperature ?? 0.35,
              top_p: input.topP ?? 0.9,
              num_predict: input.maxTokens ?? 420,
            },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ollama error ${response.status}: ${text}`);
        }

        const json = (await response.json()) as { message?: { content?: string } };
        const answer = json.message?.content?.trim();
        if (!answer) throw new Error("Ollama nu a întors conținut.");
        return answer;
      } finally {
        clearTimeout(timeout);
      }
    },
    async generateStructured<T>(input: GenerateStructuredInput<T>) {
      const text = await this.generateText(input);
      return parseStructured(text, input.fallback, input.validate);
    },
  };
}
