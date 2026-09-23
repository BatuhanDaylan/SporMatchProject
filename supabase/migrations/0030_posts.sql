-- 0030: Aktivite akışı — gönderi + beğeni. Kullanıcı metin/foto paylaşır,
-- diğerleri beğenir. Blok filtreli feed RPC; moderasyon + rate limit. Idempotent.

-- =========================================================
-- 1) POSTS
-- =========================================================
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text check (body is null or char_length(body) <= 1000),
  image_url  text,
  created_at timestamptz not null default now(),
  -- en az biri dolu olmalı
  constraint posts_has_content check (coalesce(nullif(trim(body), ''), image_url) is not null)
);
create index if not exists posts_author_idx  on public.posts (author_id, created_at desc);
create index if not exists posts_created_idx  on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to authenticated using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated using (author_id = auth.uid());

-- Moderasyon (metin).
create or replace function public.moderate_post() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(coalesce(new.body,'')) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_post on public.posts;
create trigger trg_moderate_post before insert or update on public.posts
  for each row execute function public.moderate_post();

-- Rate limit: 20 gönderi / saat.
create or replace function public.rl_posts() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('posts', 'author_id', new.author_id, 20, 3600); return new; end; $$;
drop trigger if exists trg_rl_posts on public.posts;
create trigger trg_rl_posts before insert on public.posts
  for each row execute function public.rl_posts();

-- =========================================================
-- 2) POST_REACTIONS (beğeni)
-- =========================================================
create table if not exists public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);

alter table public.post_reactions enable row level security;

drop policy if exists "pr_select" on public.post_reactions;
create policy "pr_select" on public.post_reactions for select to authenticated using (true);

drop policy if exists "pr_insert_own" on public.post_reactions;
create policy "pr_insert_own" on public.post_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "pr_delete_own" on public.post_reactions;
create policy "pr_delete_own" on public.post_reactions
  for delete to authenticated using (user_id = auth.uid());

-- Rate limit: 120 beğeni / dakika.
create or replace function public.rl_post_reactions() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('post_reactions', 'user_id', new.user_id, 120, 60); return new; end; $$;
drop trigger if exists trg_rl_post_reactions on public.post_reactions;
create trigger trg_rl_post_reactions before insert on public.post_reactions
  for each row execute function public.rl_post_reactions();

-- Beğeni bildirimi (kendi gönderine değil).
create or replace function public.post_reaction_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare author uuid; liker text; ptitle text;
begin
  select author_id into author from posts where id = new.post_id;
  if author is null or author = new.user_id then return new; end if;
  select coalesce(display_name, username, 'Bir sporcu') into liker from profiles where id = new.user_id;
  perform notify_user(author, 'Gönderin beğenildi',
    liker || ' gönderini beğendi.',
    jsonb_build_object('type','post','post_id',new.post_id));
  return new;
end; $$;
drop trigger if exists trg_post_reaction_notify on public.post_reactions;
create trigger trg_post_reaction_notify after insert on public.post_reactions
  for each row execute function public.post_reaction_notify();

-- =========================================================
-- 3) RPC: feed_posts — son gönderiler (blok filtreli, zenginleştirilmiş)
-- =========================================================
create or replace function public.feed_posts(p_limit int default 50, p_author uuid default null)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      p.id, p.body, p.image_url, p.created_at, p.author_id,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p
    where (p_author is null or p.author_id = p_author)
      and not exists (
        select 1 from user_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
           or (b.blocker_id = p.author_id and b.blocked_id = auth.uid())
      )
    order by p.created_at desc
    limit greatest(p_limit, 1)
  ) t;
$$;
grant execute on function public.feed_posts(int, uuid) to authenticated;

-- =========================================================
-- 4) Gönderi görselleri için Storage bucket
-- =========================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

drop policy if exists "posts_img_public_read" on storage.objects;
create policy "posts_img_public_read" on storage.objects
  for select to public using (bucket_id = 'post-images');

drop policy if exists "posts_img_insert_own" on storage.objects;
create policy "posts_img_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts_img_delete_own" on storage.objects;
create policy "posts_img_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
