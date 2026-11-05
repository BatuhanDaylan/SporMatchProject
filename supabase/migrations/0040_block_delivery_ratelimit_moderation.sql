-- 0040: Engelleme sonrası mesaj, iletildi tiki, anlaşılır hız sınırı mesajları, güçlendirilmiş küfür filtresi.
--  1) Engel (iki yönde de) varsa mesaj gönderilemez. İstemci read_at / delivered_at'i kendisi dolduramaz.
--  2) messages.delivered_at: karşı tarafa bildirim (push) gönderildiğinde dolar → ✓✓ (gri). Okununca mavi ✓✓.
--  3) list_conversations: son mesajın iletilme bilgisi (last_delivered).
--  4) assert_rate: tabloya özel, anlaşılır Türkçe mesaj ("Çok fazla yorum attın…").
--  5) has_banned_words → mod_check: aksan/benzer harf/rakam kaçışı, harf aralama (a.m.k, s.ik.tir, si ktir), masum kelime
--     istisnaları, hakaret listesi, yıldızlı yazım (f*ck). Listeler src/lib/moderation.ts'den ÜRETİLDİ —
--     elle değiştirme, oradan üret.
--  6) Pro anahtarı: pro_limits_enforced() = false → Pro satışa çıkana kadar tüm Pro özellikleri herkese açık.
--     Eşleşme (günde 3) ve planlı etkinlik (aynı anda 3 aktif) ücretsiz sınırları yalnız anahtar açıkken.
--  7) Güvenlik sertleştirmesi: giriş yapmamış (anon) hiçbir fonksiyonu çağıramaz; hız sınırı fonksiyonu
--     istemciye kapalı; fotoğraf bucket'larına boyut/tür sınırı; eşleşme oturumu yalnız resmi akışla oluşur.
-- Idempotent.

-- =========================================================
-- 1) Engel varken mesaj yok + sahte okundu/iletildi engeli
-- =========================================================
create or replace function public.messages_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  new.read_at := null;
  new.delivered_at := null;

  select case when m.user_a = new.sender_id then m.user_b else m.user_a end into other
    from conversations c join matches m on m.id = c.match_id
   where c.id = new.conversation_id;

  if other is not null then
    if exists (select 1 from user_blocks where blocker_id = new.sender_id and blocked_id = other) then
      raise exception 'Bu kişiyi engelledin. Mesaj göndermek için önce engeli kaldır.' using errcode = '42501';
    end if;
    -- Karşı taraf beni engellediyse bunu açık etmeden reddet
    if exists (select 1 from user_blocks where blocker_id = other and blocked_id = new.sender_id) then
      raise exception 'Bu kişiye mesaj gönderilemiyor.' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;

alter table public.messages add column if not exists delivered_at timestamptz;

-- Okundu (read_at) yalnız ALICI tarafından işaretlenebilir; gönderen kendi mesajını "okundu" yapıp
-- karşı tarafın okunmamış sayacını oynatamasın. (Sütun yetkisi 0039'da yalnız read_at.)
drop policy if exists "messages_update_participant" on public.messages;
create policy "messages_update_participant" on public.messages
  for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = messages.conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  )
  with check (sender_id <> auth.uid());

drop trigger if exists trg_messages_guard on public.messages;
create trigger trg_messages_guard before insert on public.messages
  for each row execute function public.messages_guard();

-- =========================================================
-- 2) Yeni mesaj → bildirim; bildirim gönderildiyse iletildi işaretle
-- =========================================================
create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare recipient uuid; sender_name text;
begin
  select (case when m.user_a = new.sender_id then m.user_b else m.user_a end)
    into recipient
    from conversations c join matches m on m.id = c.match_id
   where c.id = new.conversation_id;
  if recipient is null then return new; end if;
  select coalesce(display_name, username, 'Yeni mesaj') into sender_name from profiles where id = new.sender_id;
  perform notify_user(recipient, sender_name, left(new.body, 120),
                      jsonb_build_object('type', 'chat', 'conversation_id', new.conversation_id));
  -- Alıcının kayıtlı bir bildirim cihazı varsa push yola çıktı → iletildi (✓✓)
  -- Son 60 günde uygulamayı açıp jetonunu tazelemiş bir cihaz yoksa jeton ölü sayılır (✓ kalır)
  if exists (select 1 from push_tokens where user_id = recipient and updated_at > now() - interval '60 days') then
    update messages set delivered_at = now() where id = new.id;
  end if;
  return new;
