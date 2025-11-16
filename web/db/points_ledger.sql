-- Create points_ledger table for customer point history
-- Safe to run multiple times
create extension if not exists pgcrypto;

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  customer_id uuid not null,
  delta integer not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_points_ledger_owner on public.points_ledger(owner_id);
create index if not exists idx_points_ledger_customer on public.points_ledger(customer_id);
create index if not exists idx_points_ledger_created on public.points_ledger(created_at desc);

-- Enable RLS and restrict access to row owner
alter table public.points_ledger enable row level security;

-- RLS policies: a user can only see/insert their own rows (by owner_id)
create policy if not exists points_ledger_select_policy
on public.points_ledger for select
using (owner_id = auth.uid());

create policy if not exists points_ledger_insert_policy
on public.points_ledger for insert
with check (owner_id = auth.uid());
