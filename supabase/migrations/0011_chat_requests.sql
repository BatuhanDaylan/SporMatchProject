-- 0011: Profilden sohbet isteği. Mevcut matches/conversations altyapısını yeniden kullanır:
-- bir sohbet isteği = origin='chat' olan bekleyen bir match. Karşı taraf confirm_match ile kabul
-- edince (mevcut RPC) conversation otomatik oluşur.

-- 1) Eşleşme kaynağı: 'match' (spor eşleşmesi) | 'chat' (profilden sohbet isteği)
alter table public.matches
  add column if not exists origin text not null default 'match'
  check (origin in ('match', 'chat'));

-- 2) Bildirim tetikleyicilerini origin-duyarlı yap (fonksiyonu güncelle; trigger aynı kalır).
--    Sohbet isteğinde gönderen = user_a olduğundan, bildirim user_b'ye (alıcıya) gitmeli.
create or replace function public.on_match_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare pname text;
begin
  if new.origin = 'chat' then
    select coalesce(display_name, username, 'Bir sporcu') into pname from profiles where id = new.user_a;
    perform notify_user(new.user_b, 'Yeni sohbet isteği 💬',
                        pname || ' seninle sohbet etmek istiyor',
                        jsonb_build_object('type', 'chat_request', 'match_id', new.id));
  else
    select coalesce(display_name, username, 'Bir sporcu') into pname from profiles where id = new.user_b;
    perform notify_user(new.user_a, 'Yeni eşleşme! ⚡',
                        pname || ' seninle spor yapmak istiyor',
                        jsonb_build_object('type', 'match', 'match_id', new.id));
  end if;
  return new;
end; $$;

create or replace function public.on_match_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'confirmed' and new.status = 'confirmed' then
    if new.origin = 'chat' then
      perform notify_user(new.user_a, 'Sohbet isteğin kabul edildi 🎉',
                          'Artık sohbet edebilirsiniz',
                          jsonb_build_object('type', 'chat', 'conversation_id', new.conversation_id));
    else
      perform notify_user(new.user_a, 'Eşleşme onaylandı 🎉',
                          'Artık konumu görebilir ve sohbet edebilirsin',
                          jsonb_build_object('type', 'match', 'match_id', new.id));
      perform notify_user(new.user_b, 'Eşleşme onaylandı 🎉',
                          'Artık konumu görebilir ve sohbet edebilirsin',
                          jsonb_build_object('type', 'match', 'match_id', new.id));
    end if;
  end if;
  return new;
end; $$;

-- 3) RPC: send_chat_request — profilden sohbet isteği gönder (akıllı, tekrarsız).
create or replace function public.send_chat_request(p_to uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing_conv uuid;
  pend record;
  new_id uuid;
  conv uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_to is null or p_to = me then raise exception 'geçersiz kullanıcı'; end if;
  if not exists (select 1 from profiles where id = p_to) then raise exception 'kullanıcı bulunamadı'; end if;

  -- Zaten bir sohbet varsa onu aç.
  select conversation_id into existing_conv from matches
    where conversation_id is not null
      and ((user_a = me and user_b = p_to) or (user_a = p_to and user_b = me))
    limit 1;
  if existing_conv is not null then
    return json_build_object('status', 'existing', 'conversation_id', existing_conv);
  end if;

  -- Bekleyen istek varsa: karşı taraf bana gönderdiyse OTOMATİK kabul et; ben gönderdiysem beklet.
  select * into pend from matches
    where origin = 'chat' and status = 'pending'
      and ((user_a = me and user_b = p_to) or (user_a = p_to and user_b = me))
    limit 1;
  if found then
    if pend.user_b = me then
      insert into conversations (match_id) values (pend.id)
        on conflict (match_id) do update set match_id = excluded.match_id
        returning id into conv;
      update matches set b_confirmed = true, status = 'confirmed', conversation_id = conv where id = pend.id;
      return json_build_object('status', 'existing', 'conversation_id', conv);
    end if;
    return json_build_object('status', 'pending', 'match_id', pend.id);
  end if;

  insert into matches (user_a, user_b, origin, a_confirmed, status)
    values (me, p_to, 'chat', true, 'pending')
    returning id into new_id;
  return json_build_object('status', 'sent', 'match_id', new_id);
end; $$;

grant execute on function public.send_chat_request(uuid) to authenticated;
revoke all on function public.send_chat_request(uuid) from anon;

-- 4) RPC: list_chat_requests — bana gelen bekleyen sohbet istekleri.
create or replace function public.list_chat_requests()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select m.id as match_id, m.created_at,
      pr.id as from_id, pr.username, pr.display_name, pr.avatar_url
    from matches m
    join profiles pr on pr.id = m.user_a
    where m.origin = 'chat' and m.status = 'pending'
      and m.user_b = auth.uid() and m.b_confirmed = false
  ) t;
$$;

grant execute on function public.list_chat_requests() to authenticated;
revoke all on function public.list_chat_requests() from anon;
