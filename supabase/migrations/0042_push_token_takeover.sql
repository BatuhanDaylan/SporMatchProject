-- 0042: Bildirim jetonu cihaza aittir. Aynı cihazda başka hesapla oturum açılınca jeton satırı
-- eski hesapta kalıyor ve RLS (user_id = auth.uid()) yeni hesabın onu güncellemesine izin vermiyordu
-- → yeni hesaba bildirim gitmiyor, ✓✓ (iletildi) çalışmıyordu. Jetonu çağıran hesaba devreden RPC.
-- Idempotent.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'geçersiz bildirim jetonu';
  end if;
  insert into push_tokens (token, user_id, platform, updated_at)
    values (p_token, me, left(coalesce(p_platform, ''), 16), now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end; $$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated, service_role;
