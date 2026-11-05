/**
 * SporMatch Pro sınırları. Asıl kontrol sunucuda (pro_limits_enforced, user_is_pro, migration 0040);
 * buradaki değerler yalnız ekrandaki metinler içindir — SUNUCUYLA AYNI TUTULMALI.
 *
 * Pro satışa çıkana kadar PRO_ENFORCED = false → tüm Pro özellikleri herkese açık.
 * Pro'ya çıkınca: burada true + sunucuda pro_limits_enforced() → true.
 */
export const PRO_ENFORCED = false;

/** Ücretsiz katmanda günlük eşleşme başlatma hakkı. */
export const FREE_DAILY_MATCHES = 3;

/** Ücretsiz katmanda aynı anda açık tutulabilecek (gelecek tarihli) planlı etkinlik sayısı. */
export const FREE_ACTIVE_EVENTS = 3;
