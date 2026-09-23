-- 0019: Liderlik pencere düzeltmesi (off-by-one). "Son N gün" = bugün dahil N takvim günü.
-- `>= current_date - (N-1)` → N=7 için bugün + 6 önceki = tam 7 gün (en fazla 7/7).

create or replace function public.leaderboard(
  p_days  int  default 7,
  p_scope text default 'all',
  p_limit int  default 20
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
    select
      user_id,
      count(distinct d) filter (where d >= current_date - (greatest(p_days, 1) - 1)) as cnt,
      count(distinct d) filter (where d >= current_date - 29) as d30,
      count(distinct d) as dall
    from logs
    group by user_id
  )
  select coalesce(json_agg(row_to_json(t) order by t.cnt desc, t.d30 desc, t.dall desc), '[]'::json)
  from (
    select a.user_id, a.cnt, a.d30, a.dall, pr.username, pr.display_name, pr.avatar_url, pr.province
    from agg a
    join profiles pr on pr.id = a.user_id
    where a.cnt > 0
      and (p_scope <> 'city'
           or pr.province is not distinct from (select province from profiles where id = auth.uid()))
    order by a.cnt desc, a.d30 desc, a.dall desc
    limit greatest(p_limit, 1)
  ) t;
$$;
