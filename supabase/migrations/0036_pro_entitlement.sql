-- 0036: SporMatch Pro — abonelik yetkisi + ücretsiz katmanda günlük eşleşme sınırı.
-- pro_until: null veya geçmiş bir tarih = ücretsiz katman; gelecekte bir tarih = Pro aktif.
-- Bu sütun yalnızca RevenueCat webhook'u (Faz B) veya admin tarafından güncellenecek —
-- client asla doğrudan yazamaz (RLS'te profiles update policy zaten yalnız kendi profilini
-- düzenlemeye izin veriyor, pro_until'ü de kapsıyor olmasın diye ayrıca kısıtlanır).

alter table public.profiles add column if not exists pro_until timestamptz;

-- Kullanıcılar kendi pro_until'ünü client'tan değiştiremesin (yalnızca security definer
-- fonksiyonlar/webhook service role ile yazabilir).
create or replace function public.protect_pro_until() returns trigger
language plpgsql as $$
begin
  if new.pro_until is distinct from old.pro_until and auth.role() <> 'service_role' then
    new.pro_until := old.pro_until;
  end if;
  return new;
end; $$;

drop trigger if exists protect_pro_until on public.profiles;
create trigger protect_pro_until
  before update on public.profiles
  for each row execute function public.protect_pro_until();

-- start_match_session: ücretsiz katmanda günde en fazla 3 eşleşme başlatma.
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
  v_free_daily_limit constant int := 3;
  v_is_pro boolean;
  v_today_count int;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_sport_ids is null or array_length(p_sport_ids, 1) is null then
    raise exception 'en az bir spor gerekli';
  end if;

  select (pro_until is not null and pro_until > now()) into v_is_pro
    from profiles where id = me;

  if not coalesce(v_is_pro, false) then
    select count(*) into v_today_count
      from match_sessions
     where user_id = me and created_at > now() - interval '1 day';
    if v_today_count >= v_free_daily_limit then
      raise exception 'Bugünkü ücretsiz eşleşme hakkını kullandın. SporMatch Pro ile sınırsız eşleş.'
        using errcode = '55000';
    end if;
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

revoke all on function public.start_match_session(text[], double precision, double precision, integer) from anon;
grant execute on function public.start_match_session(text[], double precision, double precision, integer) to authenticated;
