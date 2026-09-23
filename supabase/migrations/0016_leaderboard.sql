-- 0016: Liderlik tablosu — son p_days içinde en çok antrenman yapan sporcular.
-- workout_logs kişiye özel (RLS); burada security definer ile yalnızca SAYILAR toplanır.

create or replace function public.leaderboard(
  p_days  int  default 7,
  p_scope text default 'all',   -- 'all' | 'city' (arayanın iliyle aynı)
  p_limit int  default 20
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with active as (
    select w.user_id, count(*) as cnt
    from workout_logs w
    where w.performed_at::date >= current_date - greatest(p_days, 1)
    group by w.user_id
  )
  select coalesce(json_agg(row_to_json(t) order by t.cnt desc), '[]'::json)
  from (
    select a.user_id, a.cnt, pr.username, pr.display_name, pr.avatar_url, pr.province
    from active a
    join profiles pr on pr.id = a.user_id
    where p_scope <> 'city'
       or pr.province is not distinct from (select province from profiles where id = auth.uid())
    order by a.cnt desc
    limit greatest(p_limit, 1)
  ) t;
$$;
grant execute on function public.leaderboard(int, text, int) to authenticated;
