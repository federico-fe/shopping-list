# Lista della spesa — MVP (Vite + React + Netlify Functions + Supabase)

## Setup rapido

### 1) Installazione locale
```bash
pnpm i
pnpm dev
```

### 2) Supabase (schema)
Crea un progetto e poi esegui queste query SQL:

```sql
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  updated_at timestamptz not null default now()
);

create index on public.items(list_id);
```

> MVP: niente RLS. La service role key resta **solo nelle Netlify Functions**.

### 3) Variabili d'ambiente su Netlify
- `VITE_SUPABASE_URL` — URL del progetto
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only)
- (opz.) `NODE_VERSION` — es. `20`

### 4) Deploy su Netlify
- Connetti il repo GitHub → *Build command*: `pnpm build`
- *Publish dir*: `dist`
- *Functions dir*: `netlify/functions`

Dopo il deploy, l'URL principale reindirizza a `/l/:listId`. Condividi il link della lista direttamente dalla barra indirizzi.

## Script utili
- `pnpm dev` — avvio locale
- `pnpm build` — build produzione
- `pnpm preview` — serve statico produzione

## Note
- Offline-first con Zustand persist su `localStorage`.
- Sync opportunistica verso backend via Netlify Functions.
