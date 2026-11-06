// Uygulama içi yasal metinler (legal/index.html ile aynı içerik; iki belge ayrı sayfalarda gösterilir).
export type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

const CONTACT = 'batuhandaylan5@gmail.com';

export const PRIVACY: LegalDoc = {
  title: 'Gizlilik Politikası',
  updated: 'Son güncelleme: 6 Kasım 2026 · Veri sorumlusu: SporMatch (Batuhan Daylan) · İletişim: ' + CONTACT,
  intro:
    'Bu politika, SporMatch mobil uygulamasını ("Uygulama") kullandığında hangi kişisel verilerini işlediğimizi, nasıl kullandığımızı ve haklarını açıklar. Uygulamayı kullanarak bu politikayı kabul etmiş olursun.',
  sections: [
    {
      title: '1. İşlediğimiz veriler',
      bullets: [
        'Hesap: e-posta adresi, şifre (şifrelenmiş olarak kimlik sağlayıcıda tutulur).',
        'Profil: görünen ad, kullanıcı adı, hakkında, profil fotoğrafı, seviye, hedefler, müsaitlik, sporlar, il/ilçe, hesap gizliliği (açık/gizli).',
        'Konum: profilinde belirttiğin yaklaşık konum (il/ilçe). Kesin konum (koordinat) yalnızca eşleşme başlattığında alınır, mesafe hesaplamak için kullanılır ve yalnızca karşılıklı onaydan sonra eşleştiğin kişiyle paylaşılır.',
        'İçerik: antrenman programları ve kayıtları, gönderiler ve fotoğrafları, yorumlar ve yanıtlar, mesajlar, beğeni/kaydetme, takip ilişkileri ve takip istekleri.',
        'Cihaz/teknik: bildirim (push) jetonu, platform bilgisi, kullanım kayıtları.',
        'Güvenlik: engellediğin kullanıcılar, gönderdiğin şikayetler.',
      ],
    },
    {
      title: '2. Verileri ne için kullanıyoruz',
      bullets: [
        'Hesabını oluşturmak ve oturumunu yönetmek.',
        'Konuma göre eşleşme sağlamak (temel işlev).',
        'Program/antrenman takibi, sosyal etkileşim ve bildirimler.',
        'Güvenlik, kötüye kullanım önleme ve içerik moderasyonu (küfür, telefon numarası ve bağlantı paylaşımı otomatik engellenir).',
        'Yasal yükümlülüklerin yerine getirilmesi.',
      ],
    },
    {
      title: '3. Hukuki dayanak (KVKK / GDPR)',
      paragraphs: [
        'Verilerini; sözleşmenin ifası, açık rızan (kesin konum, bildirim), meşru menfaat (güvenlik) ve yasal yükümlülük temellerine dayanarak işleriz.',
      ],
    },
    {
      title: '4. Paylaşım',
      bullets: [
        'Kişisel verilerini üçüncü taraflara satmayız.',
        'Diğer kullanıcılar: profil bilgilerin ve herkese açık içeriğin görülebilir. Hesabını gizli yaparsan gönderilerini, programlarını ve antrenman geçmişini yalnızca onayladığın takipçilerin görür.',
        'Kesin konum yalnızca karşılıklı onaylı eşleşmede paylaşılır.',
        'Hizmet sağlayıcılar: barındırma/kimlik/gerçek zamanlı altyapı için Supabase (sunucular AWS eu-west-1 / İrlanda); bildirim için Expo ve Google Firebase Cloud Messaging. Veriler yalnızca hizmeti sunmak için işlenir.',
      ],
    },
    {
      title: '5. Uluslararası aktarım',
      paragraphs: ['Veriler AB (İrlanda) bölgesinde barındırılır; Türkiye dışına aktarım uygun güvencelerle yapılır.'],
    },
    {
      title: '6. Saklama ve silme',
      paragraphs: [
        'Verilerini hesabın aktif olduğu sürece saklarız. Ayarlar → Hesabı sil ile hesabın ve ilişkili tüm verilerin (yüklediğin fotoğraflar dahil) kalıcı olarak silinir. Silme talebini ' +
          CONTACT +
          ' adresine de iletebilirsin.',
      ],
    },
    {
      title: '7. Hakların (KVKK m.11 / GDPR)',
      paragraphs: [
        'Verilerine erişme, düzeltme, silme, işlenmesine itiraz ve taşınabilirlik haklarına sahipsin. Talepler için: ' + CONTACT + '.',
      ],
    },
    {
      title: '8. Yaş sınırı',
      paragraphs: ['SporMatch 18 yaş ve üzeri kullanıcılar içindir. 18 yaşından küçüklerin bilerek verisini işlemeyiz.'],
    },
    {
      title: '9. Güvenlik',
      paragraphs: [
        'Erişim denetimi (satır bazlı güvenlik), şifreli iletişim ve içerik moderasyonu gibi önlemler alırız. Hiçbir sistem %100 güvenli değildir.',
      ],
    },
    {
      title: '10. Değişiklikler',
      paragraphs: ['Bu politikayı güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz.'],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Kullanım Şartları',
  updated: 'Son güncelleme: 6 Kasım 2026 · İletişim: ' + CONTACT,
  intro: "SporMatch'i kullanarak bu şartları kabul etmiş olursun. Kabul etmiyorsan Uygulamayı kullanma.",
  sections: [
    {
      title: '1. Uygunluk',
      paragraphs: ['Uygulamayı kullanmak için en az 18 yaşında olmalısın. Doğru ve güncel bilgi vermeyi kabul edersin.'],
    },
    {
      title: '2. Hesabın',
      paragraphs: ['Hesap güvenliğinden sen sorumlusun. Başkasının kimliğine bürünemez, sahte hesap açamazsın.'],
    },
    {
      title: '3. Kabul edilebilir kullanım',
      bullets: [
        'Taciz, tehdit, nefret söylemi, küfür, müstehcen veya yasa dışı içerik paylaşamazsın.',
        'Güvenliğin için telefon numarası, bağlantı veya site adresi paylaşamazsın; bunlar otomatik olarak engellenir.',
        'Başkalarının bilgilerini izinsiz paylaşamaz, taciz amaçlı takip edemezsin.',
        'Spam, dolandırıcılık, kötü amaçlı yazılım veya otomatik/istismarcı kullanım yasaktır.',
        'Reşit olmayanlara yönelik veya cinsel içerikli davranış yasaktır.',
      ],
      paragraphs: ['Uygunsuz içerik engellenebilir ve hesabın askıya alınabilir/kapatılabilir.'],
    },
    {
      title: '4. Kullanıcı içeriği',
      paragraphs: [
        'Paylaştığın içerik sana aittir; Uygulamada gösterebilmemiz için sınırlı, telifsiz bir kullanım lisansı verirsin. İçeriğinden sen sorumlusun.',
      ],
    },
    {
      title: '5. Eşleşme, etkinlik ve yüz yüze buluşma — ÖNEMLİ',
      paragraphs: [
        'Tanımadığın kişilerle eşleşebilir, planlı etkinliklere katılabilir ve buluşabilirsin. Buluşmalar tamamen kendi sorumluluğundadır; SporMatch kullanıcıların kimliğini/geçmişini doğrulamaz.',
        'Güvenlik için: ilk buluşmaları halka açık yerlerde yap, yakınlarını bilgilendir, rahatsız edici durumda kişiyi engelle/şikayet et ve gerekirse yetkililere başvur. Etkinlik sahibi, katılımcıları etkinlikten çıkarabilir.',
      ],
    },
    {
      title: '6. Sorumluluğun sınırlandırılması',
      paragraphs: [
        'Uygulama "olduğu gibi" sunulur. Yasaların izin verdiği ölçüde, kullanımdan veya kullanıcılar arası etkileşimlerden (buluşmalar dahil) doğan zararlardan sorumlu değiliz.',
      ],
    },
    {
      title: '7. Fesih',
      paragraphs: ['Şartları ihlal edersen hesabın askıya alınabilir/kapatılabilir. Sen de dilediğin zaman hesabını silebilirsin.'],
    },
    {
      title: '8. Uygulanacak hukuk',
      paragraphs: ['Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir.'],
    },
  ],
};
