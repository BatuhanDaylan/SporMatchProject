-- SporMatch — Faz 4: konum bazlı canlı eşleşme motoru (PostGIS)
-- Idempotent yazıldı.

create extension if not exists postgis;

-- =========================================================
-- 1) MATCH_SESSIONS — aktif eşleşme havuzu
-- =========================================================
create table if not exists public.match_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  sport_ids  text[] not null,
  location   geography(Point, 4326) not null,
  radius_m   integer not null default 5000 check (radius_m between 100 and 100000),
  status     text not null default 'searching'
             check (status in ('searching', 'matched', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);

create index if not exists match_sessions_loc_gix    on public.match_sessions using gist (location);
create index if not exists match_sessions_status_idx on public.match_sessions (status, expires_at);
create index if not exists match_sessions_sports_gix on public.match_sessions using gin (sport_ids);

-- =========================================================
-- 2) MATCHES — karşılıklı onay durumu (conversations'tan ÖNCE)
-- =========================================================
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  session_a       uuid references public.match_sessions (id) on delete set null,
  session_b       uuid references public.match_sessions (id) on delete set null,
  user_a          uuid not null references public.profiles (id) on delete cascade,
  user_b          uuid not null references public.profiles (id) on delete cascade,
  sport_id        text references public.sports (id) on delete set null,
  distance_m      double precision,
  a_confirmed     boolean not null default false,
  b_confirmed     boolean not null default false,
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'declined', 'expired')),
  conversation_id uuid,
  created_at      timestamptz not null default now()
);

create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);

-- =========================================================
-- 3) CONVERSATIONS — onaylı eşleşme sohbeti (mesajlar Faz 5)
-- =========================================================
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null unique references public.matches (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- matches.conversation_id -> conversations FK (conversations oluştuktan sonra)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matches_conversation_id_fkey') then
    alter table public.matches
      add constraint matches_conversation_id_fkey
      foreign key (conversation_id) references public.conversations (id) on delete set null;
  end if;
end $$;

-- =========================================================
-- 4) RLS
-- =========================================================
alter table public.match_sessions enable row level security;
alter table public.conversations  enable row level security;
alter table public.matches        enable row level security;

-- match_sessions: yalnızca SAHİBİ görür/yönetir (başkasının konumu asla doğrudan okunmaz)
drop policy if exists "ms_all_own" on public.match_sessions;
create policy "ms_all_own" on public.match_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- matches: yalnızca katılımcılar görür (yazma RPC ile — security definer)
drop policy if exists "matches_select_participant" on public.matches;
create policy "matches_select_participant" on public.matches
  for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- conversations: yalnızca eşleşmenin katılımcıları
drop policy if exists "conv_select_participant" on public.conversations;
create policy "conv_select_participant" on public.conversations
  for select to authenticated
  using (
    exists (select 1 from public.matches m
            where m.id = conversations.match_id and (m.user_a = auth.uid() or m.user_b = auth.uid()))
  );

-- Realtime (katılımcı RLS teslimatı sınırlar; filtre yerine RLS'e güveniyoruz)
alter table public.matches replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='matches') then
    execute 'alter publication supabase_realtime add table public.matches';
  end if;
end $$;

-- =========================================================
-- 5) RPC: start_match_session — havuza gir + anında eşleşme dene
-- =========================================================
create or replace function public.start_match_session(
  p_sport_ids text[],
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 5000
) returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_loc geography := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  my_radius integer := greatest(coalesce(p_radius_m, 5000), 100);
  new_session uuid;
  cand record;
  new_match uuid;
  common_sport text;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_sport_ids is null or array_length(p_sport_ids, 1) is null then
    raise exception 'en az bir spor gerekli';
  end if;

  -- Kullanıcının eski aktif oturumlarını kapat (tek aktif oturum)
  update match_sessions set status = 'cancelled' where user_id = me and status = 'searching';

  insert into match_sessions (user_id, sport_ids, location, radius_m, status, expires_at)
    values (me, p_sport_ids, my_loc, my_radius, 'searching', now() + interval '15 minutes')
    returning id into new_session;

  -- Uygun aday: aynı sporlardan biri + iki tarafın da yarıçapı içinde + süresi geçmemiş
  select s.id, s.user_id, s.sport_ids, ST_Distance(s.location, my_loc) as dist
    into cand
    from match_sessions s
   where s.status = 'searching'
     and s.user_id <> me
     and s.expires_at > now()
     and s.sport_ids && p_sport_ids
     and ST_DWithin(s.location, my_loc, least(s.radius_m, my_radius))
   order by ST_Distance(s.location, my_loc) asc
   for update skip locked
   limit 1;

  if found then
    common_sport := (select x from unnest(p_sport_ids) x where x = any (cand.sport_ids) limit 1);
    insert into matches (session_a, session_b, user_a, user_b, sport_id, distance_m, status)
      values (cand.id, new_session, cand.user_id, me, common_sport, cand.dist, 'pending')
      returning id into new_match;
    update match_sessions set status = 'matched' where id in (cand.id, new_session);
    return json_build_object('session_id', new_session, 'match_id', new_match);
  end if;

  return json_build_object('session_id', new_session, 'match_id', null);
