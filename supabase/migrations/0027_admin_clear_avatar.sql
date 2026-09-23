-- 0027: Yönetici, şikayet edilen uygunsuz profil fotoğrafını kaldırabilir.
-- Görsel için otomatik NSFW tespiti yok (kullanıcı kararı: şikayet + manuel kaldırma).
-- avatar_url null'lanır → uygulamada baş harf rozeti gösterilir. Idempotent.

create or replace function public.admin_clear_avatar(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  update profiles set avatar_url = null where id = p_user_id;
end; $$;
grant execute on function public.admin_clear_avatar(uuid) to authenticated;
