const base = "/.netlify/functions/api";

export const api = {
  ensureList: async (): Promise<{ listId: string }> => {
    const res = await fetch(`${base}/lists`, { method: "POST" });
    return res.json();
  },
  fetchList: async (listId: string) => {
    const res = await fetch(`${base}/lists/${listId}`);
    return res.json() as Promise<{ items: any[] }>;
  },
  addItem: async (listId: string, label: string) => {
    const res = await fetch(`${base}/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    return res.json();
  },
  patchItem: async (listId: string, itemId: string, patch: any) => {
    const res = await fetch(`${base}/lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.json();
  },
  deleteItem: async (listId: string, itemId: string) => {
    await fetch(`${base}/lists/${listId}/items/${itemId}`, { method: "DELETE" });
  },
};
