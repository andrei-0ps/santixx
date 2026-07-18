import { useCallback, useEffect, useRef, useState } from "react";
import { type Bone, categoryLabels, categoryLabelsEn } from "@/data/bones";
import {
  X,
  BookMarked,
  Sparkles,
  AlertTriangle,
  Activity,
  Layers,
  Bot,
  Compass,
  Send,
  UserRound,
  HeartPulse,
  FileText,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { askSelectionAi, type AiContextSwitchAction } from "@/lib/ai-chat.functions";
import type { SantixStructuredAiOutput } from "@/lib/ai/structured-output";
import {
  buildConsultationSheetModel,
  canGenerateTriagePdf,
  ConsultationSheetValidationError,
  renderConsultationSheetPdf,
  type SantixTriagePdfReport,
  validateConsultationSheetModel,
} from "@/lib/ai/triagePdf";
import {
  buildTriageOrientation,
  normalizeTriageRedFlagLevel,
} from "@/lib/ai/conversationalPolicy";
import { classifyAnatomyStructure, translateCurriculumInfo } from "@/data/anatomyCurriculum";
import { getAnatomyDisplayName } from "@/data/anatomyDisplayNames";
import {
  AI_CONVERSATION_DELETED_EVENT,
  dispatchAiHistoryRefresh,
  fetchAiConversationMessages,
} from "@/lib/aiHistory";
import type { AnatomyStructureNameRow } from "@/lib/anatomyStructures";
import type { BoneSelection, TissueType } from "./SkeletonScene";
import type { LayerMode } from "./LayersToggle";
import { getInternalOrgan, type InternalOrgan } from "@/data/internalOrgans";
import { localizeInternalOrgan } from "@/data/organLocalization";
import { dispatchOnboardingStep } from "@/lib/onboarding";
import {
  shouldAcceptConversationStateResponse,
  validateConversationState,
  type ConversationStateV1,
} from "@/lib/ai/conversation/conversationState";
import { getConversationQuestionPlaceholder } from "@/lib/ai/conversation/questionTypes";
import {
  createGuestAiSelectionKey,
  getOrCreateGuestAiSessionId,
  readGuestAiSession,
  toGuestPreviousMessages,
  writeGuestAiSession,
} from "@/lib/ai/guestConversationSession";
import { useLanguage } from "@/lib/useLanguage";

interface Props {
  bone: Bone | null;
  selection: BoneSelection | null;
  onClose: () => void;
  onContextSwitch?: (action: AiContextSwitchAction) => void;
  onActiveFlowChange?: (active: boolean) => void;
  preserveAiStateOnSelectionChange?: boolean;
  visualLayer?: LayerMode;
  openConversationId?: string | null;
}

type ContextSwitchSuggestion = {
  action: AiContextSwitchAction;
  prompt: string;
  /** null în sesiunile guest — nu există conversație salvată de reluat. */
  conversationId: string | null;
  key: string;
};

type AiChatMessage = {
  role: "assistant" | "user";
  content: string;
  structured?: SantixStructuredAiOutput;
};

type TechnicalDetail = {
  label: string;
  value: string;
};

type AnatomyDetailSource = Record<string, unknown>;

function shouldAutoRedirect(action: AiContextSwitchAction | undefined): boolean {
  return Boolean(
    action?.should_switch_context &&
    action.confidence === "high" &&
    action.target_layer &&
    action.target_structure_slug &&
    (action.selected_context_fit === "different_body_region_detected" ||
      action.selected_context_fit === "likely_muscular_but_bone_selected" ||
      action.selected_context_fit === "likely_bone_joint_but_muscle_selected"),
  );
}

function shouldShowContextSuggestion(action: AiContextSwitchAction | undefined) {
  if (shouldAutoRedirect(action)) return false;
  return Boolean(
    action?.should_switch_context &&
    action.confidence === "high" &&
    action.target_layer &&
    action.target_structure_slug &&
    (action.selected_context_fit === "likely_organ_but_other_selected" ||
      action.selected_context_fit === "red_flag_priority"),
  );
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function latestTriageStructured(messages: AiChatMessage[]) {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.structured?.triageState)
      ?.structured ?? null
  );
}

