-- 0038: Denetim bulguları (2. tur).
--  1) assert_rate: kullanıcı+tablo başına transaction-seviyesi advisory lock. Sayım ile INSERT
--     arasındaki yarış kapanır; paralel istekler sırayla işlenir ve limit aşılamaz.
--  2) post_comments_select: birbirini engelleyen taraflar birbirinin yorumunu göremez.

create or replace function public.assert_rate(p_table text, p_col text, p_user uuid, p_max int, p_secs int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cnt int;
begin
  -- Lock, insert'i yapan transaction bitene kadar tutulur (before-insert trigger içinden çağrılır).
  perform pg_advisory_xact_lock(hashtextextended(p_table || ':' || p_user::text, 0));
  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - make_interval(secs => $2)',
    p_table, p_col
  ) into cnt using p_user, p_secs;
  if cnt >= p_max then
    raise exception 'Çok hızlısın — lütfen biraz bekleyip tekrar dene.' using errcode = '55000';
  end if;
end; $$;

drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments
  for select to authenticated
  using (
    (hidden_at is null or author_id = auth.uid() or public.is_admin(auth.uid()))
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = post_comments.author_id)
         or (b.blocker_id = post_comments.author_id and b.blocked_id = auth.uid())
    )
  );
