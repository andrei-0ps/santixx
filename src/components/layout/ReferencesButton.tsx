import { BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/useLanguage";

export function ReferencesButton() {
  const { t } = useLanguage();
  return (
    <button className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-full px-6 py-3 flex items-center gap-2.5 spring-hover hover:bg-primary/10 group">
      <BookOpen className="size-4 text-primary" />
      <span className="text-[11px] tracking-[0.22em] uppercase font-bold">{t.ref_button}</span>
      <span className="size-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
    </button>
  );
}
