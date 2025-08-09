import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Item = { id: string; label: string; done: boolean; updated_at: string; qty: number };

type State = {
  items: Record<string, Item[]>;
  upserts: Record<string, Item[]>;
  removeQueue: Record<string, string[]>;
};
type Actions = {
  load: (listId: string, items: Item[]) => void;
  add: (listId: string, label: string, qty?: number) => Item;
  toggle: (listId: string, id: string) => void;
  remove: (listId: string, id: string) => void;
  setQty: (listId: string, id: string, qty: number) => void;
  clearBought: (listId: string) => void;
  consumeQueues: (listId: string) => { upserts: Item[]; removeIds: string[] };
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      items: {},
      upserts: {},
      removeQueue: {},
      load: (listId, items) =>
        set((s) => ({ items: { ...s.items, [listId]: items } })),
      add: (listId, label, qty = 1) => {
        const item: Item = {
          id: crypto.randomUUID(),
          label,
          done: false,
          updated_at: new Date().toISOString(),
          qty,
        };
        set((s) => ({
          items: { ...s.items, [listId]: [item, ...(s.items[listId] ?? [])] },
          upserts: { ...s.upserts, [listId]: [item, ...(s.upserts[listId] ?? [])] },
        }));
        return item;
      },
      toggle: (listId, id) =>
        set((s) => {
          const list = (s.items[listId] ?? []).map((it) =>
            it.id === id ? { ...it, done: !it.done, updated_at: new Date().toISOString() } : it
          );
          const changed = list.find((i) => i.id === id)!;
          return {
            items: { ...s.items, [listId]: list },
            upserts: { ...s.upserts, [listId]: [changed, ...(s.upserts[listId] ?? [])] },
          };
        }),
      setQty: (listId, id, qty) =>
        set((s) => {
          const list = (s.items[listId] ?? []).map((it) =>
            it.id === id ? { ...it, qty, updated_at: new Date().toISOString() } : it
          );
          const changed = list.find((i) => i.id === id)!;
          return {
            items: { ...s.items, [listId]: list },
            upserts: { ...s.upserts, [listId]: [changed, ...(s.upserts[listId] ?? [])] },
          };
        }),
      remove: (listId, id) =>
        set((s) => ({
          items: { ...s.items, [listId]: (s.items[listId] ?? []).filter((i) => i.id !== id) },
          removeQueue: { ...s.removeQueue, [listId]: [id, ...(s.removeQueue[listId] ?? [])] },
        })),
      clearBought: (listId) =>
        set((s) => {
          const remaining = (s.items[listId] ?? []).filter(i => !i.done);
          const removedIds = (s.items[listId] ?? []).filter(i => i.done).map(i => i.id);
          return {
            items: { ...s.items, [listId]: remaining },
            removeQueue: { ...s.removeQueue, [listId]: [...(s.removeQueue[listId] ?? []), ...removedIds] },
          };
        }),
      consumeQueues: (listId) => {
        const { upserts, removeQueue } = get();
        const ups = upserts[listId] ?? [];
        const dels = removeQueue[listId] ?? [];
        set((s) => ({
          upserts: { ...s.upserts, [listId]: [] },
          removeQueue: { ...s.removeQueue, [listId]: [] },
        }));
        return { upserts: ups, removeIds: dels };
      },
    }),
    { name: "shopping-list", storage: createJSONStorage(() => localStorage) }
  )
);
