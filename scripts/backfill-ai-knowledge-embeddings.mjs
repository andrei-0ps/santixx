import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_DIMENSIONS = 1536;
const DEFAULT_OPENAI_MODEL = "text-embedding-3-small";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

function parseArgs(argv) {
  const options = {
    all: false,
    dryRun: false,
    limit: Number.POSITIVE_INFINITY,
    batchSize: 25,
    delayMs: 120,
    provider: null,
  };

  for (const arg of argv) {
    if (arg === "--all") options.all = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice("--limit=".length));
    else if (arg.startsWith("--batch-size="))
      options.batchSize = Number(arg.slice("--batch-size=".length));
    else if (arg.startsWith("--delay-ms="))
      options.delayMs = Number(arg.slice("--delay-ms=".length));
    else if (arg.startsWith("--provider=")) options.provider = arg.slice("--provider=".length);
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    options.limit = Number.POSITIVE_INFINITY;
  }
  if (!Number.isInteger(options.batchSize) || options.batchSize <= 0) options.batchSize = 25;
  if (!Number.isFinite(options.delayMs) || options.delayMs < 0) options.delayMs = 120;

  return options;
}

async function readEnv() {
  const workspace = process.cwd();
  const env = { ...process.env };

  for (const file of [".env.local", ".env", ".env.production"]) {
    try {
      const content = await readFile(path.join(workspace, file), "utf8");
      for (const line of content.split(/\r?\n/)) {
        if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "");
        if (key && env[key] === undefined) env[key] = value;
      }
    } catch {
      continue;
    }
  }

  return env;
}

function normalizeInputText(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 8_000);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dimensions(env) {
  const configured = Number(env.AI_EMBEDDING_DIMENSIONS);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_DIMENSIONS;
}

function providerName(env, cliProvider) {
  const explicit = (cliProvider ?? env.AI_EMBEDDING_PROVIDER ?? "").trim().toLowerCase();
  if (["openai", "ollama"].includes(explicit)) return explicit;
  if (env.OPENAI_API_KEY) return "openai";
  if (env.OLLAMA_EMBEDDING_MODEL) return "ollama";
  throw new Error(
    "No embedding provider configured. Set OPENAI_API_KEY or OLLAMA_EMBEDDING_MODEL.",
  );
}

function validateVector(value, expectedDimensions) {
  if (!Array.isArray(value) || value.length !== expectedDimensions) return null;
  const vector = value.map((item) => Number(item));
  return vector.every((item) => Number.isFinite(item)) ? vector : null;
}

function toPgVectorLiteral(vector) {
  return `[${vector.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

function buildKnowledgeEmbeddingText(row) {
  const metadataText = row.metadata
    ? Object.entries(row.metadata)
        .filter(
          ([, value]) =>
            typeof value === "string" || typeof value === "number" || typeof value === "boolean",
        )
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join("; ")
    : "";

  return [
    row.title_ro,
    row.title_en,
    `Categorie: ${row.category}`,
    row.structure_slug ? `Structura: ${row.structure_slug}` : "",
    row.body_region ? `Regiune: ${row.body_region}` : "",
    row.tags?.length ? `Tag-uri: ${row.tags.join(", ")}` : "",
    metadataText,
    row.content_ro,
    row.content_en,
  ]
    .filter(Boolean)
    .join("\n");
}

async function createOpenAiEmbedding(text, env) {
  const model = env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_OPENAI_MODEL;
  const expectedDimensions = dimensions(env);
  const baseUrl = env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: normalizeInputText(text),
      ...(env.OPENAI_EMBEDDING_DIMENSIONS
        ? { dimensions: Number(env.OPENAI_EMBEDDING_DIMENSIONS) }
        : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed: ${response.status} ${payload.error?.message ?? ""}`);
  }

  const vector = validateVector(payload.data?.[0]?.embedding, expectedDimensions);
  if (!vector) {
    const actual = Array.isArray(payload.data?.[0]?.embedding)
      ? payload.data[0].embedding.length
      : "unknown";
    throw new Error(
      `OpenAI embedding dimension mismatch. Expected ${expectedDimensions}, got ${actual}.`,
    );
  }

  return {
    vector,
    modelLabel: `openai:${model}:${expectedDimensions}`,
  };
}

async function createOllamaEmbedding(text, env) {
  const model = env.OLLAMA_EMBEDDING_MODEL;
  const expectedDimensions = dimensions(env);
  const baseUrl = env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: normalizeInputText(text) }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Ollama embeddings failed: ${response.status}`);
  }

  const firstEmbedding = Array.isArray(payload.embeddings)
    ? payload.embeddings[0]
    : payload.embedding;
  const vector = validateVector(firstEmbedding, expectedDimensions);
  if (!vector) {
    const actual = Array.isArray(firstEmbedding) ? firstEmbedding.length : "unknown";
    throw new Error(
      `Ollama embedding dimension mismatch. Expected ${expectedDimensions}, got ${actual}.`,
    );
  }

  return {
    vector,
    modelLabel: `ollama:${model}:${expectedDimensions}`,
  };
}

async function createEmbedding(text, env, provider) {
  if (provider === "openai") return createOpenAiEmbedding(text, env);
  if (provider === "ollama") return createOllamaEmbedding(text, env);
  throw new Error(`Unsupported embedding provider: ${provider}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const env = await readEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin configuration. Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const provider = providerName(env, options.provider);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let processed = 0;
  let updated = 0;
  let page = 0;

  console.log(
    JSON.stringify(
      {
        provider,
        dimensions: dimensions(env),
        mode: options.all ? "all active rows" : "rows missing embeddings",
        dryRun: options.dryRun,
        limit: Number.isFinite(options.limit) ? options.limit : "none",
      },
      null,
      2,
    ),
  );

  while (processed < options.limit) {
    const remaining = Math.min(options.batchSize, options.limit - processed);
    let query = supabase
      .from("ai_knowledge_entries")
      .select(
        "id, tissue, structure_slug, body_region, category, title_ro, content_ro, title_en, content_en, tags, metadata",
      )
      .eq("active", true)
      .order("id", { ascending: true });

    if (options.all) {
      const start = page * options.batchSize;
      query = query.range(start, start + remaining - 1);
    } else {
      query = query.is("embedding", null).limit(remaining);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows?.length) break;

    for (const row of rows) {
      if (processed >= options.limit) break;
      processed += 1;

      const embeddingText = buildKnowledgeEmbeddingText(row);
      if (options.dryRun) {
        console.log(`DRY ${row.id} ${row.category} ${row.structure_slug ?? row.body_region ?? ""}`);
        continue;
      }

      const { vector, modelLabel } = await createEmbedding(embeddingText, env, provider);
      const { error: updateError } = await supabase
        .from("ai_knowledge_entries")
        .update({
          embedding: toPgVectorLiteral(vector),
          embedding_model: modelLabel,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) throw updateError;
      updated += 1;
      console.log(`OK  ${updated} ${row.id} ${row.category}`);

      if (options.delayMs) await delay(options.delayMs);
    }

    page += 1;
    if (rows.length < remaining) break;
  }

  console.log(`Done. processed=${processed} updated=${updated}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
