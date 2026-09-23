-- 0014: Takip sistemi (follow) + takipçi/takip sayıları + yeni takipçi bildirimi.

create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists follows_follower_idx  on public.follows (follower_id);

alter table public.follows enable row level security;

-- Herkes takip ilişkilerini görebilir (takipçi/takip listeleri + sayılar için)
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows
  for select to authenticated using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert to authenticated with check (follower_id = auth.uid() and following_id <> auth.uid());

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- Takipçi/takip sayıları + "onu takip ediyor muyum" (tek çağrı)
create or replace function public.get_follow_info(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'followers',    (select count(*) from follows where following_id = p_user_id),
    'following',    (select count(*) from follows where follower_id  = p_user_id),
    'is_following', exists (select 1 from follows where follower_id = auth.uid() and following_id = p_user_id)
  );
$$;
grant execute on function public.get_follow_info(uuid) to authenticated;

-- Yeni takipçi → bildirim
create or replace function public.on_follow_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare fname text;
begin
  select coalesce(display_name, username, 'Bir sporcu') into fname from profiles where id = new.follower_id;
  perform notify_user(new.following_id, 'Yeni takipçi 👤',
                      fname || ' seni takip etmeye başladı',
                      jsonb_build_object('type', 'follow', 'user_id', new.follower_id));
  return new;
end; $$;

drop trigger if exists trg_follow_notify on public.follows;
create trigger trg_follow_notify after insert on public.follows
  for each row execute function public.on_follow_insert();
