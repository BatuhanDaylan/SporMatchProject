import type { TourId } from '@/store/tour';

export type TourStep = {
  /** Vurgulanacak `TourTarget` kimliği; yoksa ortada/altta yalnızca bir mesaj kartı gösterilir. */
  target?: string;
  /** Bu adımın geçerli olduğu ekran(lar) — `usePathname()` değeri. Başka ekrandaysak adım beklenir. */
  home: string | string[];
  title: string;
  text: string;
  /**
   * 'next'  → kartta "Devam" düğmesi; 'tap' → kullanıcı vurgulanan öğeye dokunup `route` ekranına
   * geçmeli (geçince otomatik ilerler; zaten oradaysa "Devam" çıkar);
   * 'route' → kullanıcı `route` ekranına dönünce (ör. geri tuşu) otomatik ilerler.
   */
  advance: 'next' | 'tap' | 'route';
  /** 'tap' ve 'route' adımlarında beklenen hedef ekran (usePathname). */
  route?: string;
  /** 'tap' adımında zaten hedef ekrandaysak gösterilecek metin. */
  here?: string;
  /** Hedef kaydırılan içeriğin dışında sabit duruyorsa (sekme çubuğu, FAB) ekran kaydırılmaz. */
  fixed?: boolean;
};

/** Alt sekme çubuğunun göründüğü ekranlar. */
export const TABS = ['/', '/match', '/programs', '/chats', '/profile'];

const DISCOVER: TourStep[] = [
  {
    target: 'tabbar',
    home: TABS,
    title: 'Ana menü',
    text: 'Uygulamanın beş ana bölümü burada: Keşfet, Eşleş, Program, Sohbet ve Profil. Şimdi birlikte sırayla gezeceğiz.',
    fixed: true,
    advance: 'next',
  },
  {
    target: 'tab.index',
    home: TABS,
    title: 'Keşfet',
    text: 'İlk durak Keşfet. Vurgulanan sekmeye dokun.',
    fixed: true,
    advance: 'tap',
    route: '/',
    here: 'Zaten Keşfet ekranındasın.',
  },
  {
    target: 'kesfet.search',
    home: '/',
    title: 'Arama',
    text: 'Sporcu veya program aramak için bu çubuğa dokun.',
    advance: 'tap',
    route: '/search',
  },
  {
    target: 'search.input',
    home: '/search',
    title: 'Ara',
    text: 'Buraya en az 2 harf yazınca sporcular ve programlar listelenir. Sonuca dokunarak profiline veya programa gidersin.',
    advance: 'next',
  },
  {
    home: '/search',
    title: 'Geri dön',
    text: 'Keşfet ekranına dönmek için telefonun geri tuşuna bas.',
    advance: 'route',
    route: '/',
  },
  {
    target: 'kesfet.filter',
    home: '/',
    title: 'Akış',
    text: 'Keşfet, sporcuların paylaşımları ve herkese açık programlardan oluşan akıştır. Buradan yalnız gönderileri ya da yalnız programları (spora göre) görebilirsin.',
    advance: 'next',
  },
  {
    target: 'feed.fab',
    home: '/',
    title: 'Gönderi paylaş',
    text: 'Bu düğmeyle sen de metin ve fotoğraf paylaşırsın. Paylaşımlar beğenilebilir ve yorumlanabilir.',
    fixed: true,
    advance: 'next',
  },
  {
    target: 'kesfet.bell',
    home: '/',
    title: 'Bildirimler',
    text: 'Eşleşme, mesaj, takip ve beğeni bildirimlerin için zil simgesine dokun.',
    advance: 'tap',
    route: '/notifications',
  },
  {
    home: '/notifications',
    title: 'Bildirim listesi',
    text: 'Tüm bildirimlerin burada, açınca okundu olur. Bir bildirime dokununca ilgili ekrana (sohbet, profil, etkinlik…) gidersin. Telefonuna da anlık bildirim gelir.',
    advance: 'next',
  },
  {
    home: '/notifications',
    title: 'Geri dön',
    text: 'Keşfet ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/',
  },
];

