-- 0041: Test geri bildirimleri (Kasım 2026).
--  1) Küfür filtresi: yeni kaçışlar (pipi, am yala, sex/seks…), yanlış alarmlar (anlamında, programında,
--     eksik misin, terapist, pis…). Uzun kökler artık yalnız kelime içinde ya da kelime BAŞINDAN aranır.
--     Listeler src/lib/moderation.ts'den ÜRETİLDİ — elle değiştirme, oradan üret.
--  2) Telefon numarası ve bağlantı paylaşımı yasak (has_contact_info) — tüm metin alanlarında.
--  3) Gizli hesap: takip isteği + onay; gizli hesabın gönderi/program/ısı haritası yalnız takipçilere.
--  4) Yorum: yanıt (parent_id), beğeni, düzenleme (yalnız metin); gönderi düzenleme.
--  5) Akış: hashtag filtresi (#etiket), düzenlendi bilgisi; program keşfinde spor filtresi.
--  6) Etkinlik: sahibi katılımcı çıkarabilir (tekrar katılamaz); engellenen kişi etkinlikten düşer ve
--     katılamaz; geçmiş/şu anki saat seçilemez.
--  7) Eşleşme geçmişi (my_match_history).
-- Idempotent.

-- =========================================================
-- 1) Küfür / hakaret filtresi
-- =========================================================
-- Önek temizleme + indirgeme + harf dışını boşluğa çevirme (istemcideki finish())
create or replace function public.mod_finish(p text, p_allowed_re text)
returns text language sql immutable set search_path = public as $$
  select btrim(regexp_replace(
    regexp_replace(regexp_replace(p, p_allowed_re, '\1 ', 'g'), '(.)\1+', '\1', 'g'),
    '[^a-zçğıöşü]+', ' ', 'g'));
$$;