end; $$;

-- =========================================================
-- 3) list_conversations — + last_delivered
-- =========================================================
create or replace function public.list_conversations() returns json
language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.last_at desc nulls last), '[]'::json)
  from (
    select
      c.id as conversation_id,
      c.match_id,
      (case when m.user_a = auth.uid() then m.user_b else m.user_a end) as partner_id,
      p.username as partner_username,
      p.display_name as partner_name,
      p.avatar_url as partner_avatar,
      lm.body as last_message,
      lm.created_at as last_at,
      (lm.sender_id = auth.uid()) as last_from_me,
      (lm.read_at is not null) as last_read,
      (lm.delivered_at is not null or lm.read_at is not null) as last_delivered,
      (select count(*) from messages um
        where um.conversation_id = c.id and um.sender_id <> auth.uid() and um.read_at is null
          and um.created_at > coalesce(s.cleared_at, '-infinity')) as unread
    from conversations c
    join matches m on m.id = c.match_id
    join profiles p on p.id = (case when m.user_a = auth.uid() then m.user_b else m.user_a end)
    left join conversation_user_state s on s.conversation_id = c.id and s.user_id = auth.uid()
    left join lateral (
      select body, created_at, sender_id, read_at, delivered_at from messages mm
       where mm.conversation_id = c.id and mm.created_at > coalesce(s.cleared_at, '-infinity')
       order by created_at desc limit 1
    ) lm on true
    where (m.user_a = auth.uid() or m.user_b = auth.uid())
      and (
        s.cleared_at is null
        or lm.created_at is not null
        or exists (select 1 from matches mm2 where mm2.conversation_id = c.id and mm2.created_at > s.cleared_at)
      )
  ) t;
$$;

-- =========================================================
-- 4) Hız sınırı: tabloya özel anlaşılır mesaj
-- =========================================================
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
    raise exception '%', case p_table
      when 'comments'       then 'Çok fazla yorum attın. Bir dakika bekleyip tekrar dene.'
      when 'post_comments'  then 'Çok fazla yorum attın. Bir dakika bekleyip tekrar dene.'
      when 'messages'       then 'Çok hızlı mesaj gönderiyorsun. Biraz bekleyip tekrar dene.'
      when 'reports'        then 'Çok fazla şikayet gönderdin. Daha sonra tekrar dene.'
      when 'posts'          then 'Çok fazla gönderi paylaştın. Daha sonra tekrar dene.'
      when 'match_sessions' then 'Çok sık eşleşme başlattın. Biraz bekleyip tekrar dene.'
      when 'follows'        then 'Çok hızlı takip ediyorsun. Biraz bekleyip tekrar dene.'
      when 'events'         then 'Çok fazla etkinlik oluşturdun. Daha sonra tekrar dene.'
      when 'challenges'     then 'Çok fazla meydan okuma oluşturdun. Daha sonra tekrar dene.'
      else 'Çok hızlısın. Biraz bekleyip tekrar dene.'
    end using errcode = '55000';
  end if;
end; $$;

