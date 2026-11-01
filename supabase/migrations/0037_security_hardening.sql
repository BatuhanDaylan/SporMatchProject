-- 0037: Güvenlik sertleştirmesi (çapraz denetim bulguları).
--  1) notify_user istemciden çağrılamaz (sahte bildirim/push spam'i). Çağıran tüm trigger/RPC'ler
--     SECURITY DEFINER olduğu için etkilenmez.
--  2) event_participants'a doğrudan INSERT kapatılır; katılım yalnız join_event RPC'si ile
--     (kapasite / durum / engel kontrolleri orada). create_event de definer olduğu için çalışır.
--  3) posts okuma: gizlenmiş gönderiler yalnız yazara + admin'e; engelli taraflar birbirinin
--     gönderisini doğrudan sorguyla da göremez.
--  4) post_comments insert: gizli veya engelli taraftaki gönderiye yorum yazılamaz.

-- 1) notify_user
revoke all on function public.notify_user(uuid, text, text, jsonb) from public, anon, authenticated;

-- 2) event_participants
drop policy if exists "ep_insert_own" on public.event_participants;

-- 3) posts_select
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts
  for select to authenticated
  using (
    (hidden_at is null or author_id = auth.uid() or public.is_admin(auth.uid()))
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = posts.author_id)
         or (b.blocker_id = posts.author_id and b.blocked_id = auth.uid())
    )
  );

-- 4) post_comments_insert (posts_select zaten gizli/engelli gönderiyi süzer)
drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert" on public.post_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_comments.post_id)
  );