create or replace function public.mod_check(p_lowered text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  base text;
  t text;
  j text;
  merged text := '';
  toks text[];
  tok text;
  prev_len int := 0;
  chain text;
  n int;
  roots text[] := array[
    'orospu','orosbu','orispu','oruspu','orusbu','pezevenk','pezeveng','pezeven','pezevek','pezo',
    'yavşak','yavsak','yavşağ','yavsağ','yavuşak','kahpe','kahbe','kaltak','kaltağ','kancık','kancik',
    'sürtük','surtuk','sürtüğ','surtuğ','ibne','ibine','ıbne','ipne','gavat','gavad','kavat','amcık',
    'amcik','amcığ','amcig','amcuk','amına','amina','amını','amında','aminda','amınoğlu','aminoglu',
    'amkafa','yarrak','yarak','yarağ','yarrağ','yarag','dalyarak','dalyarag','taşşak','taşak','tassak',
    'taşağ','tassağ','daşşak','daşak','dassak','dassağ','daltaşak','daltassak','sikt','siktiğ','siktig',
    'sikeyim','sikerim','siker','sikem','sikecem','sikicem','sikiyim','sikim','sikik','sikiğ','sikiş',
    'sikis','sikici','sikmek','sikmiş','sikmis','sikc','sikç','sikko','sikd','siken','sikes','sikey',
    'sikien','sikir','siks','siqt','hasiktir','hasitir','sittir','sokayım','sokayim','sokarım','sokarim',
    'sokuyum','giberim','gibmek','gibtiler','zikeyim','xikeyim','zikik','göt','gotver','gotos','gotun',
    'gotelek','gtveren','godumun','koduğmun','koduumun','fahişe','fahise','porno','meme ucu','çük',
    'oçocu','ococu','şerefsiz','serefsiz','puşt','kerhane','karhane','kerane','genelev','boktan',
    'escort','eskort','onlyfans','piç','pickurusu','dassag','kevaşe','kevase','dürzü','durzu','godoş',
    'godos','yosma','avradın','avradin','deyyus','deyyuz','mastürb','masturb','sakso','pedofil','abazan',
    'domal','malafat','madafaka','veledizina','veledi zina','weledizina','otuzbirci','otuz birci',
    'sıçayım','sıçarım','sıçtığım','ağzına sıç','itoğlu','seks','pipi','sikyala','gotyala','götyala',
    'fuck','shit','bullshit','dipshit','horseshit','apeshit','bitch','asshole','arsehole','assmunch',
    'bastard','dick','pussy','porn','whore','slut','nigger','nigga','faggot','motherf','retard','wank',
    'chink','tranny','cocksucker','blowjob','blow job','dildo','jackass','dumbass','phuck','phuk','fvck',
    'prick','bollocks','skank','douche','jerkoff','jerk off','jack off','cumshot','handjob','hand job',
    'rimjob','rimming','hentai','kill yourself','rapist','raping','pedophile','paedophile','anilingus',
    'cunnilingus','fellatio','bukkake','bulldyke','butthole','camwhore','camslut','circlejerk','clit',
    'creampie','daterape','deepthroat','deep throat','doggystyle','doggy style','femdom','fingerbang',
    'fisting','footjob','fudgepacker','gangbang','gang bang','goatse','jizz','nympho','poontang','queef',
    'schlong','shemale','sodomi','sodomy','splooge','strapon','threesome','titties','tosser','raghead',
    'towelhead','wetback','beaner','beastiality','bestiality','sex'
  ];
  insults text[] := array[
    'salak','aptal','ahmak','embesil','beyinsiz','namussuz','haysiyetsiz','şıllık','sıllık','gerzek',
    'dangalak','gerizekalı','gerizekali','gerızekalı','geri zekalı','geri zekali','andaval','angut',
    'dallama','lavuk','it oğlu it','mal mısın','mal misin','cibiliyetsiz','cibilliyetsiz','ebleh',
    'geber','amyala'
  ];
  exacts text[] := array[
    'amk','amq','aq','mk','mq','amck','amın','amı','amık','amn','amnda','amuna','amona','amuga','amuğa',
    'amsız','amsiz','oç','sktr','sktir','siktr','sktim','skrm','skm','skym','skerim','skcem','skecem',
    'skem','sker','skerm','skeyim','skiim','skik','skime','skmek','sksin','sksn','sksz','skyim','hsktr',
    'sg','syk','yrk','yrrk','yrrak','orspu','orsp','gtver','gtvr','gtn','gtnde','gtne','gtten','gtelek',
    'pzvnk','sik','sike','sikin','sikinde','sikinden','sikine','sikini','sikip','sikme','sikmem',
    'sikmiler','sikime','sikimi','sikler','sikleri','sikli','sokam','sokarm','sokaym','sokim','soxum',
    'goyum','ziksin','bok','boku','bokum','boka','boklar','boklu','bokça','bombok','bokbok','gotu',
    'gote','gotune','gotunu','gotum','gotumu','gotlu','pust','pici','picler','piclik','mcik','mna',
    'yaraq','malsın','malsin','nude','nudes','cock','cocks','cunt','cunts','twat','kike','spic','fuk',
    'fck','fuq','stfu','sht','btch','arse','milf','kys','rape','fag','fags','bdsm','orgy','smut','tits',
    'titty','boobs','boner','paki','gook','cumming'
  ];
  skip text[] := array[
    'yarak','kaltak','kaltağ','ipne','oçocu','ococu','göt','clit','amı','dallama','geber','angut',
    'amında','aminda','amınoğlu','aminoglu','amkafa'
  ];
  allowed text[] := array[
    'sikke','siklon','siklamen','siklus','siklotron','sikatif','sikayet','sikh','götür','shiitake',
    'dickens','dickinson','saksofon','saksafon','clitheroe','geberit','seksen','seksek','seksiyon',
    'terapi'
  ];
  word_re text;
  exact_re text;
  long_re text;
  chain_re text;
  allowed_re text;
begin
  if position('🖕' in p_lowered) > 0 then return true; end if;

  -- listeler de aynı indirgemeden geçer (yarrak → yarak)
  select array_agg(regexp_replace(r, '(.)\1+', '\1', 'g')) into roots from unnest(roots) r;
  select array_agg(regexp_replace(r, '(.)\1+', '\1', 'g')) into insults from unnest(insults) r;
  select array_agg(regexp_replace(r, '(.)\1+', '\1', 'g')) into exacts from unnest(exacts) r;
  select array_agg(regexp_replace(r, '(.)\1+', '\1', 'g')) into skip from unnest(skip) r;
  word_re := '(^| )(' || array_to_string(roots || insults, '|') || ')';
  exact_re := '(^| )(' || array_to_string(exacts, '|') || ')( |$)';
  select string_agg(x, '|') into long_re from (
    select replace(r, ' ', '') x from unnest(roots) r where length(replace(r, ' ', '')) >= 6
    union all
    select replace(r, ' ', '') x from unnest(insults) r where length(replace(r, ' ', '')) >= 8
  ) s where not (x = any (skip));
  select '^((' || string_agg(r, '|') || ')[a-zçğıöşü]{0,3}' into chain_re
    from unnest(roots || insults) r where position(' ' in r) = 0 and not (r = any (skip));
  select chain_re || '|' || string_agg(e, '|') || ')$' into chain_re
    from unnest(exacts) e where not (e = any (skip));
  allowed_re := '(^|[^a-zçğıöşü])(' || array_to_string(allowed, '|') || ')';

  base := normalize(p_lowered, NFC);
  base := regexp_replace(base, '[\u0300-\u036f\u00ad\u200b-\u200f\u2060\ufeff]', '', 'g');
  base := translate(base, 'àáâãäåāèéêëēìíîïīòóôõōùúûūñýÿаеорсухкмтіјѕαοειινρτυ', 'aaaaaaaeeeeeiiiiiooooouuuunyyaeopcyxkmtijsaoeiivptu');
  -- rakam/sembol kaçışı yalnız harf içeren kelimelerde (s1kt1r evet, "5 km" hayır)
  select string_agg(case when x.w ~ '[a-zçğıöşü]' then translate(x.w, '0134579@$€+8', 'oieastgasetb') else x.w end, ' ' order by x.n)
    into base from regexp_split_to_table(base, '\s+') with ordinality as x(w, n);
  base := regexp_replace(base, '([a-zçğıöşü])[!|](?=[a-zçğıöşü])', '\1i', 'g');
  base := regexp_replace(base, '([a-zçğıöşü])\*+(?=[a-zçğıöşü])', '\1', 'g');   -- f*ck → fck

  t := public.mod_finish(base, allowed_re);                                        -- işaretler boşluk
  j := public.mod_finish(regexp_replace(base, '([a-zçğıöşü])[^a-zçğıöşü\s]+(?=[a-zçğıöşü])', '\1', 'g'), allowed_re); -- s.ik.tir → siktir

  -- tek harflik ardışık parçaları birleştir: "a m k" → "amk"
  toks := regexp_split_to_array(t, ' ');
  foreach tok in array toks loop
    if length(tok) = 1 and prev_len = 1 then merged := merged || tok;
    else merged := merged || ' ' || tok;
    end if;
    prev_len := length(tok);
  end loop;
  merged := btrim(regexp_replace(merged, '(.)\1+', '\1', 'g'));

  if t ~ word_re or j ~ word_re or merged ~ word_re
     or t ~ exact_re or j ~ exact_re or merged ~ exact_re then
    return true;
  end if;
  -- uzun kökler: kelime içinde ya da bir kelimenin BAŞINDAN itibaren (en çok 5 parça) boşluksuz.
  -- Kelime ortasından başlayan birleşim sayılmaz ("eksik misin", "şarap istiyorum").
  if long_re is not null then
    n := coalesce(array_length(toks, 1), 0);
    for i in 1..n loop
      if toks[i] ~ long_re
         or regexp_replace(array_to_string(toks[i:least(n, i + 4)], ''), '(.)\1+', '\1', 'g') ~ ('^(' || long_re || ')') then
        return true;
      end if;
    end loop;
  end if;

  -- kısa parça birleştirme: "si ktir", "amı na", "oro spu"
  n := coalesce(array_length(toks, 1), 0);
  for i in 1..n loop
    chain := toks[i];
    for k in i + 1 .. least(n, i + 3) loop
      exit when length(toks[k - 1]) > 3 and length(toks[k]) > 3;
      chain := regexp_replace(chain || toks[k], '(.)\1+', '\1', 'g');
      if chain ~ chain_re then return true; end if;
    end loop;
  end loop;
  return false;
end; $$;

create or replace function public.has_banned_words(p_text text)
returns boolean
language sql
immutable
set search_path = public
as $$
  -- Türkçe (I→ı, İ→i) ve standart küçültme: ikisinden biri yakalarsa yasaklı
  select case
    when p_text is null or btrim(p_text) = '' then false
    else public.mod_check(lower(translate(p_text, 'Iİ', 'ıi'))) or public.mod_check(lower(p_text))
  end;
$$;

-- =========================================================
-- 2) Telefon numarası / bağlantı paylaşımı (istemcideki hasContactInfo ile aynı)
-- =========================================================
create or replace function public.has_contact_info(p_text text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  t text := lower(coalesce(p_text, ''));
  m text;
  d text;
  g text[];
begin
  if t ~ '(https?://|www\.|bit\.ly|(^|[^a-z0-9_])(t|wa)\.me($|[^a-z0-9_])|[a-z0-9-]+\.(com|net|org|io|app|xyz|link|site|info|biz|online|store|shop|club|live|page|dev|tr)($|[^a-z0-9_]))' then
    return true;
  end if;
  for m in select (regexp_matches(t, '\+?[0-9][0-9[:space:]().-]{8,}[0-9]', 'g'))[1] loop
    d := regexp_replace(m, '[^0-9]', '', 'g');
    if left(m, 1) = '+' and length(d) >= 10 then return true; end if;
    if d ~ '^(90|0)?5[0-9]{9}$' then
      g := regexp_split_to_array(btrim(regexp_replace(m, '[^0-9]+', ' ', 'g')), ' ');
      if g[1] in ('90', '0') then g := g[2:]; end if;
      -- "50 55 60 65 70 kg" gibi listeler numara değil: ilk grup en az 3 hane (ya da tek tek yazılmış rakamlar)
      if (array_length(g, 1) <= 5 and length(g[1]) >= 3)
         or (select bool_and(length(x) = 1) from unnest(g) x) then
        return true;
      end if;
    end if;
  end loop;
  return false;
end; $$;

-- Tek yerden: küfür ya da iletişim bilgisi varsa anlaşılır mesajla reddet
create or replace function public.mod_reject(p_text text, p_contact boolean default true)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if has_banned_words(p_text) then
    raise exception 'Uygunsuz içerik: küfür/müstehcen ifade kullanılamaz.';
  end if;
  if p_contact and has_contact_info(p_text) then
    raise exception 'Güvenliğin için telefon numarası, bağlantı veya site adresi paylaşamazsın.';
  end if;
end; $$;

create or replace function public.moderate_comment() returns trigger
language plpgsql set search_path = public as $$
begin perform mod_reject(new.body); return new; end; $$;

create or replace function public.moderate_post_comment() returns trigger
language plpgsql set search_path = public as $$
begin perform mod_reject(new.body); return new; end; $$;

create or replace function public.moderate_message() returns trigger
language plpgsql set search_path = public as $$
begin perform mod_reject(new.body); return new; end; $$;

create or replace function public.moderate_post() returns trigger
language plpgsql set search_path = public as $$
begin perform mod_reject(coalesce(new.body, '')); return new; end; $$;

create or replace function public.moderate_program() returns trigger
language plpgsql set search_path = public as $$
begin
  perform mod_reject(coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.template::text, ''));
  return new;