function triageOriginalProblem(structured: SantixStructuredAiOutput | null) {
  const state = structured?.triageState;
  if (!state || typeof state !== "object") return null;
  const value = state.originalProblem;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstUserQuestion(messages: AiChatMessage[]) {
  return (
    messages.find((message) => message.role === "user" && message.content.trim())?.content.trim() ??
    null
  );
}

function triageLevelOf(structured: SantixStructuredAiOutput | null) {
  return (
    normalizeTriageRedFlagLevel(
      structured?.redFlagLevel ?? structured?.triageState?.redFlagLevel,
    ) ?? "needs_more_info"
  );
}

function summaryWithTriageOrientation(
  summary: string,
  structured: SantixStructuredAiOutput | null,
  lang: "ro" | "en",
) {
  if (/Orientare Santix:|Santix guidance:/i.test(summary)) return summary;
  return `${summary}\n${buildTriageOrientation(triageLevelOf(structured), lang)}`;
}

async function downloadTriagePdf(report: SantixTriagePdfReport) {
  const model = buildConsultationSheetModel(report, report.lang ?? "ro");
  const validation = validateConsultationSheetModel(model);
  if (!validation.valid) throw new ConsultationSheetValidationError(validation.reasons);
  const rendered = await renderConsultationSheetPdf(model);
  if (rendered.bytes.length < 1_000 || rendered.pageCount < 1 || rendered.textBlockCount < 1) {
    throw new ConsultationSheetValidationError(["empty_render_output"]);
  }
  const pdfBuffer = new ArrayBuffer(rendered.bytes.byteLength);
  new Uint8Array(pdfBuffer).set(rendered.bytes);
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.lang === "en" ? "santix-consultation-sheet.pdf" : "santix-fisa-medic.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function getTechnicalDetails(input: {
  bone: Bone | null;
  selection: BoneSelection;
  dbStructure?: AnatomyStructureNameRow | null;
  curriculum: ReturnType<typeof classifyAnatomyStructure>;
  functionText: string;
  labels: { origin: string; insertion: string; innervation: string; action: string };
  lang: "ro" | "en";
  organ?: InternalOrgan;
}): TechnicalDetail[] {
  const selectionSource = input.selection as unknown as AnatomyDetailSource;
  const boneSource = (input.bone ?? {}) as AnatomyDetailSource;
  const dbSource = (input.dbStructure ?? {}) as AnatomyDetailSource;
  const organ = input.organ ?? getInternalOrgan(input.selection.id);
  const region = input.selection.regionLabel ?? input.curriculum.subgroup ?? input.curriculum.group;
  const segment = input.curriculum.segment.toLowerCase();
  const group = input.curriculum.group.toLowerCase();
  const aspect = input.curriculum.aspect?.toLowerCase();
  const placementText = aspect
    ? `${input.curriculum.group}, ${input.curriculum.segment}, ${aspect}`
    : `${input.curriculum.group}, ${input.curriculum.segment}`;

  const isEn = input.lang === "en";

  const origin =
    firstString(
      selectionSource.origine,
      selectionSource.origin,
      selectionSource.origin_ro,
      dbSource.origine,
      dbSource.origin,
      dbSource.origin_ro,
      boneSource.origine,
      boneSource.origin,
      boneSource.origin_ro,
      organ?.technical.origin,
    ) ??
    (input.selection.tissue === "os"
      ? isEn
        ? `Part of ${input.curriculum.group.toLowerCase()}, in the ${input.curriculum.segment.toLowerCase()} segment.`
        : `Parte a ${input.curriculum.group.toLowerCase()}, în segmentul ${input.curriculum.segment.toLowerCase()}.`
      : isEn
        ? `Starting landmarks within ${placementText}.`
        : `Repere de pornire încadrate în ${placementText}.`);

  const insertion =
    firstString(
      selectionSource.inserție,
      selectionSource.insertie,
      selectionSource.insertion,
      selectionSource.insertion_ro,
      dbSource.inserție,
      dbSource.insertie,
      dbSource.insertion,
      dbSource.insertion_ro,
      boneSource.inserție,
      boneSource.insertie,
      boneSource.insertion,
      boneSource.insertion_ro,
      organ?.technical.insertion,
    ) ??
    (input.selection.tissue === "tendon"
      ? isEn
        ? `Associated with the ${region.toLowerCase()} area and force transmission to adjacent structures.`
        : `Asociată cu zona ${region.toLowerCase()} și transmiterea forței către structurile vecine.`
      : isEn
        ? `Continues to adjacent structures in the ${region.toLowerCase()} area, contributing to ${segment} segment movement.`
        : `Se continuă către structurile vecine din zona ${region.toLowerCase()}, contribuind la mișcarea segmentului ${segment}.`);

  const innervation =
    firstString(
      selectionSource.inervație,
      selectionSource.inervatie,
      selectionSource.innervation,
      selectionSource.innervation_ro,
      dbSource.inervație,
      dbSource.inervatie,
      dbSource.innervation,
      dbSource.innervation_ro,
      boneSource.inervație,
      boneSource.inervatie,
      boneSource.innervation,
      boneSource.innervation_ro,
      organ?.technical.innervation,
    ) ??
    (input.selection.tissue === "os"
      ? isEn
        ? "Not directly applicable as in muscles; sensitivity is related to the periosteum and adjacent structures."
        : "Nu se aplică direct ca la mușchi; sensibilitatea este legată de periost și structurile vecine."
      : isEn
        ? `Controlled by nerves serving the ${group} group; exact detail may vary depending on the selected fascicle.`
        : `Controlată de nervii care deservesc grupa ${group}; detaliul exact poate varia în funcție de fasciculul selectat.`);

  const action =
    firstString(
      selectionSource.acțiune,
      selectionSource.actiune,
      selectionSource.action,
      selectionSource.action_ro,
      dbSource.acțiune,
      dbSource.actiune,
      dbSource.action,
      dbSource.action_ro,
      boneSource.acțiune,
      boneSource.actiune,
      boneSource.action,
      boneSource.action_ro,
      boneSource.funcție,
      organ?.technical.action,
    ) ?? input.functionText;

  return [
    { label: input.labels.origin, value: origin },
    { label: input.labels.insertion, value: insertion },
    { label: input.labels.innervation, value: innervation },
    { label: input.labels.action, value: action },
  ];
}

