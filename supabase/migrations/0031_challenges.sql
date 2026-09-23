-- 0031: Meydan okumalar. Süreli hedef (ör. "7 günde 5 antrenman"); katıl,
-- ilerlemen workout_logs'tan otomatik hesaplanır, hedefe ulaşınca "tamamlandı".
-- İlerleme performed_at bazlı pencere içinde sayılır. Moderasyon + rate limit. Idempotent.

-- =========================================================
-- 1) CHALLENGES
-- =========================================================
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  metric      text not null default 'workouts' check (metric in ('workouts', 'active_days')),
  goal        integer not null check (goal between 1 and 1000),
  sport_id    text references public.sports (id) on delete set null,
  starts_at   date not null,
  ends_at     date not null,
  created_at  timestamptz not null default now(),
  constraint challenges_window check (ends_at >= starts_at)
);
create index if not exists challenges_window_idx on public.challenges (ends_at, starts_at);

alter table public.challenges enable row level security;

drop policy if exists "challenges_select" on public.challenges;
create policy "challenges_select" on public.challenges for select to authenticated using (true);

drop policy if exists "challenges_insert_own" on public.challenges;
create policy "challenges_insert_own" on public.challenges
  for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists "challenges_delete_own" on public.challenges;
create policy "challenges_delete_own" on public.challenges
  for delete to authenticated using (creator_id = auth.uid());

create or replace function public.moderate_challenge() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(new.title) or has_banned_words(coalesce(new.description,'')) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_challenge on public.challenges;
create trigger trg_moderate_challenge before insert or update on public.challenges
  for each row execute function public.moderate_challenge();

create or replace function public.rl_challenges() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('challenges', 'creator_id', new.creator_id, 10, 3600); return new; end; $$;
drop trigger if exists trg_rl_challenges on public.challenges;
create trigger trg_rl_challenges before insert on public.challenges
  for each row execute function public.rl_challenges();

-- =========================================================
-- 2) CHALLENGE_PARTICIPANTS
-- =========================================================
create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);

alter table public.challenge_participants enable row level security;

drop policy if exists "cp_select" on public.challenge_participants;
create policy "cp_select" on public.challenge_participants for select to authenticated using (true);

drop policy if exists "cp_insert_own" on public.challenge_participants;
create policy "cp_insert_own" on public.challenge_participants
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "cp_delete_own" on public.challenge_participants;
create policy "cp_delete_own" on public.challenge_participants
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.rl_challenge_join() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('challenge_participants', 'user_id', new.user_id, 30, 60); return new; end; $$;
drop trigger if exists trg_rl_challenge_join on public.challenge_participants;
create trigger trg_rl_challenge_join before insert on public.challenge_participants
  for each row execute function public.rl_challenge_join();

-- =========================================================
-- 3) İlerleme hesabı (performed_at penceresi içinde)
-- =========================================================
create or replace function public.challenge_progress(p_challenge uuid, p_user uuid)
returns int language plpgsql stable security definer set search_path = public as $$
declare ch record; v int;
begin
  select metric, goal, starts_at, ends_at, sport_id into ch from challenges where id = p_challenge;
  if not found then return 0; end if;
  if ch.metric = 'active_days' then
    select count(distinct wl.performed_at::date) into v
      from workout_logs wl
      where wl.user_id = p_user
        and wl.performed_at::date between ch.starts_at and ch.ends_at;
  else
    select count(*) into v
      from workout_logs wl
      where wl.user_id = p_user
        and wl.performed_at::date between ch.starts_at and ch.ends_at;
  end if;
  return coalesce(v, 0);
end; $$;
grant execute on function public.challenge_progress(uuid, uuid) to authenticated;

-- =========================================================
-- 4) RPC: create_challenge (katılımcı olarak yaratıcıyı ekle)
-- =========================================================
create or replace function public.create_challenge(
  p_title text, p_description text, p_metric text, p_goal int,
  p_sport_id text, p_starts_at date, p_ends_at date
) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  insert into challenges (creator_id, title, description, metric, goal, sport_id, starts_at, ends_at)
    values (me, p_title, nullif(trim(p_description),''), coalesce(p_metric,'workouts'), p_goal, p_sport_id, p_starts_at, p_ends_at)
    returning id into new_id;
  insert into challenge_participants (challenge_id, user_id) values (new_id, me) on conflict do nothing;
  return json_build_object('id', new_id);
