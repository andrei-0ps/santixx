import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/useLanguage";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const { t } = useLanguage();

  useEffect(() => {
    const saved = window.localStorage.getItem("santix-theme");
    const nextTheme: Theme = saved === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("light-mode", nextTheme === "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("santix-theme", nextTheme);
    document.documentElement.classList.toggle("light-mode", nextTheme === "light");
    window.dispatchEvent(new CustomEvent("santix-theme-change", { detail: nextTheme }));
  };

  const isLight = theme === "light";
  const Icon = isLight ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? t.theme_activate_dark : t.theme_activate_light}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-2xl border border-primary/15 bg-white/[0.04] px-2 text-xs font-semibold text-foreground transition-all hover:border-primary/35 hover:bg-primary/10 sm:px-3"
    >
      <Icon className="size-4 text-primary" />
      <span className="hidden sm:inline">{isLight ? t.theme_dark : t.theme_light}</span>
    </button>
  );
}
