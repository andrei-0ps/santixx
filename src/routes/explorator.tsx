import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  RESET_VIEW_EVENT,
  SkeletonScene,
  type BoneSelection,
} from "@/components/skeleton/SkeletonScene";
import { BoneInfoPanel } from "@/components/skeleton/BoneInfoPanel";
import { LayersToggle, type LayerMode } from "@/components/skeleton/LayersToggle";
import { PainQuickStart, type PainRegionPick } from "@/components/skeleton/PainQuickStart";
import { AnatomySearch } from "@/components/skeleton/AnatomySearch";
import { MedicalCareMapModal } from "@/components/medical-care/MedicalCareMapModal";
import type { AnatomySearchResult } from "@/data/anatomySearch";
import { bones } from "@/data/bones";
import { getInternalOrgan } from "@/data/internalOrgans";
import { MousePointerClick, HeartPulse, RotateCcw, MapPin } from "lucide-react";
import type { AiContextSwitchAction } from "@/lib/ai-chat.functions";
import { dispatchOnboardingStep } from "@/lib/onboarding";
import { useAuth } from "@/components/auth/AuthProvider";
import { readGuestAiSession } from "@/lib/ai/guestConversationSession";
import { hasActiveQuestion, validateConversationState } from "@/lib/ai/conversation/conversationState";
import { useLanguage } from "@/lib/useLanguage";
import {
  AI_CONVERSATION_OPEN_EVENT,
  getConversationStructureLabel,
  type OpenAiConversationDetail,
} from "@/lib/aiHistory";

export const Route = createFileRoute("/explorator")({
  head: () => ({
    meta: [
      { title: "Explorator Anatomie 3D — Santix" },
      {
        name: "description",
        content:
          "Explorează anatomia umană în 3D — schelet, mușchi, tendoane și organe. Click pe orice structură pentru detalii și asistent AI de simptome.",
      },
      { property: "og:title", content: "Explorator Anatomie 3D — Santix" },
      {
        property: "og:description",
        content: "Vizualizare interactivă 3D a oaselor, sistemului muscular și organelor.",
      },
    ],
  }),
  component: ExploratorPage,
});

