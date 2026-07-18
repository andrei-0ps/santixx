/**
 * Sidebar — istoricul conversațiilor cu asistentul AI Santix.
 *
 * Navigarea trăiește EXCLUSIV în header. Acest panou din stânga este dedicat
 * integral conversațiilor: un buton „Conversație nouă" sus, o căutare și lista
 * de conversații grupată pe date (Astăzi / Ieri / Ultimele 7 zile / Mai demult),
 * scrollabilă pe toată înălțimea. Reactiv la temă prin tokenii semantici.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bone,
  Bot,
  Check,
  Clock3,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  isOnboardingDone,
  ONBOARDING_DONE_KEY,
  ONBOARDING_STEP_EVENT,
  ONBOARDING_STEPS,
  ONBOARDING_STEPS_KEY,
  readOnboardingSteps,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AI_HISTORY_REFRESH_EVENT,
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

type Bucket = "today" | "yesterday" | "week" | "older";

const BUCKET_ORDER: Bucket[] = ["today", "yesterday", "week", "older"];
const BUCKET_LABEL: Record<Bucket, { ro: string; en: string }> = {
  today: { ro: "Astăzi", en: "Today" },
  yesterday: { ro: "Ieri", en: "Yesterday" },
  week: { ro: "Ultimele 7 zile", en: "Previous 7 days" },
  older: { ro: "Mai demult", en: "Older" },
};

function bucketOf(dateStr: string): Bucket {
  const t = new Date(dateStr).getTime();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  if (Number.isNaN(t)) return "older";
  if (t >= startToday) return "today";
  if (t >= startToday - day) return "yesterday";
  if (t >= startToday - 7 * day) return "week";
  return "older";
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
} = {}) {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AiConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Stagiul de Inițiere (onboarding interactiv) ──
  const [obSteps, setObSteps] = useState<Set<OnboardingStepId>>(
    () => new Set(readOnboardingSteps()),
  );
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const [toast, setToast] = useState<string | null>(null);
  const obStepsRef = useRef(obSteps);
  obStepsRef.current = obSteps;
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!showOnboarding) return;
    const onStep = (e: Event) => {
      const step = (e as CustomEvent<OnboardingStepId>).detail;
      if (!step || obStepsRef.current.has(step)) return;
      const next = new Set(obStepsRef.current);
      next.add(step);
      obStepsRef.current = next;
      window.localStorage.setItem(ONBOARDING_STEPS_KEY, JSON.stringify([...next]));
      setObSteps(next);
      // recompensă: +50 XP per abilitate deblocată
      const xp = Number(window.localStorage.getItem("santix-xp") || 0) + 50;
      window.localStorage.setItem("santix-xp", String(xp));
      const def = ONBOARDING_STEPS.find((s) => s.id === step);
      if (def) {
        setToast(isEn ? def.rewardEn : def.rewardRo);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 2600);
      }
      if (next.size === ONBOARDING_STEPS.length) {
        window.localStorage.setItem(ONBOARDING_DONE_KEY, "1");
        // lasă utilizatorul să vadă ultima bifă, apoi fade-out elegant
        window.setTimeout(() => {
          setShowOnboarding(false);
          setToast(
            isEn
              ? "Initiation complete — welcome aboard!"
              : "Stagiu de inițiere finalizat — bine ai venit!",
          );
          window.clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setToast(null), 3200);
        }, 1300);
      }
    };
    window.addEventListener(ONBOARDING_STEP_EVENT, onStep);
    return () => window.removeEventListener(ONBOARDING_STEP_EVENT, onStep);
  }, [showOnboarding, isEn]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const summaries = await fetchAiConversationSummaries(undefined, lang);
        if (!cancelled) setConversations(summaries);
      } catch {
        if (!cancelled)
          setError(isEn ? "Couldn't load the history." : "Nu am putut încărca istoricul.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    window.addEventListener(AI_HISTORY_REFRESH_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(AI_HISTORY_REFRESH_EVENT, load);
    };
  }, [user, lang, isEn]);

  // Drawer (sub lg): Escape îl închide, iar cât e deschis blocăm scroll-ul din
  // spate ca gestul de derulare să rămână în panou.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onCloseMobile]);

  const openConversation = async (conversation: AiConversationSummary) => {
    onCloseMobile?.();
    await navigate({ to: "/explorator" });
    window.setTimeout(() => dispatchOpenAiConversation(conversation), 100);
  };

  const handleDelete = async () => {
    if (!pendingDelete || !user) return;
    setIsDeleting(true);
    try {
      await deleteAiConversation(pendingDelete.id, user.id);
      setConversations((current) => current.filter((c) => c.id !== pendingDelete.id));
      dispatchAiConversationDeleted(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError(isEn ? "Couldn't delete the conversation." : "Nu am putut șterge conversația.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      `${formatConversationTitle(c.title, lang)} ${getConversationStructureLabel(c, lang)}`
        .toLowerCase()
        .includes(q),
    );
  }, [conversations, query, lang]);

  const groups = useMemo(() => {
    const map: Record<Bucket, AiConversationSummary[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    for (const c of filtered) map[bucketOf(c.updated_at)].push(c);
    return BUCKET_ORDER.map((b) => ({ bucket: b, items: map[b] })).filter(
      (g) => g.items.length > 0,
    );
  }, [filtered]);

  const hasConversations = conversations.length > 0;

  return (
    <>
      {/* fundal semi-transparent — doar sub lg, închide prin click în afară */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            aria-hidden
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          "w-72 shrink-0 flex-col gap-3 p-4 pr-2",
          // sub lg: panou glisant peste conținut, cu suprafață proprie
          "fixed inset-y-0 left-0 z-50 flex max-w-[85vw] overflow-y-auto",
          "border-r border-primary/15 bg-background/95 backdrop-blur-xl",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          mobileOpen ? "translate-x-0" : "invisible -translate-x-full",
          // de la lg în sus: exact coloana statică de dinainte
          "lg:visible lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible",
          "lg:border-r-0 lg:bg-transparent lg:backdrop-blur-none",
        ].join(" ")}
      >
        {/* buton de închidere — doar în modul drawer */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t.nav_close_menu}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-xl border border-primary/15 bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground lg:hidden"
        >
          <X className="size-4" />
        </button>
        {/* Stagiul de Inițiere — ghid interactiv pentru utilizatorii noi */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.section
              key="onboarding"
              initial={false}
              exit={{ opacity: 0, y: -14, height: 0, marginBottom: -12 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="glass glass-highlight shrink-0 overflow-hidden rounded-3xl p-4"
            >
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/15 ring-1 ring-primary/30">
                  <GraduationCap className="size-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black tracking-tight text-foreground">
                    {isEn ? "Initiation Stage" : "Stagiul de Inițiere"}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {isEn ? "Interactive guide" : "Ghid interactiv"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-primary">
                  {obSteps.size}/{ONBOARDING_STEPS.length}
                </span>
              </div>

              <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={false}
                  animate={{ width: `${(obSteps.size / ONBOARDING_STEPS.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </div>

              <ul className="space-y-1.5">
                {ONBOARDING_STEPS.map((s) => {
                  const done = obSteps.has(s.id);
                  return (
                    <li
                      key={s.id}
                      className={`flex items-start gap-2.5 rounded-2xl border px-3 py-2 transition-colors duration-300 ${
                        done
                          ? "border-emerald-500/30 bg-emerald-500/[0.07]"
                          : "border-primary/10 bg-primary/[0.03]"
                      }`}
                    >
                      {done ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 480, damping: 18 }}
                          className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <span className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-muted-foreground/40" />
                      )}
                      <span
                        className={`text-[11.5px] leading-snug transition-all duration-300 ${
                          done ? "text-muted-foreground line-through" : "text-foreground/90"
                        }`}
                      >
                        {isEn ? s.en : s.ro}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        {/* toast recompensă (colțul ecranului) */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-[#0c1410]/95 px-4 py-2.5 text-[12.5px] font-bold text-emerald-400 shadow-[0_14px_40px_-14px_rgba(16,185,129,0.6)] backdrop-blur-md"
            >
              <Sparkles className="size-4" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        {hasConversations && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isEn ? "Search conversations" : "Caută în conversații"}
              className="w-full rounded-2xl border border-primary/10 bg-primary/[0.04] py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary/30 focus:outline-none"
            />
          </div>
        )}

        {/* History list */}
        <div
          className="glass fade-up flex min-h-0 flex-1 flex-col overflow-y-auto rounded-3xl p-2.5"
          style={{ animationDelay: "60ms" }}
        >
          {loading ? (
            <Status
              icon={<Loader2 className="size-7 animate-spin text-primary" />}
              title={isEn ? "Loading session…" : "Se încarcă sesiunea…"}
            />
          ) : !user ? (
            <Status
              icon={<Bot className="size-7 text-primary" />}
              title={
                isEn ? "Sign in to see your AI history" : "Autentifică-te ca să vezi istoricul AI"
              }
              description={
                isEn
                  ? "Your conversations with the Santix assistant show up here."
                  : "Conversațiile cu asistentul Santix apar aici."
              }
            />
          ) : isLoading && conversations.length === 0 ? (
            <Status
              icon={<Loader2 className="size-7 animate-spin text-primary" />}
              title={isEn ? "Loading…" : "Se încarcă…"}
            />
          ) : error && conversations.length === 0 ? (
            <Status icon={<Bot className="size-7 text-destructive" />} title={error} />
          ) : filtered.length === 0 ? (
            <Status
              icon={<Bot className="size-7 text-primary" />}
              title={
                query
                  ? isEn
                    ? "No matching conversations"
                    : "Nicio conversație potrivită"
                  : isEn
                    ? "No conversations yet"
                    : "Nicio conversație încă"
              }
              description={
                query
                  ? undefined
                  : isEn
                    ? "Use New conversation to ask the AI about a structure."
                    : "Apasă pe Conversație nouă ca să întrebi AI-ul despre o structură."
              }
            />
          ) : (
            <div className="space-y-3">
              {groups.map(({ bucket, items }) => (
                <div key={bucket}>
                  <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    {isEn ? BUCKET_LABEL[bucket].en : BUCKET_LABEL[bucket].ro}
                  </div>
                  <div className="space-y-1">
                    {items.map((conversation, index) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.035, 0.3) }}
                      >
                        <ConversationRow
                          conversation={conversation}
                          lang={lang}
                          onOpen={() => openConversation(conversation)}
                          onDelete={() => setPendingDelete(conversation)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pendingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/75 px-4 backdrop-blur-md">
            <div className="glass-strong w-full max-w-sm rounded-3xl border border-destructive/25 p-5">
              <h2 className="text-base font-black tracking-tight">
                {isEn ? "Delete conversation?" : "Ștergi conversația?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                „{formatConversationTitle(pendingDelete.title, lang)}"{" "}
                {isEn ? "will be permanently removed." : "va fi ștearsă definitiv."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={isDeleting}
                  className="rounded-2xl border border-primary/15 bg-background/35 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {isEn ? "Cancel" : "Anulează"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-2xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {isDeleting ? (isEn ? "Deleting…" : "Se șterge…") : isEn ? "Delete" : "Șterge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function ConversationRow({
  conversation,
  lang,
  onOpen,
  onDelete,
}: {
  conversation: AiConversationSummary;
  lang: "ro" | "en";
  onOpen: () => void;
  onDelete: () => void;
}) {
  const Icon =
    conversation.tissue === "organ"
      ? HeartPulse
      : conversation.tissue === "muschi"
        ? Dumbbell
        : Bone;
  const title = formatConversationTitle(conversation.title, lang);
  const structureLabel = getConversationStructureLabel(conversation, lang);
  const timeLabel = formatConversationRelativeTime(conversation.updated_at, lang);

  return (
    <div className="group flex w-full items-center gap-2 rounded-2xl border border-transparent px-2 py-2 transition-all hover:border-primary/20 hover:bg-primary/[0.06]">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.06] text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground group-hover:text-primary">
            {title}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="truncate">{structureLabel}</span>
            <span className="shrink-0">·</span>
            <Clock3 className="size-3 shrink-0" />
            <span className="shrink-0">{timeLabel}</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={lang === "en" ? "Delete conversation" : "Șterge conversația"}
        className="flex size-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function Status({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="my-auto flex flex-col items-center gap-4 px-5 py-8 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-primary/25 to-accent/10 ring-1 ring-primary/25">
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-bold leading-snug text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-2 max-w-[220px] text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
