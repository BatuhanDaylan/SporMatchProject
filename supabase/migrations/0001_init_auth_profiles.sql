-- SporMatch — Faz 1: kimlik doğrulama & profil şeması
-- Idempotent yazıldı: SQL Editor'de tekrar çalıştırılabilir.

-- =========================================================
-- 1) PROFILES — auth.users ile 1-1 profil
-- =========================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  bio          text,
  avatar_url   text,
  level        text check (level in ('beginner', 'intermediate', 'advanced')),
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Kullanıcı profili (auth.users ile 1-1).';

-- username format kısıtı (3-20, harf/rakam/alt çizgi) — sadece dolu ise
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-zA-Z0-9_]{3,20}$');

-- =========================================================
-- 2) SPORTS — spor kataloğu (istemciden salt-okunur)
-- =========================================================
create table if not exists public.sports (
  id   text primary key,          -- slug: 'running', 'football'...
  name text not null,             -- Türkçe görünen ad
  icon text                       -- emoji
);

insert into public.sports (id, name, icon) values
  ('running',      'Koşu',            '🏃'),
  ('gym',          'Fitness (Salon)', '🏋️'),
  ('football',     'Futbol',          '⚽'),
  ('basketball',   'Basketbol',       '🏀'),
  ('volleyball',   'Voleybol',        '🏐'),
  ('tennis',       'Tenis',           '🎾'),
  ('table_tennis', 'Masa Tenisi',     '🏓'),
  ('cycling',      'Bisiklet',        '🚴'),
  ('swimming',     'Yüzme',           '🏊'),
  ('yoga',         'Yoga',            '🧘'),
  ('pilates',      'Pilates',         '🤸'),
  ('boxing',       'Boks',            '🥊'),
  ('crossfit',     'CrossFit',        '💪'),
  ('hiking',       'Doğa Yürüyüşü',   '🥾')
on conflict (id) do update set name = excluded.name, icon = excluded.icon;

-- =========================================================
-- 3) USER_SPORTS — kullanıcının yaptığı sporlar + seviye
-- =========================================================
create table if not exists public.user_sports (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  sport_id    text not null references public.sports (id) on delete cascade,
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  created_at  timestamptz not null default now(),
  primary key (user_id, sport_id)
);

create index if not exists user_sports_sport_idx on public.user_sports (sport_id);

-- =========================================================
-- 4) updated_at otomatik güncelleme trigger'ı
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================
-- 5) Kayıt olunca otomatik boş profil oluştur
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 6) RLS — Satır Düzeyi Güvenlik
-- =========================================================
alter table public.profiles    enable row level security;
alter table public.sports      enable row level security;
alter table public.user_sports enable row level security;

-- profiles: giriş yapmış herkes tüm profilleri okuyabilir (keşif/eşleşme için)
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

-- profiles: kullanıcı yalnızca kendi profilini ekler/günceller
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- sports: giriş yapmış herkes okur, yazamaz (katalog yönetimli)
drop policy if exists "sports_select_all" on public.sports;
create policy "sports_select_all" on public.sports
  for select to authenticated using (true);

-- user_sports: giriş yapmış herkes okur (eşleşme/keşif için)
drop policy if exists "user_sports_select_all" on public.user_sports;
create policy "user_sports_select_all" on public.user_sports
  for select to authenticated using (true);

-- user_sports: kullanıcı yalnızca kendi kayıtlarını yönetir
drop policy if exists "user_sports_write_own" on public.user_sports;
create policy "user_sports_write_own" on public.user_sports
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