end; $$;

create or replace function public.moderate_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  -- kullanıcı adında rakam serisi olabilir (sporcu_05…): iletişim denetimi yalnız ad + hakkında
  perform mod_reject(coalesce(new.username, ''), false);
  perform mod_reject(coalesce(new.display_name, '') || ' ' || coalesce(new.bio, ''));
  return new;
end; $$;

create or replace function public.moderate_event() returns trigger
language plpgsql set search_path = public as $$
begin
  perform mod_reject(coalesce(new.title, ''));
  perform mod_reject(coalesce(new.description, ''));
  perform mod_reject(coalesce(new.place_name, ''));
  return new;
end; $$;

create or replace function public.moderate_challenge() returns trigger
language plpgsql set search_path = public as $$
begin
  perform mod_reject(coalesce(new.title, ''));
  perform mod_reject(coalesce(new.description, ''));
  return new;
end; $$;

-- Mesaj düzenleme yok ama olursa da denetlensin
drop trigger if exists trg_moderate_message on public.messages;
create trigger trg_moderate_message before insert or update of body on public.messages
  for each row execute function public.moderate_message();

-- =========================================================
-- 3) Gizli hesap + takip isteği
-- =========================================================
alter table public.profiles add column if not exists is_private boolean not null default false;

-- İki kişi arasında (herhangi bir yönde) engel var mı? (user_blocks RLS'i yalnız kendi engellerini gösterir)
create or replace function public.blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_blocks
                 where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- Görüntüleyen, sahibin içeriğini görebilir mi? (kendisi / hesap açık / takipçi / yönetici)
create or replace function public.can_view_user(p_viewer uuid, p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_viewer = p_owner
      or not coalesce((select is_private from profiles where id = p_owner), false)
      or exists (select 1 from follows where follower_id = p_viewer and following_id = p_owner)
      or public.is_admin(p_viewer);
$$;

create table if not exists public.follow_requests (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, target_id),
  check (requester_id <> target_id)
);
alter table public.follow_requests enable row level security;
drop policy if exists fr_select on public.follow_requests;
create policy fr_select on public.follow_requests for select to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());
drop policy if exists fr_delete on public.follow_requests;
create policy fr_delete on public.follow_requests for delete to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());
-- Ekleme yalnız follow_user() ile
revoke insert, update on public.follow_requests from authenticated, anon;

