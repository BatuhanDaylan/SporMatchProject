-- 0028: Planlı buluşma / etkinlik. Canlı eşleşmenin aksine eşzamanlı çevrimiçilik
-- gerektirmez → az kullanıcıyla bile buluşma akar (cold-start çözümü).
-- PostGIS ile yakındaki yaklaşan etkinlikler; moderasyon + rate limit; RPC'ler. Idempotent.

-- =========================================================
-- 1) EVENTS
-- =========================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles (id) on delete cascade,
  sport_id    text references public.sports (id) on delete set null,
  title       text not null check (char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  location    geography(Point, 4326) not null,
  place_name  text check (place_name is null or char_length(place_name) <= 160),
  province    text,
  district    text,
  starts_at   timestamptz not null,
  capacity    integer check (capacity is null or capacity between 2 and 200),
  status      text not null default 'open' check (status in ('open', 'cancelled')),
  created_at  timestamptz not null default now()
);
create index if not exists events_loc_gix     on public.events using gist (location);
create index if not exists events_starts_idx   on public.events (starts_at);
create index if not exists events_host_idx      on public.events (host_id);

alter table public.events enable row level security;

-- Herkes (giriş yapmış) yaklaşan etkinlikleri görebilir (keşif için).
drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select to authenticated using (true);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
  for delete to authenticated using (host_id = auth.uid());

-- Moderasyon: başlık + açıklama küfür/müstehcen içeremez.
create or replace function public.moderate_event() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(new.title) or has_banned_words(coalesce(new.description,''))
     or has_banned_words(coalesce(new.place_name,'')) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_event on public.events;
create trigger trg_moderate_event before insert or update on public.events
  for each row execute function public.moderate_event();

-- Rate limit: 10 etkinlik / saat.
create or replace function public.rl_events() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('events', 'host_id', new.host_id, 10, 3600); return new; end; $$;
drop trigger if exists trg_rl_events on public.events;
create trigger trg_rl_events before insert on public.events
  for each row execute function public.rl_events();

-- =========================================================
-- 2) EVENT_PARTICIPANTS
-- =========================================================
create table if not exists public.event_participants (
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
-- Eski dağıtımlarda joined_at olarak oluşturulduysa created_at'e çevir
-- (generic assert_rate created_at sütununu bekler).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='event_participants' and column_name='joined_at') then
    alter table public.event_participants rename column joined_at to created_at;
  end if;
end $$;
create index if not exists event_participants_user_idx on public.event_participants (user_id);

alter table public.event_participants enable row level security;

-- Katılımcı listesi herkese açık (sayaç + kimler geliyor).
drop policy if exists "ep_select" on public.event_participants;
create policy "ep_select" on public.event_participants
  for select to authenticated using (true);

-- Kendi katılımını ekle/sil (kapasite RPC ile kontrol edilir ama doğrudan da güvenli).
drop policy if exists "ep_insert_own" on public.event_participants;
create policy "ep_insert_own" on public.event_participants
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ep_delete_own" on public.event_participants;
create policy "ep_delete_own" on public.event_participants
  for delete to authenticated using (user_id = auth.uid());

-- Rate limit: 30 katılım / dakika.
create or replace function public.rl_event_join() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('event_participants', 'user_id', new.user_id, 30, 60); return new; end; $$;
drop trigger if exists trg_rl_event_join on public.event_participants;
create trigger trg_rl_event_join before insert on public.event_participants
  for each row execute function public.rl_event_join();

-- =========================================================
-- 3) RPC: create_event — etkinlik oluştur + host'u katılımcı yap
-- =========================================================
create or replace function public.create_event(
  p_sport_id text,
  p_title text,
  p_description text,
  p_lat double precision,
  p_lng double precision,
  p_place_name text,
  p_province text,
  p_district text,
  p_starts_at timestamptz,
  p_capacity integer default null
) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid; loc geography;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_starts_at < now() - interval '5 minutes' then raise exception 'geçmiş bir zaman seçilemez'; end if;
  loc := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  insert into events (host_id, sport_id, title, description, location, place_name, province, district, starts_at, capacity)
    values (me, p_sport_id, p_title, nullif(trim(p_description),''), loc, nullif(trim(p_place_name),''), p_province, p_district, p_starts_at, p_capacity)
    returning id into new_id;

  insert into event_participants (event_id, user_id) values (new_id, me)
    on conflict do nothing;

  return json_build_object('id', new_id);
end; $$;
grant execute on function public.create_event(text,text,text,double precision,double precision,text,text,text,timestamptz,integer) to authenticated;

