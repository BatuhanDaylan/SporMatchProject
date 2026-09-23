# SporMatch — Play Store Yayın Hazırlığı

Durum: 2026-08-17. Kod tarafı (tasarım, IA, moderasyon, hesap silme) yayın için hazır. Kalan işler
büyük ölçüde Play Console'da senin yapman gereken adımlar + iki dış kaynak (GitHub Pages, Play
Console hesabı). Bu dosya sırayla ne yapman gerektiğini ve hazır metinleri içeriyor.

## Zaten hazır olanlar
- Hesap silme: uygulama içinde Ayarlar → Hesabı sil (Play'in zorunlu tuttuğu özellik) ✅
- Gizlilik politikası + Kullanım şartları metni: `legal/` klasöründe yazılı, sadece yayınlanması lazım
- Konum kullanımı gerekçeli ve net (yalnız eşleşme sırasında, onay öncesi sadece mesafe) ✅
- Kullanılmayan izinler kapatıldı: `app.json`'da `cameraPermission: false`, `microphonePermission: false`
  eklendi (uygulama yalnız galeriden fotoğraf seçiyor, kamera/mikrofon hiç kullanılmıyor)
- **İnceleme (reviewer) test hesabı** oluşturuldu ve e-postası onaylandı:
  - E-posta: `playstore.reviewer@spormatch.app`
  - Şifre: `PlayReview2026!`
  - Bu bilgileri Play Console'da **App content → App access** bölümüne gireceksin (Adım 6).

---

## Adım 1 — Google Play Console hesabı (SEN yapmalısın, ödeme + kimlik gerekiyor)

### 1a. Yeni Google (Gmail) hesabı aç
Play Console bir **Google hesabı** ile giriş ister — yeni "e-posta hesabı" dediğin şey pratikte yeni
bir Gmail. Mevcut `batuhandaylan5@gmail.com`'dan ayrı, geliştirici kimliği için özel bir hesap:
1. https://accounts.google.com/signup adresine git (gizli sekmede aç, mevcut hesabınla karışmasın).
2. Ad/soyad, kullanıcı adı (ör. `spormatch.dev` gibi bir şey — bu sadece giriş adresi, Play Store'da
   görünmez), güçlü bir şifre gir.
3. Telefon doğrulaması iste (SMS kod) — kendi numaranı kullanabilirsin, sorun değil.
4. Kurtarma e-postası olarak `batuhandaylan5@gmail.com`'u eklemeni öneririm (şifre sıfırlama için).
5. Hesap oluşunca **2 adımlı doğrulamayı** (2FA) aç: Google Hesabı → Güvenlik → 2 Adımlı Doğrulama.
   Play Console kimlik doğrulama sürecinde bunu zaten isteyebiliyor, baştan açmak sorun çıkarmaz.

### 1b. Play Console geliştirici kaydı
1. Az önce açtığın YENİ Google hesabıyla oturum açık şekilde https://play.google.com/console/signup
   adresine git.
2. **Hesap türü**: "Kişisel" (Individual) seç — kuruluş (Organization) hesabı D-U-N-S numarası ister,
   çok daha yavaş; tek geliştirici olarak Kişisel yeterli ve önerilir.
3. **Geliştirici adı**: Play Store'da uygulamanın altında **herkese açık** görünecek isim
   (ör. `Batuhan Daylan` ya da bir stüdyo adı `SporMatch Studio`). Sonradan değiştirmek zor/yavaş
   onay gerektirir, bir kere iyi düşün. Bana hangisini seçtiğini söylersen not alırım.
4. İletişim bilgileri: gerçek ad-soyad, adres, telefon — bunlar **kimlik doğrulama** için gerçek ve
   doğru olmalı, Google resmi kimlikle karşılaştırıyor.
5. **25$ tek seferlik kayıt ücreti** — kredi/banka kartıyla öde.
6. **Kimlik doğrulama**: Google artık yeni geliştiricilerden T.C. kimlik/pasaport fotoğrafı ve
   çoğu zaman kısa bir video/selfie doğrulaması istiyor. Bu adım **1-7 gün** sürebilir, bazen daha
   hızlı. Onay e-postasını bekle.
7. Onay e-postası gelince Play Console'a tekrar gir → **"Uygulama oluştur"**:
   - Uygulama adı: `SporMatch`
   - Varsayılan dil: Türkçe
   - Uygulama mı oyun mu: Uygulama
   - Ücretsiz mi ücretli mi: Ücretsiz
8. Bana "uygulama oluşturuldu" de, devam edelim (Adım 2'ye geçeriz).

**Not:** Kimlik doğrulama beklerken Adım 2'yi (GitHub Pages repo'su) paralel yapabilirsin, birbirini
beklemiyor.

## Adım 2 — Gizlilik politikasını yayınlama (GitHub Pages)
Kod `src/constants/legal.ts` içinde şu adresi bekliyor: `https://batuhandaylan.github.io/spormatch-legal/`
1. GitHub'da **yeni, boş** bir repo oluştur: `spormatch-legal` (public olmalı, Pages ücretsiz sadece public repo'da).
   → https://github.com/new adresinden, repo adı tam olarak `spormatch-legal`, README ekleme.
