-- 0017: Liderlik anti-spam. Kayıt SAYISI yerine AKTİF GÜN sayısına göre sırala.
-- - count(distinct created_at::date): aynı gün onlarca kayıt = 1 gün (spam etkisiz).
-- - created_at sunucu tarafından set edilir → performed_at'ı geçmişe atarak hile yapılamaz.
-- - Metrik en fazla p_days (ör. 7) olur → düzenlilik ödüllendirilir.

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
  with active as (
    select w.user_id, count(distinct w.created_at::date) as cnt
    from workout_logs w
    where w.created_at >= now() - make_interval(days => greatest(p_days, 1))
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