-- =========================================================
-- 4) RPC: nearby_events — yakındaki yaklaşan etkinlikler
-- =========================================================
create or replace function public.nearby_events(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 25000,
  p_sport_id text default null,
  p_limit integer default 50
) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); myloc geography := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
begin
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select
        e.id, e.title, e.description, e.place_name, e.province, e.district,
        e.starts_at, e.capacity, e.host_id, e.status,
        round(ST_Distance(e.location, myloc))::int as distance_m,
        ST_Y(e.location::geometry) as lat, ST_X(e.location::geometry) as lng,
        (select count(*) from event_participants ep where ep.event_id = e.id) as participant_count,
        exists (select 1 from event_participants ep where ep.event_id = e.id and ep.user_id = me) as joined,
        (select row_to_json(h) from (select username, display_name, avatar_url from profiles where id = e.host_id) h) as host,
        (select row_to_json(sp) from (select name, icon from sports where id = e.sport_id) sp) as sport
      from events e
      where e.status = 'open'
        and e.starts_at > now() - interval '3 hours'
        and ST_DWithin(e.location, myloc, greatest(p_radius_m, 100))
        and (p_sport_id is null or e.sport_id = p_sport_id)
        and not exists (
          select 1 from user_blocks b
          where (b.blocker_id = me and b.blocked_id = e.host_id)
             or (b.blocker_id = e.host_id and b.blocked_id = me)
        )
      order by e.starts_at asc
      limit greatest(p_limit, 1)
    ) t
  );
end; $$;
grant execute on function public.nearby_events(double precision,double precision,integer,text,integer) to authenticated;

-- =========================================================
-- 5) RPC: event_detail — tek etkinlik + katılımcılar + katıldım mı
-- =========================================================
create or replace function public.event_detail(p_event_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  return (
    select row_to_json(t) from (
      select
        e.id, e.title, e.description, e.place_name, e.province, e.district,
        e.starts_at, e.capacity, e.host_id, e.status, e.sport_id,
        ST_Y(e.location::geometry) as lat, ST_X(e.location::geometry) as lng,
        (select count(*) from event_participants ep where ep.event_id = e.id) as participant_count,
        exists (select 1 from event_participants ep where ep.event_id = e.id and ep.user_id = me) as joined,
        (e.host_id = me) as is_host,
        (select row_to_json(h) from (select id, username, display_name, avatar_url from profiles where id = e.host_id) h) as host,
        (select row_to_json(sp) from (select name, icon from sports where id = e.sport_id) sp) as sport,
        (select coalesce(json_agg(row_to_json(p)), '[]'::json) from (
           select pr.id, pr.username, pr.display_name, pr.avatar_url
           from event_participants ep join profiles pr on pr.id = ep.user_id
           where ep.event_id = e.id order by ep.created_at asc limit 50
         ) p) as participants
      from events e where e.id = p_event_id
    ) t
  );
end; $$;
grant execute on function public.event_detail(uuid) to authenticated;

-- =========================================================
-- 6) RPC: join_event / leave_event (kapasite güvenli + host bildirimi)
-- =========================================================
create or replace function public.join_event(p_event_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ev record; cnt int; mename text;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into ev from events where id = p_event_id for update;
  if not found then raise exception 'etkinlik bulunamadı'; end if;
  if ev.status <> 'open' then raise exception 'etkinlik kapalı'; end if;
  if ev.starts_at < now() - interval '2 hours' then raise exception 'etkinlik sona erdi'; end if;
  if exists (select 1 from user_blocks b
             where (b.blocker_id = me and b.blocked_id = ev.host_id)
                or (b.blocker_id = ev.host_id and b.blocked_id = me)) then
    raise exception 'bu etkinliğe katılamazsın';
  end if;

  if ev.capacity is not null then
    select count(*) into cnt from event_participants where event_id = p_event_id;
    if cnt >= ev.capacity and not exists (select 1 from event_participants where event_id=p_event_id and user_id=me) then
      raise exception 'kontenjan dolu';
    end if;
  end if;

  insert into event_participants (event_id, user_id) values (p_event_id, me)
    on conflict do nothing;

  -- Host'a bildirim (kendisi katılıyorsa gönderme).
  if ev.host_id <> me then
    select coalesce(display_name, username, 'Bir sporcu') into mename from profiles where id = me;
    perform notify_user(ev.host_id, 'Etkinliğine katılım',
      mename || ' "' || ev.title || '" etkinliğine katıldı.',
      jsonb_build_object('type','event','event_id',p_event_id));
  end if;

  return json_build_object('joined', true);
end; $$;
grant execute on function public.join_event(uuid) to authenticated;

create or replace function public.leave_event(p_event_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  delete from event_participants where event_id = p_event_id and user_id = me;
  return json_build_object('joined', false);
end; $$;
grant execute on function public.leave_event(uuid) to authenticated;

-- =========================================================
-- 7) RPC: my_events — ev sahibi olduğum ya da katıldığım etkinlikler
-- =========================================================
create or replace function public.my_events() returns json
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  return (
    select coalesce(json_agg(row_to_json(t) order by t.starts_at asc), '[]'::json) from (
      select
        e.id, e.title, e.place_name, e.starts_at, e.status, e.host_id,
        (e.host_id = me) as is_host,
        (select count(*) from event_participants ep where ep.event_id = e.id) as participant_count,
        (select row_to_json(sp) from (select name, icon from sports where id = e.sport_id) sp) as sport
      from events e
      where e.host_id = me
         or exists (select 1 from event_participants ep where ep.event_id = e.id and ep.user_id = me)
    ) t
  );
end; $$;
grant execute on function public.my_events() to authenticated;

-- Realtime: katılımcı değişimini anlık gör.
alter table public.event_participants replica identity full;
-- not: created_at (yukarıda joined_at'ten çevrildi) rate-limit için gerekli.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='event_participants') then
    execute 'alter publication supabase_realtime add table public.event_participants';
  end if;
end $$;
