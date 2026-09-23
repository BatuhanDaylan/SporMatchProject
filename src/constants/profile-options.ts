// Profil düzenlemede hazır seçenekler. Değerler doğrudan (Türkçe etiket olarak)
// profiles.goals / profiles.availability text[] kolonlarında saklanır.

export const GOAL_OPTIONS = [
  'Kilo verme',
  'Kas kazanımı',
  'Dayanıklılık',
  'Esneklik',
  'Genel sağlık',
  'Maraton',
  'Rekabet',
  'Stres atma',
] as const;

export const AVAILABILITY_OPTIONS = [
  'Hafta içi sabah',
  'Hafta içi öğle',
  'Hafta içi akşam',
  'Hafta sonu sabah',
  'Hafta sonu öğle',
  'Hafta sonu akşam',
] as const;