-- Doğrudan takip: yalnız açık hesaba ve engel yoksa (gizli hesaba follow_user/istek akışı)
drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows for insert to authenticated
  with check (
    follower_id = auth.uid() and following_id <> auth.uid()
    and not coalesce((select is_private from public.profiles where id = following_id), false)
    and not public.blocked_between(auth.uid(), following_id)
  );

create or replace function public.follow_user(p_target uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); priv boolean; fname text; n int;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_target = me then raise exception 'Kendini takip edemezsin.'; end if;
  if blocked_between(me, p_target) then raise exception 'Bu kullanıcıyı takip edemezsin.'; end if;
  -- satırı paylaşımlı kilitle: aynı anda gizliliğe geçilirse sırayla işlenir
  select is_private into priv from profiles where id = p_target for share;
  if not found then raise exception 'Kullanıcı bulunamadı.'; end if;
  if exists (select 1 from follows where follower_id = me and following_id = p_target) then
    return json_build_object('status', 'following');
  end if;
  if priv then
    perform assert_rate('follow_requests', 'requester_id', me, 30, 60);
    insert into follow_requests (requester_id, target_id) values (me, p_target) on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      select coalesce(display_name, username, 'Bir sporcu') into fname from profiles where id = me;
      perform notify_user(p_target, 'Takip isteği 👤', fname || ' seni takip etmek istiyor',
                          jsonb_build_object('type', 'follow_request', 'user_id', me));
    end if;
    return json_build_object('status', 'requested');
  end if;
  insert into follows (follower_id, following_id) values (me, p_target) on conflict do nothing;
  return json_build_object('status', 'following');
end; $$;

create or replace function public.respond_follow_request(p_requester uuid, p_accept boolean)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); mname text;
begin
  if me is null then raise exception 'auth required'; end if;
  delete from follow_requests where requester_id = p_requester and target_id = me;
  if not found then raise exception 'Takip isteği bulunamadı.'; end if;
  if p_accept and not blocked_between(me, p_requester) then
    insert into follows (follower_id, following_id) values (p_requester, me) on conflict do nothing;
    select coalesce(display_name, username, 'Bir sporcu') into mname from profiles where id = me;
    perform notify_user(p_requester, 'Takip isteğin kabul edildi ✅', mname || ' takip isteğini kabul etti',
                        jsonb_build_object('type', 'follow', 'user_id', me));
  end if;
  return json_build_object('ok', true);
end; $$;

-- Hesap açılınca bekleyen istekler otomatik kabul
create or replace function public.on_profile_privacy_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.is_private and not new.is_private then
    insert into follows (follower_id, following_id)
      select requester_id, target_id from follow_requests
       where target_id = new.id and not blocked_between(requester_id, target_id)
      on conflict do nothing;
    delete from follow_requests where target_id = new.id;
  end if;
  return new;
end; $$;
drop trigger if exists trg_profile_privacy on public.profiles;
create trigger trg_profile_privacy after update of is_private on public.profiles
  for each row execute function public.on_profile_privacy_change();

create or replace function public.get_follow_info(p_user_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'followers',    (select count(*) from follows where following_id = p_user_id),
    'following',    (select count(*) from follows where follower_id  = p_user_id),
    'is_following', exists (select 1 from follows where follower_id = auth.uid() and following_id = p_user_id),
    'requested',    exists (select 1 from follow_requests where requester_id = auth.uid() and target_id = p_user_id),
    'is_private',   coalesce((select is_private from profiles where id = p_user_id), false),
    'can_view',     public.can_view_user(auth.uid(), p_user_id)
  );
$$;

-- Gizli hesabın gönderileri ve programları yalnız takipçilere
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select to authenticated using (
  (hidden_at is null or author_id = auth.uid() or public.is_admin(auth.uid()))
  and not public.blocked_between(auth.uid(), author_id)
  and public.can_view_user(auth.uid(), author_id)
);
drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select to authenticated using (
  owner_id = auth.uid() or (visibility = 'public' and public.can_view_user(auth.uid(), owner_id))
);

