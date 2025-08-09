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
        try { await api.patchItem(listId, it.id, { label: it.label, done: it.done }); }
        catch { await api.addItem(listId, it.label); }
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
        <h1 className="text-2xl font-semibold">Lista della spesa</h1>
        <p className="text-sm text-gray-500 break-all">Condividi: {window.location.href}</p>
        <AddForm onAdd={(label) => listId && add(listId, label)} />
      </header>

      <Section title="Da comprare">
        {pending.map(i => (
          <Row key={i.id} label={i.label} done={i.done}
               onToggle={() => listId && toggle(listId, i.id)}
               onRemove={() => listId && remove(listId, i.id)} />
        ))}
        {pending.length === 0 && <Empty text="Tutto comprato!" />}
      </Section>

      <Section title={`Comprati (${bought.length})`} collapsed>
        {bought.map(i => (
          <Row key={i.id} label={i.label} done={i.done}
               onToggle={() => listId && toggle(listId, i.id)}
               onRemove={() => listId && remove(listId, i.id)} />
        ))}
      </Section>
    </div>
  );
}

function AddForm({ onAdd }: { onAdd: (label: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="flex gap-2 mt-3" onSubmit={(e) => {
      e.preventDefault();
      const t = v.trim(); if (!t) return;
      onAdd(t); setV("");
    }}>
      <input className="flex-1 border rounded px-3 py-2" placeholder="Aggiungi articolo…" value={v} onChange={e=>setV(e.target.value)} />
      <button className="border rounded px-3 py-2">Aggiungi</button>
    </form>
  );
}

function Row({ label, done, onToggle, onRemove }: { label:string; done:boolean; onToggle:()=>void; onRemove:()=>void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <button onClick={onToggle} className="text-left flex-1">
        <span className={done ? "line-through text-gray-400" : ""}>{label}</span>
      </button>
      <button onClick={onRemove} className="text-xs text-red-600 ml-3">Rimuovi</button>
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
