import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, BookMarked, Activity, HeartPulse } from "lucide-react";
import { searchAnatomy, type AnatomySearchResult } from "@/data/anatomySearch";

const TISSUE_ICON = {
  os: BookMarked,
  muschi: Activity,
  organ: HeartPulse,
} as const;

export function AnatomySearch({
  onSelect,
  lang,
  placeholder,
  emptyLabel,
  className = "",
}: {
  onSelect: (result: AnatomySearchResult) => void;
  lang: "ro" | "en";
  placeholder: string;
  emptyLabel: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchAnatomy(query), [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (result: AnatomySearchResult) => {
    onSelect(result);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(results[activeIndex] ?? results[0]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div
      ref={containerRef}
      data-testid="anatomy-search-overlay"
      className={`relative w-fit max-w-sm min-w-0 transition-all duration-300 ${className}`}
    >
      <div className="flex w-fit max-w-sm min-w-0 items-center gap-2 rounded-2xl border border-primary/20 bg-background/70 px-3 py-2.5 backdrop-blur-md transition-all duration-300 focus-within:border-primary/55">
        <Search className="size-4 shrink-0 text-primary" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-[clamp(160px,26vw,260px)] min-w-[160px] max-w-[260px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          aria-label={placeholder}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label={lang === "en" ? "Clear" : "Șterge"}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="glass-strong absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[320px] overflow-y-auto rounded-2xl p-1.5">
            {results.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">{emptyLabel}</div>
            ) : (
              results.map((result, index) => {
                const Icon = TISSUE_ICON[result.tissue];
                const active = index === activeIndex;
                return (
                  <button
                    key={result.key}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => pick(result)}
                    className={[
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
                      active ? "bg-primary/15" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {lang === "en" ? result.labelEn : result.label}
                      </span>
                      <span className="block truncate text-[10.5px] text-muted-foreground">
                        {lang === "en" ? result.subtitleEn : result.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
        </div>
      )}
    </div>
  );
}
