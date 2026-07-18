import { CheckCircle2 } from "lucide-react";

// Ordered triage steps, matching the deterministic flow in the backend
// (resolveNextStep / decidePainNextStep). next_question_intent carries the
// upcoming step, so the current question index is its position in this list.
const TRIAGE_STEPS = [
  "ask_trauma_or_effort",
  "ask_onset",
  "ask_movement",
  "ask_severity",
  "ask_associated_signs",
  "ask_duration",
] as const;

const TOTAL = TRIAGE_STEPS.length;

export function getTriageProgress(nextQuestionIntent: string | null | undefined): {
  current: number;
  total: number;
  done: boolean;
} {
  if (!nextQuestionIntent || nextQuestionIntent === "recommend") {
    return { current: TOTAL, total: TOTAL, done: true };
  }
  const index = TRIAGE_STEPS.indexOf(nextQuestionIntent as (typeof TRIAGE_STEPS)[number]);
  if (index === -1) {
    // "urgent" or any non-flow intent: not a counted triage step.
    return { current: 0, total: TOTAL, done: false };
  }
  return { current: index + 1, total: TOTAL, done: false };
}

export function TriageProgress({
  nextQuestionIntent,
  label,
  doneLabel,
}: {
  nextQuestionIntent: string | null | undefined;
  label: (current: number, total: number) => string;
  doneLabel: string;
}) {
  const { current, total, done } = getTriageProgress(nextQuestionIntent);
  // Only render while a real triage flow is in progress (or just completed).
  if (current === 0) return null;

  const percent = Math.round((current / total) * 100);

  return (
    <div className="rounded-xl border border-primary/15 bg-background/40 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
          {done && <CheckCircle2 className="size-3.5 text-emerald-400" />}
          {done ? doneLabel : label(current, total)}
        </span>
        {!done && (
          <span className="text-[10px] font-bold tabular-nums text-primary">{percent}%</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
