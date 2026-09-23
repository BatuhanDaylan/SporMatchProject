-- 0032: Gönderi moderasyonu (yorumlarla parite). posts.hidden_at + 3 farklı
-- kullanıcı şikayetinde otomatik gizleme + admin gizle/göster + feed filtresi.
-- Görsel içeren UGC için şikayet+manuel kaldırma güvence ağı. Idempotent.

alter table public.posts add column if not exists hidden_at timestamptz;

-- reports_auto_hide'ı hem yorum hem gönderi için çalışacak biçimde güncelle.
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
  end if;

  return new;
end; $$;

-- feed_posts: gizli gönderiyi yalnız yazar + admin görür.
create or replace function public.feed_posts(p_limit int default 50, p_author uuid default null)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      p.id, p.body, p.image_url, p.created_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
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

-- admin: gönderiyi gizle/göster.
create or replace function public.admin_set_post_hidden(p_post_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  update posts set hidden_at = case when p_hidden then coalesce(hidden_at, now()) else null end
    where id = p_post_id;
end; $$;
grant execute on function public.admin_set_post_hidden(uuid, boolean) to authenticated;

-- admin_list_reports: gönderi şikayetlerinde de içerik döndür.
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
        ) end as post
      from reports r
      order by r.created_at desc
      limit greatest(p_limit, 1)
    ) t
  );
end; $$;
