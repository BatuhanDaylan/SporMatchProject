-- 0008: Profil zenginleştirme — şehir, hedefler, müsaitlik + istatistik/streak RPC'si.
-- İstatistik kartları ve rozetler bu RPC'nin döndürdüğü sayımlardan türetilir (istemci tarafı).

-- 1) Yeni profil alanları (hepsi opsiyonel; mevcut satırları bozmaz)
alter table public.profiles
  add column if not exists city         text,
  add column if not exists goals        text[] not null default '{}',
  add column if not exists availability text[] not null default '{}';

-- 2) Profil istatistikleri + antrenman serisi (streak).
--    security definer: RLS'i kontrollü aşarak herhangi bir kullanıcının SAYIMLARINI döndürür
--    (ham satırları değil — yalnız sayılar, gizlilik korunur). Başka profilleri de gösterebilmek
--    için p_user_id parametreli.
create or replace function public.get_profile_stats(p_user_id uuid default auth.uid())
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_programs   int;
  v_workouts   int;
  v_matches    int;
  v_comments   int;
  v_streak     int := 0;
  v_check      date := current_date;
  v_created    timestamptz;
begin
  select count(*) into v_programs from programs      where owner_id  = p_user_id;
  select count(*) into v_workouts from workout_logs  where user_id   = p_user_id;
  select count(*) into v_comments from comments      where author_id = p_user_id;
  select count(*) into v_matches  from matches
    where (user_a = p_user_id or user_b = p_user_id) and status = 'confirmed';

  select created_at into v_created from profiles where id = p_user_id;

  -- Güncel seri: bugünden (yoksa dünden) geriye doğru kesintisiz antrenman günleri.
  if not exists (
    select 1 from workout_logs
    where user_id = p_user_id and performed_at::date = current_date
  ) then
    v_check := current_date - 1;
  end if;

  loop
    if exists (
      select 1 from workout_logs
      where user_id = p_user_id and performed_at::date = v_check
    ) then
      v_streak := v_streak + 1;
      v_check  := v_check - 1;
    else
      exit;
    end if;
  end loop;

  return json_build_object(
    'programs',     v_programs,
    'workouts',     v_workouts,
    'matches',      v_matches,
    'comments',     v_comments,
    'streak',       v_streak,
    'member_since', v_created
  );
end;
$$;

grant execute on function public.get_profile_stats(uuid) to authenticated;
