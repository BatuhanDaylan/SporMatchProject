import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useHeatmap, type HeatDay } from '@/hooks/useHeatmap';
import { Spacing } from '@/constants/theme';

const CELL = 13;
const GAP = 3;
const WEEKS = 53;
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Sayıyı 0-3 yoğunluk seviyesine indir. */
function level(c: number): number {
  if (c <= 0) return 0;
  if (c === 1) return 1;
  if (c <= 3) return 2;
  return 3;
}

/**
 * GitHub tarzı yıllık antrenman ısı-haritası. Sütun = hafta (Pzt başlangıç),
 * satır = gün. Son WEEKS hafta; yatay kaydırılır, en güncele hizalanır.
 */
export function WorkoutHeatmap({ userId }: { userId?: string }) {
  const c = useColors();
  const { data, isLoading } = useHeatmap(userId);
  const scrollRef = useRef<ScrollView>(null);

  const { columns, monthLabels, total } = useMemo(() => {
    const counts = new Map<string, number>();
    let tot = 0;
    (data ?? []).forEach((h: HeatDay) => {
      counts.set(h.d, h.c);
      tot += h.c;
    });

    // Bugünden geriye WEEKS hafta; sütunları Pazartesi'ye hizala.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Bu haftanın Pazartesi'si
    const dow = (today.getDay() + 6) % 7; // Pzt=0 … Paz=6
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dow);

    const cols: { date: Date; count: number; lvl: number }[][] = [];
    const labels: { col: number; text: string }[] = [];
    let lastMonth = -1;

    for (let w = WEEKS - 1; w >= 0; w--) {
      const colIdx = WEEKS - 1 - w;
      const week: { date: Date; count: number; lvl: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(lastMonday);
        cur.setDate(lastMonday.getDate() - w * 7 + d);
        const key = ymd(cur);
        const cnt = counts.get(key) ?? 0;
        week.push({ date: cur, count: cur > today ? -1 : cnt, lvl: level(cnt) });
      }
      // Ay etiketi: haftanın ilk gününün ayı değiştiyse
      const m = week[0].date.getMonth();
      if (m !== lastMonth && week[0].date <= today) {
        labels.push({ col: colIdx, text: MONTHS[m] });
        lastMonth = m;
      }
      cols.push(week);
    }
    return { columns: cols, monthLabels: labels, total: tot };
  }, [data]);

  function cellColor(lvl: number, future: boolean): string {
    if (future) return 'transparent';
    if (lvl === 0) return c.border;
    return c.primary;
  }
  function cellOpacity(lvl: number): number {
    return lvl === 0 ? 0.4 : lvl === 1 ? 0.4 : lvl === 2 ? 0.7 : 1;
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>Aktivite</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {isLoading ? '…' : `Son 1 yılda ${total} antrenman`}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        <View>
          {/* Ay etiketleri */}
          <View style={{ flexDirection: 'row', height: 14, marginBottom: 2 }}>
            {columns.map((_, i) => {
              const label = monthLabels.find((l) => l.col === i);
              return (
                <View key={i} style={{ width: CELL + GAP }}>
                  {label ? <Text style={{ color: c.textSecondary, fontSize: 9 }}>{label.text}</Text> : null}
                </View>
              );
            })}
          </View>
          {/* Hücreler */}
          <View style={{ flexDirection: 'row' }}>
            {columns.map((week, wi) => (
              <View key={wi} style={{ marginRight: GAP }}>
                {week.map((cell, di) => {
                  const future = cell.count < 0;
                  return (
                    <View
                      key={di}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        marginBottom: GAP,
                        backgroundColor: cellColor(cell.lvl, future),
                        opacity: future ? 0 : cellOpacity(cell.lvl),
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Açıklama */}
      <View style={styles.legend}>
        <Text style={{ color: c.textSecondary, fontSize: 10 }}>Az</Text>
        {[0, 1, 2, 3].map((l) => (
          <View
            key={l}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              backgroundColor: l === 0 ? c.border : c.primary,
              opacity: cellOpacity(l),
            }}
          />
        ))}
        <Text style={{ color: c.textSecondary, fontSize: 10 }}>Çok</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 },
});
