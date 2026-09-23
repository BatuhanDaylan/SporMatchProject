-- 0033: Şehir bazlı etkinlik listesi. "Yakında" GPS yerine kullanıcının İL'ine göre
-- filtrelenir (emülatör/GPS derdi olmadan çalışır). p_province verilmezse kullanıcının
-- profil ili kullanılır; verilirse o il gösterilir (başka şehre bakmak için). Idempotent.

create or replace function public.city_events(p_province text default null, p_limit int default 50)
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); prov text;
begin
  prov := coalesce(nullif(trim(p_province), ''), (select province from profiles where id = me));
  if prov is null then return '[]'::json; end if;
  return (
    select coalesce(json_agg(row_to_json(t) order by t.starts_at asc), '[]'::json) from (
      select
        e.id, e.title, e.description, e.place_name, e.province, e.district,
        e.starts_at, e.capacity, e.host_id, e.status,
        ST_Y(e.location::geometry) as lat, ST_X(e.location::geometry) as lng,
        (select count(*) from event_participants ep where ep.event_id = e.id)::int as participant_count,
        exists (select 1 from event_participants ep where ep.event_id = e.id and ep.user_id = me) as joined,
        (select row_to_json(h) from (select username, display_name, avatar_url from profiles where id = e.host_id) h) as host,
        (select row_to_json(sp) from (select name, icon from sports where id = e.sport_id) sp) as sport
      from events e
      where e.status = 'open'
        and e.province = prov
        and e.starts_at > now() - interval '3 hours'
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
grant execute on function public.city_events(text, int) to authenticated;

-- Eski etkinliklerde il/ilçe boşsa ev sahibinin profilinden geri-doldur (idempotent).
update public.events e
set province = p.province,
    district = coalesce(e.district, p.district)
from public.profiles p
where e.host_id = p.id
  and e.province is null
  and p.province is not null;
