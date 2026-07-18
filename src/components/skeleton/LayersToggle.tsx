import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bone, Activity, HeartPulse, Layers as LayersIcon } from "lucide-react";
import { useLanguage } from "@/lib/useLanguage";

export type LayerMode = "skeleton" | "muscles" | "organs" | "complete";

interface Props {
  mode: LayerMode;
  onChange: (next: LayerMode) => void;
}

// skeleton & complete use --primary; muscles & organs have distinct accent colors
const LAYER_COLORS: Record<LayerMode, string> = {
  skeleton: "var(--primary)",
  muscles: "oklch(0.72 0.20 15)",
  organs: "oklch(0.76 0.16 290)",
  complete: "var(--primary)",
};

export function LayersToggle({ mode, onChange }: Props) {
  const { t } = useLanguage();

  // memoised so the array is only rebuilt when the locale changes
  const ITEMS = useMemo(
    () => [
      { key: "skeleton" as LayerMode, label: t.layers_skeleton, hint: t.layers_skeleton_sub, Icon: Bone },
      { key: "muscles" as LayerMode, label: t.layers_muscles, hint: t.layers_muscles_sub, Icon: Activity },
      { key: "organs" as LayerMode, label: t.layers_organs, hint: t.layers_organs_sub, Icon: HeartPulse },
      { key: "complete" as LayerMode, label: t.layers_full, hint: t.layers_full_sub, Icon: LayersIcon },
    ],
    [t],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.15 }}
      className="absolute left-6 bottom-24 glass-strong rounded-3xl p-3.5 w-[260px]"
    >
      <div className="flex items-center gap-2 px-1.5 pb-2.5 mb-2 border-b border-primary/10">
        <LayersIcon className="size-3.5 text-primary" />
        <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-primary">
          {t.layers_title}
        </span>
      </div>
      <div className="space-y-1">
        {ITEMS.map(({ key, label, hint, Icon }) => {
          const active = mode === key;
          const accentColor = LAYER_COLORS[key];
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              whileTap={{ scale: 0.97 }}
              className={[
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl transition-all duration-200 text-left relative overflow-hidden",
                active
                  ? "border border-primary/30"
                  : "bg-transparent border border-transparent hover:bg-muted/60",
              ].join(" ")}
              style={active ? { background: `${accentColor}18` } : undefined}
            >
              {active && (
                <motion.div
                  layoutId="layers-active-bg"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: `${accentColor}0e`, boxShadow: `inset 0 0 0 1px ${accentColor}40` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={[
                  "size-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 relative z-10",
                  active
                    ? "text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
                style={active ? {
                  background: accentColor,
                  boxShadow: `0 0 18px -4px ${accentColor}`,
                } : undefined}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 relative z-10">
                <div className={`text-[12.5px] font-semibold tracking-tight leading-tight transition-colors duration-200 ${active ? "text-foreground" : ""}`}>{label}</div>
                <div className="text-[10.5px] text-muted-foreground leading-tight">{hint}</div>
              </div>
              <span
                className={[
                  "relative z-10 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  active ? "border-primary bg-primary/15" : "border-muted-foreground/35 bg-muted-foreground/10",
                ].join(" ")}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="inline-block h-2.5 w-2.5 rounded-full bg-primary"
                      style={{ boxShadow: `0 0 10px ${accentColor}` }}
                    />
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
