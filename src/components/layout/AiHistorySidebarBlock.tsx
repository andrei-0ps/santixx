import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bone, Bot, Clock3, Dumbbell, HeartPulse, History, Loader2, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AI_HISTORY_REFRESH_EVENT,
  deleteAllAiConversations,
  deleteAiConversation,
  dispatchAiConversationDeleted,
  dispatchOpenAiConversation,
  fetchAiConversationSummaries,
  formatConversationRelativeTime,
  formatConversationTitle,
  getConversationStructureLabel,
  type AiConversationSummary,
} from "@/lib/aiHistory";
import { useLanguage } from "@/lib/useLanguage";

const SIDEBAR_VISIBLE_COUNT = 3;

export function AiHistorySidebarBlock() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, lang } = useLanguage();
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [allConversations, setAllConversations] = useState<AiConversationSummary[]>([]);
  const [allHistoryOpen, setAllHistoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AiConversationSummary | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllLoading, setIsAllLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleConversations = conversations.slice(0, SIDEBAR_VISIBLE_COUNT);
  const hasMoreConversations = conversations.length > SIDEBAR_VISIBLE_COUNT;

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setAllConversations([]);
      return;
    }

    let cancelled = false;
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const summaries = await fetchAiConversationSummaries(SIDEBAR_VISIBLE_COUNT + 1, lang);
        if (!cancelled) setConversations(summaries);
      } catch {
        if (!cancelled) setError(t.hist_load_error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadConversations();
    window.addEventListener(AI_HISTORY_REFRESH_EVENT, loadConversations);

    return () => {
      cancelled = true;
      window.removeEventListener(AI_HISTORY_REFRESH_EVENT, loadConversations);
    };
  }, [user, lang, t.hist_load_error]);

  useEffect(() => {
    if (!allHistoryOpen || !user) return;

    let cancelled = false;
    const loadAllConversations = async () => {
      setIsAllLoading(true);
      try {
        const summaries = await fetchAiConversationSummaries(undefined, lang);
        if (!cancelled) setAllConversations(summaries);
      } catch {
        if (!cancelled) setError(t.hist_load_all_error);
      } finally {
        if (!cancelled) setIsAllLoading(false);
      }
    };

    loadAllConversations();
    window.addEventListener(AI_HISTORY_REFRESH_EVENT, loadAllConversations);

    return () => {
      cancelled = true;
      window.removeEventListener(AI_HISTORY_REFRESH_EVENT, loadAllConversations);
    };
  }, [allHistoryOpen, user, lang, t.hist_load_all_error]);

  const handleOpenConversation = async (conversation: AiConversationSummary) => {
    setAllHistoryOpen(false);
    await navigate({ to: "/explorator" });
    window.setTimeout(() => dispatchOpenAiConversation(conversation), 100);
  };

  const handleDeleteConversation = async () => {
    if (!pendingDelete || !user) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteAiConversation(pendingDelete.id, user.id);
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== pendingDelete.id),
      );
      setAllConversations((current) =>
        current.filter((conversation) => conversation.id !== pendingDelete.id),
      );
      dispatchAiConversationDeleted(pendingDelete.id);
      setPendingDelete(null);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent(AI_HISTORY_REFRESH_EVENT)), 0);
    } catch {
      setError(t.hist_delete_error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllConversations = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError(null);
    try {
      const activeIds = [...conversations, ...allConversations].map(
        (conversation) => conversation.id,
      );
      await deleteAllAiConversations(user.id);
      setConversations([]);
      setAllConversations([]);
      activeIds.forEach(dispatchAiConversationDeleted);
      setDeleteAllOpen(false);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent(AI_HISTORY_REFRESH_EVENT)), 0);
    } catch {
      setError(t.hist_delete_all_error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-auto glass rounded-3xl p-4 fade-up" style={{ animationDelay: "120ms" }}>
      <div className="mb-3 flex items-center gap-2">
        <History className="size-4 text-medical" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t.hist_title}
        </span>
      </div>

      {loading ? (
        <StatusMessage
          icon={<Loader2 className="size-4 animate-spin text-primary" />}
          title={t.hist_loading_session}
        />
      ) : !user ? (
        <StatusMessage icon={<Bot className="size-4 text-primary" />} title={t.hist_login_prompt} />
      ) : isLoading && conversations.length === 0 ? (
        <StatusMessage
          icon={<Loader2 className="size-4 animate-spin text-primary" />}
          title={t.hist_loading}
        />
      ) : error && conversations.length === 0 ? (
        <StatusMessage icon={<Bot className="size-4 text-destructive" />} title={error} />
      ) : conversations.length === 0 ? (
        <StatusMessage
          icon={<Bot className="size-4 text-primary" />}
          title={t.hist_empty}
          description={t.hist_start_prompt}
        />
      ) : (
        <div className="space-y-1.5">
          {visibleConversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              compact
              conversation={conversation}
              onOpen={() => handleOpenConversation(conversation)}
              onDelete={() => setPendingDelete(conversation)}
            />
          ))}
        </div>
      )}

      {user && hasMoreConversations && (
        <button
          type="button"
          onClick={() => setAllHistoryOpen(true)}
          className="mt-2.5 w-full rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary/35 hover:bg-primary/10"
        >
          {t.hist_see_all}
        </button>
      )}

      {allHistoryOpen && (
        <HistoryModal
          conversations={allConversations}
          isLoading={isAllLoading}
          onClose={() => setAllHistoryOpen(false)}
          onOpen={handleOpenConversation}
          onDelete={setPendingDelete}
          onDeleteAll={() => setDeleteAllOpen(true)}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteDialog
          conversation={pendingDelete}
          deleting={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConversation}
        />
      )}

      {deleteAllOpen && (
        <ConfirmDeleteAllDialog
          deleting={isDeleting}
          onCancel={() => setDeleteAllOpen(false)}
          onConfirm={handleDeleteAllConversations}
        />
      )}
    </div>
  );
}

