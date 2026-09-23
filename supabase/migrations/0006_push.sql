-- SporMatch — Faz 6: push bildirim altyapısı (pg_net ile Expo Push)
-- Idempotent yazıldı. Bildirimlerin cihaza ULAŞMASI için dev build + Expo/FCM gerekir;
-- bu şema tetikleme/gönderim tarafını kurar.

-- pg_net (Postgres'ten async HTTP) — varsa etkinleştir
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
exception when others then raise notice 'pg_net etkinleştirilemedi: %', sqlerrm;
end $$;

-- =========================================================
-- push_tokens — kullanıcının cihaz push token'ları
-- =========================================================
create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  platform   text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens_all_own" on public.push_tokens;
create policy "push_tokens_all_own" on public.push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- notify_user — kullanıcının tüm cihazlarına Expo push gönder
-- =========================================================
create or replace function public.notify_user(
  p_user uuid, p_title text, p_body text, p_data jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  for t in select token from push_tokens where user_id = p_user loop
    begin
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object(
          'to', t.token, 'title', p_title, 'body', p_body,
          'sound', 'default', 'data', p_data)
      );
    exception when others then
      -- pg_net yoksa veya çağrı başarısızsa tetikleyen işlemi ASLA bloklama
      null;
    end;
  end loop;
end; $$;

-- =========================================================
-- Trigger: yeni mesaj → karşı tarafa bildir
-- =========================================================
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
  return new;
end; $$;

drop trigger if exists trg_message_notify on public.messages;
create trigger trg_message_notify after insert on public.messages
  for each row execute function public.on_message_insert();

-- =========================================================
-- Trigger: yeni eşleşme → bekleyen tarafa (user_a) bildir
-- =========================================================
create or replace function public.on_match_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare pname text;
begin
  select coalesce(display_name, username, 'Bir sporcu') into pname from profiles where id = new.user_b;
  perform notify_user(new.user_a, 'Yeni eşleşme! ⚡',
                      pname || ' seninle spor yapmak istiyor',
                      jsonb_build_object('type', 'match', 'match_id', new.id));
  return new;
end; $$;

drop trigger if exists trg_match_notify on public.matches;
create trigger trg_match_notify after insert on public.matches
  for each row execute function public.on_match_insert();

-- =========================================================
-- Trigger: eşleşme onaylandı → iki tarafa bildir
-- =========================================================
create or replace function public.on_match_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'confirmed' and new.status = 'confirmed' then
    perform notify_user(new.user_a, 'Eşleşme onaylandı 🎉',
                        'Artık konumu görebilir ve sohbet edebilirsin',
                        jsonb_build_object('type', 'match', 'match_id', new.id));
    perform notify_user(new.user_b, 'Eşleşme onaylandı 🎉',
                        'Artık konumu görebilir ve sohbet edebilirsin',
                        jsonb_build_object('type', 'match', 'match_id', new.id));
  end if;
  return new;
end; $$;

drop trigger if exists trg_match_confirmed on public.matches;
create trigger trg_match_confirmed after update on public.matches
  for each row execute function public.on_match_confirmed();

-- =========================================================
-- Trigger: yeni yorum → program sahibine bildir
-- =========================================================
create or replace function public.on_comment_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; cname text;
begin
  select owner_id into owner from programs where id = new.program_id;
  if owner is null or owner = new.author_id then return new; end if;
  select coalesce(display_name, username, 'Biri') into cname from profiles where id = new.author_id;
  perform notify_user(owner, 'Yeni yorum 💬', cname || ' programına yorum yaptı',
                      jsonb_build_object('type', 'comment', 'program_id', new.program_id));
  return new;
end; $$;

drop trigger if exists trg_comment_notify on public.comments;
create trigger trg_comment_notify after insert on public.comments
  for each row execute function public.on_comment_insert();
