export type TriageRedFlagLevel =
  "none" | "needs_more_info" | "watch" | "medical_attention" | "urgent";

export const TRIAGE_CONVERSATION_POLICY = {
  intermediateMaxWords: 70,
  firstAnswerTargetWords: [40, 70],
  maxQuestionsPerTurn: 1,
  diagnosisAllowed: false,
  defaultUsesNumberedSections: false,
  pdfRequiresFinalizedSummary: true,
  userMessageOverridesSelectedStructure: true,
  requiredFlows: [
    "wound_cut",
    "burn",
    "musculoskeletal_pain",
    "trauma_fall_hit",
    "numbness_weakness",
    "abdominal_pain",
    "urinary_kidney",
    "chest_pain",
    "breathing_problem",
    "headache_neuro",
    "unknown",
  ],
} as const;

export const RED_FLAG_LEVEL_RANK: Record<TriageRedFlagLevel, number> = {
  none: 0,
  needs_more_info: 1,
  watch: 2,
  medical_attention: 3,
  urgent: 4,
};

export function normalizeTriageRedFlagLevel(value: unknown): TriageRedFlagLevel | null {
  if (value === "none") return "none";
  if (value === "needs_more_info") return "needs_more_info";
  if (value === "watch") return "watch";
  if (value === "medical_attention") return "medical_attention";
  if (value === "urgent") return "urgent";
  if (value === "low") return "needs_more_info";
  if (value === "medium") return "medical_attention";
  return null;
}

export function strongerRedFlagLevel(
  current: TriageRedFlagLevel,
  next: TriageRedFlagLevel,
): TriageRedFlagLevel {
  return RED_FLAG_LEVEL_RANK[next] > RED_FLAG_LEVEL_RANK[current] ? next : current;
}

export function isMedicalAttentionLevel(level: TriageRedFlagLevel | null | undefined) {
  return level === "medical_attention" || level === "urgent";
}

export function buildTriageOrientation(
  level: TriageRedFlagLevel,
  lang: "ro" | "en" = "ro",
) {
  if (lang === "en") {
    if (level === "urgent") {
      return "Santix guidance: seek urgent medical help. If symptoms are severe, rapidly worsening, or you feel unsafe, call 112.";
    }
    if (level === "medical_attention") {
      return "Santix guidance: arrange a medical consultation as soon as possible, especially if the symptom persists or worsens.";
    }
    if (level === "needs_more_info") {
      return "Santix guidance: there is not enough information to estimate the concern level safely. Continue the assessment or ask a clinician.";
    }
    if (level === "watch") {
      return "Santix guidance: monitor the symptom closely and seek medical advice if it persists, worsens, or a new warning sign appears.";
    }
    return "Santix guidance: the answers provided did not reveal a warning sign in this flow. Monitor the symptom and seek medical advice if it persists, worsens, or changes.";
  }

  if (level === "urgent") {
    return "Orientare Santix: caută ajutor medical urgent. Dacă simptomele sunt severe, se agravează rapid sau nu te simți în siguranță, sună la 112.";
  }
  if (level === "medical_attention") {
    return "Orientare Santix: programează un consult medical cât mai curând, mai ales dacă simptomul persistă sau se agravează.";
  }
  if (level === "needs_more_info") {
    return "Orientare Santix: informațiile nu sunt suficiente pentru a estima în siguranță nivelul de îngrijorare. Continuă evaluarea sau cere sfatul unui medic.";
  }
  if (level === "watch") {
    return "Orientare Santix: monitorizează atent simptomul și cere sfat medical dacă persistă, se agravează sau apare un semn de alarmă nou.";
  }
  return "Orientare Santix: răspunsurile oferite nu au indicat un semn de alarmă în acest flux. Monitorizează simptomul și cere sfat medical dacă persistă, se agravează sau se schimbă.";
}

type PolicyAnswerInput = {
  lang: "ro" | "en";
  selectedStructure: string;
  selectedStructureMatchesIntent: boolean;
  showContextRedirect?: boolean;
  clarifyCurrentQuestion?: boolean;
  mismatchRo: string;
  mismatchEn: string;
  introRo: string;
  introEn: string;
  urgentRo?: string;
  urgentEn?: string;
  redFlagLevel: TriageRedFlagLevel;
  question: string | null;
};

export function buildPolicyTriageAnswer(input: PolicyAnswerInput) {
  const en = input.lang === "en";
  if (!input.question) {
    return en
      ? "I have enough information for a short educational summary. Use “Finalize summary”, then you can generate a local PDF."
      : "Am suficiente informatii pentru un rezumat educational scurt. Apasa „Finalizeaza rezumatul”, apoi poti genera PDF local.";
  }

  const prefix = input.clarifyCurrentQuestion
    ? en
      ? "I couldn't interpret that answer. Let me repeat the current question:"
      : "Nu am putut interpreta răspunsul. Reformulez întrebarea curentă:"
    : input.showContextRedirect && !input.selectedStructureMatchesIntent
      ? en
        ? `Although you selected ${input.selectedStructure}, this sounds more like ${input.mismatchEn}.`
        : `Desi ai selectat ${input.selectedStructure}, ce descrii pare mai degraba ${input.mismatchRo}.`
      : input.redFlagLevel === "urgent"
        ? en
          ? (input.urgentEn ??
            "This may need prompt medical help. Santix cannot assess emergencies.")
          : (input.urgentRo ??
            "Asta poate necesita ajutor medical rapid. Santix nu poate evalua urgente.")
        : en
          ? input.introEn
          : input.introRo;

  return `${prefix} ${input.question}`.replace(/\s+/g, " ").trim();
}

export function policyFallbackRedFlagLevel(args: {
  isUrgent: boolean;
  hasRedFlags: boolean;
}): TriageRedFlagLevel {
  if (args.isUrgent) return "urgent";
  if (args.hasRedFlags) return "medical_attention";
  return "none";
}
