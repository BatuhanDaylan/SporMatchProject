-- 0021: İçerik moderasyonu (küfür/müstehcen filtresi) — SUNUCU TARAFI ZORUNLU.
-- İstemci filtresi (src/lib/moderation.ts) atlansa bile bu trigger'lar reddeder.
-- Kelime listesi src/lib/moderation.ts ile senkron tutulmalıdır.

create or replace function public.has_banned_words(p_text text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  t text;
  roots text[] := array[
    -- Türkçe
    'orospu','pezevenk','pezeveng','piç','yavşak','yavsak','kahpe','kaltak',
    'sürtük','surtuk','ibne','gavat','amcık','amcik','amına','amina',
    'yarrak','yarak','taşşak','taşak','tassak','siktir','sikeyim',
    'sikik','sikiş','sikis','sikici','sikerim','sokayım','sokayim','sokarım',
    'sokarim','götver','gotver','götlek','götoş','gotos','fahişe','fahise',
    'porno','çük','oç','göt oğlanı','meme ucu',
    -- İngilizce
    'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy',
    'porn','whore','slut','nigger','faggot','motherf'
  ];
begin
  if p_text is null or p_text = '' then return false; end if;
  t := lower(p_text);
  t := regexp_replace(t, '(.)\1+', '\1', 'g');        -- tekrar eden harfleri teke indir
  t := regexp_replace(t, '[^a-zçğıöşü ]+', ' ', 'g');  -- harf/boşluk dışını boşluğa çevir
  t := ' ' || regexp_replace(t, '\s+', ' ', 'g') || ' ';
  return t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(roots, '|') || ')');
end; $$;

-- comments
create or replace function public.moderate_comment() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(new.body) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_comment on public.comments;
create trigger trg_moderate_comment before insert or update on public.comments
  for each row execute function public.moderate_comment();

-- messages
create or replace function public.moderate_message() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(new.body) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_message on public.messages;
create trigger trg_moderate_message before insert on public.messages
  for each row execute function public.moderate_message();

-- programs (başlık + açıklama + şablon metni)
create or replace function public.moderate_program() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(coalesce(new.title,'') || ' ' || coalesce(new.description,'') || ' ' || coalesce(new.template::text,'')) then
    raise exception 'Uygunsuz içerik: program metninde küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_program on public.programs;
create trigger trg_moderate_program before insert or update on public.programs
  for each row execute function public.moderate_program();

-- profiles (görünen ad + bio + kullanıcı adı)
create or replace function public.moderate_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  if has_banned_words(coalesce(new.display_name,'') || ' ' || coalesce(new.bio,'') || ' ' || coalesce(new.username,'')) then
    raise exception 'Uygunsuz içerik: profil metninde küfür/müstehcen ifade kullanılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_moderate_profile on public.profiles;
create trigger trg_moderate_profile before insert or update on public.profiles
  for each row execute function public.moderate_profile();