create or replace function public.workout_heatmap(p_user_id uuid, p_days integer default 371)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('d', to_char(d, 'YYYY-MM-DD'), 'c', c) order by d), '[]'::json)
  from (
    select performed_at::date as d, count(*)::int as c
    from workout_logs
    where user_id = p_user_id
      and public.can_view_user(auth.uid(), p_user_id)
      and performed_at::date > current_date - greatest(p_days, 1)
    group by performed_at::date
  ) t;
$$;

-- =========================================================
-- 4) Yorum: yanıt, beğeni, düzenleme; gönderi düzenleme
-- =========================================================
alter table public.post_comments add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;
alter table public.comments add column if not exists edited_at timestamptz;
alter table public.post_comments add column if not exists edited_at timestamptz;
alter table public.posts add column if not exists edited_at timestamptz;
create index if not exists comments_parent_idx on public.comments(parent_id);
create index if not exists post_comments_parent_idx on public.post_comments(parent_id);

-- Düzenleme yalnız METİN: sahibi gizlenmeyi kaldıramaz, yorumu başka yere taşıyamaz
revoke update on public.comments, public.post_comments, public.posts from authenticated;
grant update (body) on public.comments, public.post_comments, public.posts to authenticated;

drop policy if exists post_comments_update_own on public.post_comments;
create policy post_comments_update_own on public.post_comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create or replace function public.mark_edited() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.body is distinct from old.body then new.edited_at := now(); end if;
  return new;
end; $$;
drop trigger if exists trg_comments_edited on public.comments;
create trigger trg_comments_edited before update on public.comments for each row execute function public.mark_edited();
drop trigger if exists trg_post_comments_edited on public.post_comments;
create trigger trg_post_comments_edited before update on public.post_comments for each row execute function public.mark_edited();
drop trigger if exists trg_posts_edited on public.posts;
create trigger trg_posts_edited before update on public.posts for each row execute function public.mark_edited();

-- Yanıt: üst yorum aynı program/gönderide olmalı; yanıta yanıt üst yoruma bağlanır (tek seviye)
create or replace function public.comment_parent_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.parent_id is null then return new; end if;
  if tg_table_name = 'comments' then
    select id, parent_id, program_id as target into p from comments where id = new.parent_id;
    if not found or p.target <> new.program_id then raise exception 'Yanıtlanan yorum bulunamadı.'; end if;
  else
    select id, parent_id, post_id as target into p from post_comments where id = new.parent_id;
    if not found or p.target <> new.post_id then raise exception 'Yanıtlanan yorum bulunamadı.'; end if;
  end if;
  if p.parent_id is not null then new.parent_id := p.parent_id; end if;
  return new;
end; $$;
drop trigger if exists trg_comments_parent on public.comments;
create trigger trg_comments_parent before insert on public.comments for each row execute function public.comment_parent_guard();
drop trigger if exists trg_post_comments_parent on public.post_comments;
create trigger trg_post_comments_parent before insert on public.post_comments for each row execute function public.comment_parent_guard();

-- Yanıt bildirimi (yanıtlanan yorumun sahibine)
create or replace function public.comment_reply_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare parent_author uuid; rname text; data jsonb;
begin
  if new.parent_id is null then return new; end if;
  if tg_table_name = 'comments' then
    select author_id into parent_author from comments where id = new.parent_id;
    data := jsonb_build_object('type', 'comment', 'program_id', new.program_id);
  else
    select author_id into parent_author from post_comments where id = new.parent_id;
    data := jsonb_build_object('type', 'post_comment', 'post_id', new.post_id);
  end if;
  if parent_author is null or parent_author = new.author_id then return new; end if;
  select coalesce(display_name, username, 'Biri') into rname from profiles where id = new.author_id;
  perform notify_user(parent_author, 'Yorumuna yanıt 💬', rname || ' yorumuna yanıt verdi', data);
  return new;
end; $$;
drop trigger if exists trg_comments_reply_notify on public.comments;
create trigger trg_comments_reply_notify after insert on public.comments for each row execute function public.comment_reply_notify();
drop trigger if exists trg_post_comments_reply_notify on public.post_comments;
create trigger trg_post_comments_reply_notify after insert on public.post_comments for each row execute function public.comment_reply_notify();

-- Program yorumlarında da engellenen kişinin yorumu görünmesin (gönderi yorumlarıyla aynı)
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated using (
  exists (select 1 from programs p where p.id = comments.program_id)   -- programs RLS: açık/sahibi/gizli hesap
  and (hidden_at is null or author_id = auth.uid() or public.is_admin(auth.uid()))
  and not public.blocked_between(auth.uid(), author_id)
);

-- Yorum beğenileri
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_likes enable row level security;
alter table public.post_comment_likes enable row level security;
drop policy if exists cl_select on public.comment_likes;
create policy cl_select on public.comment_likes for select to authenticated using (true);
drop policy if exists cl_insert on public.comment_likes;
create policy cl_insert on public.comment_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from comments c where c.id = comment_id));
drop policy if exists cl_delete on public.comment_likes;
create policy cl_delete on public.comment_likes for delete to authenticated using (user_id = auth.uid());
drop policy if exists pcl_select on public.post_comment_likes;
create policy pcl_select on public.post_comment_likes for select to authenticated using (true);
drop policy if exists pcl_insert on public.post_comment_likes;
create policy pcl_insert on public.post_comment_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from post_comments c where c.id = comment_id));
drop policy if exists pcl_delete on public.post_comment_likes;
create policy pcl_delete on public.post_comment_likes for delete to authenticated using (user_id = auth.uid());
revoke update on public.comment_likes, public.post_comment_likes from authenticated, anon;

