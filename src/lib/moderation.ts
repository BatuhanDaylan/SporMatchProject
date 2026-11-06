/**
 * İçerik moderasyonu — küfür/hakaret/müstehcen ifade filtresi.
 * İstemci tarafı anlık geri bildirim içindir; ASIL güvence sunucudaki trigger'lardır
 * (has_banned_words / mod_check, migration 0040). LİSTELER VE ADIMLAR SUNUCUYLA AYNI TUTULMALI
 * (sunucu listeleri bu dosyadan üretilir).
 *
 * Kaynaklar: elle derlenen liste + ooguz/turkce-kufur-karaliste (CC BY-SA 4.0) ve
 * LDNOOBW tr/en (CC BY 4.0) listelerinden masum kelimelerle çakışmayanlar seçildi.
 *
 * Sadeleştirme adımları (sırası önemli):
 *  1) küçült (tr ve en, ikisi de denenir) → görünmez/birleşik işaretleri sil (s̈iktir, si​ktir)
 *  2) yabancı aksan + benzer görünen Kiril/Yunan harfleri (fúck, оrospu); rakam/sembol kaçışı yalnız harf
 *     içeren kelimelerde (s1kt1r, $ik, 9öt → evet; "5 km" → hayır)
 *  3) harf arasındaki ! ve | → i (s!kt!r); harf arasındaki * silinir (f*ck → fck)
 *  4) iki yazım üretilir: işaretler BOŞLUK (t) ve harf arasındaki işaretler SİLİNMİŞ/bitişik (j: s.ik.tir → siktir)
 *  5) masum kelime önekleri silinir (sikke, götürmek, şikayet…) — tekrar-harf indirgemesinden ÖNCE
 *  6) tekrar eden harfler teke iner (siiiktir, yarrak → yarak); harf dışı her şey boşluk
 *  7) tek harflik ardışık parçalar birleşir (a m k → amk)
 *
 * Eşleşme türleri:
 *  - ROOTS / INSULTS: kelime başı (çekimli haller: orospusun, salaksın)
 *  - EXACT: yalnız tam kelime (kısa/riskli: bok ≠ boks, aq, mk)
 *  - ROOTS (≥6 harf): kelime içinde ("ananısikerim") ve bir kelimenin BAŞINDAN itibaren boşluklar silinerek
 *    aranır ("oros puçocuğu"). Kelime ortasından başlayan birleşim sayılmaz ("eksik misin", "şarap istiyorum").
 *  - Kısa parça birleştirme: en az biri ≤3 harf olan ardışık parçalar birleştirilir ("si ktir", "amı na");
 *    birleşim bir köke + en çok 3 harf eke ya da tam bir EXACT'e eşitse yakalanır.
 *    CHAIN_SKIP'teki kökler bu adımda kullanılmaz ("ya rakı", "kal tak", "o çocuğu" yanlış alarmı).
 */

