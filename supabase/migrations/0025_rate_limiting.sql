-- 0025: Rate limiting (istismar/spam koruması). Kullanıcı başına, zaman penceresinde
-- belirli bir sayıyı aşan ekleme reddedilir. security definer sayım → RLS'ten etkilenmez
-- (özellikle reports'ta select politikası yok, doğru sayım için definer şart).

create or replace function public.assert_rate(p_table text, p_col text, p_user uuid, p_max int, p_secs int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cnt int;
begin
  execute format(
    'select count(*) from public.%I where %I = $1 and created_at > now() - make_interval(secs => $2)',
    p_table, p_col
  ) into cnt using p_user, p_secs;
  if cnt >= p_max then
    raise exception 'Çok hızlısın — lütfen biraz bekleyip tekrar dene.' using errcode = '55000';
  end if;
end; $$;

-- messages: 30 / dakika
create or replace function public.rl_messages() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('messages', 'sender_id', new.sender_id, 30, 60); return new; end; $$;
drop trigger if exists trg_rl_messages on public.messages;
create trigger trg_rl_messages before insert on public.messages
  for each row execute function public.rl_messages();

-- comments: 15 / dakika
create or replace function public.rl_comments() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('comments', 'author_id', new.author_id, 15, 60); return new; end; $$;
drop trigger if exists trg_rl_comments on public.comments;
create trigger trg_rl_comments before insert on public.comments
  for each row execute function public.rl_comments();

-- reports: 10 / saat (şikayet spam'i)
create or replace function public.rl_reports() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('reports', 'reporter_id', new.reporter_id, 10, 3600); return new; end; $$;
drop trigger if exists trg_rl_reports on public.reports;
create trigger trg_rl_reports before insert on public.reports
  for each row execute function public.rl_reports();

-- follows: 60 / dakika (toplu takip spam'i)
create or replace function public.rl_follows() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('follows', 'follower_id', new.follower_id, 60, 60); return new; end; $$;
drop trigger if exists trg_rl_follows on public.follows;
create trigger trg_rl_follows before insert on public.follows
  for each row execute function public.rl_follows();

-- program_likes: 60 / dakika
create or replace function public.rl_likes() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('program_likes', 'user_id', new.user_id, 60, 60); return new; end; $$;
drop trigger if exists trg_rl_likes on public.program_likes;
create trigger trg_rl_likes before insert on public.program_likes
  for each row execute function public.rl_likes();

-- match_sessions: 10 / dakika (eşleşme oturumu spam'i)
create or replace function public.rl_match_sessions() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('match_sessions', 'user_id', new.user_id, 10, 60); return new; end; $$;
drop trigger if exists trg_rl_match_sessions on public.match_sessions;
create trigger trg_rl_match_sessions before insert on public.match_sessions
  for each row execute function public.rl_match_sessions();
