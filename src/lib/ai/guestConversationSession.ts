import {
  validateStructuredAiOutput,
  type SantixStructuredAiOutput,
} from "./structured-output";

export const GUEST_AI_SESSION_STORAGE_KEY = "santix-guest-ai-session-v1";

const GUEST_AI_SESSION_ID_KEY = `${GUEST_AI_SESSION_STORAGE_KEY}:id`;
const GUEST_AI_SESSION_VERSION = 1;
const MAX_STORED_GUEST_MESSAGES = 64;
const MAX_STORED_MESSAGE_LENGTH = 2_400;

export type GuestAiSessionMessage = {
  role: "assistant" | "user";
  content: string;
  structured?: SantixStructuredAiOutput;
};

export type GuestAiSessionSnapshot = {
  version: typeof GUEST_AI_SESSION_VERSION;
  guestSessionId: string;
  selectionKey: string;
  messages: GuestAiSessionMessage[];
  conversationLanguage?: "ro" | "en";
  latestStructured?: SantixStructuredAiOutput | null;
  finalizedTriageOutput?: SantixStructuredAiOutput | null;
  noticeDismissed?: boolean;
  updatedAt: string;
};

export function createGuestAiSelectionKey(input: {
  selectionId?: string | null;
  tissue?: string | null;
  lang?: string | null;
}) {
  return [input.lang ?? "ro", input.tissue ?? "unknown", input.selectionId ?? "none"].join(":");
}

function getSessionStorage() {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") return null;
  return window.sessionStorage;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeContent(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, MAX_STORED_MESSAGE_LENGTH);
}

function normalizeGuestMessage(value: unknown): GuestAiSessionMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.role !== "assistant" && row.role !== "user") return null;
  const content = sanitizeContent(row.content);
  if (!content) return null;
  const structured = validateStructuredAiOutput(row.structured);
  return structured ? { role: row.role, content, structured } : { role: row.role, content };
}

export function normalizeGuestAiSessionSnapshot(value: unknown): GuestAiSessionSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== GUEST_AI_SESSION_VERSION) return null;
  if (typeof row.guestSessionId !== "string" || !row.guestSessionId.trim()) return null;
  if (typeof row.selectionKey !== "string" || !row.selectionKey.trim()) return null;
  if (!Array.isArray(row.messages)) return null;

  const messages = row.messages
    .map(normalizeGuestMessage)
    .filter((message): message is GuestAiSessionMessage => Boolean(message))
    .slice(-MAX_STORED_GUEST_MESSAGES);

  return {
    version: GUEST_AI_SESSION_VERSION,
    guestSessionId: row.guestSessionId,
    selectionKey: row.selectionKey,
    messages,
    conversationLanguage: row.conversationLanguage === "en" ? "en" : "ro",
    latestStructured: validateStructuredAiOutput(row.latestStructured),
    finalizedTriageOutput: validateStructuredAiOutput(row.finalizedTriageOutput),
    noticeDismissed: row.noticeDismissed === true,
    updatedAt:
      typeof row.updatedAt === "string" && row.updatedAt.trim()
        ? row.updatedAt
        : new Date().toISOString(),
  };
}

export function getOrCreateGuestAiSessionId() {
  const storage = getSessionStorage();
  if (!storage) return createSessionId();
  const existing = storage.getItem(GUEST_AI_SESSION_ID_KEY);
  if (existing) return existing;
  const next = createSessionId();
  storage.setItem(GUEST_AI_SESSION_ID_KEY, next);
  return next;
}

export function readGuestAiSession() {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    return normalizeGuestAiSessionSnapshot(
      JSON.parse(storage.getItem(GUEST_AI_SESSION_STORAGE_KEY) ?? "null"),
    );
  } catch {
    return null;
  }
}

export function writeGuestAiSession(snapshot: GuestAiSessionSnapshot) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.setItem(GUEST_AI_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearGuestAiSession() {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(GUEST_AI_SESSION_STORAGE_KEY);
}

export function toGuestPreviousMessages(messages: GuestAiSessionMessage[]) {
  return messages.slice(-MAX_STORED_GUEST_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content,
    structured: message.structured,
  }));
}