2. Repo oluşunca bana haber ver — ben `legal/` klasöründeki `index.html`'i o repo'nun ana dalına push
   edeceğim (GitHub Pages varsayılan olarak `main` dalının kökünden yayın yapar, Settings → Pages'ten
   "Deploy from branch: main / (root)" seçmen yeterli, birkaç dakika içinde canlıya çıkar).
3. Canlıya çıktıktan sonra `https://batuhandaylan.github.io/spormatch-legal/` adresini tarayıcıda açıp
   doğrula.

*Alternatif:* Zaten sahip olduğun bir domain varsa, `legal/index.html`'i oraya da koyabiliriz —
o zaman `src/constants/legal.ts`'teki `BASE` adresini güncelleriz.

## Adım 3 — Store listing metinleri (hazır, kopyala-yapıştır)

**Kısa açıklama** (max 80 karakter):
```
Sporcularla tanış, canlı eşleş, programını paylaş. Spor sosyal ağın.
```

**Tam açıklama** (max 4000 karakter):
```
SporMatch, spor yapan insanların birbirini bulup birlikte antrenman yapması için sosyal bir platform.

🔎 KEŞFET
Herkese açık antrenman programlarını keşfet, beğen, yorum yap, ilham al. Diğer sporcuların
paylaşımlarını (Akış) takip et.

⚡ CANLI EŞLEŞ
Yaptığın sporu ve mesafeyi seç, yakınındaki sporcularla eşleş. Konumun yalnızca aktivite
başlattığında ve yalnızca karşılıklı onaydan SONRA paylaşılır — onay öncesi sadece mesafe görünür.

📅 PLANLI ETKİNLİKLER
Belirli bir gün/saat için spor etkinliği oluştur, katılımcı topla.

🏋️ PROGRAMLARIM
Kendi antrenman programını oluştur (gün/egzersiz/set/tekrar — tamamen esnek), takip et,
ilerlemeni grafiklerle gör.

🏆 LİDERLİK & MEYDAN OKUMALAR
Diğer sporcularla rekabet et, meydan okumalara katıl, liderlik tablosunda yerini al.

💬 SOHBET
Eşleştiğin veya etkinlikte tanıştığın sporcularla gerçek zamanlı mesajlaş.

🛡️ GÜVENLİK
Uygunsuz içerik ve kullanıcıları şikayet edebilir, engelleyebilirsin. Tüm kullanıcı içeriği
otomatik moderasyondan geçer. Hesabını ve verilerini istediğin an kalıcı olarak silebilirsin.

SporMatch ücretsizdir.
```

**Kategori:** Sağlık ve Zindelik (Health & Fitness) — alternatif: Spor (Sports)
**İletişim e-postası:** batuhandaylan5@gmail.com
**Gizlilik politikası URL:** https://batuhandaylan.github.io/spormatch-legal/#gizlilik (Adım 2 sonrası)

## Adım 4 — Grafik varlıklar
Play Console şunları ister (Store listing → Graphics):

| Varlık | Boyut | Durum |
|---|---|---|
| Uygulama ikonu | 512×512 PNG (32-bit, alfa kanallı) | `assets/images/icon.png` 1024×1024 mevcut — Play Console'a yüklerken 512×512'ye küçültmen lazım (herhangi bir online resizer/Photoshop/GIMP ile 30 saniyelik iş) |
| Feature graphic | 1024×500 PNG/JPG | **Eksik** — tasarlanması lazım (marka rengi turuncu `#F0501A`, logo + slogan) |
| Telefon ekran görüntüleri | En az 2, önerilen 4-8 (min kenar 320px, max 3840px) | **Eksik** — build tamamlanınca emulator/gerçek cihazdan alacağız (Keşfet, Eşleş, Program, Sohbet, Profil ekranlarından birer tane iyi olur) |

Feature graphic ve ekran görüntüleri için ayrı bir tur yapabiliriz — build bitince emulator'da
gezip ekran görüntüsü toplarız, feature graphic'i de o sırada hazırlarım.

