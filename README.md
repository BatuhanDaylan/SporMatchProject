# SporMatch

Sporcuların sosyalleşmesi ve **konum bazlı canlı eşleşme** ile birlikte spor yapması için çapraz
platform (iOS + Android) mobil uygulama.

## Özellikler
- 🔐 **Auth & profil** — e-posta ile giriş, onboarding, spor & seviye seçimi, avatar
- 🏋️ **Programlar** — yapılandırılabilir antrenman programı (gün/egzersiz/özel alanlar), takip, ilerleme grafiği
- 🔎 **Keşif & yorum** — herkese açık programları keşfet, realtime yorum yap
- ⚡ **Canlı eşleşme** — spor + yarıçap seç, yakındaki sporcuyla eşleş; **konum yalnız iki taraf onaylayınca** paylaşılır (PostGIS)
- 💬 **Sohbet** — eşleşenler arası realtime mesajlaşma, okunmamış sayacı
- 🔔 **Push** — yeni mesaj / eşleşme / yorum bildirimleri (dev build gerektirir)

## Teknoloji
React Native (Expo SDK 57) · TypeScript · Expo Router · Supabase (Postgres + PostGIS + Auth +
Realtime + Storage) · TanStack Query · Zustand · react-native-svg

## Kurulum
```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL ve _ANON_KEY'i doldur
npm start              # sonra 'a' (Android) / 'i' (iOS)
```

## Veritabanı (migration)
Şema `supabase/migrations/*.sql` içinde, idempotent. Uygulamak için:
```bash
node supabase/migrate.mjs   # veya: npm run migrate
```
Bağlantı `supabase/.env` içindeki `SUPABASE_DB_URL`'den okunur (git'e gitmez). Session pooler (5432) kullan.

## Proje yapısı
```
src/
  app/          Expo Router ekranları ((auth), (tabs), program/, match/, chat/, profile-edit)
  components/   UI kiti (button, text-field, chip, avatar, screen, error-state, chart, comments)
  hooks/        useProfile, usePrograms, useWorkoutLogs, useDiscover, useComments, useMatch, useChat, usePushNotifications
  lib/          supabase, auth, queryClient, authErrors, avatar, push
  types/        database (Supabase tipleri), program (şablon domain tipleri)
supabase/
  migrations/   0001..0007 SQL
  migrate.mjs   migration runner (pg)
```

## Kalan: development build (push + gömülü harita)
Uzak **push** ve **gömülü harita** (react-native-maps) Expo Go'da çalışmaz; aktifleştirmek için:
- Expo hesabı + EAS Build
- Android push için Firebase/FCM kimlik bilgileri (`eas credentials`)
- Gömülü harita için Google Maps API anahtarı
Kod tarafı hazır; yalnız dev build + kimlik bilgileri kurulumu gerekiyor.

## Test
Backend akışları `@supabase/supabase-js` ile uçtan uca doğrulandı (auth, RLS, eşleşme, sohbet, push
pipeline). Emulator'da: `npm start` → `a`.
