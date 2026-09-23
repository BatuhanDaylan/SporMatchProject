-- 0010: Keşfet sıralama/filtreleme RPC'si.
-- Toplam beğeni/kaydetme + son p_period_days içindeki "hit" skorunu hesaplayıp
-- seçilen ölçüte göre sıralar. security definer: kayıt sayılarını (RLS'i aşarak) toplar
-- ama YALNIZCA herkese açık programları ve YALNIZCA sayıları döndürür (kim beğendi/kaydetti bilgisi değil).

create or replace function public.discover_programs(
  p_sort        text default 'recent',   -- 'recent' | 'liked' | 'saved' | 'hit'
  p_period_days int  default 7,           -- 'hit' için pencere (gün)
  p_limit       int  default 50
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      p.id, p.title, p.description, p.owner_id, p.visibility, p.template, p.updated_at, p.sport_id,
      coalesce(lc.cnt, 0)  as like_count,
      coalesce(sc.cnt, 0)  as save_count,
      coalesce(rlc.cnt, 0) + coalesce(rsc.cnt, 0) as hit_score
    from programs p
    left join (select program_id, count(*) cnt from program_likes group by program_id) lc  on lc.program_id  = p.id
    left join (select program_id, count(*) cnt from program_saves group by program_id) sc  on sc.program_id  = p.id
    left join (
      select program_id, count(*) cnt from program_likes
      where created_at > now() - make_interval(days => greatest(p_period_days, 1)) group by program_id
    ) rlc on rlc.program_id = p.id
    left join (
      select program_id, count(*) cnt from program_saves
      where created_at > now() - make_interval(days => greatest(p_period_days, 1)) group by program_id
    ) rsc on rsc.program_id = p.id
    where p.visibility = 'public'
  ),
  filtered as (
    select * from base
    where case when p_sort = 'hit' then hit_score > 0 else true end
  ),
  ordered as (
    select * from filtered
    order by
      case when p_sort = 'liked' then like_count end desc nulls last,
      case when p_sort = 'saved' then save_count end desc nulls last,
      case when p_sort = 'hit'   then hit_score  end desc nulls last,
      updated_at desc
    limit greatest(p_limit, 1)
  )
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select
      o.id, o.title, o.description, o.owner_id, o.visibility, o.template, o.updated_at,
      o.like_count, o.save_count, o.hit_score,
      (select row_to_json(pr) from (
         select username, display_name, avatar_url from profiles where id = o.owner_id
       ) pr) as owner,
      (select row_to_json(sp) from (
         select name, icon from sports where id = o.sport_id
       ) sp) as sport
    from ordered o
  ) t;
$$;

grant execute on function public.discover_programs(text, int, int) to authenticated;
