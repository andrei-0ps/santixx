import { AlertTriangle, ListChecks, ShieldCheck, Stethoscope, TrendingUp } from "lucide-react";
import type { SantixStructuredAiOutput } from "@/lib/ai/structured-output";

type SectionKey = "summary" | "causes" | "aggravators" | "safeActions" | "consult" | "note";

export type ParsedAiAnswer = {
  summary: string;
  causes: string[];
  aggravators: string[];
  safeActions: string[];
  consult: string[];
  note: string;
};

// The deterministic backend answer (formatSixSectionAnswer) is emitted as six
// numbered sections in a stable order. We detect each header by its localized
// title so we can re-render the body as visual cards instead of a wall of text.
const HEADER_MATCHERS: Record<"ro" | "en", Array<{ key: SectionKey; test: RegExp }>> = {
  ro: [
    { key: "summary", test: /^rezumat/i },
    { key: "causes", test: /^posibile cauze/i },
    { key: "aggravators", test: /^ce ar putea agrava/i },
    { key: "safeActions", test: /^ce poate face/i },
    { key: "consult", test: /^c[âa]nd ar trebui/i },
    { key: "note", test: /^limit[ăa] informativ/i },
  ],
  en: [
    { key: "summary", test: /^brief summary/i },
    { key: "causes", test: /^possible causes/i },
    { key: "aggravators", test: /^what could aggravate/i },
    { key: "safeActions", test: /^what the user can/i },
    { key: "consult", test: /^when to consult/i },
    { key: "note", test: /^informational limit/i },
  ],
};

function stripLeadingMarker(line: string) {
  return line.replace(/^\s*(?:\d+[.)]|[-•*])\s+/, "").trim();
}

function matchHeader(line: string, lang: "ro" | "en"): SectionKey | null {
  const cleaned = stripLeadingMarker(line);
  for (const matcher of HEADER_MATCHERS[lang]) {
    if (matcher.test.test(cleaned)) return matcher.key;
  }
  return null;
}

/**
 * Parses the six-section deterministic answer into structured sections.
 * Returns null when the text does not follow that format (e.g. a clarifying
 * question during the triage flow), so the caller can fall back to plain text.
 */
export function parseStructuredAiAnswer(text: string, lang: "ro" | "en"): ParsedAiAnswer | null {
  const lines = text.split("\n");
  const buckets: Record<SectionKey, string[]> = {
    summary: [],
    causes: [],
    aggravators: [],
    safeActions: [],
    consult: [],
    note: [],
  };

  let current: SectionKey | null = null;
  let matchedHeaders = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const header = matchHeader(line, lang);
    if (header) {
      current = header;
      matchedHeaders += 1;
      continue;
    }
    if (current) buckets[current].push(stripLeadingMarker(line));
  }

  // Require the summary plus at least two more sections to treat this as a
  // structured recommendation; otherwise it is a normal conversational reply.
  if (matchedHeaders < 3 || buckets.summary.length === 0) return null;

  return {
    summary: buckets.summary.join(" "),
    causes: buckets.causes,
    aggravators: buckets.aggravators,
    safeActions: buckets.safeActions,
    consult: buckets.consult,
    note: buckets.note.join(" "),
  };
}

type Labels = {
  causes: string;
  aggravators: string;
  safeActions: string;
  consult: string;
  urgent: string;
  disclaimer: string;
};

function CardList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li
          key={index}
          className="relative pl-3.5 text-xs leading-snug text-foreground/90 before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-current/50"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function StructuredAiAnswer({
  parsed,
  structured,
  labels,
}: {
  parsed: ParsedAiAnswer;
  structured?: SantixStructuredAiOutput;
  labels: Labels;
}) {
  const urgent = Boolean(structured?.needs_medical_attention || structured?.red_flags_detected);

  return (
    <div className="w-full space-y-2.5">
      {urgent && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/12 px-3 py-2">
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          <p className="text-[11.5px] font-bold leading-snug text-destructive">{labels.urgent}</p>
        </div>
      )}

      {parsed.summary && (
        <p className="text-xs leading-relaxed text-foreground/90">{parsed.summary}</p>
      )}

      {parsed.causes.length > 0 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ListChecks className="size-3.5 text-amber-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/90">
              {labels.causes}
            </h5>
          </div>
          <div className="text-amber-200/80">
            <CardList items={parsed.causes} />
          </div>
        </div>
      )}

      {parsed.aggravators.length > 0 && (
        <div className="rounded-xl border border-orange-400/25 bg-orange-400/[0.06] px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-orange-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300/90">
              {labels.aggravators}
            </h5>
          </div>
          <div className="text-orange-200/80">
            <CardList items={parsed.aggravators} />
          </div>
        </div>
      )}

      {parsed.safeActions.length > 0 && (
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-sky-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300/90">
              {labels.safeActions}
            </h5>
          </div>
          <div className="text-sky-200/80">
            <CardList items={parsed.safeActions} />
          </div>
        </div>
      )}

      {parsed.consult.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Stethoscope className="size-3.5 text-rose-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300/90">
              {labels.consult}
            </h5>
          </div>
          <div className="text-rose-200/80">
            <CardList items={parsed.consult} />
          </div>
        </div>
      )}

      {parsed.note && (
        <p className="text-[10.5px] italic leading-snug text-muted-foreground">{parsed.note}</p>
      )}
    </div>
  );
}
