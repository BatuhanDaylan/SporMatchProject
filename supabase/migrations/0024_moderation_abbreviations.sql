-- 0024: Moderasyon — sesli harf düşürülmüş / kısaltılmış küfürler (amk, yrk, sktr, aq...).
-- Bunlar KISA olduğundan TAM KELİME olarak eşleşir (iki yanı da sınır) → "makine", "park"
-- gibi masum kelimeler yanlış yakalanmaz.

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
    'orospu','pezevenk','pezeveng','piç','yavşak','yavsak','kahpe','kaltak',
    'sürtük','surtuk','ibne','gavat','amcık','amcik','amına','amina',
    'yarrak','yarak','taşşak','taşak','tassak','siktir','sikeyim',
    'sikik','sikiş','sikis','sikici','sikerim','sokayım','sokayim','sokarım',
    'sokarim','götver','gotver','götlek','götoş','gotos','fahişe','fahise',
    'porno','çük','oç','göt oğlanı','meme ucu',
    'yavşağ','yavsağ','yarağ','taşağ','tassağ','kaltağ','sürtüğ','surtuğ','amcığ','amcig','sikiğ',
    'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy',
    'porn','whore','slut','nigger','faggot','motherf'
  ];
  -- kısaltmalar/sesli-harfsiz: yalnız TAM KELİME eşleşir
  exacts text[] := array[
    'amk','amq','aq','amck','sktr','sktir','sktim','syk','yrk','yrrk',
    'orspu','orsp','gtver','gtvr','pzvnk','sikcem','sikçem'
  ];
begin
  if p_text is null or p_text = '' then return false; end if;
  t := lower(p_text);
  t := regexp_replace(t, '(.)\1+', '\1', 'g');
  t := regexp_replace(t, '[^a-zçğıöşü ]+', ' ', 'g');
  t := ' ' || regexp_replace(t, '\s+', ' ', 'g') || ' ';

  -- 1) kelime başı (çekimli haller)
  if t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(roots, '|') || ')') then
    return true;
  end if;

  -- 2) kısaltmalar: iki yanı da sınır (tam kelime)
  if t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(exacts, '|') || ')([^a-zçğıöşü]|$)') then
    return true;
  end if;

  -- 3) sıkıştırılmış geçiş (harf-ayırma kaçışı, uzun kökler)
  tc := replace(trim(t), ' ', '');
  select string_agg(replace(r, ' ', ''), '|') into long_pat
  from unnest(roots) r
  where length(replace(r, ' ', '')) >= 5;

  return tc ~ long_pat;
end; $$;
