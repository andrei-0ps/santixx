import { createOllamaProvider } from "./providers/ollama";
import { createOpenAiProvider } from "./providers/openai";
import type { AIProvider } from "./types";

export type {
  AIProvider,
  AIProviderInput,
  AIProviderOutput,
  AiProvider,
  AiProviderMessage,
  GenerateStructuredInput,
  GenerateTextInput,
} from "./types";

export { createOllamaProvider } from "./providers/ollama";
export { createOpenAiProvider } from "./providers/openai";

export function createAiProvider(): AIProvider {
  // Fără AI_PROVIDER explicit alegem după cheile prezente, la fel ca la
  // embeddings: dacă există OPENAI_API_KEY folosim OpenAI, altfel Ollama local.
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  const provider = explicit || (process.env.OPENAI_API_KEY ? "openai" : "ollama");

  if (provider === "ollama") {
    return createOllamaProvider();
  }

  if (provider === "openai") {
    return createOpenAiProvider();
  }

  throw new Error(`Provider AI necunoscut: ${provider}`);
}
