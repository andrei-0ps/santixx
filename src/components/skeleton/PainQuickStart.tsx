import { AnimatePresence, motion } from "framer-motion";
import { X, HeartPulse } from "lucide-react";
import type { BoneSelection } from "./SkeletonScene";
import type { LayerMode } from "./LayersToggle";

export type PainRegionPick = {
  selection: BoneSelection;
  layer: LayerMode;
};

type Region = {
  key: string;
  ro: string;
  en: string;
  emoji: string;
  boneId: string;
  label: string;
  labelEn: string;
};

// Everyday body regions mapped to a representative structure in the skeleton
// layer. We use the skeleton layer so the no-account local triage (3 questions
// → recommendation) is shown immediately — the user never needs to know the
// anatomical name.
const REGIONS: Region[] = [
  {
    key: "head",
    ro: "Cap",
    en: "Head",
    emoji: "🧠",
    boneId: "frontal",
    label: "Cap",
    labelEn: "Head",
  },
  {
    key: "neck",
    ro: "Gât",
    en: "Neck",
    emoji: "🦴",
    boneId: "vert-cervicale",
    label: "Gât",
    labelEn: "Neck",
  },
  {
    key: "shoulder",
    ro: "Umăr",
    en: "Shoulder",
    emoji: "💪",
    boneId: "scapula",
    label: "Umăr",
    labelEn: "Shoulder",
  },
  {
    key: "chest",
    ro: "Piept",
    en: "Chest",
    emoji: "🫁",
    boneId: "stern",
    label: "Piept",
    labelEn: "Chest",
  },
  {
    key: "arm",
    ro: "Braț",
    en: "Arm",
    emoji: "💪",
    boneId: "humerus",
    label: "Braț",
    labelEn: "Arm",
  },
  {
    key: "elbow",
    ro: "Cot",
    en: "Elbow",
    emoji: "🦾",
    boneId: "ulna",
    label: "Cot",
    labelEn: "Elbow",
  },
  {
    key: "wrist",
    ro: "Încheietură / Mână",
    en: "Wrist / Hand",
    emoji: "✋",
    boneId: "carp",
    label: "Încheietura mâinii",
    labelEn: "Wrist",
  },
  {
    key: "upper-back",
    ro: "Spate (sus)",
    en: "Upper back",
    emoji: "🔙",
    boneId: "vert-toracice",
    label: "Spate superior",
    labelEn: "Upper back",
  },
  {
    key: "lower-back",
    ro: "Spate (jos)",
    en: "Lower back",
    emoji: "🔙",
    boneId: "vert-lombare",
    label: "Zona lombară",
    labelEn: "Lower back",
  },
  {
    key: "hip",
    ro: "Șold",
    en: "Hip",
    emoji: "🦴",
    boneId: "coxal",
    label: "Șold",
    labelEn: "Hip",
  },
  {
    key: "thigh",
    ro: "Coapsă",
    en: "Thigh",
    emoji: "🦵",
    boneId: "femur",
    label: "Coapsă",
    labelEn: "Thigh",
  },
  {
    key: "knee",
    ro: "Genunchi",
    en: "Knee",
    emoji: "🦵",
    boneId: "rotula",
    label: "Genunchi",
    labelEn: "Knee",
  },
  {
    key: "calf",
    ro: "Gambă",
    en: "Lower leg",
    emoji: "🦵",
    boneId: "tibia",
    label: "Gambă",
    labelEn: "Lower leg",
  },
  {
    key: "ankle",
    ro: "Gleznă",
    en: "Ankle",
    emoji: "🦶",
    boneId: "tars",
    label: "Gleznă",
    labelEn: "Ankle",
  },
  {
    key: "foot",
    ro: "Laba piciorului",
    en: "Foot",
    emoji: "🦶",
    boneId: "metatars",
    label: "Laba piciorului",
    labelEn: "Foot",
  },
];

export function PainQuickStart({
  open,
  onClose,
  onPick,
  lang,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (pick: PainRegionPick) => void;
  lang: "ro" | "en";
  title: string;
  subtitle: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pain-quick-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="pain-quick-modal"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="glass-strong relative m-4 w-full max-w-lg rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label={lang === "en" ? "Close" : "Închide"}
            >
              <X className="size-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_6px_18px_-6px_rgba(0,242,254,0.45)]">
                <HeartPulse className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">{title}</h2>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REGIONS.map((region) => (
                <button
                  key={region.key}
                  type="button"
                  onClick={() =>
                    onPick({
                      layer: "skeleton",
                      selection: {
                        id: region.boneId,
                        side: "male",
                        tissue: "os",
                        label: lang === "en" ? region.labelEn : region.label,
                        labelEn: region.labelEn,
                      },
                    })
                  }
                  className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-white/[0.04] px-3 py-2.5 text-left text-xs font-semibold text-foreground/85 transition-all hover:-translate-y-[1px] hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {region.emoji}
                  </span>
                  <span className="leading-tight">{lang === "en" ? region.en : region.ro}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