create or replace function public.rl_comment_likes() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform assert_rate(tg_table_name, 'user_id', new.user_id, 120, 60); return new; end; $$;
drop trigger if exists trg_rl_comment_likes on public.comment_likes;
create trigger trg_rl_comment_likes before insert on public.comment_likes for each row execute function public.rl_comment_likes();
drop trigger if exists trg_rl_post_comment_likes on public.post_comment_likes;
create trigger trg_rl_post_comment_likes before insert on public.post_comment_likes for each row execute function public.rl_comment_likes();

-- =========================================================
-- 5) Akış: hashtag + düzenlendi + gizli hesap; program keşfi: spor filtresi
-- =========================================================
drop function if exists public.feed_posts(integer, uuid);
create or replace function public.feed_posts(p_limit integer default 50, p_author uuid default null, p_tag text default null)
returns json language sql stable security definer set search_path = public as $$
  with tag as (select nullif(lower(regexp_replace(coalesce(p_tag, ''), '[^[:alnum:]_]', '', 'g')), '') as v)
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      p.id, p.body, p.image_url, p.created_at, p.edited_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      (select count(*) from post_comments pc where pc.post_id = p.id and pc.hidden_at is null)::int as comment_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p, tag
    where (p_author is null or p.author_id = p_author)
      and (tag.v is null or lower(p.body) ~ ('(^|[^[:alnum:]_])#' || tag.v || '($|[^[:alnum:]_])'))
      and (p.hidden_at is null or p.author_id = auth.uid() or public.is_admin(auth.uid()))
      and not public.blocked_between(auth.uid(), p.author_id)
      and public.can_view_user(auth.uid(), p.author_id)
    order by p.created_at desc
    limit greatest(p_limit, 1)
  ) t;
$$;

create or replace function public.post_detail(p_post_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select row_to_json(t) from (
    select
      p.id, p.body, p.image_url, p.created_at, p.edited_at, p.author_id, p.hidden_at,
      (select count(*) from post_reactions r where r.post_id = p.id)::int as like_count,
      (select count(*) from post_comments pc where pc.post_id = p.id and pc.hidden_at is null)::int as comment_count,
      exists (select 1 from post_reactions r where r.post_id = p.id and r.user_id = auth.uid()) as liked,
      (p.author_id = auth.uid()) as is_mine,
      (select row_to_json(a) from (select username, display_name, avatar_url from profiles where id = p.author_id) a) as author
    from posts p
    where p.id = p_post_id
      and (p.hidden_at is null or p.author_id = auth.uid() or public.is_admin(auth.uid()))
      and not public.blocked_between(auth.uid(), p.author_id)
      and public.can_view_user(auth.uid(), p.author_id)
  ) t;
$$;

drop function if exists public.discover_programs(text, integer, integer);
create or replace function public.discover_programs(
  p_sort text default 'recent', p_period_days integer default 7, p_limit integer default 50, p_sport_id text default null
)
returns json language sql stable security definer set search_path = public as $$
  with base as (
    select
      p.id, p.title, p.description, p.owner_id, p.visibility, p.template, p.updated_at, p.sport_id,
      coalesce(lc.cnt, 0)  as like_count,
      coalesce(sc.cnt, 0)  as save_count,
      coalesce(cc.cnt, 0)  as comment_count,
      coalesce(rlc.cnt, 0) + coalesce(rsc.cnt, 0) as hit_score
    from programs p
    left join (select program_id, count(*) cnt from program_likes group by program_id) lc  on lc.program_id  = p.id
    left join (select program_id, count(*) cnt from program_saves group by program_id) sc  on sc.program_id  = p.id
    left join (
      select program_id, count(*) cnt from comments where hidden_at is null group by program_id
    ) cc on cc.program_id = p.id
    left join (
      select program_id, count(*) cnt from program_likes
      where created_at > now() - make_interval(days => greatest(p_period_days, 1)) group by program_id
    ) rlc on rlc.program_id = p.id
    left join (
      select program_id, count(*) cnt from program_saves
      where created_at > now() - make_interval(days => greatest(p_period_days, 1)) group by program_id
    ) rsc on rsc.program_id = p.id
    where p.visibility = 'public'
      and (p_sport_id is null or p.sport_id = p_sport_id)
      and not public.blocked_between(auth.uid(), p.owner_id)
      and public.can_view_user(auth.uid(), p.owner_id)
  ),
  filtered as (
    select * from base
    where case when p_sort = 'hit' then hit_score > 0 else true end
  ),
  ordered as (
    select * from filtered
    order by
      case when p_sort = 'liked' then like_count end desc nulls last,
      case when p_sort = 'saved' then save_count end desc nulls last,
      case when p_sort = 'hit'   then hit_score  end desc nulls last,
      updated_at desc
    limit greatest(p_limit, 1)
  )
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select
      o.id, o.title, o.description, o.owner_id, o.visibility, o.template, o.updated_at, o.sport_id,
      o.like_count, o.save_count, o.comment_count, o.hit_score,
      (select row_to_json(pr) from (
         select username, display_name, avatar_url from profiles where id = o.owner_id
       ) pr) as owner,
      (select row_to_json(sp) from (
         select name, icon from sports where id = o.sport_id
       ) sp) as sport
    from ordered o
  ) t;
$$;

