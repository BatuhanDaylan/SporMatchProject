/**
 * Basit içerik moderasyonu — küfür/müstehcen ifade filtresi.
 * İstemci tarafı anlık geri bildirim içindir; ASIL güvence sunucudaki trigger'lardır
 * (migration 0021). İki listenin (bu dosya + SQL) elle senkron tutulması gerekir.
 *
 * Eşleşme "kelime başı" mantığıyla yapılır → çekimli haller de yakalanır
 * (ör. 'orospu' → 'orospusun'); tekrar eden harfler teke indirilir ('siiiktir' → 'siktir').
 */

// Yasaklı kökler (küçük harf). Yeni kelime eklemek için listeye ekle + SQL'i güncelle.
export const BANNED_ROOTS = [
  // Türkçe
  'orospu', 'pezevenk', 'pezeveng', 'piç', 'yavşak', 'yavsak', 'kahpe', 'kaltak',
  'sürtük', 'surtuk', 'ibne', 'gavat', 'amcık', 'amcik', 'amına', 'amina',
  'yarrak', 'yarak', 'taşşak', 'taşak', 'tassak', 'siktir', 'siktir', 'sikeyim',
  'sikik', 'sikiş', 'sikis', 'sikici', 'sikerim', 'sokayım', 'sokayim', 'sokarım',
  'sokarim', 'götver', 'gotver', 'götlek', 'götoş', 'gotos', 'fahişe', 'fahise',
  'porno', 'çük', 'oç', 'göt oğlanı', 'meme ucu',
  // k→ğ yumuşama varyantları (yavşak→yavşağım gibi)
  'yavşağ', 'yavsağ', 'yarağ', 'taşağ', 'tassağ', 'kaltağ', 'sürtüğ', 'surtuğ', 'amcığ', 'amcig', 'sikiğ',
  // İngilizce
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'porn', 'whore', 'slut', 'nigger', 'faggot', 'motherf',
];

function normalize(s: string): string {
  return (
    ' ' +
    s
      .toLocaleLowerCase('tr')
      .replace(/(.)\1+/g, '$1') // tekrar eden harfleri teke indir
      .replace(/[^a-zçğıöşü ]+/g, ' ') // harf/boşluk dışını boşluğa çevir
      .replace(/\s+/g, ' ')
      .trim() +
    ' '
  );
}

// Sesli-harfsiz / kısaltma küfürler — yalnız TAM KELİME eşleşir (yanlış pozitifi önler).
export const BANNED_EXACT = [
  'amk', 'amq', 'aq', 'amck', 'sktr', 'sktir', 'sktim', 'syk', 'yrk', 'yrrk',
  'orspu', 'orsp', 'gtver', 'gtvr', 'pzvnk', 'sikcem', 'sikçem',
];

const LONG_ROOTS = BANNED_ROOTS.map((r) => r.replace(/ /g, '')).filter((r) => r.length >= 5);

/** Metin yasaklı bir kelime içeriyor mu? */
export function hasBannedWords(text?: string | null): boolean {
  if (!text) return false;
  const t = normalize(text); // ' w1 w2 '
  // 1) kelime başı eşleşmesi (çekimli haller dahil)
  if (BANNED_ROOTS.some((r) => t.includes(' ' + r))) return true;
  // 2) kısaltmalar: tam kelime (iki yanı boşluk)
  if (BANNED_EXACT.some((e) => t.includes(' ' + e + ' '))) return true;
  // 3) sıkıştırılmış geçiş (harf-ayırma kaçışına karşı, yalnız uzun kökler)
  const compact = t.replace(/ /g, '');
  return LONG_ROOTS.some((r) => compact.includes(r));
}

/** Verilen metinlerden biri uygunsuzsa hata fırlatır (mutation öncesi kullan). */
export function assertClean(...texts: (string | null | undefined)[]): void {
  for (const t of texts) {
    if (hasBannedWords(t)) {
      throw new Error('Uygunsuz içerik (küfür/müstehcen ifade) tespit edildi. Lütfen düzenle.');
    }
  }
}
