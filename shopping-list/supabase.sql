-- Supabase schema for MVP
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists items_list_id_idx on public.items(list_id);
