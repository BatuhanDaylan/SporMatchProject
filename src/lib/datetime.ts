const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const WEEKDAYS_MON = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** "14 Ağu Per" gibi kısa tarih. */
export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAYS[d.getDay()]}`;
}

/** "18:30" saat. */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Saat/dakika/saniyeyi sıfırlanmış gün başlangıcı. */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** İki tarihin aynı takvim gününde olup olmadığı. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Ayın ilk günü. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** N ay sonrası/öncesi (ayın ilk günü olarak). */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** "Eylül 2026" gibi ay başlığı. */
export function monthLabel(d: Date): string {
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** Pazartesi başlangıçlı hafta gün etiketleri. */
export function weekdayLabels(): string[] {
  return WEEKDAYS_MON;
}

/** Takvim ızgarası: verilen ayın günleri + Pazartesi hizası için baştaki/sondaki dolgu (null). Ay değişince yükseklik oynamasın diye her zaman tam 6 satır (42 hücre). */
export function calendarGrid(monthStart: Date): (Date | null)[] {
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0=Pzt
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
  while (cells.length < 42) cells.push(null);
  return cells;
}

/** Etkinlik başlangıcı için okunur etiket: "Bugün 18:30", "Yarın 09:00", "16 Ağu Cmt · 10:00". */
export function eventWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dayDiff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000);
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
