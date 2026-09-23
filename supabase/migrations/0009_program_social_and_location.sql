-- 0009: Konum (il/ilçe) + program beğeni & kaydetme (sosyal etkileşim).

-- 1) Profil konumu: serbest 'city' yerine listeden seçilen il/ilçe.
alter table public.profiles add column if not exists province text;
alter table public.profiles add column if not exists district text;
alter table public.profiles drop column if exists city;

-- 2) Program beğenileri
create table if not exists public.program_likes (
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);
create index if not exists program_likes_program_idx on public.program_likes (program_id);

alter table public.program_likes enable row level security;

drop policy if exists "program_likes_select_all" on public.program_likes;
create policy "program_likes_select_all" on public.program_likes
  for select to authenticated using (true);

drop policy if exists "program_likes_insert_own" on public.program_likes;
create policy "program_likes_insert_own" on public.program_likes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "program_likes_delete_own" on public.program_likes;
create policy "program_likes_delete_own" on public.program_likes
  for delete to authenticated using (user_id = auth.uid());

-- 3) Program kaydetme (bookmark)
create table if not exists public.program_saves (
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);
create index if not exists program_saves_user_idx on public.program_saves (user_id, created_at desc);

alter table public.program_saves enable row level security;

drop policy if exists "program_saves_select_own" on public.program_saves;
create policy "program_saves_select_own" on public.program_saves
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "program_saves_insert_own" on public.program_saves;
create policy "program_saves_insert_own" on public.program_saves
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "program_saves_delete_own" on public.program_saves;
create policy "program_saves_delete_own" on public.program_saves
  for delete to authenticated using (user_id = auth.uid());
