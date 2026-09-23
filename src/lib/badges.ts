import type { ProfileStats } from '@/hooks/useProfileStats';

/**
 * Rozet katalogu. Her rozet bir istatistik metriğine ve hedefe bağlıdır;
 * `metric` değeri `target`'a ulaşınca rozet açılır. Ayrı tablo/tetikleyici yok —
 * sayımlar değiştikçe rozetler ve ilerlemeleri otomatik güncellenir.
 */
export type BadgeMetric = 'programs' | 'workouts' | 'matches' | 'comments' | 'streak';

export type Badge = {
  key: string;
  icon: string;
  label: string;
  /** Rozetin açılma şartı (kullanıcıya gösterilir). */
  description: string;
  metric: BadgeMetric;
  target: number;
};

export const BADGES: Badge[] = [
  { key: 'first_program', icon: '📋', label: 'İlk Program', description: 'İlk antrenman programını oluştur', metric: 'programs', target: 1 },
  { key: 'programmer', icon: '🗂️', label: 'Planlı Sporcu', description: '5 program oluştur', metric: 'programs', target: 5 },
  { key: 'first_workout', icon: '💪', label: 'Başlangıç', description: 'İlk antrenmanını kaydet', metric: 'workouts', target: 1 },
  { key: 'ten_workouts', icon: '🏋️', label: 'Azimli', description: '10 antrenman kaydet', metric: 'workouts', target: 10 },
  { key: 'fifty_workouts', icon: '🔥', label: 'Makine', description: '50 antrenman kaydet', metric: 'workouts', target: 50 },
  { key: 'streak_3', icon: '⚡', label: '3 Gün Seri', description: '3 gün üst üste antrenman yap', metric: 'streak', target: 3 },
  { key: 'streak_7', icon: '🌟', label: 'Haftalık Seri', description: '7 gün üst üste antrenman yap', metric: 'streak', target: 7 },
  { key: 'first_match', icon: '🤝', label: 'İlk Eşleşme', description: 'Bir sporcuyla eşleş', metric: 'matches', target: 1 },
  { key: 'social', icon: '💬', label: 'Sosyal', description: '5 yorum yap', metric: 'comments', target: 5 },
];

export type BadgeState = Badge & {
  current: number;
  unlocked: boolean;
  /** 0–1 arası ilerleme oranı. */
  ratio: number;
};

/** Bir rozetin mevcut istatistiklere göre durumunu (ilerleme dahil) hesaplar. */
export function badgeState(b: Badge, stats: ProfileStats): BadgeState {
  const current = stats[b.metric] ?? 0;
  return {
    ...b,
    current,
    unlocked: current >= b.target,
    ratio: Math.max(0, Math.min(current / b.target, 1)),
  };
}

/** Tüm rozetleri durumlarıyla döndürür; kazanılanlar öne, kilitliler sona. */
export function rankBadges(stats: ProfileStats): BadgeState[] {
  return BADGES.map((b) => badgeState(b, stats)).sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked) || b.ratio - a.ratio,
  );
}
