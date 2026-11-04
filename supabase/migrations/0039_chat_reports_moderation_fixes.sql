-- 0039: Kullanıcı geri bildirimleri (sohbet / şikayet / yorum / küfür filtresi).
--  1) Aynı iki kişi tekrar eşleşince ESKİ sohbet sürer (yeni sohbet açılmaz); mevcut kopyalar birleştirilir.
--  2) Sohbeti "sil" (yalnız kendi tarafın): conversation_user_state + delete_conversation().
--  3) list_conversations: son mesajın benden olup olmadığı / okunup okunmadığı (✓✓ için), silinen sohbetler gizli.
--  4) messages: silinmiş (temizlenmiş) kısım görünmez; yalnız read_at güncellenebilir (mesaj metni değiştirilemez).
--  5) reports: aynı hedef tek kez şikayet edilir + saatlik limit 5.
--  6) post_comments realtime.
--  7) my_pending_matches(): bekleyen eşleşmelerim (ekrandan çıkınca kaybolmasın).
--  8) has_banned_words: rakam/sembol kaçışı (s1kt1r), çok daha kapsamlı liste.
-- Idempotent yazıldı.

-- =========================================================
-- 1) Aynı çift için tek sohbet
-- =========================================================
-- Mevcut kopya sohbetleri birleştir: mesajlar en eski sohbete taşınır, fazlalıklar silinir.
do $$
declare r record; keep uuid; dups uuid[];
begin
  for r in
    select least(user_a, user_b) as a, greatest(user_a, user_b) as b
      from matches where conversation_id is not null
     group by 1, 2 having count(distinct conversation_id) > 1
  loop
    select conversation_id into keep from matches
     where conversation_id is not null
       and least(user_a, user_b) = r.a and greatest(user_a, user_b) = r.b
     order by created_at limit 1;
    dups := array(
      select distinct conversation_id from matches
       where conversation_id is not null and conversation_id <> keep
         and least(user_a, user_b) = r.a and greatest(user_a, user_b) = r.b);
    update messages set conversation_id = keep where conversation_id = any (dups);
    update matches  set conversation_id = keep where conversation_id = any (dups);
    delete from conversations where id = any (dups);
  end loop;
end $$;

create or replace function public.confirm_match(p_match_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m record; conv uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  select * into m from matches where id = p_match_id for update;
  if not found then raise exception 'eşleşme bulunamadı'; end if;
  if me <> m.user_a and me <> m.user_b then raise exception 'katılımcı değilsin'; end if;
  if m.status = 'declined' then raise exception 'eşleşme reddedildi'; end if;

  -- Aynı çiftin farklı eşleşmeleri aynı anda onaylanırsa tek sohbet kalsın: çift başına kilit.
  perform pg_advisory_xact_lock(hashtextextended(least(m.user_a::text, m.user_b::text) || ':' || greatest(m.user_a::text, m.user_b::text), 0));

  if me = m.user_a then update matches set a_confirmed = true where id = p_match_id;
  else                    update matches set b_confirmed = true where id = p_match_id; end if;

  select * into m from matches where id = p_match_id;

  if m.a_confirmed and m.b_confirmed and m.status <> 'confirmed' then
    -- Bu iki kişinin daha önce bir sohbeti varsa onu sürdür.
    select conversation_id into conv from matches
     where conversation_id is not null and id <> p_match_id
       and ((user_a = m.user_a and user_b = m.user_b) or (user_a = m.user_b and user_b = m.user_a))
     order by created_at limit 1;
    if conv is null then
      insert into conversations (match_id) values (p_match_id)
        on conflict (match_id) do update set match_id = excluded.match_id
        returning id into conv;
    end if;
    update matches set status = 'confirmed', conversation_id = conv where id = p_match_id;
    select * into m from matches where id = p_match_id;
  end if;

  return row_to_json(m);
end; $$;

-- send_chat_request içindeki kabul dalı da aynı kuralı izlesin (karşı taraf bekleyen isteği varsa).
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

  perform pg_advisory_xact_lock(hashtextextended(least(me::text, p_to::text) || ':' || greatest(me::text, p_to::text), 0));

  select conversation_id into existing_conv from matches
    where conversation_id is not null
      and ((user_a = me and user_b = p_to) or (user_a = p_to and user_b = me))
    order by created_at limit 1;
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

-- =========================================================
-- 2) Sohbeti sil (yalnız kendi tarafın)
-- =========================================================
create table if not exists public.conversation_user_state (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  cleared_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_user_state enable row level security;
drop policy if exists "cus_select_own" on public.conversation_user_state;
create policy "cus_select_own" on public.conversation_user_state
  for select to authenticated using (user_id = auth.uid());
-- Yazma yalnız delete_conversation() ile (security definer).

create or replace function public.delete_conversation(p_conversation_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  if not exists (
    select 1 from conversations c join matches m on m.id = c.match_id
     where c.id = p_conversation_id and (m.user_a = me or m.user_b = me)
  ) and not exists (
    select 1 from matches m where m.conversation_id = p_conversation_id and (m.user_a = me or m.user_b = me)
  ) then raise exception 'erişim yok'; end if;
  insert into conversation_user_state (conversation_id, user_id, cleared_at)
    values (p_conversation_id, me, now())
    on conflict (conversation_id, user_id) do update set cleared_at = now();
end; $$;
revoke all on function public.delete_conversation(uuid) from anon;
grant execute on function public.delete_conversation(uuid) to authenticated;

-- =========================================================
-- 3) list_conversations — okundu bilgisi + silinenleri gizle
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
      (select count(*) from messages um
        where um.conversation_id = c.id and um.sender_id <> auth.uid() and um.read_at is null
          and um.created_at > coalesce(s.cleared_at, '-infinity')) as unread
    from conversations c
    join matches m on m.id = c.match_id
    join profiles p on p.id = (case when m.user_a = auth.uid() then m.user_b else m.user_a end)
    left join conversation_user_state s on s.conversation_id = c.id and s.user_id = auth.uid()
    left join lateral (
      select body, created_at, sender_id, read_at from messages mm
       where mm.conversation_id = c.id and mm.created_at > coalesce(s.cleared_at, '-infinity')
       order by created_at desc limit 1
    ) lm on true
    where (m.user_a = auth.uid() or m.user_b = auth.uid())
      and (
        s.cleared_at is null
        or lm.created_at is not null
        -- sohbeti silip aynı kişiyle yeniden eşleştiysem tekrar görünsün
        or exists (select 1 from matches mm2 where mm2.conversation_id = c.id and mm2.created_at > s.cleared_at)
      )
  ) t;
