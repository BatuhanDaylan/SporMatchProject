-- 0043: Bildirim tercihleri (kullanıcı hangi tür bildirimlerin telefonuna gelmesini istediğini seçer)
-- ve Türkçe karakterden bağımsız etiketler (#koşu = #kosu). Idempotent.

-- ── Bildirim tercihleri ────────────────────────────────────────────────────────
-- muted: telefona anlık bildirim GÖNDERİLMEYECEK kategoriler. Uygulama içi bildirim listesine
-- yine düşer (geçmiş kaybolmasın); yalnız push susturulur.
create table if not exists public.notification_prefs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  muted      text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint notification_prefs_muted_valid
    check (muted <@ array['social', 'comment', 'like', 'match', 'chat', 'event']::text[])
);
alter table public.notification_prefs enable row level security;
drop policy if exists notification_prefs_own on public.notification_prefs;
create policy notification_prefs_own on public.notification_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.notification_prefs from anon;
grant select, insert, update, delete on public.notification_prefs to authenticated;

-- Bildirim türü → kategori (uygulamadaki bildirim filtreleriyle aynı gruplar)
create or replace function public.notif_category(p_type text)
returns text language sql immutable as $$
  select case
    when p_type in ('follow', 'follow_request') then 'social'
    when p_type in ('comment', 'post_comment') then 'comment'
    when p_type = 'post' then 'like'
    when p_type = 'match' then 'match'
    when p_type in ('chat', 'chat_request') then 'chat'
    when p_type = 'event' then 'event'
    else null
  end;
$$;

create or replace function public.push_muted(p_user uuid, p_type text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select public.notif_category(p_type) = any (np.muted) from notification_prefs np where np.user_id = p_user),
    false);
$$;
revoke execute on function public.push_muted(uuid, text) from public, anon, authenticated;

create or replace function public.notify_user(p_user uuid, p_title text, p_body text, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare t record;
begin
  insert into notifications (user_id, type, title, body, data)
    values (p_user, coalesce(p_data->>'type', 'genel'), p_title, p_body, p_data);

  -- Kullanıcı bu kategoriyi susturduysa telefona gönderme (listede yine görünür)
  if public.push_muted(p_user, coalesce(p_data->>'type', 'genel')) then
    return;
  end if;

  for t in select token from push_tokens where user_id = p_user loop
    begin
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('to', t.token, 'title', p_title, 'body', p_body, 'sound', 'default', 'data', p_data)
      );
    exception when others then null;
    end;
  end loop;
end; $$;

create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare recipient uuid; sender_name text;
begin
  select (case when m.user_a = new.sender_id then m.user_b else m.user_a end)
    into recipient
    from conversations c join matches m on m.id = c.match_id
   where c.id = new.conversation_id;
  if recipient is null then return new; end if;
  select coalesce(display_name, username, 'Yeni mesaj') into sender_name from profiles where id = new.sender_id;
  perform notify_user(recipient, sender_name, left(new.body, 120),
                      jsonb_build_object('type', 'chat', 'conversation_id', new.conversation_id));
  -- Push gerçekten yola çıktıysa iletildi (✓✓): canlı bir cihaz var ve mesaj bildirimleri susturulmamış
  if not public.push_muted(recipient, 'chat')
     and exists (select 1 from push_tokens where user_id = recipient and updated_at > now() - interval '60 days') then
    update messages set delivered_at = now() where id = new.id;
  end if;
  return new;
end; $$;

-- ── Türkçe karakterden bağımsız etiketler ────────────────────────────────────
create or replace function public.tag_norm(p text)
returns text language sql immutable as $$
  select lower(translate(coalesce(p, ''), 'ÇĞİIÖŞÜçğıöşüÂâÎîÛû', 'CGIIOSUcgiosuAaIiUu'));
$$;

create or replace function public.feed_posts(p_limit integer default 50, p_author uuid default null, p_tag text default null)
returns json language sql stable security definer set search_path = public as $$
  with tag as (select nullif(regexp_replace(public.tag_norm(p_tag), '[^[:alnum:]_]', '', 'g'), '') as v)
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      p.id, p.body, p.image_url, p.created_at, p.edited_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      (select count(*) from post_comments pc where pc.post_id = p.id and pc.hidden_at is null)::int as comment_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p, tag
    where (p_author is null or p.author_id = p_author)
      and (tag.v is null or public.tag_norm(p.body) ~ ('(^|[^[:alnum:]_])#' || tag.v || '($|[^[:alnum:]_])'))
      and (p.hidden_at is null or p.author_id = auth.uid() or public.is_admin(auth.uid()))
      and not public.blocked_between(auth.uid(), p.author_id)
      and public.can_view_user(auth.uid(), p.author_id)
    order by p.created_at desc
    limit greatest(p_limit, 1)
  ) t;
$$;

grant execute on function public.feed_posts(integer, uuid, text) to authenticated;
