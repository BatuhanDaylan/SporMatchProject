-- 0020: Kullanıcının kendi liderlik sırası (listede olmasa/limit dışında olsa bile).
-- leaderboard ile AYNI sıralama mantığı: cnt (bu hafta aktif gün) > d30 > dall.

create or replace function public.my_leaderboard_rank(
  p_days  int  default 7,
  p_scope text default 'all'
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with logs as (
    select user_id, created_at::date as d from workout_logs
  ),
  agg as (
    select user_id,
      count(distinct d) filter (where d >= current_date - (greatest(p_days, 1) - 1)) as cnt,
      count(distinct d) filter (where d >= current_date - 29) as d30,
      count(distinct d) as dall
    from logs group by user_id
  ),
  scoped as (
    select a.* from agg a
    join profiles pr on pr.id = a.user_id
    where a.cnt > 0
      and (p_scope <> 'city'
           or pr.province is not distinct from (select province from profiles where id = auth.uid()))
  ),
  ranked as (
    select user_id, cnt,
      rank() over (order by cnt desc, d30 desc, dall desc) as rnk,
      count(*) over () as total
    from scoped
  )
  select coalesce(
    (select json_build_object('rank', rnk, 'cnt', cnt, 'total', total)
       from ranked where user_id = auth.uid()),
    json_build_object('rank', null, 'cnt', 0, 'total', (select count(*) from scoped))
  );
$$;
grant execute on function public.my_leaderboard_rank(int, text) to authenticated;