-- =========================================================
-- 6) Planlı etkinlik: geçmiş saat yok, sahibi çıkarabilir, engel = etkinlikten düş
-- =========================================================
create or replace function public.create_event(
  p_sport_id text, p_title text, p_description text, p_lat double precision, p_lng double precision,
  p_place_name text, p_province text, p_district text, p_starts_at timestamp with time zone, p_capacity integer default null
)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid; loc geography;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_starts_at < now() + interval '5 minutes' then
    raise exception 'Geçmiş ya da şu anki bir saat seçilemez. İleri bir saat seç.';
  end if;
  if p_capacity is not null and (p_capacity < 2 or p_capacity > 500) then
    raise exception 'Kişi sayısı 2 ile 500 arasında olmalı.';
  end if;
  loc := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  insert into events (host_id, sport_id, title, description, location, place_name, province, district, starts_at, capacity)
    values (me, p_sport_id, p_title, nullif(trim(p_description),''), loc, nullif(trim(p_place_name),''), p_province, p_district, p_starts_at, p_capacity)
    returning id into new_id;

  insert into event_participants (event_id, user_id) values (new_id, me)
    on conflict do nothing;

  return json_build_object('id', new_id);
end; $$;

-- Etkinlikten çıkarılanlar (tekrar katılamaz). Yalnız sunucu fonksiyonları kullanır.
create table if not exists public.event_bans (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_bans enable row level security;
revoke all on public.event_bans from authenticated, anon;

create or replace function public.remove_event_participant(p_event_id uuid, p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ev record;
begin
  if me is null then raise exception 'auth required'; end if;
  select id, host_id, title into ev from events where id = p_event_id for update;  -- join_event ile sıralı
  if not found or ev.host_id <> me then raise exception 'Yalnızca etkinlik sahibi katılımcı çıkarabilir.'; end if;
  if p_user_id = me then raise exception 'Kendini etkinlikten çıkaramazsın.'; end if;
  delete from event_participants where event_id = p_event_id and user_id = p_user_id;
  if not found then raise exception 'Bu kişi etkinlikte değil.'; end if;
  insert into event_bans (event_id, user_id) values (p_event_id, p_user_id) on conflict do nothing;
  perform notify_user(p_user_id, 'Etkinlikten çıkarıldın',
                      '"' || ev.title || '" etkinliğinin sahibi seni katılımcılardan çıkardı.',
                      jsonb_build_object('type', 'event', 'event_id', p_event_id));
  return json_build_object('ok', true);
end; $$;

create or replace function public.join_event(p_event_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ev record; cnt int; mename text;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into ev from events where id = p_event_id for update;
  if not found then raise exception 'Etkinlik bulunamadı.'; end if;
  if ev.status <> 'open' then raise exception 'Etkinlik kapalı.'; end if;
  if ev.starts_at < now() - interval '2 hours' then raise exception 'Etkinlik sona erdi.'; end if;
  -- engel eklenmesiyle aynı anda olmasın (on_block_leave_events ile aynı çift kilidi)
  perform pg_advisory_xact_lock(hashtextextended('block:' || least(me, ev.host_id)::text || greatest(me, ev.host_id)::text, 0));
  if blocked_between(me, ev.host_id)
     or exists (select 1 from event_bans where event_id = p_event_id and user_id = me) then
    raise exception 'Bu etkinliğe katılamazsın.';
  end if;

  if ev.capacity is not null then
    select count(*) into cnt from event_participants where event_id = p_event_id;
    if cnt >= ev.capacity and not exists (select 1 from event_participants where event_id = p_event_id and user_id = me) then
      raise exception 'Kontenjan dolu.';
    end if;
  end if;

  insert into event_participants (event_id, user_id) values (p_event_id, me)
    on conflict do nothing;

  if ev.host_id <> me then
    select coalesce(display_name, username, 'Bir sporcu') into mename from profiles where id = me;
    perform notify_user(ev.host_id, 'Etkinliğine katılım',
      mename || ' "' || ev.title || '" etkinliğine katıldı.',
      jsonb_build_object('type','event','event_id',p_event_id));
  end if;

  return json_build_object('joined', true);
end; $$;

-- Engellenen (ya da engelleyen) taraf, ötekinin etkinliğinden düşer
create or replace function public.on_block_leave_events() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('block:' || least(new.blocker_id, new.blocked_id)::text || greatest(new.blocker_id, new.blocked_id)::text, 0));
  -- bekleyen takip istekleri de düşer
  delete from follow_requests
   where (requester_id = new.blocker_id and target_id = new.blocked_id)
      or (requester_id = new.blocked_id and target_id = new.blocker_id);
  delete from event_participants ep using events e
   where ep.event_id = e.id
     and ((e.host_id = new.blocker_id and ep.user_id = new.blocked_id)
       or (e.host_id = new.blocked_id and ep.user_id = new.blocker_id));
  return new;
end; $$;
drop trigger if exists trg_block_leave_events on public.user_blocks;
create trigger trg_block_leave_events after insert on public.user_blocks
  for each row execute function public.on_block_leave_events();

create or replace function public.event_detail(p_event_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  return (
    select row_to_json(t) from (
      select
        e.id, e.title, e.description, e.place_name, e.province, e.district,
        e.starts_at, e.capacity, e.host_id, e.status, e.sport_id,
        ST_Y(e.location::geometry) as lat, ST_X(e.location::geometry) as lng,
        (select count(*) from event_participants ep where ep.event_id = e.id) as participant_count,
        exists (select 1 from event_participants ep where ep.event_id = e.id and ep.user_id = me) as joined,
        (e.host_id = me) as is_host,
        exists (select 1 from event_bans b where b.event_id = e.id and b.user_id = me) as banned,
        (select row_to_json(h) from (select id, username, display_name, avatar_url from profiles where id = e.host_id) h) as host,
        (select row_to_json(sp) from (select name, icon from sports where id = e.sport_id) sp) as sport,
        (select coalesce(json_agg(row_to_json(p)), '[]'::json) from (
           select pr.id, pr.username, pr.display_name, pr.avatar_url
           from event_participants ep join profiles pr on pr.id = ep.user_id
           where ep.event_id = e.id order by ep.created_at asc limit 100
         ) p) as participants
      from events e
      where e.id = p_event_id
        and (e.host_id = me or not public.blocked_between(me, e.host_id))
    ) t
  );
end; $$;

-- =========================================================
-- 7) Eşleşme geçmişi (canlı + önceki)
-- =========================================================
create or replace function public.my_match_history(p_limit integer default 100)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      m.id as match_id,
      (case when m.user_a = auth.uid() then m.user_b else m.user_a end) as partner_id,
      p.username, p.display_name, p.avatar_url,
      sp.name as sport_name, sp.icon as sport_icon,
      m.distance_m, m.status, m.conversation_id, m.created_at,
      (case when m.user_a = auth.uid() then m.a_confirmed else m.b_confirmed end) as i_confirmed
    from matches m
    join profiles p on p.id = (case when m.user_a = auth.uid() then m.user_b else m.user_a end)
    left join sports sp on sp.id = m.sport_id
    where (m.user_a = auth.uid() or m.user_b = auth.uid())
      and m.origin = 'match'
      and not public.blocked_between(auth.uid(), p.id)
    order by m.created_at desc
    limit greatest(least(p_limit, 300), 1)
  ) t;
$$;

-- =========================================================
-- 8) Yetkiler (0040'tan beri yeni fonksiyonlar varsayılan olarak kimseye açık değil)
-- =========================================================
revoke execute on function public.has_contact_info(text), public.mod_reject(text, boolean),
  public.blocked_between(uuid, uuid), public.can_view_user(uuid, uuid) from public, anon;
grant execute on function public.has_contact_info(text), public.mod_reject(text, boolean),
  public.blocked_between(uuid, uuid), public.can_view_user(uuid, uuid) to authenticated, service_role;

revoke execute on function public.follow_user(uuid), public.respond_follow_request(uuid, boolean),
  public.feed_posts(integer, uuid, text), public.post_detail(uuid),
  public.discover_programs(text, integer, integer, text), public.remove_event_participant(uuid, uuid),
  public.my_match_history(integer), public.get_follow_info(uuid), public.workout_heatmap(uuid, integer),
  public.create_event(text, text, text, double precision, double precision, text, text, text, timestamp with time zone, integer),
  public.join_event(uuid), public.event_detail(uuid) from public, anon;
grant execute on function public.follow_user(uuid), public.respond_follow_request(uuid, boolean),
  public.feed_posts(integer, uuid, text), public.post_detail(uuid),
  public.discover_programs(text, integer, integer, text), public.remove_event_participant(uuid, uuid),
  public.my_match_history(integer), public.get_follow_info(uuid), public.workout_heatmap(uuid, integer),
  public.create_event(text, text, text, double precision, double precision, text, text, text, timestamp with time zone, integer),
  public.join_event(uuid), public.event_detail(uuid) to authenticated, service_role;

-- Trigger fonksiyonları istemciden çağrılamaz
revoke execute on function public.on_profile_privacy_change(), public.mark_edited(), public.comment_parent_guard(),
  public.comment_reply_notify(), public.rl_comment_likes(), public.on_block_leave_events()
  from public, anon, authenticated;

revoke all on public.follow_requests, public.comment_likes, public.post_comment_likes from anon;

-- =========================================================
-- 9) Profil istatistiği: alınan beğeniler (gönderi + program + yorum beğenileri, kendi beğenisi hariç)
-- =========================================================
create or replace function public.get_profile_stats(p_user_id uuid default auth.uid())
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_programs int; v_workouts int; v_matches int; v_comments int; v_likes int;
  v_streak int := 0; v_check date := current_date; v_created timestamptz;
