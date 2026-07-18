const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

type EmbeddingProvider = "none" | "openai" | "ollama";

type OpenAiEmbeddingResponse = {
  data?: Array<{ embedding?: unknown }>;
  error?: { message?: string };
};

type OllamaEmbedResponse = {
  embedding?: unknown;
  embeddings?: unknown;
};

function expectedDimensions() {
  const configured = Number(process.env.AI_EMBEDDING_DIMENSIONS);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_EMBEDDING_DIMENSIONS;
}

function configuredProvider(): EmbeddingProvider {
  const explicit = process.env.AI_EMBEDDING_PROVIDER?.trim().toLowerCase();

  if (explicit === "openai" || explicit === "ollama" || explicit === "none") {
    return explicit;
  }

  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OLLAMA_EMBEDDING_MODEL) return "ollama";
  return "none";
}

function warnEmbeddingIssue(message: string, details?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  if (details === undefined) {
    console.warn(`[Santix embeddings] ${message}`);
  } else {
    console.warn(`[Santix embeddings] ${message}`, details);
  }
}

function normalizeInputText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 8_000);
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

export function validateEmbeddingVector(
  value: unknown,
  dimensions = expectedDimensions(),
): number[] | null {
  if (!Array.isArray(value) || value.length !== dimensions) return null;

  const vector = value.map((item) => Number(item));
  if (vector.some((item) => !Number.isFinite(item))) return null;
  return vector;
}

export function toPgVectorLiteral(vector: number[]) {
  return `[${vector.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

async function createOpenAiEmbedding(input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_OPENAI_EMBEDDING_MODEL;
  const dimensions = expectedDimensions();
  const request = timeoutSignal(30_000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: request.signal,
      body: JSON.stringify({
        model,
        input,
        ...(process.env.OPENAI_EMBEDDING_DIMENSIONS
          ? { dimensions: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS) }
          : {}),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as OpenAiEmbeddingResponse;

    if (!response.ok) {
      warnEmbeddingIssue("OpenAI embedding request failed.", {
        status: response.status,
        message: payload.error?.message,
      });
      return null;
    }

    const vector = validateEmbeddingVector(payload.data?.[0]?.embedding, dimensions);
    if (!vector) {
      warnEmbeddingIssue("OpenAI embedding has an unexpected dimension.", {
        expected: dimensions,
        actual: Array.isArray(payload.data?.[0]?.embedding)
          ? payload.data?.[0]?.embedding.length
          : null,
      });
    }
    return vector;
  } catch (error) {
    warnEmbeddingIssue("OpenAI embedding request could not be completed.", error);
    return null;
  } finally {
    request.clear();
  }
}

async function createOllamaEmbedding(input: string) {
  const model = process.env.OLLAMA_EMBEDDING_MODEL;
  if (!model) return null;

  const baseUrl = process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL;
  const dimensions = expectedDimensions();
  const request = timeoutSignal(30_000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: request.signal,
      body: JSON.stringify({ model, input }),
    });

    const payload = (await response.json().catch(() => ({}))) as OllamaEmbedResponse;
    if (!response.ok) {
      warnEmbeddingIssue("Ollama /api/embed request failed.", { status: response.status });
      return null;
    }

    const firstEmbedding = Array.isArray(payload.embeddings)
      ? payload.embeddings[0]
      : payload.embedding;
    const vector = validateEmbeddingVector(firstEmbedding, dimensions);
    if (!vector) {
      warnEmbeddingIssue("Ollama embedding has an unexpected dimension.", {
        expected: dimensions,
        actual: Array.isArray(firstEmbedding) ? firstEmbedding.length : null,
      });
    }
    return vector;
  } catch (error) {
    warnEmbeddingIssue("Ollama embedding request could not be completed.", error);
    return null;
  } finally {
    request.clear();
  }
}

export async function createQueryEmbedding(text: string): Promise<number[] | null> {
  const input = normalizeInputText(text);
  if (!input) return null;

  const provider = configuredProvider();
  if (provider === "openai") return createOpenAiEmbedding(input);
  if (provider === "ollama") return createOllamaEmbedding(input);
  return null;
}