## Adım 5 — İçerik derecelendirmesi (IARC anketi) — Play Console'da doldurulacak
Console seni bir anket akışına sokuyor. SporMatch için doğru cevaplar:
- **Kategori:** Sosyal ağ / Yaşam tarzı uygulaması (yayıncılık aracı değil)
- **Şiddet:** Yok
- **Cinsel içerik:** Yok
- **Küfür:** Kullanıcı üretimi içerikte teorik olarak olabilir ama **otomatik filtrelemeyle
  engelleniyor** (`has_banned_words` trigger'ı) — anket "kullanıcı tarafından oluşturulan içerik
  var mı" sorusuna **Evet** de, moderasyon var
- **Kontrolsüz internet erişimi / kullanıcı etkileşimi:** **Evet** — mesajlaşma (sohbet) ve
  konum paylaşımı var → bu genelde uygulamayı **Teen (13+)** bandına götürür
- **Konum paylaşımı:** Evet, kullanıcılar arası (eşleşme onayından sonra)
- **Kullanıcı üretimi içerik paylaşımı (UGC):** Evet — yorum, gönderi, mesaj

Beklenen sonuç: **PEGI 12 / Teen** civarı bir derecelendirme (kesin sonucu anket motoru hesaplar).

## Adım 6 — App content → App access
"Uygulamanın tamamına erişim login gerektiriyor mu?" sorusuna **Evet** de ve reviewer bilgilerini gir:
```
E-posta: playstore.reviewer@spormatch.app
Şifre:   PlayReview2026!
```
Ek not alanına (varsa) şunu ekleyebilirsin: "Hesap normal kayıt akışıyla oluşturuldu ve e-postası
önceden onaylandı, doğrudan giriş yapılabilir."

## Adım 7 — Data safety formu
Console'da **App content → Data safety**. Aşağıdaki tablo neyi neden topladığımızı özetliyor
(hepsi `legal/gizlilik-politikasi.md` ile birebir tutarlı):

| Veri türü | Toplanıyor mu | Amaç | Paylaşılıyor mu | Şifreli mi | Silinebilir mi |
|---|---|---|---|---|---|
| E-posta adresi | Evet | Hesap oluşturma/giriş | Hayır (3. taraf yok) | Evet (transit) | Evet |
| İsim/kullanıcı adı, profil fotoğrafı | Evet | Uygulama işlevi (profil) | Hayır | Evet | Evet |
| Kesin konum | Evet | Uygulama işlevi (eşleştirme) — **yalnız eşleşme başlatıldığında** | Hayır | Evet | Evet |
| Yaklaşık konum (il/ilçe) | Evet | Uygulama işlevi | Hayır | Evet | Evet |
| Mesajlar (sohbet) | Evet | Uygulama işlevi | Hayır | Evet | Evet |
| Fotoğraflar (gönderi/avatar) | Evet | Uygulama işlevi | Hayır | Evet | Evet |
| Kullanıcı içeriği (program, yorum, gönderi) | Evet | Uygulama işlevi | Hayır | Evet | Evet |
| Uygulama etkinliği (beğeni/takip/etkileşim) | Evet | Analitik/işlev iyileştirme | Hayır | Evet | Evet |
| Reklam/pazarlama verisi | **Hayır** | — | — | — | — |
| Ödeme bilgisi | **Hayır** (uygulama ücretsiz, uygulama içi satın alma yok) | — | — | — | — |

Ek beyanlar:
- Veri işleyici: **Supabase** (alt işlemci olarak beyan edebilirsin, kullanıcıya doğrudan
  "satılmıyor/reklamda kullanılmıyor" diye işaretleyeceğiz)
- "Veriler transit sırasında şifreleniyor mu?" → **Evet** (HTTPS/TLS, Supabase varsayılanı)
- "Kullanıcılar veri silmeyi talep edebilir mi?" → **Evet**, uygulama içi (Ayarlar → Hesabı sil)
- "Bu bir çocuklara yönelik uygulama mı?" → **Hayır**

## Adım 8 — Hedef kitle
- Hedef yaş aralığı: **18+** öneriyorum (konum paylaşımı + yabancılarla mesajlaşma içeren bir
  sosyal/eşleştirme uygulaması için en güvenli ve Play politikalarıyla en az sürtüşmeli seçim).
  13-17 yaş grubunu da hedeflemek istersen Play ek çocuk güvenliği/ebeveyn izni gereksinimleri
  getiriyor — büyük ek iş, önerilmez.
- "Çocuklara yönelik içerik mi?" → Hayır

## Adım 9 — Production build (ne zaman istersen başlatırız)
```bash
eas build --platform android --profile production
```
`eas.json`'daki `production` profili zaten `autoIncrement: true` ile versionCode'u otomatik artırıyor,
ek ayar gerekmiyor. Build ~15-20 dk sürer, arka planda takip edebiliriz.

Bittiğinde ya `eas submit --platform android` ile doğrudan Play Console'a (Internal testing track'e)
yüklenir, ya da `.aab` dosyasını indirip Console'dan elle yüklersin.

## Adım 10 — Yayın stratejisi
Önerim: önce **Internal testing** track'ine yükle (anında yayınlanır, sadece eklediğin test
e-postalarına açık), orada bir tur gerçek cihazda dene → sorun yoksa **Production**'a terfi ettir.
İlk production incelemesi Google tarafında genelde birkaç saat–birkaç gün sürebilir.

---

## Sırada ne var
Şu an **sende** olan tek adım: Adım 1 (Play Console hesabı, ödeme) ve Adım 2'deki GitHub repo'sunu
açman. İkisi de tamamlanınca bana haber ver, gizlilik sayfasını yayınlayalım ve production build'i
başlatalım.
