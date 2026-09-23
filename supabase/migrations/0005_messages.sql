-- SporMatch — Faz 5: eşleşenler arası mesajlaşma (realtime)
-- Idempotent yazıldı.

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

-- Katılımcı mı? (conversation -> match -> user_a/user_b)
-- select: yalnızca sohbetin iki tarafı
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = messages.conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- insert: kendi adına + katılımcı olduğu sohbete
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = messages.conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- update (okundu): katılımcı
drop policy if exists "messages_update_participant" on public.messages;
create policy "messages_update_participant" on public.messages
  for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = messages.conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- Realtime yayınına ekle
alter table public.messages replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- =========================================================
-- RPC: list_conversations — sohbet listesi (partner + son mesaj + okunmamış)
-- =========================================================
create or replace function public.list_conversations() returns json
language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.last_at desc nulls last), '[]'::json)
  from (
    select
      c.id as conversation_id,
      c.match_id,
      (case when m.user_a = auth.uid() then m.user_b else m.user_a end) as partner_id,
      p.username as partner_username,
      p.display_name as partner_name,
      p.avatar_url as partner_avatar,
      lm.body as last_message,
      lm.created_at as last_at,
      (select count(*) from messages um
        where um.conversation_id = c.id and um.sender_id <> auth.uid() and um.read_at is null) as unread
    from conversations c
    join matches m on m.id = c.match_id
    join profiles p on p.id = (case when m.user_a = auth.uid() then m.user_b else m.user_a end)
    left join lateral (
      select body, created_at from messages mm where mm.conversation_id = c.id
      order by created_at desc limit 1
    ) lm on true
    where m.user_a = auth.uid() or m.user_b = auth.uid()
  ) t;
$$;

-- RPC: mark_conversation_read — karşı tarafın mesajlarını okundu yap
create or replace function public.mark_conversation_read(p_conversation_id uuid) returns void
language sql security definer set search_path = public as $$
  update messages set read_at = now()
   where conversation_id = p_conversation_id
     and sender_id <> auth.uid()
     and read_at is null
     and exists (
       select 1 from conversations c join matches m on m.id = c.match_id
       where c.id = p_conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
     );
$$;

revoke all on function public.list_conversations() from anon;
revoke all on function public.mark_conversation_read(uuid) from anon;
grant execute on function public.list_conversations() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