const MATCH: TourStep[] = [
  {
    target: 'tab.match',
    home: TABS,
    title: 'Canlı eşleşme',
    text: 'Şimdi Eşleş sekmesine dokun.',
    fixed: true,
    advance: 'tap',
    route: '/match',
    here: 'Zaten Eşleş ekranındasın.',
  },
  {
    target: 'match.sports',
    home: '/match',
    title: 'Spor ve mesafe',
    text: 'Eşleşmek istediğin sporlara dokunarak seç, altından ne kadar uzağa kadar aranacağını (1-25 km) belirle.',
    advance: 'next',
  },
  {
    target: 'match.start',
    home: '/match',
    title: 'Eşleşmeyi başlat',
    text: 'Yakındaki biri bulununca iki taraf da onaylar; tam konumlar ancak o zaman paylaşılır. Tanıtımda basmana gerek yok.',
    advance: 'next',
  },
  {
    target: 'match.events',
    home: '/match',
    title: 'Planlı etkinlikler',
    text: 'Hemen eşleşmek yerine planlı buluşmalar da var. Vurgulanan karta dokun.',
    advance: 'tap',
    route: '/events',
  },
  {
    target: 'events.fab',
    home: '/events',
    title: 'Etkinlikler',
    text: 'Üstten il seçip o ildeki etkinlikleri görür, katılırsın. Bu düğmeyle kendi etkinliğini (yer, gün, saat, kontenjan) oluşturursun.',
    fixed: true,
    advance: 'next',
  },
  {
    home: '/events',
    title: 'Geri dön',
    text: 'Eşleş ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/match',
  },
];

const PROGRAM: TourStep[] = [
  {
    target: 'tab.programs',
    home: TABS,
    title: 'Program',
    text: 'Şimdi Program sekmesine dokun. Antrenmanını burada planlayıp takip edersin.',
    fixed: true,
    advance: 'tap',
    route: '/programs',
    here: 'Zaten Program ekranındasın.',
  },
  {
    target: 'programs.summary',
    home: '/programs',
    title: 'Özetin',
    text: 'Seri (art arda antrenman günü), toplam antrenman ve program sayın. Antrenman kaydettikçe güncellenir.',
    advance: 'next',
  },
  {
    target: 'programs.add',
    home: '/programs',
    title: 'Program oluştur',
    text: 'Bu düğmeyle günlerden ve egzersizlerden oluşan bir program kurarsın. "Herkese açık" programları başkaları görüp kopyalayabilir.',
    fixed: true,
    advance: 'next',
  },
  {
    target: 'programs.list',
    home: '/programs',
    title: 'Programların',
    text: 'Bir programı açınca "Antrenman Kaydet" ile yaptığını girersin; ilerleme grafiğin ve rekorların orada. "Kaydettiklerim" başkalarından kaydettiklerin.',
    advance: 'next',
  },
  {
    target: 'programs.leaderboard',
    home: '/programs',
    title: 'Liderlik',
    text: 'Son 7 günün en düzenli sporcuları; tüm kullanıcılar ya da yalnız ilindekiler.',
    advance: 'next',
  },
  {
    target: 'programs.challenges',
    home: '/programs',
    title: 'Meydan okuma',
    text: 'Süreli hedeflere (ör. 30 günde 12 antrenman) katıl ya da kendininkini başlat; tamamlayınca rozet kazanırsın.',
    advance: 'next',
  },
];

