-- 0029: Antrenman ısı-haritası. Bir kullanıcının son N gündeki günlük antrenman
-- sayısı (performed_at bazlı). Security definer → başkasının profilinde de yalnız
-- SAYILAR görünür (içerik değil). Seyrek döner (yalnız kayıt olan günler); grid'i istemci kurar.

create or replace function public.workout_heatmap(p_user_id uuid, p_days int default 371)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('d', to_char(d, 'YYYY-MM-DD'), 'c', c) order by d), '[]'::json)
  from (
    select performed_at::date as d, count(*)::int as c
    from workout_logs
    where user_id = p_user_id
      and performed_at::date > current_date - greatest(p_days, 1)
    group by performed_at::date
  ) t;
$$;
grant execute on function public.workout_heatmap(uuid, int) to authenticated;
