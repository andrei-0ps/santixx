export type YesNoUnknown = "yes" | "no" | "unknown";
export type AiLayer = "skeleton" | "muscular" | "organs";
export type VisualLayer = AiLayer | "complete";
export type Confidence = "low" | "medium" | "high";

export type AiProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  messages: AiProviderMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
};

export type GenerateStructuredInput<T> = GenerateTextInput & {
  fallback: T;
  validate?: (value: unknown) => T | null;
};

export type AIProviderInput = GenerateTextInput;

export type AIProviderOutput = {
  text: string;
  provider: string;
  model?: string;
  raw?: unknown;
};

export interface AIProvider {
  providerName: string;
  name: string;
  supportsStructuredOutput: boolean;
  generateText(input: GenerateTextInput): Promise<string>;
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}

export type AiProvider = AIProvider;

export type PainQuality =
  | "stabbing"
  | "burning"
  | "throbbing"
  | "dull"
  | "sharp"
  | "pressure"
  | "pulling"
  | "cramp"
  | "unknown";

export type Severity = "mild" | "moderate" | "severe" | "unknown";
export type TraumaType = "fall" | "hit" | "sport" | "effort" | "accident" | "none" | "unknown";
export type Onset = "sudden" | "gradual" | "unknown";
export type Duration = "minutes" | "hours" | "days" | "week_plus" | "chronic" | "unknown";

export type ConversationTopic = "anatomy" | "pain" | "injury" | "symptom" | "out_of_scope" | "unclear";

export type ConversationClassification =
  | "anatomy_question"
  | "pain_flow"
  | "symptom_or_injury"
  | "red_flag"
  | "out_of_scope"
  | "unclear";

export type NextStep =
  | "ask_trauma_or_effort"
  | "ask_onset"
  | "ask_movement"
  | "ask_severity"
  | "ask_pain_quality"
  | "ask_associated_signs"
  | "ask_duration"
  | "recommend"
  | "urgent"
  | "refuse_out_of_scope"
  | "clarify";

export type ConversationState = {
  conversation_id: string | null;
  user_id: string | null;
  selected_structure_slug: string | null;
  selected_structure_name: string | null;
  selected_structure_type: "bone" | "muscle" | "organ" | "body_region" | "unknown";
  visual_layer: VisualLayer;
  ai_layer: AiLayer;
  current_topic: ConversationTopic;
  pain_present: YesNoUnknown;
  pain_quality: PainQuality;
  trauma_or_effort: YesNoUnknown;
  trauma_type: TraumaType;
  onset: Onset;
  movement_ok: YesNoUnknown;
  severity: Severity;
  swelling: YesNoUnknown;
  bruising: YesNoUnknown;
  numbness: YesNoUnknown;
  weakness: YesNoUnknown;
  deformity: YesNoUnknown;
  duration: Duration;
  red_flags_detected: boolean;
  asked_questions: string[];
  answered_fields: string[];
  last_question_intent: string | null;
  next_step: NextStep | null;
  should_switch_context: boolean;
  target_layer: AiLayer | null;
  target_structure_slug: string | null;
  confidence: Confidence;
};

export type SymptomState = ConversationState;

export type NormalizedMessage = {
  originalMessage: string;
  normalizedMessage: string;
  matchMessage: string;
  tokens: string[];
};

export type ExtractedSignals = {
  affirmation: YesNoUnknown;
  negation: YesNoUnknown;
  pain_present: YesNoUnknown;
  pain_quality: PainQuality;
  severity: Severity;
  movement_ok: YesNoUnknown;
  trauma_or_effort: YesNoUnknown;
  trauma_type: TraumaType;
  onset: Onset;
  duration: Duration;
  swelling: YesNoUnknown;
  bruising: YesNoUnknown;
  numbness: YesNoUnknown;
  weakness: YesNoUnknown;
  deformity: YesNoUnknown;
  contexts: string[];
  body_region: string | null;
  structure_slug: string | null;
  red_flags_detected: boolean;
  red_flag_reasons: string[];
  unclear: boolean;
};

export type RetrievalSnippet = {
  id: string;
  title: string;
  content: string;
  score?: number;
  source?: string;
};

export type RetrievalContext = {
  snippets: RetrievalSnippet[];
  used_context: string[];
};

export type StructuredAIOutput = {
  reply: string;
  classification: ConversationClassification;
  signals: ExtractedSignals;
  state_before: ConversationState;
  state_after: ConversationState;
  next_step: NextStep | null;
  last_question_intent: string | null;
  red_flags_detected: boolean;
  should_switch_context: boolean;
  target_layer: AiLayer | null;
  target_structure_slug: string | null;
  confidence: Confidence;
  reply_source: "deterministic" | "ollama" | "fallback";
  retrieval_context?: RetrievalContext;
};
