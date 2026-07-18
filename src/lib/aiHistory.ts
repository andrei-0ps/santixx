import { supabase } from "@/lib/supabase";
import type { TissueType } from "@/components/skeleton/SkeletonScene";
import { getAnatomyDisplayName, type AnatomyNameRecord } from "@/data/anatomyDisplayNames";
import { fetchAnatomyStructureName } from "@/lib/anatomyStructures";
import {
  localizedMessageContent,
  normalizeConversationLanguage,
  type ConversationLanguage,
} from "@/lib/ai/conversationLanguage";
import {
  validateStructuredAiOutput,
  type SantixStructuredAiOutput,
} from "@/lib/ai/structured-output";

export const AI_HISTORY_REFRESH_EVENT = "santix-ai-history-refresh";
export const AI_CONVERSATION_OPEN_EVENT = "santix-open-ai-conversation";
export const AI_CONVERSATION_DELETED_EVENT = "santix-ai-conversation-deleted";
export type UiLanguage = ConversationLanguage;

export interface AiConversationSummary {
  id: string;
  title: string;
  language: UiLanguage;
  structure_slug: string | null;
  model_selection_id: string | null;
  tissue: TissueType | null;
  created_at: string;
  updated_at: string;
  last_message_preview?: string;
  message_count?: number;
  structure_display_name?: string;
  structure_subtitle?: string;
}

export interface AiConversationMessage {
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
  structured?: SantixStructuredAiOutput;
}

export interface AiConversationThread {
  language: UiLanguage;
  structuredState?: unknown;
  messages: AiConversationMessage[];
}

export type OpenAiConversationDetail = AiConversationSummary;

type AiConversationRow = {
  id: string;
  title: string;
  language: string;
  structure_slug: string | null;
  model_selection_id: string | null;
  tissue: TissueType | null;
  created_at: string;
  updated_at: string;
};

type AiMessageRow = {
  role: "assistant" | "user" | "system";
  content_ro: string | null;
  content_en: string | null;
  created_at: string;
  retrieved_context?: unknown;
};

type ConversationMetadata = {
  language: UiLanguage;
  structuredState?: unknown;
};

function structuredOutputFromRetrievedContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return validateStructuredAiOutput(
    (value as { structured_output?: unknown }).structured_output,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isMissingStructuredStateColumn(error: unknown) {
  if (!isRecord(error) || typeof error.message !== "string") return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("structured_state") &&
    (message.includes("does not exist") ||
      message.includes("could not find") ||
      message.includes("schema cache"))
  );
}

function symptomStateFromRetrievedContext(value: unknown): Record<string, unknown> | null {
  const contexts = Array.isArray(value) ? value : [value];
  for (const context of contexts) {
    if (!isRecord(context)) continue;
    const symptomState = context.symptom_state;
    if (isRecord(symptomState)) return symptomState;
  }
  return null;
}

function latestStructuredStateFromMessages(messages: AiMessageRow[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const symptomState = symptomStateFromRetrievedContext(messages[index]?.retrieved_context);
    if (symptomState) return symptomState;
  }
  return undefined;
}

async function fetchConversationMetadata(conversationId: string): Promise<ConversationMetadata> {
  const { data: conversation, error } = await supabase
    .from("ai_conversations")
    .select("language, structured_state")
    .eq("id", conversationId)
    .single();

  if (!error && conversation) {
    return {
      language: normalizeConversationLanguage(conversation.language),
      structuredState: (conversation as { structured_state?: unknown }).structured_state,
    };
  }

  if (!isMissingStructuredStateColumn(error)) throw error;

  const fallback = await supabase
    .from("ai_conversations")
    .select("language")
    .eq("id", conversationId)
    .single();

  if (fallback.error) throw fallback.error;

  return {
    language: normalizeConversationLanguage(fallback.data.language),
  };
}

