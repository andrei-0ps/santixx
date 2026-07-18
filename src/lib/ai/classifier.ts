import type { ConversationClassification, ExtractedSignals, NormalizedMessage } from "./types";

const OUT_OF_SCOPE_TERMS = ["investitii", "bursa", "crypto", "pariuri", "reteta mancare", "programare web"];
const ANATOMY_TERMS = ["rol", "functie", "functia", "anatomie", "unde este", "ce face", "miscare", "misca"];

export function classifyConversationMessage(
  normalized: NormalizedMessage,
  signals: ExtractedSignals,
): ConversationClassification {
  const text = normalized.matchMessage;
  const isMedical =
    signals.pain_present === "yes" ||
    signals.trauma_or_effort !== "unknown" ||
    signals.body_region !== null ||
    signals.pain_quality !== "unknown";

  if (OUT_OF_SCOPE_TERMS.some((term) => text.includes(term)) && !isMedical) {
    return "out_of_scope";
  }

  if (signals.red_flags_detected) return "red_flag";
  if (signals.pain_present === "yes") return "pain_flow";
  if (signals.trauma_or_effort !== "unknown" || signals.movement_ok !== "unknown") {
    return "symptom_or_injury";
  }
  if (ANATOMY_TERMS.some((term) => text.includes(term)) || signals.body_region) {
    return "anatomy_question";
  }
  return signals.unclear ? "unclear" : "unclear";
}
