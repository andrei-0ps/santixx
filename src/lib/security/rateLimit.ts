type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>;
};

type RateLimitOptions = {
  userId: string;
  action: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  source: "database" | "memory";
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function isMissingRateLimitRpc(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");

  return (
    message.includes("check_ai_rate_limit") ||
    message.includes("function") ||
    message.includes("schema cache")
  );
}

function memoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = `${options.userId}:${options.action}:${options.windowSeconds}`;
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: 0,
      source: "memory",
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      source: "memory",
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: 0,
    source: "memory",
  };
}

function parseRateLimitResult(value: unknown): RateLimitResult | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  return {
    allowed: row.allowed === true,
    remaining: typeof row.remaining === "number" ? row.remaining : 0,
    retryAfterSeconds:
      typeof row.retry_after_seconds === "number"
        ? row.retry_after_seconds
        : typeof row.retryAfterSeconds === "number"
          ? row.retryAfterSeconds
          : 0,
    source: "database",
  };
}

export async function enforceAiRateLimit(
  supabase: SupabaseRpcClient,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("check_ai_rate_limit", {
    p_action: options.action,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    if (isMissingRateLimitRpc(error)) {
      console.warn("check_ai_rate_limit RPC lipsește; folosesc limitare temporară în memorie.");
      return memoryRateLimit(options);
    }
    throw new Error(error.message ?? "Nu am putut verifica limita de utilizare AI.");
  }

  return parseRateLimitResult(data) ?? memoryRateLimit(options);
}

export function assertRateLimitAllowed(result: RateLimitResult) {
  if (result.allowed) return;
  throw new Error(
    `Prea multe cereri AI. Încearcă din nou în ${result.retryAfterSeconds || 60} secunde.`,
  );
}