$$;

-- =========================================================
-- 4) messages: silinen kısım görünmez; yalnız read_at güncellenebilir
-- =========================================================
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = messages.conversation_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
    and messages.created_at > coalesce(
      (select s.cleared_at from public.conversation_user_state s
        where s.conversation_id = messages.conversation_id and s.user_id = auth.uid()),
      '-infinity')
  );

-- Güvenlik: katılımcı karşı tarafın mesaj METNİNİ değiştirememeli → yalnız read_at sütunu güncellenebilir.
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- =========================================================
-- 5) reports: tekrar şikayet engeli + saatlik limit 5
-- =========================================================
create or replace function public.reports_dedupe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Aynı kullanıcının aynı hedef için eşzamanlı iki şikayeti sıraya girsin (kontrol–ekleme yarışı).
  perform pg_advisory_xact_lock(hashtextextended(
    'report:' || new.reporter_id::text || ':' || new.reported_id::text || ':' || coalesce(new.context->>'type', '') || ':' ||
    coalesce(new.context->>'comment_id', new.context->>'post_id', new.context->>'program_id', ''), 0));
  if exists (
    select 1 from reports r
     where r.reporter_id = new.reporter_id
       and r.reported_id = new.reported_id
       and coalesce(r.context->>'type', '') = coalesce(new.context->>'type', '')
       and coalesce(r.context->>'comment_id', r.context->>'post_id', r.context->>'program_id', '')
         = coalesce(new.context->>'comment_id', new.context->>'post_id', new.context->>'program_id', '')
  ) then
    raise exception 'Bunu zaten şikayet ettin.';
  end if;
  return new;
end; $$;
-- Ad sırası: trg_reports_dedupe, trg_rl_reports'tan ÖNCE çalışır.
drop trigger if exists trg_reports_dedupe on public.reports;
create trigger trg_reports_dedupe before insert on public.reports
  for each row execute function public.reports_dedupe();

create or replace function public.rl_reports() returns trigger
language plpgsql set search_path = public as $$
begin perform assert_rate('reports', 'reporter_id', new.reporter_id, 5, 3600); return new; end; $$;

-- =========================================================
-- 6) post_comments realtime
-- =========================================================
alter table public.post_comments replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='post_comments') then
    execute 'alter publication supabase_realtime add table public.post_comments';
  end if;
end $$;