// Ağır küfür / müstehcen kökler (kelime başı).
export const BANNED_ROOTS = [
  // Türkçe
  'orospu', 'orosbu', 'orispu', 'oruspu', 'orusbu', 'pezevenk', 'pezeveng', 'pezeven', 'pezevek', 'pezo',
  'yavşak', 'yavsak', 'yavşağ', 'yavsağ', 'yavuşak', 'kahpe', 'kahbe', 'kaltak', 'kaltağ', 'kancık',
  'kancik', 'sürtük', 'surtuk', 'sürtüğ', 'surtuğ', 'ibne', 'ibine', 'ıbne', 'ipne', 'gavat', 'gavad',
  'kavat', 'amcık', 'amcik', 'amcığ', 'amcig', 'amcuk', 'amına', 'amina', 'amını', 'amında', 'aminda',
  'amınoğlu', 'aminoglu', 'amkafa', 'yarrak', 'yarak', 'yarağ', 'yarrağ', 'yarag', 'dalyarak', 'dalyarag',
  'taşşak', 'taşak', 'tassak', 'taşağ', 'tassağ', 'daşşak', 'daşak', 'dassak', 'dassağ', 'daltaşak',
  'daltassak', 'sikt', 'siktiğ', 'siktig', 'sikeyim', 'sikerim', 'siker', 'sikem', 'sikecem', 'sikicem',
  'sikiyim', 'sikim', 'sikik', 'sikiğ', 'sikiş', 'sikis', 'sikici', 'sikmek', 'sikmiş', 'sikmis', 'sikc',
  'sikç', 'sikko', 'sikd', 'siken', 'sikes', 'sikey', 'sikien', 'sikir', 'siks', 'siqt', 'hasiktir',
  'hasitir', 'sittir', 'sokayım', 'sokayim', 'sokarım', 'sokarim', 'sokuyum', 'giberim', 'gibmek',
  'gibtiler', 'zikeyim', 'xikeyim', 'zikik', 'göt', 'gotver', 'gotos', 'gotun', 'gotelek', 'gtveren',
  'godumun', 'koduğmun', 'koduumun', 'fahişe', 'fahise', 'porno', 'meme ucu', 'çük', 'oçocu', 'ococu',
  'şerefsiz', 'serefsiz', 'puşt', 'kerhane', 'karhane', 'kerane', 'genelev', 'boktan', 'escort', 'eskort',
  'onlyfans', 'piç', 'pickurusu', 'dassag', 'kevaşe', 'kevase', 'dürzü', 'durzu', 'godoş', 'godos', 'yosma', 'avradın',
  'avradin', 'deyyus', 'deyyuz', 'mastürb', 'masturb', 'sakso', 'pedofil', 'abazan', 'domal', 'malafat',
  'madafaka', 'veledizina', 'veledi zina', 'weledizina', 'otuzbirci', 'otuz birci', 'sıçayım', 'sıçarım',
  'sıçtığım', 'ağzına sıç', 'itoğlu', 'seks', 'pipi', 'sikyala', 'gotyala', 'götyala',
  // İngilizce
  'fuck', 'shit', 'bullshit', 'dipshit', 'horseshit', 'apeshit', 'bitch', 'asshole', 'arsehole',
  'assmunch', 'bastard', 'dick', 'pussy', 'porn', 'whore', 'slut', 'nigger', 'nigga', 'faggot',
  'motherf', 'retard', 'wank', 'chink', 'tranny', 'cocksucker', 'blowjob', 'blow job', 'dildo', 'jackass',
  'dumbass', 'phuck', 'phuk', 'fvck', 'prick', 'bollocks', 'skank', 'douche', 'jerkoff', 'jerk off',
  'jack off', 'cumshot', 'handjob', 'hand job', 'rimjob', 'rimming', 'hentai', 'kill yourself',
  'rapist', 'raping', 'pedophile', 'paedophile', 'anilingus', 'cunnilingus', 'fellatio', 'bukkake',
  'bulldyke', 'butthole', 'camwhore', 'camslut', 'circlejerk', 'clit', 'creampie', 'daterape',
  'deepthroat', 'deep throat', 'doggystyle', 'doggy style', 'femdom', 'fingerbang', 'fisting', 'footjob',
  'fudgepacker', 'gangbang', 'gang bang', 'goatse', 'jizz', 'nympho', 'poontang', 'queef', 'schlong',
  'shemale', 'sodomi', 'sodomy', 'splooge', 'strapon', 'threesome', 'titties', 'tosser', 'raghead',
  'towelhead', 'wetback', 'beaner', 'beastiality', 'bestiality', 'sex',
];

// Hakaretler (kelime başı; en az 8 harfliler boşluksuz metinde de aranır).
export const BANNED_INSULTS = [
  'salak', 'aptal', 'ahmak', 'embesil', 'beyinsiz', 'namussuz', 'haysiyetsiz', 'şıllık', 'sıllık',
  'gerzek', 'dangalak', 'gerizekalı', 'gerizekali', 'gerızekalı', 'geri zekalı', 'geri zekali',
  'andaval', 'angut', 'dallama', 'lavuk', 'it oğlu it', 'mal mısın', 'mal misin', 'cibiliyetsiz',
  'cibilliyetsiz', 'ebleh', 'geber',
  // 8 harften kısa: boşluksuz aramaya girmez ("adam yalan" yanlış alarmı olmasın)
  'amyala',
];

// Kısa / riskli kökler ve kısaltmalar: yalnız TAM KELİME.
export const BANNED_EXACT = [
  'amk', 'amq', 'aq', 'mk', 'mq', 'amck', 'amın', 'amı', 'amık', 'amn', 'amnda', 'amuna',
  'amona', 'amuga', 'amuğa', 'amsız', 'amsiz', 'oç', 'sktr', 'sktir', 'siktr', 'sktim', 'skrm', 'skm',
  'skym', 'skerim', 'skcem', 'skecem', 'skem', 'sker', 'skerm', 'skeyim', 'skiim', 'skik', 'skime',
  'skmek', 'sksin', 'sksn', 'sksz', 'skyim', 'hsktr', 'sg', 'syk', 'yrk', 'yrrk', 'yrrak', 'orspu',
  'orsp', 'gtver', 'gtvr', 'gtn', 'gtnde', 'gtne', 'gtten', 'gtelek', 'pzvnk', 'sik', 'sike', 'sikin',
  'sikinde', 'sikinden', 'sikine', 'sikini', 'sikip', 'sikme', 'sikmem', 'sikmiler', 'sikime', 'sikimi',
  'sikler', 'sikleri', 'sikli', 'sokam', 'sokarm', 'sokaym', 'sokim', 'soxum', 'goyum', 'ziksin', 'bok',
  'boku', 'bokum', 'boka', 'boklar', 'boklu', 'bokça', 'bombok', 'bokbok', 'gotu', 'gote', 'gotune',
  'gotunu', 'gotum', 'gotumu', 'gotlu', 'pust', 'pici', 'picler', 'piclik', 'mcik', 'mna', 'yaraq',
  'malsın', 'malsin',
  'nude', 'nudes', 'cock', 'cocks', 'cunt', 'cunts', 'twat', 'kike', 'spic', 'fuk', 'fck', 'fuq',
  'stfu', 'sht', 'btch', 'arse', 'milf', 'kys', 'rape', 'fag', 'fags', 'bdsm', 'orgy', 'smut',
  'tits', 'titty', 'boobs', 'boner', 'paki', 'gook', 'cumming',
];

