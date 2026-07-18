import { ALargeSmall } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/useLanguage";

export const TEXT_SIZES = ["normal", "large", "xlarge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

// Scales the root font-size, so every rem-based size in the app grows together.
const TEXT_SIZE_SCALE: Record<TextSize, string> = {
  normal: "100%",
  large: "112.5%",
  xlarge: "125%",
};

const STORAGE_KEY = "santix-text-size";

export function readTextSize(): TextSize {
  if (typeof window === "undefined") return "normal";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && (TEXT_SIZES as readonly string[]).includes(saved)
    ? (saved as TextSize)
    : "normal";
}

export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = TEXT_SIZE_SCALE[size];
}

export function TextSizeToggle() {
  const [size, setSize] = useState<TextSize>("normal");
  const { t } = useLanguage();

  useEffect(() => {
    const initial = readTextSize();
    setSize(initial);
    applyTextSize(initial);
  }, []);

  const cycle = () => {
    // Read the persisted value as the source of truth so rapid clicks chain
    // correctly even before React re-renders.
    const current = readTextSize();
    const next = TEXT_SIZES[(TEXT_SIZES.indexOf(current) + 1) % TEXT_SIZES.length];
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTextSize(next);
    setSize(next);
  };

  const label =
    size === "normal"
      ? t.text_size_normal
      : size === "large"
        ? t.text_size_large
        : t.text_size_xlarge;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t.text_size_aria} · ${label}`}
      title={`${t.text_size_aria} · ${label}`}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border border-primary/15 bg-white/[0.04] px-2 text-xs font-semibold text-foreground transition-all hover:border-primary/35 hover:bg-primary/10 sm:px-3"
    >
      <ALargeSmall className="size-4 text-primary" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
