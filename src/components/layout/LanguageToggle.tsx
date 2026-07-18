import { useEffect, useState } from "react";
import { translations } from "@/lib/translations";

export type Language = "ro" | "en";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "ro";
  return window.localStorage.getItem("santix-lang") === "en" ? "en" : "ro";
}

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>("ro");

  useEffect(() => {
    setLang(getStoredLanguage());
  }, []);

  const toggle = (next: Language) => {
    if (next === lang) return;
    setLang(next);
    window.localStorage.setItem("santix-lang", next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("santix-lang-change", { detail: next }));
  };

  return (
    <div
      role="group"
      aria-label={translations[lang].nav_lang}
      className="flex h-9 items-center rounded-2xl border border-primary/20 bg-white/[0.03] p-0.5"
    >
      {(["ro", "en"] as Language[]).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => toggle(l)}
            aria-pressed={active}
            className={`h-full rounded-[14px] px-2 text-xs font-bold tracking-widest transition-all duration-300 sm:px-3 ${
              active
                ? "bg-primary/15 text-primary shadow-[inset_0_0_8px_rgba(0,229,255,0.12)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
