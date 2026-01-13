-- Migration Supabase - Hôpital Braun Cinkassé

-- 1. Table des rapports quotidiens
create table public.daily_reports (
  id uuid default gen_random_uuid() primary key,
  service_id text not null,
  date date not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  
  unique(service_id, date)
);

-- 2. Table des rapports hebdomadaires
create table public.weekly_reports (
  id uuid default gen_random_uuid() primary key,
  service_id text not null,
  week_number integer not null,
  year integer not null,
  status text not null default 'pending', -- pending, validated, rejected
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  validated_at timestamp with time zone,
  validated_by text,
  rejected_at timestamp with time zone,
  rejected_by text,
  rejection_reason text,
  user_id uuid references auth.users(id),
  
  unique(service_id, week_number, year)
);

-- 3. Sécurité (RLS)
alter table public.daily_reports enable row level security;
alter table public.weekly_reports enable row level security;

-- Politiques (Simplifiées pour démo - à affiner)
-- Tout le monde peut lire/écrire si authentifié (ou affiner par rôle)
create policy "Enable all access for authenticated users" on public.daily_reports
  for all using (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users" on public.weekly_reports
  for all using (auth.role() = 'authenticated');
