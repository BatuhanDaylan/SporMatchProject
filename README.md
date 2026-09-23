# SporMatch

Sporcuların sosyalleşmesi ve **konum bazlı canlı eşleşme** ile birlikte spor
yapması için çapraz platform (iOS + Android) mobil uygulama.

## Özellikler

- 🔐 **Auth & profil** — e-posta ile giriş, onboarding, spor & seviye seçimi, avatar, rozetler
- ⚡ **Canlı eşleşme** — spor + yarıçap seç, yakındaki sporcuyla eşleş; **konum yalnız iki taraf
  onaylayınca** paylaşılır (PostGIS `ST_DWithin`); ücretsiz katmanda günlük limit, **SporMatch Pro**
  ile sınırsız (limit altyapısı hazır, gerçek satın alma RevenueCat/Play Console entegrasyonu bekliyor)
- 📅 **Planlı etkinlikler** — herkese açık buluşma etkinlikleri oluştur/katıl, gömülü harita (Leaflet +
  OpenStreetMap, API anahtarı gerektirmez)
- 🏋️ **Programlar** — yapılandırılabilir antrenman programı (gün/egzersiz/özel alanlar), takip, ilerleme
  grafiği, ısı-haritası, kaydetme/forklama
- 🔎 **Keşfet** — herkese açık programları ve akış gönderilerini keşfet (Keşfet/Takip modu), arama
- 📰 **Akış** — gönderi paylaş, beğen, yorum yap
- 🏆 **Meydan okuma & liderlik** — hedef bazlı meydan okumalar (antrenman sayısı/aktif gün), sıralama
- 💬 **Sohbet** — eşleşenler arası realtime mesajlaşma, sohbet istekleri, okunmamış sayacı
- 🔔 **Bildirimler** — realtime uygulama-içi bildirimler + push (Expo push, dev build ile)
- 🛡️ **Moderasyon** — Türkçe küfür/argo filtreleme, rate limiting, kullanıcı raporlama, engelleme,
  admin paneli (temel)

## Teknoloji

React Native (Expo SDK 57) · TypeScript · Expo Router · Supabase (Postgres + PostGIS + Auth +
Realtime + Storage) · TanStack Query · Zustand · react-native-webview (harita) · react-native-svg

## Kurulum

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL ve _ANON_KEY'i doldur
npm start              # sonra 'a' (Android) / 'i' (iOS)
```

Uygulama `expo-dev-client` kullanır (push bildirimleri gibi native modüller için) — `npx expo run:android`
/ `npx expo run:ios` ile bir kere dev build alman gerekir; sonrasında `npm start` ile normal geliştirme
döngüsü çalışır.

## Veritabanı (migration)

Şema `supabase/migrations/*.sql` içinde (36 migration), idempotent yazılmış — tekrar çalıştırmak
güvenlidir. Uygulamak için:

```bash
node supabase/migrate.mjs
```

Bağlantı `supabase/.env` içindeki `SUPABASE_DB_URL`'den okunur (git'e gitmez, `supabase/.env.example`'dan
kopyala). Session pooler (5432) kullan.

## Proje yapısı

```
src/
  app/          Expo Router ekranları: (auth), (tabs) [Keşfet/Eşleş/Program/Sohbet/Profil],
                event/, challenge/, program/, chat/, post/, user/, match/[id] ...
  components/   Paylaşılan UI kiti (button, card, chip, avatar, screen, async-state, icon-button,
                person-row, badge, meta-row, segment, alert-host ...) + harita, ısı-haritası, grafik
  hooks/        useProfile, usePrograms, useDiscover, useFeed, useEvents, useMatch, useChallenges,
                useChat, useNotifications, useFollow, useModeration, usePro ...
  lib/          supabase, auth, queryClient, authErrors, errorMessage, moderation, avatar, push, datetime
  constants/    theme (renk/tipografi/spacing token'ları), tr-cities, profile-options
  types/        database (Supabase tipleri), program (şablon domain tipleri)
supabase/
  migrations/   0001..0036 SQL (auth, programlar, eşleşme, sohbet, etkinlik, akış, meydan okuma,
                liderlik, moderasyon, Pro entitlement ...)
  migrate.mjs   migration runner (pg)
```

## SporMatch Pro (uygulama içi satın alma)

Ücretsiz katmanda günlük eşleşme başlatma limiti sunucu tarafında (`start_match_session` RPC) zaten
uygulanmış ve doğrulanmış durumda. Gerçek satın alma akışı (RevenueCat + Google Play Billing) için
Play Console geliştirici hesabı ve RevenueCat hesabı açılması bekleniyor — kod tarafı bu adım için hazır.

## Test

Backend akışları `@supabase/supabase-js` ile uçtan uca doğrulandı (auth, RLS, eşleşme, sohbet, moderasyon,
push pipeline). Emulator'da: `npm start` → `a`.
