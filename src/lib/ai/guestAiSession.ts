/**
 * Sesiunea AI pentru vizitatorii fără cont.
 *
 * Conversațiile guest nu ajung în baza de date: firul este ținut în starea
 * componentei și trimis înapoi la fiecare cerere, iar identificatorul de mai jos
 * există doar ca serverul să poată limita numărul de întrebări per vizitator.
 * Îl păstrăm în sessionStorage, ca limita să nu se reseteze la fiecare navigare
 * din aceeași filă.
 */

const GUEST_AI_SESSION_ID_KEY = "santix-guest-ai-session-id";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateGuestAiSessionId() {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return createSessionId();
  }
  const existing = window.sessionStorage.getItem(GUEST_AI_SESSION_ID_KEY);
  if (existing) return existing;
  const next = createSessionId();
  window.sessionStorage.setItem(GUEST_AI_SESSION_ID_KEY, next);
  return next;
}

export type GuestAiMessage = { role: "assistant" | "user"; content: string };

/** Ultimele mesaje ale firului guest, în forma acceptată de funcția AI. */
export function toGuestPreviousMessages(messages: GuestAiMessage[]) {
  return messages.slice(-16).map((message) => ({
    role: message.role,
    content: message.content.slice(0, 2_400),
  }));
}