end; $$;
grant execute on function public.create_challenge(text,text,text,int,text,date,date) to authenticated;

-- =========================================================
-- 5) RPC: challenges_list (aktif + yaklaşan + benimkiler)
-- =========================================================
create or replace function public.challenges_list(p_scope text default 'active', p_limit int default 50)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.ends_at asc), '[]'::json) from (
    select
      ch.id, ch.title, ch.description, ch.metric, ch.goal, ch.starts_at, ch.ends_at, ch.creator_id,
      (select count(*) from challenge_participants cp where cp.challenge_id = ch.id)::int as participant_count,
      exists (select 1 from challenge_participants cp where cp.challenge_id = ch.id and cp.user_id = auth.uid()) as joined,
      public.challenge_progress(ch.id, auth.uid()) as my_progress,
      (public.challenge_progress(ch.id, auth.uid()) >= ch.goal) as completed,
      case when current_date < ch.starts_at then 'upcoming'
           when current_date > ch.ends_at then 'ended' else 'active' end as status,
      (select row_to_json(sp) from (select name, icon from sports where id = ch.sport_id) sp) as sport
    from challenges ch
    where case
      when p_scope = 'mine' then exists (select 1 from challenge_participants cp where cp.challenge_id = ch.id and cp.user_id = auth.uid())
      when p_scope = 'active' then ch.ends_at >= current_date
      else true
    end
    limit greatest(p_limit, 1)
  ) t;
$$;
grant execute on function public.challenges_list(text, int) to authenticated;

-- =========================================================
-- 6) RPC: challenge_detail (+ katılımcı sıralaması)
-- =========================================================
create or replace function public.challenge_detail(p_challenge uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  return (
    select row_to_json(t) from (
      select
        ch.id, ch.title, ch.description, ch.metric, ch.goal, ch.starts_at, ch.ends_at, ch.creator_id,
        (ch.creator_id = me) as is_creator,
        exists (select 1 from challenge_participants cp where cp.challenge_id = ch.id and cp.user_id = me) as joined,
        public.challenge_progress(ch.id, me) as my_progress,
        (public.challenge_progress(ch.id, me) >= ch.goal) as completed,
        (select count(*) from challenge_participants cp where cp.challenge_id = ch.id)::int as participant_count,
        case when current_date < ch.starts_at then 'upcoming'
             when current_date > ch.ends_at then 'ended' else 'active' end as status,
        (select row_to_json(sp) from (select name, icon from sports where id = ch.sport_id) sp) as sport,
        (select coalesce(json_agg(row_to_json(r) order by r.progress desc), '[]'::json) from (
           select pr.id, pr.username, pr.display_name, pr.avatar_url,
             public.challenge_progress(ch.id, pr.id) as progress,
             (public.challenge_progress(ch.id, pr.id) >= ch.goal) as completed
           from challenge_participants cp join profiles pr on pr.id = cp.user_id
           where cp.challenge_id = ch.id
           limit 100
         ) r) as leaderboard
      from challenges ch where ch.id = p_challenge
    ) t
  );
end; $$;
grant execute on function public.challenge_detail(uuid) to authenticated;

-- =========================================================
-- 7) join / leave
-- =========================================================
create or replace function public.join_challenge(p_challenge uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ch record;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into ch from challenges where id = p_challenge;
  if not found then raise exception 'meydan okuma bulunamadı'; end if;
  if current_date > ch.ends_at then raise exception 'meydan okuma sona erdi'; end if;
  insert into challenge_participants (challenge_id, user_id) values (p_challenge, me) on conflict do nothing;
  return json_build_object('joined', true);
end; $$;
grant execute on function public.join_challenge(uuid) to authenticated;

create or replace function public.leave_challenge(p_challenge uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  delete from challenge_participants where challenge_id = p_challenge and user_id = me;
  return json_build_object('joined', false);
end; $$;
grant execute on function public.leave_challenge(uuid) to authenticated;
