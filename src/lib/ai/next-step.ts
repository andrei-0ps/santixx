import type { ConversationClassification, ConversationState, NextStep } from "./types";
import type { ConversationLanguage } from "./conversationLanguage";

export type NextStepDecision = {
  nextStep: NextStep;
  lastQuestionIntent: string | null;
  reply: string;
};

const REPLIES: Record<ConversationLanguage, Record<NextStep, string>> = {
  ro: {
    refuse_out_of_scope:
      "Te pot ajuta cu anatomie, durere sau mișcare în context educațional Santix.",
    urgent:
      "Descrierea include semne care pot necesita evaluare medicală rapidă. Dacă durerea este severă, există deformare, amorțeală sau nu poți mișca zona, mergi la medic sau la urgențe.",
    ask_trauma_or_effort: "A apărut după o lovitură, căzătură, sport sau efort?",
    ask_onset: "A început brusc sau treptat?",
    ask_movement: "Poți mișca zona normal?",
    ask_severity: "Durerea este ușoară, moderată sau foarte puternică?",
    ask_pain_quality: "Cum ai descrie durerea: înțepătoare, arsură, presiune, crampă sau altfel?",
    ask_associated_signs: "Ai observat umflătură, amorțeală sau vânătaie?",
    ask_duration: "De cât timp simți durerea?",
    recommend:
      "Din ce ai descris, pare potrivit să urmărești evoluția, să eviți efortul care declanșează durerea și să ceri sfatul unui specialist dacă simptomele se agravează sau persistă.",
    clarify: "Spune-mi, te rog, ce zonă te supără și ce simți.",
  },
  en: {
    refuse_out_of_scope:
      "I can help with anatomy, pain, or movement in the educational context of Santix.",
    urgent:
      "Your description includes signs that may require prompt medical evaluation. If the pain is severe, there is deformity or numbness, or you cannot move the area, seek medical care or go to an emergency department.",
    ask_trauma_or_effort: "Did it start after a hit, fall, sport, or physical effort?",
    ask_onset: "Did it start suddenly or gradually?",
    ask_movement: "Can you move the area normally?",
    ask_severity: "Is the pain mild, moderate, or very severe?",
    ask_pain_quality:
      "How would you describe the pain: stabbing, burning, pressure, cramping, or something else?",
    ask_associated_signs: "Have you noticed swelling, numbness, or bruising?",
    ask_duration: "How long have you had the pain?",
    recommend:
      "Based on what you described, it is reasonable to monitor your symptoms, avoid the activity that triggers the pain, and seek advice from a healthcare professional if the symptoms worsen or persist.",
    clarify: "Please tell me which area is bothering you and what you feel.",
  },
};

export function resolveNextStep(
  state: ConversationState,
  classification: ConversationClassification,
  language: ConversationLanguage = "ro",
): NextStepDecision {
  if (classification === "out_of_scope") {
    return {
      nextStep: "refuse_out_of_scope",
      lastQuestionIntent: null,
      reply: REPLIES[language].refuse_out_of_scope,
    };
  }

  if (state.red_flags_detected || classification === "red_flag") {
    return {
      nextStep: "urgent",
      lastQuestionIntent: null,
      reply: REPLIES[language].urgent,
    };
  }

  if (state.trauma_or_effort === "unknown") {
    return {
      nextStep: "ask_trauma_or_effort",
      lastQuestionIntent: "trauma_or_effort",
      reply: REPLIES[language].ask_trauma_or_effort,
    };
  }

  if (state.onset === "unknown") {
    return {
      nextStep: "ask_onset",
      lastQuestionIntent: "onset",
      reply: REPLIES[language].ask_onset,
    };
  }

  if (state.movement_ok === "unknown") {
    return {
      nextStep: "ask_movement",
      lastQuestionIntent: "movement_ok",
      reply: REPLIES[language].ask_movement,
    };
  }

  if (state.severity === "unknown") {
    return {
      nextStep: "ask_severity",
      lastQuestionIntent: "severity",
      reply: REPLIES[language].ask_severity,
    };
  }

  if (state.pain_quality === "unknown") {
    return {
      nextStep: "ask_pain_quality",
      lastQuestionIntent: "pain_quality",
      reply: REPLIES[language].ask_pain_quality,
    };
  }

  if (
    state.swelling === "unknown" ||
    state.numbness === "unknown" ||
    state.bruising === "unknown"
  ) {
    return {
      nextStep: "ask_associated_signs",
      lastQuestionIntent: "associated_signs",
      reply: REPLIES[language].ask_associated_signs,
    };
  }

  if (state.duration === "unknown") {
    return {
      nextStep: "ask_duration",
      lastQuestionIntent: "duration",
      reply: REPLIES[language].ask_duration,
    };
  }

  return {
    nextStep: "recommend",
    lastQuestionIntent: null,
    reply: REPLIES[language].recommend,
  };
}
