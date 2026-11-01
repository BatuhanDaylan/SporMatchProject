import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

const ROW_H = 52;

type Props<T> = {
  label?: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: readonly T[];
  values: Set<string>;
  getKey: (item: T) => string;
  renderLabel: (item: T) => string;
  onChange: (values: Set<string>) => void;
};

/** Diğer seçim alanlarıyla aynı tasarım (alan + modal) — ama kaydırmalı ÇOK seçimli liste, dokununca işaretlenir/kaldırılır. */
export function MultiSelectField<T>({ label, title, icon, items, values, getKey, renderLabel, onChange }: Props<T>) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Set<string>>(values);

  function openModal() {
    setPending(new Set(values));
    setOpen(true);
  }

  function toggle(key: string) {
    setPending((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function confirm() {
    onChange(pending);
    setOpen(false);
  }

  function summary(): string {
    if (values.size === 0) return 'Seçilmedi';
    if (values.size <= 2) {
      // Az seçimde isimleri göster ("Koşu, Futbol"); çoksa sayı.
      const names = [...values]
        .map((key) => items.find((i) => getKey(i) === key))
        .filter((item): item is T => item !== undefined)
        .map(renderLabel);
      if (names.length === values.size) return names.join(', ');
    }
    return `${values.size} seçili`;
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={openModal}
        style={[styles.field, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <Ionicons name={icon} size={18} color={c.textSecondary} />
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }} numberOfLines={1}>
          {summary()}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <SafeAreaView style={[styles.sheet, { backgroundColor: c.background }]} edges={['bottom']}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: c.text }]}>{title}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.text} />
              </Pressable>
            </View>

            <FlatList
              data={items}
              keyExtractor={getKey}
              style={styles.list}
              contentContainerStyle={{ paddingHorizontal: Spacing.four }}
              renderItem={({ item }) => {
                const key = getKey(item);
                const sel = pending.has(key);
                return (
                  <Pressable onPress={() => toggle(key)} style={[styles.row, { borderBottomColor: c.border }]}>
                    <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>{renderLabel(item)}</Text>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: sel ? c.primary : c.border,
                          backgroundColor: sel ? c.primary : 'transparent',
                        },
                      ]}>
                      {sel ? <Ionicons name="checkmark" size={16} color={c.onPrimary} /> : null}
                    </View>
                  </Pressable>
                );
              }}
            />

            <View style={styles.confirmWrap}>
              <Pressable onPress={confirm} style={[styles.confirmBtn, { backgroundColor: c.primary }]}>
                <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 16 }}>Tamam</Text>
              </Pressable>
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
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Spacing.four, maxHeight: '75%' },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  list: { maxHeight: ROW_H * 5 },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  confirmWrap: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  confirmBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