// Kısa parça birleştirmede ve boşluksuz aramada kullanılmayanlar (masum ifadelerle çakışır:
// "ya rakı", "kal takımda", "ip ne", "o çocuğu", "a mı b mi", "dal lama").
export const CHAIN_SKIP = [
  'yarak', 'kaltak', 'kaltağ', 'ipne', 'oçocu', 'ococu', 'göt', 'clit', 'amı', 'dallama', 'geber', 'angut',
  // boşluksuz aramada masum kelimelerle çakışır: progr-amında, anl-amında, ad-amın oğlu, ad-am kafası
  'amında', 'aminda', 'amınoğlu', 'aminoglu', 'amkafa',
];

// Yasaklı köklerle başlayan masum kelimeler (indirgemeden önce yalnız ÖNEK silinir).
export const ALLOWED_PREFIXES = [
  'sikke', 'siklon', 'siklamen', 'siklus', 'siklotron', 'sikatif', 'sikayet', 'sikh', 'götür',
  'shiitake', 'dickens', 'dickinson', 'saksofon', 'saksafon', 'clitheroe', 'geberit', 'seksen', 'seksek',
  'seksiyon', 'terapi',
];

// Aksan / benzer görünen harf eşlemesi: FOLD_FROM[i] → FOLD_TO[i] (sunucuda translate()).
export const FOLD_FROM = 'àáâãäåāèéêëēìíîïīòóôõōùúûūñýÿаеорсухкмтіјѕαοειινρτυ';
export const FOLD_TO = 'aaaaaaaeeeeeiiiiiooooouuuunyyaeopcyxkmtijsaoeiivptu';
// Rakam/sembol kaçışı: YALNIZ harf içeren kelimelerde uygulanır (s1kt1r evet, "5 km" hayır).
export const LEET_FROM = '0134579@$€+8';
export const LEET_TO = 'oieastgasetb';

const L = 'a-zçğıöşü';
const collapse = (s: string) => s.replace(/(.)\1+/g, '$1');
const FOLD = new Map([...FOLD_FROM].map((ch, i) => [ch, FOLD_TO[i]]));
const LEET = new Map([...LEET_FROM].map((ch, i) => [ch, LEET_TO[i]]));
const HAS_LETTER = new RegExp(`[${L}]`);

const SKIP = CHAIN_SKIP.map(collapse);
const ROOTS_C = BANNED_ROOTS.map(collapse);
const INSULTS_C = BANNED_INSULTS.map(collapse);
const WORD = [...ROOTS_C, ...INSULTS_C];
const EXACTS = BANNED_EXACT.map(collapse);
const LONG = [
  ...ROOTS_C.map((r) => r.replace(/ /g, '')).filter((r) => r.length >= 6),
  ...INSULTS_C.map((r) => r.replace(/ /g, '')).filter((r) => r.length >= 8),
].filter((r) => !SKIP.includes(r));
const CHAIN = WORD.filter((r) => !r.includes(' ') && !SKIP.includes(r));
const CHAIN_EXACTS = EXACTS.filter((e) => !SKIP.includes(e));

const WORD_RE = new RegExp(`(^| )(${WORD.join('|')})`);
const EXACT_RE = new RegExp(`(^| )(${EXACTS.join('|')})( |$)`);
const LONG_IN = new RegExp(LONG.join('|'));
const LONG_START = new RegExp(`^(${LONG.join('|')})`);
const CHAIN_RE = new RegExp(`^((${CHAIN.join('|')})[${L}]{0,3}|${CHAIN_EXACTS.join('|')})$`);
const ALLOWED_RE = new RegExp(`(^|[^${L}])(${ALLOWED_PREFIXES.join('|')})`, 'g');

/** Önek temizleme + indirgeme + harf dışını boşluğa çevirme. */
function finish(s: string): string {
  return collapse(s.replace(ALLOWED_RE, '$1 ')).replace(new RegExp(`[^${L}]+`, 'g'), ' ').trim();
}

