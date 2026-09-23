-- 0022: Moderasyon güçlendirme — nokta/boşlukla harf ayırma kaçışına karşı sıkıştırılmış geçiş.
-- Boşluk/işaret temizlenmiş metinde YALNIZCA uzun kökleri (>=5) alt-dizi olarak arar → yanlış pozitif düşük.

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
    'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy',
    'porn','whore','slut','nigger','faggot','motherf'
  ];
begin
  if p_text is null or p_text = '' then return false; end if;
  t := lower(p_text);
  t := regexp_replace(t, '(.)\1+', '\1', 'g');
  t := regexp_replace(t, '[^a-zçğıöşü ]+', ' ', 'g');
  t := ' ' || regexp_replace(t, '\s+', ' ', 'g') || ' ';

  -- 1) Kelime başı eşleşmesi (çekimli haller dahil)
  if t ~ ('(^|[^a-zçğıöşü])(' || array_to_string(roots, '|') || ')') then
    return true;
  end if;

  -- 2) Sıkıştırılmış geçiş (harf-ayırma kaçışı): tüm boşlukları kaldır, uzun kökleri alt-dizi ara
  tc := replace(trim(t), ' ', '');
  select string_agg(replace(r, ' ', ''), '|') into long_pat
  from unnest(roots) r
  where length(replace(r, ' ', '')) >= 5;

  return tc ~ long_pat;
end; $$;
