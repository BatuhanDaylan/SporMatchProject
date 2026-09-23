-- SporMatch — Faz 3: program yorumları (realtime)
-- Idempotent yazıldı.

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_program_idx on public.comments (program_id, created_at);
create index if not exists comments_author_idx  on public.comments (author_id);

alter table public.comments enable row level security;

-- Yorumlar, ait olduğu program görülebiliyorsa görülebilir
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = comments.program_id
        and (p.visibility = 'public' or p.owner_id = auth.uid())
    )
  );

-- Yalnızca görülebilen programa, kendi adına yorum eklenir
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.programs p
      where p.id = comments.program_id
        and (p.visibility = 'public' or p.owner_id = auth.uid())
    )
  );

-- Güncelleme: yalnızca yazar
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Silme: yazar VEYA program sahibi (moderasyon)
drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.programs p where p.id = comments.program_id and p.owner_id = auth.uid())
  );

-- Realtime yayınına ekle (yoksa)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    execute 'alter publication supabase_realtime add table public.comments';
  end if;
end $$;
