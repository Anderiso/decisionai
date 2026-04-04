-- Decisions AI: per-user profile for onboarding + preferences.
-- Safe to re-run (drops policies before recreate).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  guidance_style text check (
    guidance_style is null
    or guidance_style in ('friend', 'advisor', 'either')
  ),
  decision_focus text check (
    decision_focus is null
    or decision_focus in ('everyday', 'relationships', 'career_money', 'big_life')
  ),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