export async function fetchAiConversationSummaries(
  limit?: number,
  lang: UiLanguage = "ro",
): Promise<AiConversationSummary[]> {
  let query = supabase
    .from("ai_conversations")
    .select(
      "id, title, language, structure_slug, model_selection_id, tissue, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  const conversations = (data ?? []) as AiConversationRow[];
  return Promise.all(
    conversations.map(async (conversation) => {
      const [{ count }, { data: latestMessages }] = await Promise.all([
        supabase
          .from("ai_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversation.id),
        supabase
          .from("ai_messages")
          .select("content_ro, content_en, role, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const language = normalizeConversationLanguage(conversation.language);
      const latestMessage = localizedMessageContent(
        latestMessages?.[0] as AiMessageRow | undefined,
        language,
      );
      const display = await fetchConversationDisplayName(conversation, lang);
      return {
        ...conversation,
        language,
        structure_display_name: display?.title,
        structure_subtitle: display?.subtitle,
        message_count: count ?? 0,
        last_message_preview: latestMessage ? truncatePreview(latestMessage) : undefined,
      };
    }),
  );
}

export async function fetchAiConversationMessages(
  conversationId: string,
): Promise<AiConversationThread> {
  const [conversation, { data, error }] = await Promise.all([
    fetchConversationMetadata(conversationId),
    supabase
      .from("ai_messages")
      .select("role, content_ro, content_en, created_at, retrieved_context")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (error) throw error;
  const messages = (data ?? []) as AiMessageRow[];
  const language = conversation.language;
  return {
    language,
    structuredState: conversation.structuredState ?? latestStructuredStateFromMessages(messages),
    messages: messages.map((message) => ({
      role: message.role,
      content: localizedMessageContent(message, language),
      created_at: message.created_at,
      ...(structuredOutputFromRetrievedContext(message.retrieved_context)
        ? { structured: structuredOutputFromRetrievedContext(message.retrieved_context)! }
        : {}),
    })),
  };
}

export async function deleteAiConversation(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteAllAiConversations(userId: string) {
  const { error } = await supabase.from("ai_conversations").delete().eq("user_id", userId);
  if (error) throw error;
}

export function dispatchAiHistoryRefresh() {
  window.dispatchEvent(new CustomEvent(AI_HISTORY_REFRESH_EVENT));
}

export function dispatchOpenAiConversation(conversation: OpenAiConversationDetail) {
  window.dispatchEvent(
    new CustomEvent<OpenAiConversationDetail>(AI_CONVERSATION_OPEN_EVENT, { detail: conversation }),
  );
}

export function dispatchAiConversationDeleted(conversationId: string) {
  window.dispatchEvent(
    new CustomEvent<string>(AI_CONVERSATION_DELETED_EVENT, { detail: conversationId }),
  );
}

export function formatConversationRelativeTime(value: string, lang: UiLanguage = "ro") {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(date.getTime())) return "";
  if (lang === "en") {
    if (diffMs < minute) return "now";
    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} min ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} h ago`;
    if (diffMs < 2 * day) return "yesterday";

    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  if (diffMs < minute) return "acum";
  if (diffMs < hour) return `acum ${Math.max(1, Math.floor(diffMs / minute))} min`;
  if (diffMs < day) return `acum ${Math.floor(diffMs / hour)} h`;
  if (diffMs < 2 * day) return "ieri";

  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getConversationStructureLabel(
  conversation: Pick<
    AiConversationSummary,
    "model_selection_id" | "structure_slug" | "tissue" | "structure_display_name"
  >,
  lang: UiLanguage = "ro",
) {
  if (conversation.structure_display_name) return conversation.structure_display_name;
  if (conversation.model_selection_id)
    return humanizeStructureId(conversation.model_selection_id, lang);
  if (conversation.structure_slug) return humanizeStructureId(conversation.structure_slug, lang);
  if (conversation.tissue === "muschi") return lang === "en" ? "Muscle" : "Mușchi";
  if (conversation.tissue === "os") return lang === "en" ? "Bone" : "Os";
  if (conversation.tissue === "organ") return lang === "en" ? "Organs" : "Organe";
  return lang === "en" ? "Structure" : "Structură";
}

async function fetchConversationDisplayName(
  conversation: Pick<AiConversationSummary, "model_selection_id" | "structure_slug" | "tissue">,
  lang: UiLanguage = "ro",
) {
  const structure = await fetchAnatomyStructureName({
    id: conversation.model_selection_id ?? conversation.structure_slug,
    regionId: conversation.structure_slug,
    tissue: conversation.tissue,
  });

  if (!structure) return null;
  return getAnatomyDisplayName({
    dbStructure: structure as AnatomyNameRecord,
    lang,
    selection: {
      id: conversation.model_selection_id ?? conversation.structure_slug ?? "structura",
      side: "male",
      tissue: conversation.tissue ?? "os",
      label: structure.name_ro ?? undefined,
      labelEn: structure.english_name ?? undefined,
    },
  });
}

export function formatConversationTitle(title: string, lang: UiLanguage = "ro") {
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (cleanTitle.toLowerCase().startsWith("santix - ")) {
    return `${lang === "en" ? "Conversation" : "Conversație"} — ${cleanTitle.slice(9).trim()}`;
  }
  if (!cleanTitle) return lang === "en" ? "AI conversation" : "Conversație AI";

  const [prefix, ...rest] = cleanTitle.split("—");
  const target = localizeKnownStructureLabel(rest.join("—").trim(), lang);
  const normalizedPrefix = prefix.trim().toLowerCase();
  const localizedPrefix =
    lang === "en"
      ? ({
          anatomie: "Anatomy",
          durere: "Pain",
          conversație: "Conversation",
          conversatie: "Conversation",
        }[normalizedPrefix] ?? prefix.trim())
      : ({ anatomy: "Anatomie", pain: "Durere", conversation: "Conversație" }[normalizedPrefix] ??
        prefix.trim());

  return target ? `${localizedPrefix} — ${target}` : cleanTitle;
}

function humanizeStructureId(value: string, lang: UiLanguage = "ro") {
  const label = value
    .replace(/^muschi:/, "")
    .replace(/^os:/, "")
    .replace(/^tendon:/, "")
    .replace(/^organ:/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bmuschi\b/gi, "mușchi")
    .replace(/^./, (letter) => letter.toUpperCase());
  return localizeKnownStructureLabel(label, lang);
}

function localizeKnownStructureLabel(value: string, lang: UiLanguage) {
  const clean = value.replace(/\s+/g, " ").trim();
  const key = clean
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const enMap: Record<string, string> = {
    inima: "Heart",
    heart: "Heart",
    plamani: "Lungs",
    lungs: "Lungs",
  };

  const roMap: Record<string, string> = {
    inima: "Inimă",
    heart: "Inimă",
    plamani: "Plămâni",
    lungs: "Plămâni",
  };

  return (lang === "en" ? enMap[key] : roMap[key]) ?? clean;
}

function truncatePreview(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 86 ? `${clean.slice(0, 83)}...` : clean;
}
