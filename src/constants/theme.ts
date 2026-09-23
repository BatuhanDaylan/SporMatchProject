/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0D12',
    background: '#EEF1F6', // uygulama arka planı (yumuşak gri)
    backgroundElement: '#FFFFFF', // kartlar/yüzeyler
    backgroundSelected: '#E4E8F0',
    textSecondary: '#616774',
    // Vurgu: sıcak turuncu-kırmızı (Strava tarzı, uygulamadaki 🔥 seri/hit/meydan-okuma
    // motifiyle tematik olarak örtüşüyor — jenerik "AI mavisi" #2563EB'nin yerine).
    primary: '#F0501A',
    onPrimary: '#FFFFFF',
    border: '#E2E6EC',
    danger: '#E5484D',
    onDanger: '#FFFFFF',
    success: '#30A46C',
    onSuccess: '#FFFFFF',
    // Alt menü (tab bar) — her iki modda da koyu (slate), aktif ikon vurgu rengiyle uyumlu
    tabBar: '#1E293B',
    tabBarBorder: '#2C3A4F',
    tabBarActive: '#FF8A50',
    tabBarInactive: '#94A3B8',
  },
  dark: {
    text: '#F4F6FA',
    background: '#0B0C0F', // uygulama arka planı (koyu)
    backgroundElement: '#17191E', // kartlar/yüzeyler
    backgroundSelected: '#23262D',
    textSecondary: '#9BA1AC',
    // Koyu zeminde okunurluk için daha açık/sıcak turuncu tonu.
    primary: '#FF7A3D',
    onPrimary: '#2B0E02',
    border: '#282B31',
    danger: '#FF6369',
    // Koyu moddaki danger/success tonları da (primary gibi) açık/parlak, üzerlerine beyaz
    // metin kontrastı düşük kalıyor — onPrimary'deki gibi koyu bir "mürekkep" tonu kullanılır.
    onDanger: '#2B0E02',
    success: '#3DD68C',
    onSuccess: '#2B0E02',
    tabBar: '#1E293B',
    tabBarBorder: '#2C3A4F',
    tabBarActive: '#FF8A50',
    tabBarInactive: '#94A3B8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Ortak tipografi ölçeği — yeni bir metin stiline ihtiyaç olduğunda buradan seçilir,
 * tekil rastgele fontSize sayıları eklenmez. `fontWeight` React Native'in beklediği
 * string literal tipiyle (`as const`) sabitlenir.
 */
export const Type = {
  displayTitle: { fontSize: 28, fontWeight: '800' } as const, // sekme başlıkları (Keşfet, Program…)
  sectionTitle: { fontSize: 17, fontWeight: '700' } as const, // ekran içi bölüm başlıkları
  cardTitle: { fontSize: 16, fontWeight: '700' } as const,
  body: { fontSize: 15, fontWeight: '400' } as const,
  label: { fontSize: 14, fontWeight: '700' } as const, // segment/chip/link/buton metni
  caption: { fontSize: 12, fontWeight: '600' } as const,
  micro: { fontSize: 11, fontWeight: '600' } as const, // ikon altı etiketler
} as const;

/** Form ekranlarındaki (etkinlik/meydan okuma oluşturma) bölüm başlığı — cardTitle + dikey aralık. */
export const FormSection = {
  fontSize: 16,
  fontWeight: '700',
  marginTop: Spacing.three,
  marginBottom: Spacing.one,
} as const;

/**
 * Hafif derinlik — Notion tarzı: belirgin drop-shadow değil, kenarlıkla (border) birlikte
 * kartın zeminden çok hafif ayrışması. `card` dokunulabilir/yükselen yüzeylerde kullanılır.
 */
export const Elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2, // Android
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
