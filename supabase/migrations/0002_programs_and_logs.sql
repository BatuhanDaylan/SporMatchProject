-- SporMatch — Faz 2: programlar & antrenman kayıtları
-- Idempotent yazıldı.

-- =========================================================
-- 1) PROGRAMS — esnek/yapılandırılabilir antrenman programı
-- =========================================================
create table if not exists public.programs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  sport_id    text references public.sports (id) on delete set null,
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  -- template: { "days": [ { id, name, exercises: [ { id, name, fields: [ {key,label,type,unit} ] } ] } ] }
  template    jsonb not null default '{"days":[]}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists programs_owner_idx      on public.programs (owner_id);
create index if not exists programs_visibility_idx on public.programs (visibility);
create index if not exists programs_sport_idx      on public.programs (sport_id);

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

-- =========================================================
-- 2) WORKOUT_LOGS — programa göre yapılan antrenman kaydı
-- =========================================================
create table if not exists public.workout_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  program_id   uuid not null references public.programs (id) on delete cascade,
  day_id       text,                         -- template içindeki gün
  performed_at date not null default current_date,
  -- data: { "entries": [ { exercise_id, values: { <fieldKey>: number|string } } ] }
  data         jsonb not null default '{}'::jsonb,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists workout_logs_user_idx    on public.workout_logs (user_id, performed_at);
create index if not exists workout_logs_program_idx on public.workout_logs (program_id);

-- =========================================================
-- 3) RLS
-- =========================================================
alter table public.programs     enable row level security;
alter table public.workout_logs enable row level security;

-- programs: public olanları herkes görür; private'ı yalnız sahibi görür
drop policy if exists "programs_select" on public.programs;
create policy "programs_select" on public.programs
  for select to authenticated
  using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists "programs_insert_own" on public.programs;
create policy "programs_insert_own" on public.programs
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "programs_update_own" on public.programs;
create policy "programs_update_own" on public.programs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "programs_delete_own" on public.programs;
create policy "programs_delete_own" on public.programs
  for delete to authenticated using (owner_id = auth.uid());

-- workout_logs: yalnızca sahibi (gizli antrenman verisi)
drop policy if exists "workout_logs_all_own" on public.workout_logs;
create policy "workout_logs_all_own" on public.workout_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
