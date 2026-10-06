create extension if not exists pgcrypto;
create table if not exists public.responses (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 source text default 'web',
 payload jsonb not null
);
alter table public.responses enable row level security;
-- No public SELECT/INSERT policy: only the Vercel server route uses the service role.
create index if not exists responses_created_at_idx on public.responses(created_at desc);
