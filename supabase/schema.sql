-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  card_name text not null,
  bank_name text not null,
  credit_limit numeric(14,2) not null default 0 check (credit_limit >= 0),
  outstanding numeric(14,2) not null default 0 check (outstanding >= 0),
  statement_amount numeric(14,2) not null default 0 check (statement_amount >= 0),
  minimum_due numeric(14,2) not null default 0 check (minimum_due >= 0),
  amount_due numeric(14,2) not null default 0 check (amount_due >= 0),
  billing_day integer not null default 1 check (billing_day between 1 and 31),
  due_day integer not null default 15 check (due_day between 1 and 31),
  due_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_cards enable row level security;
drop policy if exists "Users can view their own cards" on public.credit_cards;
create policy "Users can view their own cards" on public.credit_cards for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own cards" on public.credit_cards;
create policy "Users can insert their own cards" on public.credit_cards for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own cards" on public.credit_cards;
create policy "Users can update their own cards" on public.credit_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own cards" on public.credit_cards;
create policy "Users can delete their own cards" on public.credit_cards for delete using (auth.uid() = user_id);

create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
