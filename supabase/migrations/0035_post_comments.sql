-- 0035: Gönderi (post) yorumları. Program yorumlarıyla aynı güvenlik deseni:
-- moderasyon + rate limit + şikayet-üzerine-otomatik-gizleme + admin gizle/göster.
-- Idempotent yazıldı.

-- =========================================================
-- 1) POST_COMMENTS
-- =========================================================
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  hidden_at  timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

-- Gizlenmemiş yorumlar herkese, gizlenenler yalnız yazara + admin'e görünür.
drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments
  for select to authenticated
  using (hidden_at is null or author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert" on public.post_comments
  for insert to authenticated with check (author_id = auth.uid());

-- Silme: yorumun yazarı VEYA gönderinin sahibi (moderasyon).
drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete" on public.post_comments
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_comments.post_id and p.author_id = auth.uid())
  );

-- Moderasyon (küfür/müstehcen).
create or replace function public.moderate_post_comment() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(new.body) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_post_comment on public.post_comments;
create trigger trg_moderate_post_comment before insert or update on public.post_comments
  for each row execute function public.moderate_post_comment();

-- Rate limit: 15 yorum / dakika (program yorumlarıyla aynı).
create or replace function public.rl_post_comments() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('post_comments', 'author_id', new.author_id, 15, 60); return new; end; $$;
drop trigger if exists trg_rl_post_comments on public.post_comments;
create trigger trg_rl_post_comments before insert on public.post_comments
  for each row execute function public.rl_post_comments();

-- =========================================================
-- 2) reports_auto_hide'a 'post_comment' tipini ekle
-- =========================================================
create or replace function public.reports_auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_distinct int; v_type text;
begin
  v_type := coalesce(new.context->>'type','');

  if v_type = 'comment' and (new.context->>'comment_id') is not null then
    v_id := (new.context->>'comment_id')::uuid;
    select count(distinct r.reporter_id) into v_distinct from reports r
      where r.context->>'type' = 'comment' and r.context->>'comment_id' = new.context->>'comment_id';
    if v_distinct >= 3 then
      update comments set hidden_at = coalesce(hidden_at, now()) where id = v_id;
    end if;

  elsif v_type = 'post' and (new.context->>'post_id') is not null then
    v_id := (new.context->>'post_id')::uuid;
    select count(distinct r.reporter_id) into v_distinct from reports r
      where r.context->>'type' = 'post' and r.context->>'post_id' = new.context->>'post_id';
    if v_distinct >= 3 then
      update posts set hidden_at = coalesce(hidden_at, now()) where id = v_id;
    end if;

  elsif v_type = 'post_comment' and (new.context->>'comment_id') is not null then
    v_id := (new.context->>'comment_id')::uuid;
    select count(distinct r.reporter_id) into v_distinct from reports r
      where r.context->>'type' = 'post_comment' and r.context->>'comment_id' = new.context->>'comment_id';
    if v_distinct >= 3 then
      update post_comments set hidden_at = coalesce(hidden_at, now()) where id = v_id;
    end if;
  end if;

  return new;
end; $$;

-- =========================================================
-- 3) admin: gönderi yorumunu gizle/göster
-- =========================================================
create or replace function public.admin_set_post_comment_hidden(p_comment_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  update post_comments set hidden_at = case when p_hidden then coalesce(hidden_at, now()) else null end
    where id = p_comment_id;
end; $$;
grant execute on function public.admin_set_post_comment_hidden(uuid, boolean) to authenticated;

-- admin_list_reports: gönderi yorumu şikayetlerinde de içerik döndür.
create or replace function public.admin_list_reports(p_limit int default 100)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select
        r.id, r.reason, r.context, r.created_at,
        r.reported_id,
        (select row_to_json(rp) from (select username, display_name, avatar_url from profiles where id = r.reported_id) rp) as reported,
        (select row_to_json(rr) from (select username, display_name from profiles where id = r.reporter_id) rr) as reporter,
        case when r.context->>'type' = 'comment' and (r.context->>'comment_id') is not null then (
          select row_to_json(cc) from (
            select c.id, c.body, c.hidden_at, c.program_id
            from comments c where c.id = (r.context->>'comment_id')::uuid
          ) cc
        ) end as comment,
        case when r.context->>'type' = 'post' and (r.context->>'post_id') is not null then (
          select row_to_json(pp) from (
            select p.id, p.body, p.image_url, p.hidden_at
            from posts p where p.id = (r.context->>'post_id')::uuid
          ) pp
        ) end as post,
        case when r.context->>'type' = 'post_comment' and (r.context->>'comment_id') is not null then (
          select row_to_json(pc) from (
            select c.id, c.body, c.hidden_at, c.post_id
            from post_comments c where c.id = (r.context->>'comment_id')::uuid
          ) pc
        ) end as post_comment
      from reports r
      order by r.created_at desc
      limit greatest(p_limit, 1)
    ) t
  );
end; $$;

-- =========================================================
-- 4) feed_posts'a comment_count ekle
-- =========================================================
create or replace function public.feed_posts(p_limit int default 50, p_author uuid default null)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      p.id, p.body, p.image_url, p.created_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      (select count(*) from post_comments pc where pc.post_id = p.id and pc.hidden_at is null)::int as comment_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p
    where (p_author is null or p.author_id = p_author)
      and (p.hidden_at is null or p.author_id = auth.uid() or public.is_admin(auth.uid()))
      and not exists (
        select 1 from user_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
           or (b.blocker_id = p.author_id and b.blocked_id = auth.uid())
      )
    order by p.created_at desc
    limit greatest(p_limit, 1)
  ) t;
$$;

-- =========================================================
-- 5) RPC: post_detail — tek gönderi (yorum ekranı için)
-- =========================================================
create or replace function public.post_detail(p_post_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select row_to_json(t) from (
    select
      p.id, p.body, p.image_url, p.created_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      (select count(*) from post_comments pc where pc.post_id = p.id and pc.hidden_at is null)::int as comment_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p
    where p.id = p_post_id
      and (p.hidden_at is null or p.author_id = auth.uid() or public.is_admin(auth.uid()))
  ) t;
$$;
grant execute on function public.post_detail(uuid) to authenticated;
