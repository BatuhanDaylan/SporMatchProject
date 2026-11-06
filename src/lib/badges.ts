import type { ProfileStats } from '@/hooks/useProfileStats';

/**
 * Rozet katalogu. Her rozet bir istatistik metriğine ve hedefe bağlıdır;
 * `metric` değeri `target`'a ulaşınca rozet açılır. Ayrı tablo/tetikleyici yok —
 * sayımlar değiştikçe rozetler ve ilerlemeleri otomatik güncellenir.
 */
export type BadgeMetric = 'programs' | 'workouts' | 'matches' | 'comments' | 'likes' | 'streak';

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
  { key: 'program_master', icon: '📚', label: 'Program Ustası', description: '10 program oluştur', metric: 'programs', target: 10 },
  { key: 'program_legend', icon: '🏛️', label: 'Program Efsanesi', description: '25 program oluştur', metric: 'programs', target: 25 },
  { key: 'first_workout', icon: '💪', label: 'Başlangıç', description: 'İlk antrenmanını kaydet', metric: 'workouts', target: 1 },
  { key: 'ten_workouts', icon: '🏋️', label: 'Azimli', description: '10 antrenman kaydet', metric: 'workouts', target: 10 },
  { key: 'twentyfive_workouts', icon: '🥉', label: 'Kararlı', description: '25 antrenman kaydet', metric: 'workouts', target: 25 },
  { key: 'fifty_workouts', icon: '🔥', label: 'Makine', description: '50 antrenman kaydet', metric: 'workouts', target: 50 },
  { key: 'hundred_workouts', icon: '🥈', label: 'Yüzler Kulübü', description: '100 antrenman kaydet', metric: 'workouts', target: 100 },
  { key: 'workouts_250', icon: '🥇', label: 'Demir İrade', description: '250 antrenman kaydet', metric: 'workouts', target: 250 },
  { key: 'workouts_500', icon: '👑', label: 'Efsane', description: '500 antrenman kaydet', metric: 'workouts', target: 500 },
  { key: 'streak_3', icon: '⚡', label: '3 Gün Seri', description: '3 gün üst üste antrenman yap', metric: 'streak', target: 3 },
  { key: 'streak_7', icon: '🌟', label: 'Haftalık Seri', description: '7 gün üst üste antrenman yap', metric: 'streak', target: 7 },
  { key: 'streak_14', icon: '💫', label: 'İki Hafta', description: '14 gün üst üste antrenman yap', metric: 'streak', target: 14 },
  { key: 'streak_30', icon: '🏆', label: 'Aylık Seri', description: '30 gün üst üste antrenman yap', metric: 'streak', target: 30 },
  { key: 'streak_60', icon: '🚀', label: 'Durdurulamaz', description: '60 gün üst üste antrenman yap', metric: 'streak', target: 60 },
  { key: 'streak_100', icon: '💎', label: 'Elmas Seri', description: '100 gün üst üste antrenman yap', metric: 'streak', target: 100 },
  { key: 'first_match', icon: '🤝', label: 'İlk Eşleşme', description: 'Bir sporcuyla eşleş', metric: 'matches', target: 1 },
  { key: 'matches_5', icon: '👥', label: 'Takım Oyuncusu', description: '5 eşleşme yap', metric: 'matches', target: 5 },
  { key: 'matches_10', icon: '🎯', label: 'Sosyal Sporcu', description: '10 eşleşme yap', metric: 'matches', target: 10 },
  { key: 'matches_25', icon: '🌍', label: 'Herkesin Partneri', description: '25 eşleşme yap', metric: 'matches', target: 25 },
  { key: 'liked_10', icon: '❤️', label: 'Sevilen', description: '10 beğeni al', metric: 'likes', target: 10 },
  { key: 'liked_50', icon: '💖', label: 'Popüler', description: '50 beğeni al', metric: 'likes', target: 50 },
  { key: 'liked_250', icon: '⭐', label: 'Yıldız', description: '250 beğeni al', metric: 'likes', target: 250 },
  { key: 'social', icon: '💬', label: 'Sosyal', description: '5 yorum yap', metric: 'comments', target: 5 },
  { key: 'comments_25', icon: '🗣️', label: 'Sohbet Ustası', description: '25 yorum yap', metric: 'comments', target: 25 },
  { key: 'comments_100', icon: '📣', label: 'Topluluk Sesi', description: '100 yorum yap', metric: 'comments', target: 100 },
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