end; $$;

-- =========================================================
-- 6) RPC: confirm_match — onay; iki taraf onaylarsa konum açılır + sohbet
-- =========================================================
create or replace function public.confirm_match(p_match_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m record; conv uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into m from matches where id = p_match_id for update;
  if not found then raise exception 'eşleşme bulunamadı'; end if;
  if me <> m.user_a and me <> m.user_b then raise exception 'katılımcı değilsin'; end if;
  if m.status = 'declined' then raise exception 'eşleşme reddedildi'; end if;

  if me = m.user_a then update matches set a_confirmed = true where id = p_match_id;
  else                    update matches set b_confirmed = true where id = p_match_id; end if;

  select * into m from matches where id = p_match_id;

  if m.a_confirmed and m.b_confirmed and m.status <> 'confirmed' then
    insert into conversations (match_id) values (p_match_id)
      on conflict (match_id) do update set match_id = excluded.match_id
      returning id into conv;
    update matches set status = 'confirmed', conversation_id = conv where id = p_match_id;
    select * into m from matches where id = p_match_id;
  end if;

  return row_to_json(m);
end; $$;

-- =========================================================
-- 7) RPC: decline_match — reddet; oturumları kapat
-- =========================================================
create or replace function public.decline_match(p_match_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m record;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into m from matches where id = p_match_id;
  if not found then raise exception 'eşleşme bulunamadı'; end if;
  if me <> m.user_a and me <> m.user_b then raise exception 'katılımcı değilsin'; end if;
  update matches set status = 'declined' where id = p_match_id;
  update match_sessions set status = 'cancelled' where id in (m.session_a, m.session_b);
end; $$;

-- =========================================================
-- 8) RPC: get_match_partner — partner bilgisi; konum YALNIZCA confirmed ise
-- =========================================================
create or replace function public.get_match_partner(p_match_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m record; partner uuid; ploc geography; prof record;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into m from matches where id = p_match_id;
  if not found or (me <> m.user_a and me <> m.user_b) then raise exception 'erişim yok'; end if;

  partner := case when me = m.user_a then m.user_b else m.user_a end;
  select username, display_name, avatar_url, level into prof from profiles where id = partner;

  if m.status = 'confirmed' then
    select location into ploc from match_sessions
      where id = (case when me = m.user_a then m.session_b else m.session_a end);
    return json_build_object(
      'user_id', partner, 'username', prof.username, 'display_name', prof.display_name,
      'avatar_url', prof.avatar_url, 'level', prof.level,
      'distance_m', m.distance_m, 'status', m.status,
      'a_confirmed', m.a_confirmed, 'b_confirmed', m.b_confirmed,
      'i_confirmed', (case when me = m.user_a then m.a_confirmed else m.b_confirmed end),
      'they_confirmed', (case when me = m.user_a then m.b_confirmed else m.a_confirmed end),
      'conversation_id', m.conversation_id,
      'lat', ST_Y(ploc::geometry), 'lng', ST_X(ploc::geometry));
  end if;

  return json_build_object(
    'user_id', partner, 'username', prof.username, 'display_name', prof.display_name,
    'avatar_url', prof.avatar_url, 'level', prof.level,
    'distance_m', m.distance_m, 'status', m.status,
    'a_confirmed', m.a_confirmed, 'b_confirmed', m.b_confirmed,
    'i_confirmed', (case when me = m.user_a then m.a_confirmed else m.b_confirmed end),
    'they_confirmed', (case when me = m.user_a then m.b_confirmed else m.a_confirmed end),
    'conversation_id', m.conversation_id);
end; $$;

-- Yetkiler
revoke all on function public.start_match_session(text[], double precision, double precision, integer) from anon;
revoke all on function public.confirm_match(uuid) from anon;
revoke all on function public.decline_match(uuid) from anon;
revoke all on function public.get_match_partner(uuid) from anon;
grant execute on function public.start_match_session(text[], double precision, double precision, integer) to authenticated;
grant execute on function public.confirm_match(uuid) to authenticated;
grant execute on function public.decline_match(uuid) to authenticated;
grant execute on function public.get_match_partner(uuid) to authenticated;

-- =========================================================
-- 9) Süresi dolan oturumları temizle (pg_cron varsa)
-- =========================================================
create or replace function public.expire_stale_sessions() returns void
language sql security definer set search_path = public as $$
  update match_sessions set status = 'expired'
   where status = 'searching' and expires_at < now();
$$;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('spormatch-expire-sessions', '* * * * *',
                          'select public.expire_stale_sessions()');
  end if;
exception when others then
  raise notice 'pg_cron kurulamadı (elle/lazy temizlik kullanılacak): %', sqlerrm;
end $$;
