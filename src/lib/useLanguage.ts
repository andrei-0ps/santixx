import { useEffect, useState } from "react";
import { translations, type Lang } from "./translations";

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "ro";
  return localStorage.getItem("santix-lang") === "en" ? "en" : "ro";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("ro");

  useEffect(() => {
    const storedLanguage = getStoredLang();
    setLang(storedLanguage);
    document.documentElement.lang = storedLanguage;

    const handler = (e: Event) => {
      setLang((e as CustomEvent<Lang>).detail);
    };
    window.addEventListener("santix-lang-change", handler);
    return () => window.removeEventListener("santix-lang-change", handler);
  }, []);

  const t = translations[lang];
  return { lang, t };
}
