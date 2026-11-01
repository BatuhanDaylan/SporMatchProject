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
    target: 'kesfet.programs',
    home: '/',
    title: 'Programlar',
    text: 'Herkese açık antrenman programları burada. "Herkes" yeni programları, "Takip ettiklerim" takip ettiğin kişilerinkini gösterir. Bir programı açıp beğenebilir, kaydedebilir, yorum yapabilir ve kendi hesabına kopyalayabilirsin.',
    advance: 'next',
  },
  {
    target: 'kesfet.feed-all',
    home: '/',
    title: 'Akış',
    text: 'Akış, sporcuların kısa paylaşımlarıdır. "Tümünü Gör"e dokun.',
    advance: 'tap',
    route: '/feed',
  },
  {
    target: 'feed.fab',
    home: '/feed',
    title: 'Gönderi paylaş',
    text: 'Bu düğmeyle sen de metin ve fotoğraf paylaşırsın. Paylaşımlar beğenilebilir ve yorumlanabilir.',
    fixed: true,
    advance: 'next',
  },
  {
    home: '/feed',
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
    title: 'Sporlarını seç',
    text: 'Eşleşmek istediğin sporlara dokunarak seç/kaldır. Kartlar profilindeki sporlardan gelir.',
    advance: 'next',
  },
  {
    target: 'match.radius',
    home: '/match',
    title: 'Mesafe',
    text: 'Yakınında ne kadar uzağa kadar aranacağını seç (1 ile 25 km).',
    advance: 'next',
  },
  {
    target: 'match.start',
    home: '/match',
    title: 'Eşleşmeyi başlat',
    text: 'Hazır olunca bu düğmeye basarsın; yakındaki biri bulununca iki taraf da onaylar ve ancak o zaman tam konumlar paylaşılır. Tanıtımda basmana gerek yok (günlük hakkın harcanmaz).',
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
    target: 'events.tabs',
    home: '/events',
    title: 'Etkinlik listeleri',
    text: '"Şehrimde" seçtiğin ildeki etkinlikleri, "Benimkiler" katıldığın veya oluşturduğun etkinlikleri gösterir.',
    advance: 'next',
  },
  {
    target: 'events.city',
    home: '/events',
    title: 'İl seçimi',
    text: 'Hangi ildeki etkinlikleri görmek istediğini buradan seçersin (profilindeki il varsayılandır).',
    advance: 'next',
  },
  {
    target: 'events.fab',
    home: '/events',
    title: 'Etkinlik oluştur',
    text: 'Kendi etkinliğini oluşturmak için bu düğmeye dokun. Tanıtımda formu sadece gezeceğiz, kayıt yapmayacağız.',
    fixed: true,
    advance: 'tap',
    route: '/event/create',
  },
  {
    target: 'event.basics',
    home: '/event/create',
    title: 'Başlık ve yer',
    text: 'Etkinliğe bir ad ver ve buluşma yerinin adını yaz (ör. "Maçka Parkı girişi").',
    advance: 'next',
  },
  {
    target: 'event.sport',
    home: '/event/create',
    title: 'Spor',
    text: 'Etkinliğin hangi spor için olduğunu seç (isteğe bağlı).',
    advance: 'next',
  },
  {
    target: 'event.when',
    home: '/event/create',
    title: 'Gün ve saat',
    text: 'Dokununca takvim ve saat tekerleği açılır. Geçmiş bir zaman seçilemez.',
    advance: 'next',
  },
  {
    target: 'event.capacity',
    home: '/event/create',
    title: 'Kontenjan',
    text: 'Katılımcı sınırını belirle; "Sınırsız" da seçebilirsin.',
    advance: 'next',
  },
  {
    target: 'event.city',
    home: '/event/create',
    title: 'Şehir',
    text: 'Etkinliğin hangi ilde görüneceğini seç. Böylece o ildeki sporcular onu bulur.',
    advance: 'next',
  },
  {
    target: 'event.map',
    home: '/event/create',
    title: 'Buluşma noktası',
    text: 'Haritadan buluşma noktasını seçersin; ara, dokun ya da işareti sürükle. Etkinlik herkese açık olduğu için halka açık bir yer seç.',
    advance: 'next',
  },
  {
    target: 'event.submit',
    home: '/event/create',
    title: 'Oluştur',
    text: 'Alanları doldurunca buradan oluşturursun. Tanıtımda kaydetmene gerek yok; sadece geri dönebilirsin.',
    advance: 'next',
  },
  {
    home: '/event/create',
    title: 'Geri dön',
    text: 'Etkinlik listesine dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/events',
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
    text: 'Seri (art arda antrenman günü), toplam antrenman ve program sayın burada. Antrenman kaydettikçe güncellenir.',
    advance: 'next',
  },
  {
    target: 'programs.add',
    home: '/programs',
    title: 'Program oluştur',
    text: 'Yeni bir antrenman programı için bu düğmeye dokun. Tanıtımda formu sadece gezeceğiz, kayıt yapmayacağız.',
    fixed: true,
    advance: 'tap',
    route: '/program/edit',
  },
  {
    target: 'pedit.basics',
    home: '/program/edit',
    title: 'Başlık ve açıklama',
    text: 'Programa bir ad ver (ör. "Push Pull Legs") ve istersen kısa bir açıklama ekle.',
    advance: 'next',
  },
  {
    target: 'pedit.sport',
    home: '/program/edit',
    title: 'Spor ve görünürlük',
    text: 'Programın hangi spor için olduğunu seç. "Herkese açık" programı herkes Keşfet\'te görüp kopyalayabilir; "Gizli" yalnızca sende kalır.',
    advance: 'next',
  },
  {
    target: 'pedit.addday',
    home: '/program/edit',
    title: 'Günler ve egzersizler',
    text: 'Programı günlerle kurarsın (ör. "Push", "Pull"). Her güne egzersiz ekler; egzersize ağırlık, tekrar, süre, mesafe gibi alanlar ve not eklersin. Günleri ve egzersizleri sıralayabilir, kopyalayabilir, silebilirsin.',
    advance: 'next',
  },
  {
    target: 'pedit.submit',
    home: '/program/edit',
    title: 'Oluştur',
    text: 'En az bir gün ekleyince programı buradan kaydedersin. Tanıtımda kaydetmene gerek yok.',
    advance: 'next',
  },
  {
    home: '/program/edit',
    title: 'Geri dön',
    text: 'Program ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/programs',
  },
  {
    target: 'programs.list',
    home: '/programs',
    title: 'Programların',
    text: '"Programlarım" kendi programların, "Kaydettiklerim" Keşfet\'ten kaydettiklerin. Bir programı açınca "Antrenman Kaydet" ile yaptığın antrenmanı girersin; ilerleme grafiğin, kişisel rekorların, beğeni ve yorumlar o ekranda.',
    advance: 'next',
  },
  {
    target: 'programs.leaderboard',
    home: '/programs',
    title: 'Liderlik',
    text: 'Haftanın en düzenli sporcularını görmek için "Liderlik"e dokun.',
    fixed: false,
    advance: 'tap',
    route: '/leaderboard',
  },
  {
    target: 'leaderboard.scope',
    home: '/leaderboard',
    title: 'Sıralama kapsamı',
    text: '"Herkes" tüm kullanıcıları, "Şehrim" profilindeki ildeki sporcuları sıralar. Sıralama son 7 günün düzenliliğine göre yapılır; altta kendi sıran görünür.',
    advance: 'next',
  },
  {
    home: '/leaderboard',
    title: 'Geri dön',
    text: 'Program ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/programs',
  },
  {
    target: 'programs.challenges',
    home: '/programs',
    title: 'Meydan okuma',
    text: 'Süreli hedeflere katılmak veya kendi meydan okumanı başlatmak için "Meydan okuma"ya dokun.',
    advance: 'tap',
    route: '/challenges',
  },
  {
    target: 'challenges.tabs',
    home: '/challenges',
    title: 'Meydan okumalar',
    text: '"Aktif" herkese açık sürmekte olanları, "Benimkiler" katıldıklarını gösterir. Birine dokununca ilerleme sıralamasını görür, katılabilir veya ayrılabilirsin. Hedefi tamamlayınca rozet kazanırsın.',
    advance: 'next',
  },
  {
    target: 'challenges.fab',
    home: '/challenges',
    title: 'Meydan okuma oluştur',
    text: 'Kendi meydan okumanı başlatmak için bu düğmeye dokun. Tanıtımda formu sadece gezeceğiz.',
    fixed: true,
    advance: 'tap',
    route: '/challenge/create',
  },
  {
    target: 'ccreate.basics',
    home: '/challenge/create',
    title: 'Başlık ve ölçüt',
    text: 'Meydan okumaya ad ver ve neyin sayılacağını seç: "Antrenman sayısı" veya "Aktif gün".',
    advance: 'next',
  },
  {
    target: 'ccreate.goal',
    home: '/challenge/create',
    title: 'Hedef ve süre',
    text: 'Hedefi (kaç antrenman/gün) ve süreyi (kaç gün) seç. İlerleme, kaydettiğin antrenmanlardan otomatik sayılır.',
    advance: 'next',
  },
  {
    target: 'ccreate.submit',
    home: '/challenge/create',
    title: 'Başlat',
    text: 'Buradan meydan okumayı başlatırsın; herkes görüp katılabilir. Tanıtımda kaydetmene gerek yok.',
    advance: 'next',
  },
  {
    home: '/challenge/create',
    title: 'Geri dön',
    text: 'Meydan okumalar listesine dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/challenges',
  },
  {
    home: '/challenges',
    title: 'Geri dön',
    text: 'Program ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/programs',
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
    text: 'İki yolu var: Eşleş sekmesinde biriyle eşleşip onaylayınca sohbet açılır, ya da bir sporcunun profilinden sohbet isteği gönderirsin. Uygunsuz birini her zaman şikayet edebilir veya engelleyebilirsin.',
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
    target: 'profile.bell',
    home: '/profile',
    title: 'Bildirimler',
    text: 'Eşleşme, mesaj, takip ve beğeni bildirimlerin için zil simgesine dokun.',
    fixed: true,
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
    text: 'Profil ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/profile',
  },
  {
    target: 'profile.card',
    home: '/profile',
    title: 'Profil kartın',
    text: 'Adın, kullanıcı adın, deneyim seviyen, konumun ve varsa serin burada. Takipçi ve takip sayılarına dokunarak kişi listelerine ulaşırsın.',
    advance: 'next',
  },
  {
    target: 'profile.stats',
    home: '/profile',
    title: 'İstatistikler',
    text: 'Program, antrenman, eşleşme ve yorum sayıların. Bunlar rozetlerin ve liderliğin temelidir.',
    advance: 'next',
  },
  {
    target: 'profile.sports',
    home: '/profile',
    title: 'Sporların',
    text: 'Eşleşmede ve etkinliklerde kullandığın sporlar buradan gelir. Hedeflerin ve müsaitliğin de (doldurduysan) bu bölümde görünür.',
    advance: 'next',
  },
  {
    target: 'profile.heatmap',
    home: '/profile',
    title: 'Aktivite haritası',
    text: 'Son bir yıldaki antrenman günlerin. Koyu kareler çok antrenman yaptığın günlerdir.',
    advance: 'next',
  },
  {
    target: 'profile.badges',
    home: '/profile',
    title: 'Rozetler',
    text: 'Kazandığın ve kazanabileceğin rozetler burada. Detay için bölüme dokun.',
    advance: 'tap',
    route: '/badges',
  },
  {
    home: '/badges',
    title: 'Rozet listesi',
    text: 'Her rozetin koşulu ve ilerleme çubuğu var (ör. "10 antrenman kaydet"). Koşulu tamamlayınca rozet açılır.',
    advance: 'next',
  },
  {
    home: '/badges',
    title: 'Geri dön',
    text: 'Profil ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/profile',
  },
  {
    target: 'profile.pro',
    home: '/profile',
    title: 'SporMatch Pro',
    text: 'Pro, günlük eşleşme sınırını kaldıracak. Satın alma henüz aktif değil; hazır olunca buradan duyurulacak.',
    advance: 'next',
  },
  {
    target: 'profile.edit',
    home: '/profile',
    title: 'Profili düzenle',
    text: 'Bilgilerini güncellemek için bu düğmeye dokun. Tanıtımda formu sadece gezeceğiz.',
    advance: 'tap',
    route: '/profile-edit',
  },
  {
    target: 'pe.basics',
    home: '/profile-edit',
    title: 'Temel bilgiler',
    text: 'Fotoğrafını, görünen adını, ilini ve ilçeni, kısa tanıtım yazını buradan düzenlersin. İl bilgisi etkinlik ve liderlikte kullanılır.',
    advance: 'next',
  },
  {
    target: 'pe.level',
    home: '/profile-edit',
    title: 'Seviye',
    text: 'Deneyim seviyeni (Başlangıç, Orta, İleri) seç; eşleştiğin kişi bunu görür.',
    advance: 'next',
  },
  {
    target: 'pe.lists',
    home: '/profile-edit',
    title: 'Hedef, müsaitlik ve sporlar',
    text: 'Hedeflerini, antrenman yapabildiğin zamanları ve sporlarını seç. Sporlar eşleşmede kullanılır, en az birini seçmelisin.',
    advance: 'next',
  },
  {
    target: 'pe.save',
    home: '/profile-edit',
    title: 'Kaydet',
    text: 'Değişiklikleri buradan kaydedersin. Tanıtımda kaydetmene gerek yok.',
    advance: 'next',
  },
  {
    home: '/profile-edit',
    title: 'Geri dön',
    text: 'Profil ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/profile',
  },
  {
    target: 'profile.settings',
    home: '/profile',
    title: 'Ayarlar',
    text: 'Ayarlar\'a dokun.',
    advance: 'tap',
    route: '/settings',
  },
  {
    target: 'settings.theme',
    home: '/settings',
    title: 'Görünüm',
    text: 'Açık, koyu veya telefonunun ayarını izleyen "Sistem" temasını seç.',
    advance: 'next',
  },
  {
    target: 'settings.help',
    home: '/settings',
    title: 'Yardım',
    text: 'Bu tanıtımı veya bölüm turlarını istediğin zaman buradan yeniden başlatabilirsin.',
    advance: 'next',
  },
  {
    target: 'settings.safety',
    home: '/settings',
    title: 'Gizlilik ve güvenlik',
    text: 'Engellediğin kullanıcıları buradan görür, engeli kaldırırsın. Bir kullanıcıyı veya içeriği, profilinden/gönderisinden şikayet edebilirsin; tam konumun yalnızca iki taraf onaylayınca paylaşılır.',
    advance: 'next',
  },
  {
    target: 'settings.account',
    home: '/settings',
    title: 'Hesap',
    text: 'Çıkış yapabilir veya hesabını kalıcı olarak silebilirsin (tüm verilerin silinir, geri alınamaz). Gizlilik Politikası ve Kullanım Şartları da bu ekranda.',
    advance: 'next',
  },
  {
    home: '/settings',
    title: 'Geri dön',
    text: 'Profil ekranına dönmek için geri tuşuna bas.',
    advance: 'route',
    route: '/profile',
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
