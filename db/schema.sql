create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  persona_id text not null,
  transcript jsonb not null,
  debrief jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_created_at_idx on sessions (created_at desc);
