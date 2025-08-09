import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { api } from "../api";

export default function App() {
  const { listId } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);

  const items = useStore((s) => (listId ? s.items[listId] ?? [] : []));
  const load = useStore((s) => s.load);
  const add = useStore((s) => s.add);
  const toggle = useStore((s) => s.toggle);
  const remove = useStore((s) => s.remove);
  const clearBought = useStore((s) => s.clearBought);
  const setQty = useStore((s) => s.setQty);
  const consumeQueues = useStore((s) => s.consumeQueues);

  useEffect(() => {
    (async () => {
      if (!listId) {
        const { listId: id } = await api.ensureList();
        nav(`/l/${id}`, { replace: true });
        return;
      }
      const { items } = await api.fetchList(listId);
      load(listId, items);
      setLoading(false);
    })();
  }, [listId]);

  useEffect(() => {
    if (!listId) return;
    const interval = setInterval(async () => {
      const { upserts, removeIds } = consumeQueues(listId);
      for (const it of upserts) {
        try { await api.patchItem(listId, it.id, { label: it.label, done: it.done, qty: it.qty }); }
        catch { await api.addItem(listId, it.label, it.qty ?? 1); }
      }
      for (const id of removeIds) await api.deleteItem(listId, id);
    }, 1500);
    return () => clearInterval(interval);
  }, [listId]);

  const bought = useMemo(() => items.filter(i => i.done), [items]);
  const pending = useMemo(() => items.filter(i => !i.done), [items]);

  if (loading) return <div className="p-6">Carico la lista…</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <header className="mb-4">
        <div className="rounded-lg p-3 mb-3 bg-green-600 text-white">
          <h1 className="text-xl font-semibold">Spesa di Fede 🛒</h1>
          <p className="text-xs opacity-90 break-all">Condividi: {window.location.href}</p>
        </div>
        <AddForm onAdd={(label, qty) => listId && add(listId, label, qty)} />
        {bought.length > 0 && (
          <button
            className="mt-2 text-sm px-3 py-2 border rounded hover:bg-gray-50"
            onClick={() => listId && clearBought(listId)}
          >
            Svuota comprati ({bought.length})
          </button>
        )}
      </header>

      <Section title="Da comprare">
        {pending.map(i => (
          <Row key={i.id} label={i.label} qty={i.qty} done={i.done}
               onToggle={() => listId && toggle(listId, i.id)}
               onRemove={() => listId && remove(listId, i.id)}
               onQtyChange={(q) => listId && setQty(listId, i.id, q)} />
        ))}
        {pending.length === 0 && <Empty text="Tutto comprato!" />}
      </Section>

      <Section title={`Comprati (${bought.length})`} collapsed>
        {bought.map(i => (
          <Row key={i.id} label={i.label} qty={i.qty} done={i.done}
               onToggle={() => listId && toggle(listId, i.id)}
               onRemove={() => listId && remove(listId, i.id)}
               onQtyChange={(q) => listId && setQty(listId, i.id, q)} />
        ))}
      </Section>
    </div>
  );
}

function AddForm({ onAdd }: { onAdd: (label: string, qty: number) => void }) {
  const [v, setV] = useState("");
  const [q, setQ] = useState(1);
  return (
    <form className="flex gap-2 mt-3" onSubmit={(e) => {
      e.preventDefault();
      const t = v.trim(); if (!t) return;
      onAdd(t, q || 1); setV(""); setQ(1);
    }}>
      <input className="flex-1 border rounded px-3 py-2" placeholder="Aggiungi articolo…" value={v} onChange={e=>setV(e.target.value)} />
      <input type="number" min={1} className="w-20 border rounded px-3 py-2" value={q} onChange={e=>setQ(parseInt(e.target.value || "1"))} />
      <button className="border rounded px-3 py-2">Aggiungi</button>
    </form>
  );
}

function Row({ label, qty, done, onToggle, onRemove, onQtyChange }:
  { label:string; qty:number; done:boolean; onToggle:()=>void; onRemove:()=>void; onQtyChange:(q:number)=>void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <button onClick={onToggle} className="text-left flex-1">
        <span className={done ? "line-through text-gray-400" : ""}>
          {label}{' '}{qty > 1 ? `×${qty}` : ""}
        </span>
      </button>
      {!done && (
        <input
          type="number"
          min={1}
          className="w-16 border rounded px-2 py-1 text-sm mr-2"
          value={qty}
          onChange={(e) => onQtyChange(parseInt(e.target.value || "1"))}
        />
      )}
      <button onClick={onRemove} className="text-xs text-red-600 ml-1">Rimuovi</button>
    </div>
  );
}
function Section({ title, children, collapsed=false, }: any) {
  const [open, setOpen] = useState(!collapsed);
  return (
    <section className="mb-6">
      <button className="w-full text-left font-medium" onClick={()=>setOpen(o=>!o)}>{title}</button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
}
function Empty({ text }: { text:string }) { return <div className="text-sm text-gray-500">{text}</div>; }
