import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';
import {
  addMonths,
  calendarGrid,
  isSameDay,
  monthLabel,
  shortDate,
  startOfDay,
  startOfMonth,
  weekdayLabels,
} from '@/lib/datetime';

type Props = {
  label?: string;
  value: Date;
  minDate?: Date;
  onChange: (date: Date) => void;
};

function fieldLabel(d: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (diff === 0) return `Bugün · ${shortDate(d)}`;
  if (diff === 1) return `Yarın · ${shortDate(d)}`;
  return shortDate(d);
}

/** Tam takvim üzerinden tarih seçimi (gün şeridi yerine — ay gezinme + tek dokunuşla seçim). */
export function CalendarField({ label, value, minDate, onChange }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const min = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));

  const grid = useMemo(() => calendarGrid(viewMonth), [viewMonth]);
  const canGoPrev = startOfMonth(min).getTime() < viewMonth.getTime();
  const today = new Date();

  function openModal() {
    setViewMonth(startOfMonth(value));
    setOpen(true);
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={openModal}
        style={[styles.field, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel="Tarih seç">
        <Ionicons name="calendar-outline" size={18} color={c.textSecondary} />
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>{fieldLabel(value)}</Text>
        <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <SafeAreaView style={[styles.sheet, { backgroundColor: c.background }]} edges={['bottom']}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Tarih seç</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.text} />
              </Pressable>
            </View>

            <View style={styles.monthNav}>
              <Pressable
                disabled={!canGoPrev}
                onPress={() => setViewMonth((m) => addMonths(m, -1))}
                hitSlop={10}
                style={{ opacity: canGoPrev ? 1 : 0.3 }}
                accessibilityLabel="Önceki ay">
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: c.text }]}>{monthLabel(viewMonth)}</Text>
              <Pressable
                onPress={() => setViewMonth((m) => addMonths(m, 1))}
                hitSlop={10}
                accessibilityLabel="Sonraki ay">
                <Ionicons name="chevron-forward" size={22} color={c.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdayLabels().map((w) => (
                <Text key={w} style={[styles.weekday, { color: c.textSecondary }]}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const disabled = d.getTime() < min.getTime();
                const selected = isSameDay(d, value);
                const isToday = isSameDay(d, today);
                return (
                  <Pressable
                    key={i}
                    disabled={disabled}
                    onPress={() => {
                      onChange(d);
                      setOpen(false);
                    }}
                    style={styles.cell}>
                    <View
                      style={[
                        styles.dayInner,
                        selected && { backgroundColor: c.primary },
                        !selected && isToday && { borderWidth: 1.5, borderColor: c.primary },
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          { color: selected ? c.onPrimary : c.text },
                          disabled && { color: c.textSecondary, opacity: 0.4 },
                        ]}>
                        {d.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', marginLeft: 2 },
  field: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Spacing.four },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', paddingHorizontal: Spacing.three },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15, fontWeight: '600' },
});