function check(lowered: string): boolean {
  if (lowered.includes('🖕')) return true;
  const base = lowered
    .normalize('NFC')
    .replace(/[̀-ͯ­​-‏⁠﻿]/g, '')
    .replace(/./gu, (ch) => FOLD.get(ch) ?? ch)
    .split(/\s+/)
    .map((tok) => (HAS_LETTER.test(tok) ? tok.replace(/./gu, (ch) => LEET.get(ch) ?? ch) : tok))
    .join(' ')
    .replace(new RegExp(`([${L}])[!|](?=[${L}])`, 'g'), '$1i')
    .replace(new RegExp(`([${L}])\\*+(?=[${L}])`, 'g'), '$1');

  const t = finish(base); // işaretler boşluk
  const j = finish(base.replace(new RegExp(`([${L}])[^${L}\\s]+(?=[${L}])`, 'g'), '$1')); // harf arası işaret silinir

  // Tek harflik ardışık parçaları birleştir: "a m k" → "amk"
  const toks = t.split(' ');
  const merged = collapse(toks.reduce((acc, tok, i) => acc + (tok.length === 1 && i > 0 && toks[i - 1].length === 1 ? '' : ' ') + tok, '').trim());

  for (const s of [t, j, merged]) {
    if (WORD_RE.test(s) || EXACT_RE.test(s)) return true;
  }
  // Uzun kökler: kelime içinde ya da bir kelimenin başından itibaren (en çok 5 parça) boşluksuz
  for (let i = 0; i < toks.length; i++) {
    if (LONG_IN.test(toks[i]) || LONG_START.test(collapse(toks.slice(i, i + 5).join('')))) return true;
  }

  // Kısa parça birleştirme: "si ktir", "amı na", "oro spu"
  for (let i = 0; i < toks.length; i++) {
    let chain = toks[i];
    for (let k = i + 1; k < Math.min(toks.length, i + 4); k++) {
      if (toks[k - 1].length > 3 && toks[k].length > 3) break;
      chain = collapse(chain + toks[k]);
      if (CHAIN_RE.test(chain)) return true;
    }
  }
  return false;
}

/** Metin yasaklı bir kelime içeriyor mu? (Sunucu 'I'→'i', Türkçe 'I'→'ı' derdi: iki yazımı da dener.) */
export function hasBannedWords(text?: string | null): boolean {
  if (!text || !text.trim()) return false;
  return check(text.toLocaleLowerCase('tr')) || check(text.toLowerCase());
}

// Telefon numarası / bağlantı paylaşımı (güvenlik, dolandırıcılık önlemi). Sunucudaki has_contact_info() ile aynı.
const LINK_RE =
  /(https?:\/\/|www\.|bit\.ly|(^|[^a-z0-9_])(t|wa)\.me($|[^a-z0-9_])|[a-z0-9-]+\.(com|net|org|io|app|xyz|link|site|info|biz|online|store|shop|club|live|page|dev|tr)($|[^a-z0-9_]))/;
const DIGIT_RUN_RE = /\+?\d[\d\s().-]{8,}\d/g;

export const CONTACT_MESSAGE = 'Güvenliğin için telefon numarası, bağlantı veya site adresi paylaşamazsın.';

/**
 * Metinde telefon numarası ya da bağlantı var mı?
 * Numara: 05xx… cep formatı (boşluklu/tireli de olur) ya da +ülke kodlu. "50 55 60 65 70 kg" gibi
 * ağırlık/tekrar listeleri numara sayılmaz (ilk grup en az 3 hane olmalı).
 */
export function hasContactInfo(text?: string | null): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  if (LINK_RE.test(t)) return true;
  for (const m of t.match(DIGIT_RUN_RE) ?? []) {
    const d = m.replace(/\D/g, '');
    if (m.startsWith('+') && d.length >= 10) return true;
    if (/^(90|0)?5\d{9}$/.test(d)) {
      let g = m.replace(/\D+/g, ' ').trim().split(' ');
      if (g[0] === '90' || g[0] === '0') g = g.slice(1);
      if ((g.length <= 5 && g[0].length >= 3) || g.every((x) => x.length === 1)) return true;
    }
  }
  return false;
}

/** Verilen metinlerden biri uygunsuzsa hata fırlatır (mutation öncesi kullan). */
export function assertClean(...texts: (string | null | undefined)[]): void {
  for (const t of texts) {
    if (hasBannedWords(t)) {
      throw new Error('Uygunsuz içerik (küfür/hakaret/müstehcen ifade) tespit edildi. Lütfen düzenle.');
    }
    if (hasContactInfo(t)) throw new Error(CONTACT_MESSAGE);
  }
}