const CHAT: TourStep[] = [
  {
    target: 'tab.chats',
    home: TABS,
    title: 'Sohbet',
    text: 'Şimdi Sohbet sekmesine dokun.',
    fixed: true,
    advance: 'tap',
    route: '/chats',
    here: 'Zaten Sohbet ekranındasın.',
  },
  {
    target: 'chats.header',
    home: '/chats',
    title: 'Mesajların',
    text: 'Eşleştiğin ve sohbet isteğini kabul ettiğin sporcularla konuşmaların burada listelenir. Okunmamış mesajların sayısı başlıkta ve konuşmanın yanında rozetle görünür.',
    advance: 'next',
  },
  {
    target: 'chats.body',
    home: '/chats',
    title: 'Konuşmalar ve istekler',
    text: 'Bir konuşmaya dokununca mesajlaşırsın: yaz, gönder, mesajlar gerçek zamanlı gelir. Biri sana sohbet isteği gönderirse listenin başında "Sohbet istekleri" kutusu çıkar; Kabul et veya Reddet dersin.',
    advance: 'next',
  },
  {
    home: '/chats',
    title: 'Sohbete nasıl başlarım?',
    text: 'İki yolu var: Eşleş sekmesinde biriyle eşleşip onaylayınca sohbet açılır, ya da bir sporcunun profilindeki "Mesaj" düğmesiyle sohbet isteği gönderirsin. Uygunsuz birini her zaman şikayet edebilir veya engelleyebilirsin.',
    advance: 'next',
  },
];

const PROFILE: TourStep[] = [
  {
    target: 'tab.profile',
    home: TABS,
    title: 'Profil',
    text: 'Şimdi Profil sekmesine dokun.',
    fixed: true,
    advance: 'tap',
    route: '/profile',
    here: 'Zaten Profil ekranındasın.',
  },
  {
    target: 'profile.card',
    home: '/profile',
    title: 'Profil kartın',
    text: 'Adın, takipçilerin ve seviyen burada. Sayfanın en altında gönderilerin ve programların listelenir.',
    advance: 'next',
  },
  {
    target: 'profile.stats',
    home: '/profile',
    title: 'İstatistikler',
    text: 'Program, antrenman, eşleşme ve aldığın beğeni sayıların.',
    advance: 'next',
  },
  {
    target: 'profile.heatmap',
    home: '/profile',
    title: 'Aktivite haritası',
    text: 'Son bir yıldaki antrenman günlerin; koyu kareler yoğun günlerdir.',
    advance: 'next',
  },
  {
    target: 'profile.badges',
    home: '/profile',
    title: 'Rozetler',
    text: 'Kazandığın ve kazanabileceğin rozetler. Bölüme dokunursan her rozetin koşulunu görürsün.',
    advance: 'next',
  },
  {
    target: 'profile.edit',
    home: '/profile',
    title: 'Profili düzenle',
    text: 'Fotoğrafını, ilini, tanıtım yazını, hedeflerini ve sporlarını buradan güncellersin.',
    advance: 'next',
  },
  {
    target: 'profile.settings',
    home: '/profile',
    title: 'Ayarlar',
    text: 'Tema, bildirim ayarları, gizli hesap, engellenenler, parola ve hesap silme Ayarlar’da. Bu tanıtımı da oradan yeniden başlatabilirsin.',
    advance: 'next',
  },
];

/** Her turun sonunda tek bir kapanış kartı. */
const END: TourStep = {
  home: TABS,
  title: 'Hazırsın! 🎉',
  text: 'Tanıtım bitti. İstediğin zaman Ayarlar > Yardım\'dan tamamını ya da tek bir bölümü yeniden izleyebilirsin.',
  advance: 'next',
};

export const TOURS: Record<TourId, TourStep[]> = {
  discover: [...DISCOVER, END],
  match: [...MATCH, END],
  program: [...PROGRAM, END],
  chat: [...CHAT, END],
  profile: [...PROFILE, END],
  all: [...DISCOVER, ...MATCH, ...PROGRAM, ...CHAT, ...PROFILE, END],
};

export const TOUR_TITLES: Record<TourId, string> = {
  all: 'Tüm tanıtımı başlat',
  discover: 'Keşfet turu',
  match: 'Eşleş ve etkinlikler turu',
  program: 'Program, liderlik ve meydan okuma turu',
  chat: 'Sohbet turu',
  profile: 'Profil ve ayarlar turu',
};