function ExploratorPage() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [selection, setSelection] = useState<BoneSelection | null>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>("complete");
  const [contextSwitchCount, setContextSwitchCount] = useState(0);
  const [preserveAiStateOnSelectionChange, setPreserveAiStateOnSelectionChange] = useState(false);
  const [hasActiveConversationFlow, setHasActiveConversationFlow] = useState(false);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);
  const [painQuickOpen, setPainQuickOpen] = useState(false);
  const [medicalCareOpen, setMedicalCareOpen] = useState(false);
  const guestRestoreAttemptedRef = useRef(false);

  const selectedBone = useMemo(
    () => (selection ? (bones.find((b) => b.id === selection.id) ?? null) : null),
    [selection],
  );

  const confirmContextChange = (nextSelection: BoneSelection | null) => {
    if (!hasActiveConversationFlow || !selection || !nextSelection) return true;
    if (`${selection.tissue}:${selection.id}` === `${nextSelection.tissue}:${nextSelection.id}`) {
      return true;
    }
    return window.confirm(
      lang === "en"
        ? "A guided conversation is active. Change the anatomical structure and start a new context?"
        : "Ai o conversație ghidată activă. Schimbi structura anatomică și începi un context nou?",
    );
  };

  const handleSelectionChange = (nextSelection: BoneSelection | null) => {
    if (!confirmContextChange(nextSelection)) return;
    setContextSwitchCount(0);
    setOpenConversationId(null);
    if (!nextSelection) setHasActiveConversationFlow(false);
    setSelection(nextSelection);
  };

  const handlePainRegionPick = (pick: PainRegionPick) => {
    if (!confirmContextChange(pick.selection)) return;
    setPainQuickOpen(false);
    setContextSwitchCount(0);
    setOpenConversationId(null);
    setLayerMode(pick.layer);
    setSelection(pick.selection);
  };

  const handleSearchSelect = (result: AnatomySearchResult) => {
    if (!confirmContextChange(result.selection)) return;
    setContextSwitchCount(0);
    setOpenConversationId(null);
    setLayerMode(result.layer);
    setSelection(result.selection);
  };

  useEffect(() => {
    if (authLoading || guestRestoreAttemptedRef.current) return;
    guestRestoreAttemptedRef.current = true;
    if (user || selection) return;

    const snapshot = readGuestAiSession();
    const restoredState = validateConversationState(snapshot?.latestStructured);
    if (!snapshot || !hasActiveQuestion(restoredState)) return;

    const [, storedTissue, ...storedIdParts] = snapshot.selectionKey.split(":");
    const tissue: BoneSelection["tissue"] =
      storedTissue === "organ" ? "organ" : storedTissue === "muschi" ? "muschi" : "os";
    const structureId = restoredState.selectedStructureId ?? storedIdParts.join(":");
    if (!structureId) return;

    const targetBone = tissue === "os" ? bones.find((item) => item.id === structureId) : null;
    const organ = tissue === "organ" ? getInternalOrgan(structureId) : undefined;
    const label =
      restoredState.selectedStructureName || targetBone?.name || organ?.popularName || structureId;

    setPreserveAiStateOnSelectionChange(true);
    setLayerMode(tissue === "organ" ? "organs" : tissue === "muschi" ? "muscles" : "skeleton");
    setSelection({
      id: structureId,
      side: "male",
      tissue,
      regionId: tissue === "os" ? undefined : structureId,
      regionLabel: tissue === "organ" ? organ?.category : undefined,
      label,
      labelEn: organ?.popularNameEn ?? targetBone?.latin ?? label,
    });
    window.setTimeout(() => setPreserveAiStateOnSelectionChange(false), 0);
  }, [authLoading, selection, user]);

  useEffect(() => {
    const handleOpenConversation = (event: Event) => {
      const conversation = (event as CustomEvent<OpenAiConversationDetail>).detail;
      if (!conversation?.id) return;

      const tissue: BoneSelection["tissue"] = conversation.tissue ?? "os";
      const structureId =
        conversation.model_selection_id ?? conversation.structure_slug ?? conversation.id;
      const targetBone =
        tissue === "os"
          ? bones.find((item) => item.id === structureId || item.id === conversation.structure_slug)
          : null;
      const label = getConversationStructureLabel(conversation, lang) ?? targetBone?.name;

      setPreserveAiStateOnSelectionChange(true);
      setContextSwitchCount(0);
      setLayerMode(tissue === "organ" ? "organs" : tissue === "muschi" ? "muscles" : "skeleton");
      setOpenConversationId(conversation.id);
      setSelection({
        id: targetBone?.id ?? structureId,
        side: "male",
        tissue,
        regionId: tissue === "muschi" || tissue === "organ" ? structureId : undefined,
        regionLabel: tissue === "muschi" || tissue === "organ" ? label : undefined,
        label,
      });
      window.setTimeout(() => setPreserveAiStateOnSelectionChange(false), 0);
    };

    window.addEventListener(AI_CONVERSATION_OPEN_EVENT, handleOpenConversation);
    return () => window.removeEventListener(AI_CONVERSATION_OPEN_EVENT, handleOpenConversation);
  }, [lang]);

  const handleAiContextSwitch = (action: AiContextSwitchAction) => {
    if (!action.should_switch_context || contextSwitchCount > 0 || !action.target_structure_slug)
      return;

    const nextLayer: LayerMode =
      action.target_layer === "organs"
        ? "organs"
        : action.target_layer === "muscular"
          ? "muscles"
          : "skeleton";
    const nextTissue: BoneSelection["tissue"] =
      action.target_layer === "organs" || action.target_structure_type === "organ"
        ? "organ"
        : action.target_structure_type === "muscle" ||
            action.target_structure_type === "muscle_group"
          ? "muschi"
          : "os";
    const targetBone =
      nextTissue === "os" ? bones.find((item) => item.id === action.target_structure_slug) : null;
    const muscleLabels: Record<string, string> = {
      "muschi:muschii-bratului": "Mușchii brațului",
      "muschi:muschii-antebratului": "Mușchii antebrațului",
      "muschi:muschii-umarului": "Mușchii umărului",
      "muschi:muschii-mainii": "Mușchii mâinii",
      "muschi:muschii-coapsei": "Mușchii coapsei",
      "muschi:muschii-gambei": "Mușchii gambei",
      "muschi:muschii-piciorului": "Mușchii labei piciorului",
      "muschi:muschii-soldului": "Mușchii șoldului",
      "muschi:muschii-spatelui": "Mușchii spatelui",
      "muschi:muschii-capului-gatului": "Mușchii capului și gâtului",
      "muschi:muschii-toracelui": "Mușchii toracelui",
    };
    const organ =
      nextTissue === "organ" ? getInternalOrgan(action.target_structure_slug) : undefined;

    setPreserveAiStateOnSelectionChange(true);
    setContextSwitchCount((count) => count + 1);
    setLayerMode(nextLayer);
    setSelection({
      id: action.target_structure_slug,
      side: "male",
      tissue: nextTissue,
      regionId:
        nextTissue === "muschi" || nextTissue === "organ"
          ? action.target_structure_slug
          : undefined,
      regionLabel:
        nextTissue === "muschi"
          ? muscleLabels[action.target_structure_slug]
          : nextTissue === "organ"
            ? (organ?.category ?? action.target_body_region ?? undefined)
            : (action.target_body_region ?? undefined),
      label:
        action.target_display_name ??
        organ?.popularName ??
        targetBone?.name ??
        muscleLabels[action.target_structure_slug] ??
        action.target_body_region ??
        action.target_structure_slug,
      labelEn:
        organ?.popularNameEn ??
        action.target_display_name ??
        targetBone?.latin ??
        action.target_structure_slug,
    });
    window.setTimeout(() => setPreserveAiStateOnSelectionChange(false), 0);
  };

  return (
    <div
      className="absolute inset-0 m-4 mt-2 overflow-hidden rounded-3xl glass"
      onPointerDownCapture={() => dispatchOnboardingStep("perspective")}
    >
      <SkeletonScene
        selection={selection}
        onSelect={handleSelectionChange}
        layerMode={layerMode}
        mode="complex"
      />

      <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex flex-col items-center gap-3 px-6 transition-all duration-300 sm:top-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {!selection && (
          <div
            className="pointer-events-auto flex w-fit max-w-xs min-w-0 items-center gap-2.5 rounded-2xl px-4 py-3 glass glass-highlight transition-all duration-300 sm:max-w-sm"
            style={{ boxShadow: "var(--shadow-float), 0 0 0 1px oklch(0.82 0.17 205 / 0.12)" }}
            title={t.exp_hint}
            data-testid="anatomy-hint-overlay"
          >
            <motion.div
              className="shrink-0"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MousePointerClick className="size-4 text-primary" />
            </motion.div>
            <span className="min-w-0 truncate text-xs tracking-tight text-muted-foreground">
              {t.exp_hint}
            </span>
          </div>
        )}
        <div className="pointer-events-auto flex w-full min-w-0 flex-col items-center gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setMedicalCareOpen(true)}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-background/70 px-3.5 text-xs font-bold text-foreground shadow-[0_10px_28px_-18px_rgba(0,242,254,0.72)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:text-primary"
            aria-label={lang === "en" ? "Nearby care" : "Ajutor aproape"}
            title={lang === "en" ? "Nearby care" : "Ajutor aproape"}
          >
            <MapPin className="size-4 text-primary" />
            <span>{lang === "en" ? "Nearby care" : "Ajutor aproape"}</span>
          </button>
          <AnatomySearch
            onSelect={handleSearchSelect}
            lang={lang}
            placeholder={t.exp_search_placeholder}
            emptyLabel={t.exp_search_empty}
          />
        </div>
      </div>

      <LayersToggle
        mode={layerMode}
        onChange={(nextMode) => {
          handleSelectionChange(null);
          setLayerMode(nextMode);
          dispatchOnboardingStep("layers");
        }}
      />

      {!selection && (
        <button
          type="button"
          onClick={() => setPainQuickOpen(true)}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-primary to-accent px-4 py-3 font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,242,254,0.45)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <motion.span
            animate={{ scale: [1, 1.18, 1, 1.12, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex"
          >
            <HeartPulse className="size-4.5" />
          </motion.span>
          <span className="text-sm tracking-tight">{t.exp_pain_button}</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(RESET_VIEW_EVENT))}
        className="group absolute bottom-6 left-6 z-30 flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-background/70 text-primary shadow-[0_10px_30px_-18px_rgba(0,242,254,0.65)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-primary/45 hover:bg-primary/10 hover:shadow-[0_12px_34px_-16px_rgba(0,242,254,0.9)] active:scale-95"
        aria-label={lang === "en" ? "Reset View" : "Resetează vizualizarea"}
        title={lang === "en" ? "Reset View" : "Resetează vizualizarea"}
      >
        <RotateCcw className="size-4 transition-transform duration-500 ease-out group-hover:-rotate-[360deg]" />
      </button>

      <PainQuickStart
        open={painQuickOpen}
        onClose={() => setPainQuickOpen(false)}
        onPick={handlePainRegionPick}
        lang={lang}
        title={t.exp_pain_title}
        subtitle={t.exp_pain_subtitle}
      />

      <MedicalCareMapModal open={medicalCareOpen} onOpenChange={setMedicalCareOpen} lang={lang} />

      {selection && (
        <BoneInfoPanel
          key="bone-info-panel"
          bone={selectedBone}
          selection={selection}
          onClose={() => handleSelectionChange(null)}
          onContextSwitch={handleAiContextSwitch}
          onActiveFlowChange={setHasActiveConversationFlow}
          preserveAiStateOnSelectionChange={preserveAiStateOnSelectionChange}
          visualLayer={layerMode}
          openConversationId={openConversationId}
        />
      )}
    </div>
  );
}