-- =========================================================
-- 5) Küfür / hakaret filtresi
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
    'sıçayım','sıçarım','sıçtığım','ağzına sıç','itoğlu','fuck','shit','bullshit','dipshit','horseshit',
    'apeshit','bitch','asshole','arsehole','assmunch','bastard','dick','pussy','porn','whore','slut',
    'nigger','nigga','faggot','motherf','retard','wank','chink','tranny','cocksucker','blowjob',
    'blow job','dildo','jackass','dumbass','phuck','phuk','fvck','prick','bollocks','skank','douche',
    'jerkoff','jerk off','jack off','cumshot','handjob','hand job','rimjob','rimming','hentai',
    'kill yourself','rapist','raping','pedophile','paedophile','anilingus','cunnilingus','fellatio',
    'bukkake','bulldyke','butthole','camwhore','camslut','circlejerk','clit','creampie','daterape',
    'deepthroat','deep throat','doggystyle','doggy style','femdom','fingerbang','fisting','footjob',
    'fudgepacker','gangbang','gang bang','goatse','jizz','nympho','poontang','queef','schlong','shemale',
    'sodomi','sodomy','splooge','strapon','threesome','titties','tosser','raghead','towelhead','wetback',
    'beaner','beastiality','bestiality'
  ];
  insults text[] := array[
    'salak','aptal','ahmak','embesil','beyinsiz','namussuz','haysiyetsiz','şıllık','sıllık','gerzek',
    'dangalak','gerizekalı','gerizekali','gerızekalı','geri zekalı','geri zekali','andaval','angut',
    'dallama','lavuk','it oğlu it','mal mısın','mal misin','cibiliyetsiz','cibilliyetsiz','ebleh',
    'geber'
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
    'yaraq','malsın','malsin','seks','sexs','sex','nude','nudes','cock','cocks','cunt','cunts','twat',
    'kike','spic','fuk','fck','fuq','stfu','sht','btch','arse','milf','kys','rape','fag','fags','bdsm',
    'orgy','piss','smut','tits','titty','boob','boobs','boner','paki','gook','cumming'
  ];
  skip text[] := array[
    'yarak','kaltak','kaltağ','ipne','oçocu','ococu','göt','clit','amı','dallama','geber','angut'
  ];
  allowed text[] := array[
    'sikke','siklon','siklamen','siklus','siklotron','sikatif','sikayet','sikh','götür','shiitake',
    'dickens','dickinson','saksofon','saksafon','clitheroe','geberit'
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
  if long_re is not null and replace(t, ' ', '') ~ long_re then return true; end if;

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
-- 6) Pro: tek anahtar. Pro satışa çıkana kadar TÜM Pro özellikleri herkese açık.
--    Pro'ya çıkınca: pro_limits_enforced() → true (ve src/constants/pro.ts PRO_ENFORCED = true).
-- =========================================================
create or replace function public.pro_limits_enforced() returns boolean
language sql immutable as $$ select false $$;

create or replace function public.user_is_pro(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select pro_until is not null and pro_until > now() from profiles where id = p_user), false);
$$;
-- Yalnız sunucu içinde (definer fonksiyon/trigger) kullanılır; istemci başkasının Pro durumunu sorgulayamasın.
revoke all on function public.user_is_pro(uuid) from public, anon, authenticated;

-- Eşleşme: ücretsiz katmanda günde 3 (yalnız anahtar açıkken)
create or replace function public.start_match_session(
  p_sport_ids text[],
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 5000
) returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my_loc geography := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  my_radius integer := greatest(coalesce(p_radius_m, 5000), 100);
  new_session uuid;
  cand record;
  new_match uuid;
  common_sport text;
  v_free_daily_limit constant int := 3;
  v_is_pro boolean;
  v_today_count int;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_sport_ids is null or array_length(p_sport_ids, 1) is null then
    raise exception 'en az bir spor gerekli';
  end if;

  select (pro_until is not null and pro_until > now()) into v_is_pro
    from profiles where id = me;

  -- Sınır yalnız Pro satışa çıkınca (pro_limits_enforced) uygulanır
  if public.pro_limits_enforced() and not coalesce(v_is_pro, false) then
    -- Eşzamanlı iki istek aynı sayımı görüp sınırı aşmasın (rl_match_sessions ile aynı anahtar)
    perform pg_advisory_xact_lock(hashtextextended('match_sessions:' || me::text, 0));
    select count(*) into v_today_count
      from match_sessions
     where user_id = me and created_at > now() - interval '1 day';
    if v_today_count >= v_free_daily_limit then
      raise exception 'Bugünkü ücretsiz eşleşme hakkını kullandın. SporMatch Pro ile sınırsız eşleş.'
        using errcode = '55000';
    end if;
  end if;

  -- Kullanıcının eski aktif oturumlarını kapat (tek aktif oturum)
  update match_sessions set status = 'cancelled' where user_id = me and status = 'searching';

  insert into match_sessions (user_id, sport_ids, location, radius_m, status, expires_at)
    values (me, p_sport_ids, my_loc, my_radius, 'searching', now() + interval '15 minutes')
    returning id into new_session;

  -- Uygun aday: aynı sporlardan biri + iki tarafın da yarıçapı içinde + süresi geçmemiş
  select s.id, s.user_id, s.sport_ids, ST_Distance(s.location, my_loc) as dist
    into cand
    from match_sessions s
   where s.status = 'searching'
     and s.user_id <> me
     and s.expires_at > now()
     and s.sport_ids && p_sport_ids
     and ST_DWithin(s.location, my_loc, least(s.radius_m, my_radius))
   order by ST_Distance(s.location, my_loc) asc
   for update skip locked
   limit 1;

  if found then
    common_sport := (select x from unnest(p_sport_ids) x where x = any (cand.sport_ids) limit 1);
    insert into matches (session_a, session_b, user_a, user_b, sport_id, distance_m, status)
      values (cand.id, new_session, cand.user_id, me, common_sport, cand.dist, 'pending')
      returning id into new_match;
    update match_sessions set status = 'matched' where id in (cand.id, new_session);
    return json_build_object('session_id', new_session, 'match_id', new_match);
  end if;

  return json_build_object('session_id', new_session, 'match_id', null);
