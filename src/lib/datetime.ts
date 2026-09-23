const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** "14 Ağu Per" gibi kısa tarih. */
export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAYS[d.getDay()]}`;
}

/** "18:30" saat. */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Etkinlik başlangıcı için okunur etiket: "Bugün 18:30", "Yarın 09:00", "16 Ağu Cmt · 10:00". */
export function eventWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
  const time = hhmm(d);
  if (dayDiff === 0) return `Bugün ${time}`;
  if (dayDiff === 1) return `Yarın ${time}`;
  if (dayDiff === -1) return `Dün ${time}`;
  return `${shortDate(d)} · ${time}`;
}

/** Mesafeyi okunur biçimde: "1.2 km", "350 m". */
export function prettyDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

/** Kısa göreli zaman (TR): "şimdi", "5 dk", "3 sa", "2 gün". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün`;
  return shortDate(new Date(iso));
}

/** Sonraki N gün için Date listesi (bugün dahil). */
export function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

/** 06:00–23:00 arası 30 dk adımlı saat seçenekleri. */
export function timeSlots(): { label: string; h: number; m: number }[] {
  const out: { label: string; h: number; m: number }[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      out.push({ label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, h, m });
    }
  }
  return out;
}