function HistoryModal({
  conversations,
  isLoading,
  onClose,
  onOpen,
  onDelete,
  onDeleteAll,
}: {
  conversations: AiConversationSummary[];
  isLoading: boolean;
  onClose: () => void;
  onOpen: (conversation: AiConversationSummary) => void;
  onDelete: (conversation: AiConversationSummary) => void;
  onDeleteAll: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-md">
      <div className="glass-strong flex max-h-[78vh] w-full max-w-xl flex-col rounded-3xl border border-primary/15 p-5 shadow-[0_24px_80px_-32px_oklch(0.62_0.20_255_/_0.65)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight">{t.hist_all_title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.hist_subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={onDeleteAll}
                className="group flex size-8 items-center justify-center rounded-full border border-destructive/20 bg-destructive/5 text-destructive/80 transition-all hover:border-destructive/35 hover:bg-destructive/10 hover:text-destructive"
                aria-label={t.hist_delete_all}
                title={t.hist_delete_all}
              >
                <Trash2 className="size-3.5 transition-transform group-hover:scale-110" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/70"
              aria-label={t.hist_close}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <StatusMessage
              icon={<Loader2 className="size-4 animate-spin text-primary" />}
              title={t.hist_loading}
            />
          ) : conversations.length === 0 ? (
            <StatusMessage
              icon={<Bot className="size-4 text-primary" />}
              title={t.hist_empty}
              description={t.hist_start_prompt}
            />
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  onOpen={() => onOpen(conversation)}
                  onDelete={() => onDelete(conversation)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  compact = false,
  onOpen,
  onDelete,
}: {
  conversation: AiConversationSummary;
  compact?: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useLanguage();
  const Icon =
    conversation.tissue === "organ"
      ? HeartPulse
      : conversation.tissue === "muschi"
        ? Dumbbell
        : Bone;
  const formattedTitle = formatConversationTitle(conversation.title, lang);
  const title =
    conversation.structure_display_name && formattedTitle.includes("—")
      ? `${formattedTitle.split("—")[0].trim()} — ${conversation.structure_display_name}`
      : formattedTitle;
  const structureLabel = getConversationStructureLabel(conversation, lang);
  const timeLabel = formatConversationRelativeTime(conversation.updated_at, lang);

  return (
    <div
      className={[
        "group flex w-full items-center gap-2 rounded-2xl border border-primary/10 bg-primary/[0.04] text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.08]",
        compact ? "px-2.5 py-2" : "px-3 py-3",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background/40 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold tracking-tight text-foreground group-hover:text-primary">
            {title}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <span className="truncate">{structureLabel}</span>
            <span className="shrink-0">·</span>
            <span className="shrink-0 rounded-md border border-primary/15 bg-primary/5 px-1 py-0.5 text-[9px] font-bold uppercase text-primary">
              {conversation.language}
            </span>
            <span className="shrink-0">·</span>
            <Clock3 className="size-3 shrink-0" />
            <span className="shrink-0">{timeLabel}</span>
          </span>
          {!compact && conversation.last_message_preview && (
            <span className="mt-1 block truncate text-[11px] leading-snug text-muted-foreground/85">
              {conversation.last_message_preview}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={[
          "flex size-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive",
          compact ? "opacity-0 group-hover:opacity-100 focus:opacity-100" : "",
        ].join(" ")}
        aria-label={t.hist_delete_conv}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function ConfirmDeleteDialog({
  conversation,
  deleting,
  onCancel,
  onConfirm,
}: {
  conversation: AiConversationSummary;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t, lang } = useLanguage();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/75 px-4 backdrop-blur-md">
      <div className="glass-strong w-full max-w-sm rounded-3xl border border-destructive/25 p-5">
        <h2 className="text-base font-black tracking-tight">{t.hist_confirm_delete}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          „{formatConversationTitle(conversation.title, lang)}" {t.hist_will_be_removed}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-2xl border border-primary/15 bg-background/35 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {t.hist_cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-2xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {deleting ? t.hist_deleting : t.hist_delete}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteAllDialog({
  deleting,
  onCancel,
  onConfirm,
}: {
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/75 px-4 backdrop-blur-md">
      <div className="glass-strong w-full max-w-sm rounded-3xl border border-destructive/25 p-5">
        <h2 className="text-base font-black tracking-tight">{t.hist_confirm_delete_all}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.hist_confirm_delete_all_desc}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-2xl border border-primary/15 bg-background/35 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {t.hist_cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-2xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {deleting ? t.hist_deleting : t.hist_delete_all_btn}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-xs font-semibold leading-snug text-foreground/90">{title}</p>
          {description && (
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