-- =========================================================
-- 7) Bekleyen eşleşmelerim (son 24 saat)
-- =========================================================
create or replace function public.my_pending_matches() returns json
language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select
      m.id as match_id,
      (case when m.user_a = auth.uid() then m.user_b else m.user_a end) as partner_id,
      p.username, p.display_name, p.avatar_url,
      sp.name as sport_name, sp.icon as sport_icon,
      m.distance_m,
      (case when m.user_a = auth.uid() then m.a_confirmed else m.b_confirmed end) as i_confirmed,
      m.created_at
    from matches m
    join profiles p on p.id = (case when m.user_a = auth.uid() then m.user_b else m.user_a end)
    left join sports sp on sp.id = m.sport_id
    where (m.user_a = auth.uid() or m.user_b = auth.uid())
      and m.origin = 'match' and m.status = 'pending'
      and m.created_at > now() - interval '24 hours'
      and not exists (select 1 from user_blocks b
                       where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                          or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  ) t;
$$;
revoke all on function public.my_pending_matches() from anon;
grant execute on function public.my_pending_matches() to authenticated;

-- =========================================================
-- 8) Küfür filtresi (has_banned_words)
--    İstemci kopyası: src/lib/moderation.ts — İKİ LİSTE ELLE SENKRON TUTULMALI.
-- =========================================================
create or replace function public.has_banned_words(p_text text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  t text;
  tc text;
  long_pat text;
  roots text[] := array[
    'orospu','pezevenk','pezeveng','yavşak','yavsak','yavşağ','yavsağ','kahpe','kaltak','kaltağ',
    'kancık','kancik','sürtük','surtuk','sürtüğ','surtuğ','ibne','ibine','gavat','amcık','amcik',
    'amcığ','amcig','amına','amina','amını','yarrak','yarak','yarağ','yarrağ','taşşak',
    'taşak','tassak','taşağ','tassağ','daşşak','daşak','dassak','siktir','siktiğ','siktig','sikeyim','sikerim',
    'sikim','sikik','sikiğ','sikiş','sikis','sikici','sokayım','sokayim','sokarım','sokarim',
    'götver','gotver','götlek','götoş','gotos','götün','gotun','fahişe','fahise','porno',
    'göt oğlanı','meme ucu','çük','oç','şerefsiz','serefsiz','dangalak','gerizekalı','gerizekali',
    'puşt','kerhane','boktan','escort','eskort','onlyfans',
    'fuck','shit','bitch','asshole','bastard','dick','pussy','porn','whore','slut','nigger',
    'nigga','faggot','motherf','retard','wanker','chink','tranny','cocksucker','blowjob','dildo','jackass'
  ];
  -- kısa/tehlikeli kökler: yalnız TAM KELİME eşleşir (yanlış pozitifi önler)
  exacts text[] := array[
    'amk','amq','aq','amck','sktr','sktir','sktim','syk','yrk','yrrk','orspu','orsp','gtver','gtvr',
    'pzvnk','sikcem','sikçem','sik','sikime','sikimi','sikin','sikme','sikmek','siker','sikti',
    'bok','boku','bokum','göt','gotu','götü','gote','göte','gotune','götüne','gotunu','götünü',
    'pust','piç','piçler','picler','piçlik','piclik',
    'sex','nude','nudes','cock','cunt','cunts','twat','kike','spic','fuk','fck','fuq'
  ];
begin
  if p_text is null or p_text = '' then return false; end if;
  t := lower(p_text);
  t := replace(t, chr(775), '');                 -- İ → i̇ artığı
  t := regexp_replace(t, '([a-zçğıöşü])!(?=[a-zçğıöşü])', '\1i', 'g');   -- s!kt!r
  t := translate(t, '013457@$', 'oieastas');     -- rakam/sembol kaçışı (s1kt1r, 4mk, $ik)
  t := regexp_replace(t, '(.)\1+', '\1', 'g');   -- tekrar eden harfleri teke indir
  t := regexp_replace(t, '[^a-zçğıöşü ]+', ' ', 'g');
  t := ' ' || regexp_replace(t, '\s+', ' ', 'g') || ' ';

  -- listeler de aynı sadeleştirmeden geçer (çift harfli kökler: yarrak → yarak)
  select array_agg(regexp_replace(r, '(.)\1+', '\1', 'g')) into roots from unnest(roots) r;
  select array_agg(regexp_replace(e, '(.)\1+', '\1', 'g')) into exacts from unnest(exacts) e;

  -- 1) kelime başı (çekimli haller)
  if t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(roots, '|') || ')') then
    return true;
  end if;

  -- 2) kısa kökler/kısaltmalar: iki yanı da sınır (tam kelime)
  if t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(exacts, '|') || ')([^a-zçğıöşü]|$)') then
    return true;
  end if;

  -- 3) sıkıştırılmış geçiş (harf-ayırma kaçışı: "s i k t i r", uzun kökler)
  tc := replace(trim(t), ' ', '');
  select string_agg(replace(r, ' ', ''), '|') into long_pat
  from unnest(roots) r
  where length(replace(r, ' ', '')) >= 5;

  return tc ~ long_pat;
end; $$;