export function BoneInfoPanel({
  bone,
  selection,
  onClose,
  onContextSwitch,
  onActiveFlowChange,
  preserveAiStateOnSelectionChange = false,
  visualLayer = "complete",
  openConversationId = null,
}: Props) {
  const { session, user } = useAuth();
  const { lang, t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  // ── Auto-scroll în conversația AI: fiecare mesaj nou (întrebarea următoare a
  // asistentului) e adus în vizor. ──
  const aiScrollRef = useRef<HTMLDivElement | null>(null);
  // Cât timp utilizatorul stă lipit de finalul conversației, mesajele noi se
  // aduc singure în vizor; dacă derulează în sus ca să recitească, îl lăsăm.
  const aiPinnedToBottomRef = useRef(true);

  const smoothBehavior = (): ScrollBehavior =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiConversationId, setAiConversationId] = useState<string | undefined>();
  const [aiConversationLanguage, setAiConversationLanguage] = useState<"ro" | "en" | undefined>();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [finalizedTriageOutput, setFinalizedTriageOutput] =
    useState<SantixStructuredAiOutput | null>(null);
  const [restoredConversationState, setRestoredConversationState] =
    useState<ConversationStateV1 | null>(null);
  const [contextSuggestion, setContextSuggestion] = useState<ContextSwitchSuggestion | null>(null);
  const guestSessionIdRef = useRef<string | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const conversationStateRef = useRef<ConversationStateV1 | null>(null);

  const getGuestSessionId = useCallback(() => {
    if (!guestSessionIdRef.current) {
      guestSessionIdRef.current = getOrCreateGuestAiSessionId();
    }
    return guestSessionIdRef.current;
  }, []);

  // Conversația AI: fiecare mesaj nou (inclusiv indicatorul „se încarcă") aduce
  // finalul listei în vizor, ca următoarea întrebare să fie mereu vizibilă.
  // Derulăm containerul în sine, nu prin scrollIntoView, ca panoul din jur să
  // rămână pe loc — lista are propriul overflow.
  useEffect(() => {
    const container = aiScrollRef.current;
    if (!container) return;
    // Conversație nouă / resetată: revenim la comportamentul lipit de final.
    if (aiMessages.length === 0) aiPinnedToBottomRef.current = true;
    if (!aiPinnedToBottomRef.current) return;
    const raf = window.requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: smoothBehavior() });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [aiMessages, aiLoading]);

  const handleAiScroll = () => {
    const container = aiScrollRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    aiPinnedToBottomRef.current = distanceFromBottom < 48;
  };

  const previousSelectionKeyRef = useRef<string | null>(null);
  const shownSuggestionKeysRef = useRef<Set<string>>(new Set());

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 700;
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("bonePanelWidth") : null;
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(saved))) : 360;
  });
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Sub lg lățimea vine din clase (inset-x-3), nu din stil inline.
  const [isWideViewport, setIsWideViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsWideViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const panelWidthStyle = isWideViewport ? { width: panelWidth } : undefined;

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = panelWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [panelWidth],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setPanelWidth(next);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setPanelWidth((w) => {
        localStorage.setItem("bonePanelWidth", String(w));
        return w;
      });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const TISSUE_META: Record<
    TissueType,
    { label: string; Icon: typeof BookMarked; tagBg: string; tagText: string }
  > = {
    os: {
      label: t.bone_tissue_bone,
      Icon: BookMarked,
      tagBg: "bg-primary/15 border-primary/25",
      tagText: "text-primary",
    },
    muschi: {
      label: t.bone_tissue_muscle,
      Icon: Activity,
      tagBg: "bg-medical/15 border-medical/30",
      tagText: "text-medical",
    },
    tendon: {
      label: t.bone_tissue_tendon,
      Icon: Layers,
      tagBg: "bg-accent/15 border-accent/30",
      tagText: "text-accent-foreground",
    },
    organ: {
      label: t.bone_tissue_organ,
      Icon: HeartPulse,
      tagBg: "bg-primary/15 border-primary/30",
      tagText: "text-primary",
    },
  };

  useEffect(() => {
    setError(null);
    setAiError(null);
    setFinalizedTriageOutput(null);
    setRestoredConversationState(null);
    setContextSuggestion(null);
  }, [lang]);

  useEffect(() => {
    const selectionKey = selection
      ? `${selection.side}:${selection.tissue}:${selection.regionId ?? ""}:${selection.id}`
      : null;
    if (preserveAiStateOnSelectionChange) return;
    if (previousSelectionKeyRef.current === selectionKey) return;
    activeRequestRef.current = null;
    previousSelectionKeyRef.current = selectionKey;
    if (!user && selection) {
      const guestSnapshot = readGuestAiSession();
      const guestSelectionKey = createGuestAiSelectionKey({
        selectionId: selection.id,
        tissue: selection.tissue,
        lang,
      });
      if (guestSnapshot?.selectionKey === guestSelectionKey) {
        guestSessionIdRef.current = guestSnapshot.guestSessionId;
        setError(null);
        setAiInput("");
        setAiMessages(guestSnapshot.messages);
        setAiConversationId(undefined);
        setAiConversationLanguage(guestSnapshot.conversationLanguage);
        setFinalizedTriageOutput(guestSnapshot.finalizedTriageOutput ?? null);
        setRestoredConversationState(
          validateConversationState(guestSnapshot.latestStructured?.triageState),
        );
        setAiLoading(false);
        setAiError(null);
        setContextSuggestion(null);
        return;
      }
    }
    setError(null);
    setAiInput("");
    setAiMessages([]);
    setAiConversationId(undefined);
    setAiConversationLanguage(undefined);
    setFinalizedTriageOutput(null);
    setRestoredConversationState(null);
    setAiLoading(false);
    setAiError(null);
    setContextSuggestion(null);
  }, [lang, preserveAiStateOnSelectionChange, selection, user]);

  useEffect(() => {
    if (!openConversationId) return;
    let cancelled = false;
    setAiLoading(true);
    setAiError(null);
    fetchAiConversationMessages(openConversationId)
      .then((thread) => {
        if (cancelled) return;
        setAiConversationId(openConversationId);
        setAiConversationLanguage(thread.language);
        setRestoredConversationState(
          validateConversationState(thread.structuredState, {
            conversationId: openConversationId,
          }),
        );
        setAiMessages(
          thread.messages
            .filter((m) => m.role === "assistant" || m.role === "user")
            .map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
              ...(m.structured ? { structured: m.structured } : {}),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setAiError(t.bone_err_reopen);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openConversationId, t.bone_err_reopen]);

  useEffect(() => {
    const handleDeletedConversation = (event: Event) => {
      const deletedId = (event as CustomEvent<string>).detail;
      if (!deletedId || deletedId !== aiConversationId) return;
      setAiConversationId(undefined);
      setAiConversationLanguage(undefined);
      setAiMessages([]);
      setFinalizedTriageOutput(null);
      setRestoredConversationState(null);
      setAiInput("");
      setAiError(null);
      setAiLoading(false);
      setContextSuggestion(null);
    };
    window.addEventListener(AI_CONVERSATION_DELETED_EVENT, handleDeletedConversation);
    return () =>
      window.removeEventListener(AI_CONVERSATION_DELETED_EVENT, handleDeletedConversation);
  }, [aiConversationId]);

  useEffect(() => {
    if (user || !selection || openConversationId) return;
    if (aiMessages.length === 0 && !finalizedTriageOutput) return;
    const latestStructured = finalizedTriageOutput ?? latestTriageStructured(aiMessages);
    writeGuestAiSession({
      version: 1,
      guestSessionId: getGuestSessionId(),
      selectionKey: createGuestAiSelectionKey({
        selectionId: selection.id,
        tissue: selection.tissue,
        lang,
      }),
      messages: aiMessages,
      conversationLanguage: aiConversationLanguage ?? lang,
      latestStructured,
      finalizedTriageOutput,
      updatedAt: new Date().toISOString(),
    });
  }, [
    aiConversationLanguage,
    aiMessages,
    finalizedTriageOutput,
    getGuestSessionId,
    lang,
    openConversationId,
    selection,
    user,
  ]);

  const latestStructuredConversationState = validateConversationState(
    latestTriageStructured(aiMessages)?.triageState,
    { conversationId: aiConversationId ?? null },
  );
  const activeConversationState =
    latestStructuredConversationState ?? restoredConversationState;

  useEffect(() => {
    conversationStateRef.current = activeConversationState;
  }, [activeConversationState]);

  const hasActiveConversationFlow = Boolean(
    activeConversationState?.activeFlow &&
      activeConversationState.currentQuestionId &&
      activeConversationState.phase !== "completed",
  );

  useEffect(() => {
    onActiveFlowChange?.(hasActiveConversationFlow);
  }, [hasActiveConversationFlow, onActiveFlowChange]);

  if (!selection) return null;

  const tissue = selection.tissue;
  const selectedOrgan = localizeInternalOrgan(
    tissue === "organ" ? getInternalOrgan(selection.id) : undefined,
    lang,
  );
  const aiLayer = tissue === "organ" ? "organs" : tissue === "muschi" ? "muscular" : "skeleton";
  const aiLayerLabel =
    tissue === "organ"
      ? t.layers_organs
      : aiLayer === "muscular"
        ? t.layers_muscles
        : t.layers_skeleton;
  const serverVisualLayer =
    visualLayer === "muscles" ? "muscular" : visualLayer === "organs" ? "organs" : visualLayer;
  const completeLayerNote = visualLayer === "complete" ? t.bone_full_mode_notice : null;
  const debugAiEnabled =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debugAi") === "1";
  const aiInputPlaceholder = getConversationQuestionPlaceholder({
    questionId: activeConversationState?.currentQuestionId,
    questionType: activeConversationState?.currentQuestionType,
    questionPlaceholder: activeConversationState?.currentQuestionPlaceholder,
    locale: lang,
    fallback:
      tissue === "organ"
        ? t.bone_placeholder_organ
        : tissue === "os"
          ? t.bone_placeholder_injury
          : t.bone_placeholder_movement,
  });
  const meta = TISSUE_META[tissue];
  const Icon = meta.Icon;
  const curriculumRaw = classifyAnatomyStructure({
    tissue,
    label: selection.label,
    labelEn: selection.labelEn,
    id: selection.id,
  });
  const curriculum = translateCurriculumInfo(curriculumRaw, lang);

  const displayInfo = getAnatomyDisplayName({
    bone,
    selection,
    lang,
  });
  const displayName = selectedOrgan?.popularName ?? displayInfo.display_name;
  const displayTitle = selectedOrgan?.popularName ?? displayInfo.title;
  const aiStructureName = displayTitle;
  const aiTechnicalStructureName =
    selectedOrgan?.scientificName ??
    displayInfo.subtitle ??
    (lang === "en" ? selection.labelEn : selection.label) ??
    selection.labelEn ??
    selection.label;
  const categoryLabelsLang = lang === "en" ? categoryLabelsEn : categoryLabels;
  const categoryText =
    selectedOrgan?.category ?? (bone ? categoryLabelsLang[bone.category] : curriculum.group);

  const isEn = lang === "en";
  const description =
    selectedOrgan?.description ??
    (isEn ? (bone?.description_en ?? bone?.description) : bone?.description) ??
    (tissue === "organ"
      ? isEn
        ? "Internal organ included in the complete Santix visualization."
        : "Organ intern inclus în vizualizarea completă Santix."
      : tissue === "muschi"
        ? isEn
          ? "Part of the muscular system. It helps the body move by contracting and working with bones and tendons."
          : "Parte din sistemul muscular. Ajută corpul să se miște prin contractare și lucrează împreună cu oasele și tendoanele."
        : tissue === "tendon"
          ? isEn
            ? "Strong connective tissue that helps keep the area stable and passes force from muscle to bone."
            : "Țesut rezistent care ajută zona să fie stabilă și transmite forța de la mușchi către os."
          : isEn
            ? "Part of the skeleton. It helps support the body, protect nearby areas and make movement possible."
            : "Parte a scheletului. Ajută la susținerea corpului, protejează zone apropiate și face mișcarea posibilă.");

  const funcText =
    selectedOrgan?.function ??
    (isEn ? (bone?.functie_en ?? bone?.funcție) : bone?.funcție) ??
    curriculum.functionHint;
  const isCompleteAnatomyMode = visualLayer === "complete";
  const isOrganSelection = tissue === "organ";
  const hideAssistantInComplete = isCompleteAnatomyMode;

  const technicalDetails = getTechnicalDetails({
    bone,
    selection,
    curriculum,
    functionText: funcText,
    organ: selectedOrgan,
    labels: {
      origin: t.bone_origin,
      insertion: t.bone_insertion,
      innervation: t.bone_innervation,
      action: t.bone_action,
    },
    lang,
  });

  const latestTriage = latestTriageStructured(aiMessages);
  const canFinalizeTriageSummary = Boolean(
    latestTriage?.canFinalizeSummary && latestTriage.summary && !finalizedTriageOutput,
  );
  const pdfReadyTriage =
    finalizedTriageOutput ?? (canGenerateTriagePdf(false, latestTriage) ? latestTriage : null);
  const canDownloadTriagePdf = canGenerateTriagePdf(Boolean(finalizedTriageOutput), pdfReadyTriage);
  const legacyFinalizedOrientation =
    pdfReadyTriage?.summary && !/Orientare Santix:|Santix guidance:/i.test(pdfReadyTriage.summary)
      ? buildTriageOrientation(triageLevelOf(pdfReadyTriage), lang)
      : null;

  const handleFinalizeTriageSummary = () => {
    if (!latestTriage?.summary) return;
    const finalizedSummary = summaryWithTriageOrientation(latestTriage.summary, latestTriage, lang);
    const finalizedState = latestTriage.triageState
      ? {
          ...latestTriage.triageState,
          phase: "completed",
          currentQuestionId: null,
          isReadyForSummary: true,
          summaryFinalized: true,
          canGeneratePdf: true,
        }
      : null;
    const finalized: SantixStructuredAiOutput = {
      ...latestTriage,
      triageState: finalizedState,
      summary: finalizedSummary,
      shortAnswer: finalizedSummary,
      reply: finalizedSummary,
      canFinalizeSummary: false,
      canGeneratePdf: true,
      showDetailsCollapsed: false,
    };
    setFinalizedTriageOutput(finalized);
    setRestoredConversationState(validateConversationState(finalizedState));
    setAiMessages((current) => [
      ...current,
      { role: "assistant", content: finalizedSummary, structured: finalized },
    ]);
  };

  const handleGenerateTriagePdf = async () => {
    const userFacingError = isEn
      ? "The sheet could not be generated because conversation data is missing."
      : "Fișa nu a putut fi generată deoarece lipsesc datele conversației.";
    if (!pdfReadyTriage?.summary) {
      setAiError(userFacingError);
      return;
    }

    try {
      await downloadTriagePdf({
        generatedAt: new Date(),
        selectedArea: displayTitle,
        problem:
          triageOriginalProblem(pdfReadyTriage) ??
          firstUserQuestion(aiMessages) ??
          (isEn ? "User-described concern" : "Problema descrisă de utilizator"),
        summary: summaryWithTriageOrientation(pdfReadyTriage.summary, pdfReadyTriage, lang),
        detectedIntent:
          typeof pdfReadyTriage.triageState?.detectedIntent === "string"
            ? pdfReadyTriage.triageState.detectedIntent
            : null,
        triageState: pdfReadyTriage.triageState,
        lang,
        selectedStructure: {
          displayName: displayTitle,
          scientificName: aiTechnicalStructureName,
          mode: visualLayer ?? tissue,
        },
      });
      setAiError(null);
    } catch (error) {
      setAiError(userFacingError);
      if (import.meta.env.DEV) {
        console.error(
          "Santix consultation sheet generation failed",
          error instanceof ConsultationSheetValidationError ? error.reasons : error,
        );
      }
    }
  };

  const submitAiPrompt = async (
    prompt: string,
    options: {
      appendUser?: boolean;
      suppressSuggestion?: boolean;
      requestId?: string;
      conversationIdOverride?: string | null;
      overrideContext?: {
        tissue: TissueType;
        structureName: string;
        technicalStructureName?: string;
        structureSlug: string;
        modelSelectionId: string;
        bodyRegion?: string;
        visualLayer: "skeleton" | "muscular" | "organs" | "complete";
        aiLayer: "skeleton" | "muscular" | "organs";
      };
    } = {},
  ) => {
    if (!prompt) return;
    const requestId =
      options.requestId ??
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `request-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
    if (activeRequestRef.current && activeRequestRef.current !== requestId) return;
    activeRequestRef.current = requestId;

    if (options.appendUser !== false) {
      setAiMessages((current) => [...current, { role: "user", content: prompt }]);
      setAiInput("");
      setFinalizedTriageOutput(null);
    }
    setAiError(null);
    setAiLoading(true);

    const requestContext = options.overrideContext ?? {
      tissue,
      structureName: aiStructureName,
      technicalStructureName: aiTechnicalStructureName,
      structureSlug: bone?.id ?? selection.id,
      modelSelectionId: bone?.id ?? selection.id,
      bodyRegion: curriculum.segment,
      visualLayer: serverVisualLayer,
      aiLayer,
    };
    const conversationLanguage = aiConversationLanguage ?? lang;
    const latestStructured = finalizedTriageOutput ?? latestTriageStructured(aiMessages);
    const clientConversationState =
      validateConversationState(latestStructured?.triageState, {
        conversationId: aiConversationId ?? null,
      }) ?? restoredConversationState;
    const accessToken = session?.access_token;
    const requestGuestSessionId = accessToken ? null : getGuestSessionId();

    try {
      const response = await askSelectionAi({
        data: {
          ...(accessToken
            ? {
                accessToken,
                conversationId: options.conversationIdOverride ?? aiConversationId,
              }
            : {
                guestSessionId: requestGuestSessionId ?? getGuestSessionId(),
                guestPreviousMessages: toGuestPreviousMessages(aiMessages),
                guestStructuredState: latestStructured?.triageState ?? latestStructured,
              }),
          clientStructuredState: clientConversationState,
          debugTrace: debugAiEnabled,
          question: prompt,
          requestId,
          ...requestContext,
          lang: conversationLanguage,
        },
      });

      if (activeRequestRef.current !== requestId) return;
      const responseState = validateConversationState(response.structured?.triageState, {
        conversationId: response.conversationId ?? aiConversationId ?? null,
      });
      if (
        !shouldAcceptConversationStateResponse({
          currentState: conversationStateRef.current,
          responseState,
          context: { conversationId: response.conversationId ?? aiConversationId ?? null },
        })
      ) {
        return;
      }
      if (responseState) {
        conversationStateRef.current = responseState;
        setRestoredConversationState(responseState);
      }

      setAiConversationId(response.conversationId ?? undefined);
      setAiConversationLanguage(response.language);
      if (accessToken && response.conversationId) dispatchAiHistoryRefresh();
      setAiMessages((current) => [
        ...current,
        { role: "assistant", content: response.answer, structured: response.structured },
      ]);

      const contextSwitch = response.contextSwitch;

      if (!options.suppressSuggestion && contextSwitch) {
        if (shouldAutoRedirect(contextSwitch)) {
          const action = contextSwitch;
          if (action.target_layer && action.target_structure_slug) {
            const nextTissue: TissueType =
              action.target_layer === "organs"
                ? "organ"
                : action.target_layer === "muscular"
                  ? "muschi"
                  : "os";
            const nextLayer =
              action.target_layer === "organs"
                ? "organs"
                : action.target_layer === "muscular"
                  ? "muscular"
                  : "skeleton";
            const nextOrgan = localizeInternalOrgan(
              nextTissue === "organ" ? getInternalOrgan(action.target_structure_slug) : undefined,
              lang,
            );
            const targetName =
              nextOrgan?.popularName ??
              action.target_display_name ??
              action.target_body_region ??
              action.target_structure_slug.replace(/^muschi:/, "").replace(/-/g, " ");

            const regionLabel =
              action.target_display_name ?? action.target_body_region ?? targetName;
            const notice = isEn
              ? `I noticed your question is about **${regionLabel}**, not the current selection. Switching automatically.`
              : `Am observat că întrebarea ta este despre **${regionLabel}**, nu despre selecția curentă. Schimb selecția automat.`;
            setAiMessages((current) => [
              ...current.slice(0, -1),
              { role: "assistant", content: notice },
            ]);

            onContextSwitch?.(action);

            await submitAiPrompt(prompt, {
              appendUser: false,
              suppressSuggestion: true,
              requestId,
              conversationIdOverride: response.conversationId,
              overrideContext: {
                tissue: nextTissue,
                structureName: targetName,
                technicalStructureName: action.target_structure_slug,
                structureSlug: action.target_structure_slug,
                modelSelectionId: action.target_structure_slug,
                bodyRegion: action.target_body_region ?? curriculum.segment,
                visualLayer: nextLayer,
                aiLayer: nextLayer,
              },
            });
          }
        } else if (shouldShowContextSuggestion(contextSwitch)) {
          const suggestionKey = [
            contextSwitch.target_layer,
            contextSwitch.target_structure_slug,
            contextSwitch.selected_context_fit,
          ].join(":");
          if (!shownSuggestionKeysRef.current.has(suggestionKey)) {
            shownSuggestionKeysRef.current.add(suggestionKey);
            setContextSuggestion({
              action: contextSwitch,
              prompt,
              conversationId: response.conversationId,
              key: suggestionKey,
            });
          }
        }
      }
    } catch (err) {
      if (activeRequestRef.current !== requestId) return;
      const message = err instanceof Error ? err.message : t.bone_err_ai;
      setAiError(message);
      setAiMessages((current) => [...current, { role: "assistant", content: t.bone_err_start }]);
      if (import.meta.env.DEV) console.error("Santix AI conversation error", err);
    } finally {
      if (activeRequestRef.current === requestId) {
        activeRequestRef.current = null;
        setAiLoading(false);
      }
    }
  };

  const handleAiSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitAiPrompt(aiInput.trim());
  };

  const handleAcceptContextSuggestion = async () => {
    if (!contextSuggestion) return;
    const { action, prompt, conversationId } = contextSuggestion;
    if (!action.target_layer || !action.target_structure_slug) return;

    const nextTissue: TissueType =
      action.target_layer === "organs"
        ? "organ"
        : action.target_layer === "muscular"
          ? "muschi"
          : "os";
    const nextLayer =
      action.target_layer === "organs"
        ? "organs"
        : action.target_layer === "muscular"
          ? "muscular"
          : "skeleton";
    const nextOrgan = localizeInternalOrgan(
      nextTissue === "organ" ? getInternalOrgan(action.target_structure_slug) : undefined,
      lang,
    );
    const targetName =
      nextOrgan?.popularName ??
      action.target_display_name ??
      action.target_body_region ??
      action.target_structure_slug.replace(/^muschi:/, "");

    setContextSuggestion(null);
    onContextSwitch?.(action);

    await submitAiPrompt(prompt, {
      appendUser: false,
      suppressSuggestion: true,
      conversationIdOverride: conversationId ?? undefined,
      overrideContext: {
        tissue: nextTissue,
        structureName: targetName,
        technicalStructureName: action.target_structure_slug,
        structureSlug: action.target_structure_slug,
        modelSelectionId: action.target_structure_slug,
        bodyRegion: action.target_body_region ?? curriculum.segment,
        visualLayer: nextLayer,
        aiLayer: nextLayer,
      },
    });
  };

  return (
    <div
      data-testid="bone-info-panel"
      className="glass-strong absolute inset-x-3 top-3 bottom-20 flex flex-col overflow-hidden rounded-3xl lg:inset-x-auto lg:right-6 lg:top-6 lg:bottom-24"
      // Lățimea reglabilă are sens doar pe ecran lat; sub lg panoul ocupă toată
      // lățimea disponibilă, altfel iese în afara ecranului pe telefon.
      style={panelWidthStyle}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 bottom-0 hidden w-3 cursor-col-resize z-10 group items-center justify-center lg:flex"
        title="Drag to resize"
      >
        <div className="w-[3px] h-12 rounded-full bg-white/10 group-hover:bg-primary/50 transition-colors duration-150" />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div
              className={`size-10 rounded-2xl border flex items-center justify-center ${meta.tagBg}`}
            >
              <Icon className={`size-4 ${meta.tagText}`} />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[10px] tracking-[0.22em] uppercase font-semibold ${meta.tagText}`}
              >
                {meta.label}
              </span>
              <span className="text-[10px] tracking-wide text-muted-foreground">
                {categoryText}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.auth_close}
            className="size-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight leading-tight mb-1">{displayTitle}</h2>

          {bone && (
            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-2xl bg-bone-glow/10 border border-bone-glow/20 w-fit">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {bone.count} {bone.count === 1 ? t.bone_count_singular : t.bone_count_plural}{" "}
                {isEn ? "in the body" : "în corp"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1 -mr-1">
          <Section title={t.bone_description}>
            <p className="text-sm leading-relaxed text-foreground/90">{description}</p>
          </Section>

          {isCompleteAnatomyMode && (
            <div>
              {completeLayerNote && (
                <div className="mb-3 rounded-2xl border border-primary/15 bg-primary/5 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
                  {completeLayerNote}
                </div>
              )}
              <TechnicalDetails
                details={technicalDetails}
                title={t.bone_details_title}
                subtitle={t.bone_details_subtitle}
              />
              {selectedOrgan && <OrganQuizSummary organ={selectedOrgan} />}
            </div>
          )}

          <Section title={t.bone_function}>
            <p className="text-sm leading-relaxed text-foreground/90">{funcText}</p>
          </Section>

          <Section title={t.bone_anatomical}>
            <div className="grid grid-cols-2 gap-2">
              <InfoChip
                label={t.bone_popular_name}
                value={
                  selectedOrgan?.popularName ??
                  (isEn ? displayInfo.popular_name_en : displayInfo.popular_name_ro) ??
                  displayTitle
                }
              />
              <InfoChip
                label={t.bone_scientific_name}
                value={
                  selectedOrgan?.scientificName ??
                  (isEn ? displayInfo.scientific_name_en : displayInfo.scientific_name_ro) ??
                  aiTechnicalStructureName ??
                  t.bone_general
                }
              />
              <InfoChip
                label={t.bone_latin_name}
                value={selectedOrgan?.latinName ?? displayInfo.latin_name ?? t.bone_general}
              />
              <InfoChip label={t.bone_system} value={curriculum.system} />
              <InfoChip label={t.bone_segment} value={curriculum.segment} />
              <InfoChip label={t.bone_group} value={curriculum.group} />
              <InfoChip label={t.bone_subgroup} value={curriculum.subgroup ?? t.bone_general} />
              <InfoChip label={t.bone_face_plan} value={curriculum.aspect ?? t.bone_general_plan} />
            </div>
          </Section>

          {!hideAssistantInComplete ? (
            <div className="order-first pb-3 mb-1 border-b border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.45)]">
                  <Bot className="size-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">{t.bone_ai_title}</h3>
                  <p className="text-[11px] text-muted-foreground">{t.bone_ai_subtitle}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-white/[0.04] p-3">
                {debugAiEnabled && completeLayerNote && (
                  <div className="mb-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    {completeLayerNote}
                  </div>
                )}
                <div className="mb-3 rounded-xl border border-primary/15 bg-primary/10 px-3 py-2 text-xs leading-relaxed text-foreground/90">
                  {tissue === "organ" ? (
                    <>{t.bone_ai_organ_prompt(displayName)}</>
                  ) : (
                    <>{t.bone_ai_default_prompt(displayName)}</>
                  )}
                </div>

                {debugAiEnabled && (
                  <details className="mb-3 rounded-xl border border-primary/15 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-semibold text-foreground/80">
                      {t.bone_debug_ai}
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <InfoChip label={t.bone_mode} value={aiLayerLabel} />
                      <InfoChip
                        label={t.bone_context}
                        value={selection.label ?? selection.regionLabel ?? selection.id}
                      />
                      <InfoChip label={t.bone_slug} value={bone?.id ?? selection.id} />
                      <InfoChip
                        label={t.bone_original_name}
                        value={aiTechnicalStructureName ?? aiStructureName}
                      />
                    </div>
                  </details>
                )}

                {contextSuggestion && (
                  <ContextSwitchCard
                    action={contextSuggestion.action}
                    disabled={aiLoading}
                    onAccept={handleAcceptContextSuggestion}
                    onDismiss={() => setContextSuggestion(null)}
                  />
                )}

                {aiConversationLanguage && aiConversationLanguage !== lang && (
                  <div className="mb-3 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-[11px] leading-relaxed text-foreground/85">
                    {aiConversationLanguage === "en"
                      ? t.bone_conversation_continues_en
                      : t.bone_conversation_continues_ro}
                  </div>
                )}

                <div
                  ref={aiScrollRef}
                  onScroll={handleAiScroll}
                  className="max-h-[250px] space-y-2 overflow-y-auto pr-1"
                >
                  {/* Cât timp nu există mesaje nu afișăm nimic aici: exemplul de
                      întrebare stă deja în placeholder-ul inputului de mai jos. */}
                  {aiMessages.length === 0
                    ? null
                    : aiMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          data-testid={`ai-message-${message.role}`}
                          className={[
                            "flex gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed",
                            message.role === "user"
                              ? "border-primary/25 bg-primary/10 text-foreground"
                              : "border-white/10 bg-background/45 text-foreground/90",
                          ].join(" ")}
                        >
                          {message.role === "user" ? (
                            <UserRound className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          ) : (
                            <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          )}
                          <span className="whitespace-pre-line">{message.content}</span>
                        </div>
                      ))}
                  {aiLoading && (
                    <div className="flex gap-2 rounded-xl border border-white/10 bg-background/45 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{t.bone_reading}</span>
                    </div>
                  )}
                </div>

                {aiError && (
                  <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    {aiError}
                  </div>
                )}

                {(canFinalizeTriageSummary || canDownloadTriagePdf) && (
                  <div data-testid="ai-medical-sheet-actions" className="mt-3 flex flex-wrap gap-2">
                    {canFinalizeTriageSummary && (
                      <button
                        type="button"
                        onClick={handleFinalizeTriageSummary}
                        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                      >
                        <FileText className="size-3.5" />
                        {isEn ? "Finalize summary" : "Finalizează rezumatul"}
                      </button>
                    )}
                    {canDownloadTriagePdf && (
                      <button
                        type="button"
                        data-testid="generate-medical-sheet-button"
                        onClick={handleGenerateTriagePdf}
                        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/25 bg-background/45 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10"
                      >
                        <Download className="size-3.5" />
                        {isEn ? "Generate consultation sheet" : "Generează fișa pentru medic"}
                      </button>
                    )}
                  </div>
                )}

                {legacyFinalizedOrientation && (
                  <div
                    data-testid="ai-triage-orientation"
                    className="mt-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-xs leading-relaxed text-foreground/90"
                  >
                    {legacyFinalizedOrientation}
                  </div>
                )}

                <form onSubmit={handleAiSubmit} className="mt-3 flex gap-2">
                  <input
                    data-testid="ai-chat-input"
                    value={aiInput}
                    onChange={(event) => setAiInput(event.target.value)}
                    disabled={aiLoading}
                    placeholder={aiInputPlaceholder}
                    className="min-w-0 flex-1 rounded-2xl border border-primary/20 bg-background/45 px-3 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/55 focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all hover:-translate-y-[1px] hover:shadow-[0_0_22px_rgba(0,242,254,0.25)]"
                    aria-label={isEn ? "Send question" : "Trimite întrebarea"}
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              </div>

              {!isCompleteAnatomyMode && (
                <div className="mt-3 rounded-2xl bg-destructive/8 border border-destructive/30 px-3.5 py-2.5 flex gap-2.5">
                  <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[11.5px] leading-snug text-destructive font-semibold">
                    {t.bone_disclaimer}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TechnicalDetails({
  details,
  title,
  subtitle,
}: {
  details: TechnicalDetail[];
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-white/[0.04] p-3 shadow-[0_0_30px_-24px_rgba(0,242,254,0.9)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          <Layers className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-2">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="rounded-2xl border border-primary/15 bg-background/40 px-3 py-2.5"
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {detail.label}
            </p>
            <p className="text-xs leading-relaxed text-foreground/90">{detail.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganQuizSummary({ organ }: { organ: InternalOrgan }) {
  const { t } = useLanguage();
  return (
    <div className="mt-3 rounded-2xl border border-primary/20 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight text-foreground">{t.bone_quick_q}</h3>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          {organ.difficulty === "incepator" ? t.bone_beginner : t.bone_medium}
        </span>
      </div>
      <div className="space-y-2">
        {organ.quiz.slice(0, 2).map((item) => (
          <div
            key={item.question}
            className="rounded-xl border border-primary/10 bg-background/35 px-3 py-2"
          >
            <p className="text-xs font-semibold leading-snug text-foreground/90">{item.question}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextSwitchCard({
  action,
  disabled,
  onAccept,
  onDismiss,
}: {
  action: AiContextSwitchAction;
  disabled: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  const isOrganTarget = action.target_layer === "organs";
  const isMuscularTarget = action.target_layer === "muscular";
  const title = isOrganTarget
    ? t.bone_ctx_organ_title
    : isMuscularTarget
      ? t.bone_ctx_muscle_title
      : t.bone_ctx_bone_title;
  const description = isOrganTarget
    ? t.bone_ctx_organ_desc
    : isMuscularTarget
      ? t.bone_ctx_muscle_desc
      : t.bone_ctx_bone_desc;
  const buttonLabel = isOrganTarget
    ? t.bone_ctx_organ_go
    : isMuscularTarget
      ? t.bone_ctx_muscle_go
      : t.bone_ctx_bone_go;

  return (
    <div className="mb-3 fade-up rounded-2xl border border-primary/25 bg-primary/[0.075] p-3 shadow-[0_0_28px_-18px_oklch(0.62_0.20_255_/_0.9)]">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-background/35 text-primary">
          <Compass className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-black tracking-tight text-foreground">{title}</h4>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
              aria-label={t.bone_hide_rec}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</p>
          <button
            type="button"
            onClick={onAccept}
            disabled={disabled}
            className="mt-2.5 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,242,254,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-primary/15 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      <p className="text-xs font-semibold leading-snug text-foreground/90">{value}</p>
    </div>
  );
}
