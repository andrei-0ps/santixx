/**
 * Onboarding „Stagiul de Inițiere" — ghid interactiv integrat organic în
 * panoul din stânga, în locul tutorialelor rigide de tip pop-up.
 *
 * Arhitectură event-driven: componentele existente (canvas 3D, straturi,
 * simulatorul optic, triajul AI) doar DISPATCH-uiesc un pas printr-un
 * CustomEvent; widget-ul din Sidebar ascultă, bifează misiunea, dă XP și
 * afișează un toast discret. Progresul și starea de „utilizator nou" sunt
 * persistate în localStorage, deci ghidul nu reapare după finalizare.
 */

export type OnboardingStepId = "perspective" | "layers" | "diagnosis" | "copilot";

export const ONBOARDING_STEP_EVENT = "santix-onboarding-step";
export const ONBOARDING_STEPS_KEY = "santix-onboarding-steps";
export const ONBOARDING_DONE_KEY = "santix-onboarding-done";

export const ONBOARDING_STEPS: {
  id: OnboardingStepId;
  ro: string;
  en: string;
  rewardRo: string;
  rewardEn: string;
}[] = [
  {
    id: "perspective",
    ro: "Schimbă perspectiva — rotește modelul 3D",
    en: "Change the perspective — rotate the 3D model",
    rewardRo: "+50 XP: Abilitate de navigare deblocată!",
    rewardEn: "+50 XP: Navigation skill unlocked!",
  },
  {
    id: "layers",
    ro: "Secționează corpul uman — schimbă stratul anatomic",
    en: "Section the body — switch the anatomy layer",
    rewardRo: "+50 XP: Straturi anatomice deblocate!",
    rewardEn: "+50 XP: Anatomy layers unlocked!",
  },
  {
    id: "diagnosis",
    ro: "Primul diagnostic — reglează dioptriile sau intensitatea în Optică",
    en: "First diagnosis — adjust diopters or intensity in Optics",
    rewardRo: "+50 XP: Simț clinic deblocat!",
    rewardEn: "+50 XP: Clinical sense unlocked!",
  },
  {
    id: "copilot",
    ro: "Consultă Copilotul AI — răspunde la o întrebare rapidă",
    en: "Consult the AI Copilot — answer a quick question",
    rewardRo: "+50 XP: Copilot AI activat!",
    rewardEn: "+50 XP: AI Copilot activated!",
  },
];

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
}

export function readOnboardingSteps(): OnboardingStepId[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(ONBOARDING_STEPS_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Semnalează un pas de onboarding din orice componentă. No-op după finalizare,
 * deci declanșatorii pot rămâne permanent în cod fără vreun cost.
 */
export function dispatchOnboardingStep(step: OnboardingStepId) {
  if (typeof window === "undefined" || isOnboardingDone()) return;
  window.dispatchEvent(new CustomEvent<OnboardingStepId>(ONBOARDING_STEP_EVENT, { detail: step }));
}
