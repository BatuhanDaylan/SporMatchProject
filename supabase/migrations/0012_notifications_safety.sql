-- 0012: Bildirim merkezi (uygulama içi) + güvenlik (engelle/şikayet) + hesap silme.

-- =========================================================
-- 1) NOTIFICATIONS — uygulama içi bildirim geçmişi
-- =========================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null default 'genel',
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- Realtime (kendi bildirimlerini anlık görsün)
alter table public.notifications replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

-- notify_user'ı genişlet: önce uygulama-içi bildirim satırı yaz, sonra push gönder.
create or replace function public.notify_user(
  p_user uuid, p_title text, p_body text, p_data jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  insert into notifications (user_id, type, title, body, data)
    values (p_user, coalesce(p_data->>'type', 'genel'), p_title, p_body, p_data);

  for t in select token from push_tokens where user_id = p_user loop
    begin
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('to', t.token, 'title', p_title, 'body', p_body, 'sound', 'default', 'data', p_data)
      );
    exception when others then null;
    end;
  end loop;
end; $$;

create or replace function public.mark_all_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- =========================================================
-- 2) USER_BLOCKS — engelleme
-- =========================================================
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "blocks_select_own" on public.user_blocks;
create policy "blocks_select_own" on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());

drop policy if exists "blocks_insert_own" on public.user_blocks;
create policy "blocks_insert_own" on public.user_blocks
  for insert to authenticated with check (blocker_id = auth.uid() and blocked_id <> auth.uid());

drop policy if exists "blocks_delete_own" on public.user_blocks;
create policy "blocks_delete_own" on public.user_blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- =========================================================
-- 3) REPORTS — şikayet (yalnız yazılır; okuma admin işi)
-- =========================================================
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- =========================================================
-- 4) Hesap silme (auth.users'ı sil → cascade ile tüm veri gider)
-- =========================================================
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  delete from auth.users where id = me;
end; $$;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.delete_my_account() from anon;

-- =========================================================
-- 5) Engelli kullanıcıları keşiften gizle + sohbet isteğini engelle
-- =========================================================
create or replace function public.discover_programs(
  p_sort text default 'recent', p_period_days int default 7, p_limit int default 50
) returns json
language sql stable security definer set search_path = public as $$
  with base as (
    select p.id, p.title, p.description, p.owner_id, p.visibility, p.template, p.updated_at, p.sport_id,
      coalesce(lc.cnt,0) as like_count, coalesce(sc.cnt,0) as save_count,
      coalesce(rlc.cnt,0) + coalesce(rsc.cnt,0) as hit_score
    from programs p
    left join (select program_id, count(*) cnt from program_likes group by program_id) lc  on lc.program_id  = p.id
    left join (select program_id, count(*) cnt from program_saves group by program_id) sc  on sc.program_id  = p.id
    left join (select program_id, count(*) cnt from program_likes where created_at > now() - make_interval(days => greatest(p_period_days,1)) group by program_id) rlc on rlc.program_id = p.id
    left join (select program_id, count(*) cnt from program_saves where created_at > now() - make_interval(days => greatest(p_period_days,1)) group by program_id) rsc on rsc.program_id = p.id
    where p.visibility = 'public'
      and not exists (
        select 1 from user_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.owner_id)
           or (b.blocker_id = p.owner_id and b.blocked_id = auth.uid())
      )
  ),
  filtered as (select * from base where case when p_sort='hit' then hit_score > 0 else true end),
  ordered as (
    select * from filtered
    order by
      case when p_sort='liked' then like_count end desc nulls last,
      case when p_sort='saved' then save_count end desc nulls last,
      case when p_sort='hit'   then hit_score  end desc nulls last,
      updated_at desc
    limit greatest(p_limit,1)
  )
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select o.id, o.title, o.description, o.owner_id, o.visibility, o.template, o.updated_at,
      o.like_count, o.save_count, o.hit_score,
      (select row_to_json(pr) from (select username, display_name, avatar_url from profiles where id = o.owner_id) pr) as owner,
      (select row_to_json(sp) from (select name, icon from sports where id = o.sport_id) sp) as sport
    from ordered o
  ) t;
$$;

create or replace function public.send_chat_request(p_to uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); existing_conv uuid; pend record; new_id uuid; conv uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_to is null or p_to = me then raise exception 'geçersiz kullanıcı'; end if;
  if not exists (select 1 from profiles where id = p_to) then raise exception 'kullanıcı bulunamadı'; end if;
  if exists (select 1 from user_blocks b
             where (b.blocker_id=me and b.blocked_id=p_to) or (b.blocker_id=p_to and b.blocked_id=me)) then
    raise exception 'engellenen kullanıcıyla sohbet başlatılamaz';
  end if;

  select conversation_id into existing_conv from matches
    where conversation_id is not null
      and ((user_a = me and user_b = p_to) or (user_a = p_to and user_b = me))
    limit 1;
  if existing_conv is not null then
    return json_build_object('status','existing','conversation_id',existing_conv);
  end if;

  select * into pend from matches
    where origin='chat' and status='pending'
      and ((user_a=me and user_b=p_to) or (user_a=p_to and user_b=me))
    limit 1;
  if found then
    if pend.user_b = me then
      insert into conversations (match_id) values (pend.id)
        on conflict (match_id) do update set match_id = excluded.match_id returning id into conv;
      update matches set b_confirmed=true, status='confirmed', conversation_id=conv where id=pend.id;
      return json_build_object('status','existing','conversation_id',conv);
    end if;
    return json_build_object('status','pending','match_id',pend.id);
  end if;

  insert into matches (user_a, user_b, origin, a_confirmed, status)
    values (me, p_to, 'chat', true, 'pending') returning id into new_id;
  return json_build_object('status','sent','match_id',new_id);
end; $$;
