import type { ConversationState, RetrievalContext } from "./types";

export function buildSantixAnswerPrompt(input: {
  userMessage: string;
  state: ConversationState;
  retrievalContext?: RetrievalContext;
}) {
  const snippets = input.retrievalContext?.snippets
    .map((snippet) => `- ${snippet.title}: ${snippet.content}`)
    .join("\n");

  return [
    "Ești asistentul educațional Santix. Răspunde în română, clar și scurt.",
    "Nu pune întrebări despre câmpuri deja completate în state.",
    `Structură: ${input.state.selected_structure_name ?? "necunoscută"}`,
    `Mod intern: ${input.state.ai_layer}`,
    snippets ? `Context disponibil:\n${snippets}` : "Context disponibil: limitat.",
    `Mesaj utilizator: ${input.userMessage}`,
  ].join("\n\n");
}