end; $$;

revoke all on function public.start_match_session(text[], double precision, double precision, integer) from anon;
grant execute on function public.start_match_session(text[], double precision, double precision, integer) to authenticated;

-- Planlı etkinlik: ücretsiz katmanda aynı anda en fazla 3 aktif (gelecek tarihli, iptal edilmemiş) etkinlik
create or replace function public.events_free_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare active int;
begin
  if not public.pro_limits_enforced() or public.user_is_pro(new.host_id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('events_free:' || new.host_id::text, 0));
  select count(*) into active from events
   where host_id = new.host_id and status = 'open' and starts_at > now();
  if active >= 3 then
    raise exception 'Ücretsiz katmanda aynı anda en fazla 3 aktif etkinlik oluşturabilirsin. SporMatch Pro ile sınırsız etkinlik oluştur.'
      using errcode = '55000';
  end if;
  return new;
end; $$;

drop trigger if exists trg_events_free_limit on public.events;
create trigger trg_events_free_limit before insert on public.events
  for each row execute function public.events_free_limit();

-- =========================================================
-- 7) Güvenlik sertleştirmesi (kod incelemesi bulguları)
-- =========================================================
-- 7a) Hız sınırı tetikleyicileri (rl_*) definer olur → assert_rate istemciye kapatılabilir
--     (assert_rate dışarıdan çağrılınca başka kullanıcının etkinlik sayısını sızdırabiliyordu).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'rl\_%' and p.prorettype = 'trigger'::regtype
  loop
    execute format('alter function %s security definer set search_path = public', f.sig);
  end loop;
end $$;

-- 7b) Giriş yapmamış kullanıcı (anon anahtarı) hiçbir public fonksiyonu çağıramasın
--     (liderlik, programlar, profil istatistikleri, antrenman takvimi giriş yapmadan okunabiliyordu).
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges revoke execute on functions from public;
-- Yalnız sunucu içinde kullanılanlar istemciye de kapalı
revoke execute on function public.notify_user(uuid, text, text, jsonb) from authenticated;
revoke execute on function public.user_is_pro(uuid) from authenticated;
revoke execute on function public.assert_rate(text, text, uuid, integer, integer) from authenticated;
-- Kayıt tetikleyicisi auth servisi tarafından çalıştırılır
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- 7c) Fotoğraf bucket'ları: en fazla 10 MB, yalnız görsel türleri (src/lib/uploadImage.ts ile aynı)
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id in ('avatars', 'post-images');

-- 7d) Eşleşme oturumu yalnız start_match_session ile oluşur; istemci yalnız kendi oturumunu görür/iptal eder
--     (doğrudan insert ile 30 günlük "hayalet" oturum ve Pro sınırını atlatma kapanır).
drop policy if exists "ms_all_own" on public.match_sessions;
drop policy if exists "ms_select_own" on public.match_sessions;
create policy "ms_select_own" on public.match_sessions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "ms_cancel_own" on public.match_sessions;
create policy "ms_cancel_own" on public.match_sessions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');
revoke insert, update, delete on public.match_sessions from authenticated;
grant update (status) on public.match_sessions to authenticated;
