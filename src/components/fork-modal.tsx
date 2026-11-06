import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/useColors';
import type { ProgramTemplate } from '@/types/program';
import { Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  template: ProgramTemplate;
  loading?: boolean;
  onClose: () => void;
  /** Seçilen günler/egzersizlerle süzülmüş şablon. */
  onConfirm: (template: ProgramTemplate) => void;
};

/** Programın tamamını ya da yalnız seçilen günlerini/egzersizlerini kopyalama. */
export function ForkModal({ visible, template, loading, onClose, onConfirm }: Props) {
  const c = useColors();
  const [days, setDays] = useState<Set<string>>(new Set());
  const [exercises, setExercises] = useState<Set<string>>(new Set());

  // Açılınca hepsi seçili başlar
  useEffect(() => {
    if (!visible) return;
    setDays(new Set(template.days.map((d) => d.id)));
    setExercises(new Set(template.days.flatMap((d) => d.exercises.map((e) => e.id))));
  }, [visible, template]);

  const allExIds = template.days.flatMap((d) => d.exercises.map((e) => e.id));
  const allSelected = days.size === template.days.length && exercises.size === allExIds.length;

  function toggleAll() {
    if (allSelected) {
      setDays(new Set());
      setExercises(new Set());
    } else {
      setDays(new Set(template.days.map((d) => d.id)));
      setExercises(new Set(allExIds));
    }
  }

  function toggleDay(dayId: string) {
    const day = template.days.find((d) => d.id === dayId)!;
    const nextDays = new Set(days);
    const nextEx = new Set(exercises);
    if (days.has(dayId)) {
      nextDays.delete(dayId);
      day.exercises.forEach((e) => nextEx.delete(e.id));
    } else {
      nextDays.add(dayId);
      day.exercises.forEach((e) => nextEx.add(e.id));
    }
    setDays(nextDays);
    setExercises(nextEx);
  }

  function toggleExercise(dayId: string, exId: string) {
    const day = template.days.find((d) => d.id === dayId)!;
    const nextEx = new Set(exercises);
    nextEx.has(exId) ? nextEx.delete(exId) : nextEx.add(exId);
    const nextDays = new Set(days);
    // Günde en az bir egzersiz seçiliyse gün de seçili sayılır
    if (day.exercises.some((e) => nextEx.has(e.id))) nextDays.add(dayId);
    else nextDays.delete(dayId);
    setExercises(nextEx);
    setDays(nextDays);
  }

  const picked: ProgramTemplate = {
    days: template.days
      .filter((d) => days.has(d.id))
      .map((d) => ({ ...d, exercises: d.exercises.filter((e) => exercises.has(e.id)) })),
  };
  const pickedEx = picked.days.reduce((n, d) => n + d.exercises.length, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, { backgroundColor: c.background }]} edges={['bottom']}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: c.text }]}>Neleri kopyalayacaksın?</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>
          <Pressable onPress={toggleAll} style={styles.allRow} accessibilityRole="checkbox" accessibilityState={{ checked: allSelected }}>
            <Check on={allSelected} />
            <Text style={{ color: c.text, fontWeight: '700' }}>Tamamı</Text>
          </Pressable>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.two }}>
            {template.days.map((d) => (
              <View key={d.id} style={[styles.day, { borderColor: c.border, backgroundColor: c.backgroundElement }]}>
                <Pressable onPress={() => toggleDay(d.id)} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: days.has(d.id) }}>
                  <Check on={days.has(d.id)} />
                  <Text style={{ color: c.text, fontWeight: '700', flex: 1 }}>{d.name || 'Gün'}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{d.exercises.length} egzersiz</Text>
                </Pressable>
                {d.exercises.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => toggleExercise(d.id, e.id)}
                    style={[styles.row, styles.exRow]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: exercises.has(e.id) }}>
                    <Check on={exercises.has(e.id)} small />
                    <Text style={{ color: c.text, flex: 1 }} numberOfLines={1}>
                      {e.name || 'İsimsiz egzersiz'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          <Button
            title={days.size === 0 ? 'En az bir gün seç' : `Kopyala (${picked.days.length} gün · ${pickedEx} egzersiz)`}
            onPress={() => onConfirm(picked)}
            disabled={days.size === 0}
            loading={loading}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Check({ on, small }: { on: boolean; small?: boolean }) {
  const c = useColors();
  const size = small ? 18 : 22;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: on ? c.primary : c.border,
        backgroundColor: on ? c.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {on ? <Ionicons name="checkmark" size={size - 6} color={c.onPrimary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.four, gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800' },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 6 },
  day: { borderWidth: 1, borderRadius: 12, padding: Spacing.two, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 6 },
  exRow: { paddingLeft: Spacing.four },
});