begin
  select count(*) into v_programs from programs     where owner_id  = p_user_id;
  select count(*) into v_workouts from workout_logs where user_id   = p_user_id;
  select count(*) into v_comments from comments     where author_id = p_user_id;
  select count(*) into v_matches  from matches
    where (user_a = p_user_id or user_b = p_user_id) and status = 'confirmed';
  select
      (select count(*) from post_reactions r join posts p on p.id = r.post_id
        where p.author_id = p_user_id and r.user_id <> p_user_id)
    + (select count(*) from program_likes l join programs g on g.id = l.program_id
        where g.owner_id = p_user_id and l.user_id <> p_user_id)
    + (select count(*) from comment_likes l join comments c on c.id = l.comment_id
        where c.author_id = p_user_id and l.user_id <> p_user_id)
    + (select count(*) from post_comment_likes l join post_comments c on c.id = l.comment_id
        where c.author_id = p_user_id and l.user_id <> p_user_id)
    into v_likes;

  select created_at into v_created from profiles where id = p_user_id;

  if not exists (select 1 from workout_logs where user_id = p_user_id and performed_at::date = current_date) then
    v_check := current_date - 1;
  end if;
  loop
    if exists (select 1 from workout_logs where user_id = p_user_id and performed_at::date = v_check) then
      v_streak := v_streak + 1; v_check := v_check - 1;
    else exit; end if;
  end loop;

  return json_build_object('programs', v_programs, 'workouts', v_workouts, 'matches', v_matches,
    'comments', v_comments, 'likes', v_likes, 'streak', v_streak, 'member_since', v_created);
end; $$;
revoke execute on function public.get_profile_stats(uuid) from public, anon;
grant execute on function public.get_profile_stats(uuid) to authenticated, service_role;
