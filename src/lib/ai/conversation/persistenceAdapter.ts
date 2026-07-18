import type { ConversationStateV1 } from "./conversationState";

export interface ConversationPersistenceAdapter {
  readonly kind: "guest" | "authenticated";
  load(): Promise<unknown>;
  save(state: ConversationStateV1): Promise<void>;
  clear?(): Promise<void>;
}

export function createGuestSessionAdapter(input: {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  key: string;
}): ConversationPersistenceAdapter {
  return {
    kind: "guest",
    async load() {
      try {
        return JSON.parse(input.storage.getItem(input.key) ?? "null");
      } catch {
        return null;
      }
    },
    async save(state) {
      input.storage.setItem(input.key, JSON.stringify(state));
    },
    async clear() {
      input.storage.removeItem(input.key);
    },
  };
}

export function createAuthenticatedConversationAdapter(input: {
  loadState: () => Promise<unknown>;
  saveState: (state: ConversationStateV1) => Promise<void>;
}): ConversationPersistenceAdapter {
  return {
    kind: "authenticated",
    load: input.loadState,
    save: input.saveState,
  };
}
