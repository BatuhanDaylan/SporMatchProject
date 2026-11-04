/**
 * İçerik moderasyonu — küfür/müstehcen ifade filtresi.
 * İstemci tarafı anlık geri bildirim içindir; ASIL güvence sunucudaki trigger'lardır
 * (has_banned_words, migration 0039). İKİ LİSTE ELLE SENKRON TUTULMALIDIR.
 *
 * - Kök eşleşmesi "kelime başı" mantığıyla yapılır → çekimli haller de yakalanır ('orospu' → 'orospusun').
 * - Kısa/riskli kökler (EXACT) yalnız TAM KELİME eşleşir ('bok' ≠ 'boksör').
 * - Rakam/sembol kaçışı çözülür ('s1kt1r', '4mk', '$ik'); tekrar eden harfler teke iner ('siiiktir').
 * - Harf aralama kaçışına karşı (s i k t i r) uzun kökler bitişik metinde de aranır.
 */

// Yasaklı kökler (kelime başı).
export const BANNED_ROOTS = [
  'orospu', 'pezevenk', 'pezeveng', 'yavşak', 'yavsak', 'yavşağ', 'yavsağ', 'kahpe', 'kaltak',
  'kaltağ', 'kancık', 'kancik', 'sürtük', 'surtuk', 'sürtüğ', 'surtuğ', 'ibne', 'ibine', 'gavat',
  'amcık', 'amcik', 'amcığ', 'amcig', 'amına', 'amina', 'amını', 'yarrak', 'yarak', 'yarağ',
  'yarrağ', 'taşşak', 'taşak', 'tassak', 'taşağ', 'tassağ', 'daşşak', 'daşak', 'dassak', 'siktir',
  'siktiğ', 'siktig', 'sikeyim', 'sikerim', 'sikim', 'sikik', 'sikiğ', 'sikiş', 'sikis', 'sikici',
  'sokayım', 'sokayim', 'sokarım', 'sokarim', 'götver', 'gotver', 'götlek', 'götoş', 'gotos',
  'götün', 'gotun', 'fahişe', 'fahise', 'porno', 'göt oğlanı', 'meme ucu', 'çük', 'oç', 'şerefsiz',
  'serefsiz', 'dangalak', 'gerizekalı', 'gerizekali', 'puşt', 'kerhane', 'boktan', 'escort',
  'eskort', 'onlyfans', 'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'porn',
  'whore', 'slut', 'nigger', 'nigga', 'faggot', 'motherf', 'retard', 'wanker', 'chink', 'tranny',
  'cocksucker', 'blowjob', 'dildo', 'jackass',
];

// Kısa / tehlikeli kökler: yalnız TAM KELİME eşleşir (yanlış pozitifi önler).
export const BANNED_EXACT = [
  'amk', 'amq', 'aq', 'amck', 'sktr', 'sktir', 'sktim', 'syk', 'yrk', 'yrrk', 'orspu', 'orsp',
  'gtver', 'gtvr', 'pzvnk', 'sikcem', 'sikçem', 'sik', 'sikime', 'sikimi', 'sikin', 'sikme',
  'sikmek', 'siker', 'sikti', 'bok', 'boku', 'bokum', 'göt', 'gotu', 'götü', 'gote', 'göte',
  'gotune', 'götüne', 'gotunu', 'götünü', 'pust', 'piç', 'piçler', 'picler', 'piçlik', 'piclik',
  'sex', 'nude', 'nudes', 'cock', 'cunt', 'cunts', 'twat', 'kike', 'spic', 'fuk', 'fck', 'fuq',
];

const collapse = (s: string) => s.replace(/(.)\1+/g, '$1');

// Sunucu ile aynı sadeleştirme: çift harfler teke indirilir (yarrak → yarak).
const ROOTS = BANNED_ROOTS.map(collapse);
const EXACTS = BANNED_EXACT.map(collapse);
const LONG_ROOTS = ROOTS.map((r) => r.replace(/ /g, '')).filter((r) => r.length >= 5);

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };

function normalize(lowered: string): string {
  const t = lowered
    .replace(/̇/g, '') // İ → i̇ artığı
    .replace(/([a-zçğıöşü])!(?=[a-zçğıöşü])/g, '$1i') // s!kt!r
    .replace(/[013457@$]/g, (ch) => LEET[ch] ?? ch); // rakam/sembol kaçışı
  return (
    ' ' +
    collapse(t)
      .replace(/[^a-zçğıöşü ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() +
    ' '
  );
}

function check(t: string): boolean {
  // 1) kelime başı eşleşmesi (çekimli haller dahil)
  if (ROOTS.some((r) => t.includes(' ' + r))) return true;
  // 2) kısa kökler: tam kelime (iki yanı boşluk)
  if (EXACTS.some((e) => t.includes(' ' + e + ' '))) return true;
  // 3) sıkıştırılmış geçiş (harf-ayırma kaçışına karşı, yalnız uzun kökler)
  const compact = t.replace(/ /g, '');
  return LONG_ROOTS.some((r) => compact.includes(r));
}

/** Metin yasaklı bir kelime içeriyor mu? (Sunucu 'I'→'i', Türkçe 'I'→'ı' derdi: iki yazımı da dener.) */
export function hasBannedWords(text?: string | null): boolean {
  if (!text) return false;
  return check(normalize(text.toLocaleLowerCase('tr'))) || check(normalize(text.toLowerCase()));
}

/** Verilen metinlerden biri uygunsuzsa hata fırlatır (mutation öncesi kullan). */
export function assertClean(...texts: (string | null | undefined)[]): void {
  for (const t of texts) {
    if (hasBannedWords(t)) {
      throw new Error('Uygunsuz içerik (küfür/müstehcen ifade) tespit edildi. Lütfen düzenle.');
    }
  }
}
