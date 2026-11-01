import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

const ITEM_H = 44;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

type Item = string | number | null;

type Props<T extends Item> = {
  label?: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: T[];
  value: T;
  renderLabel: (item: T) => string;
  onChange: (item: T) => void;
};

/** Tek sütunlu kaydırmalı çark seçici — Saat alanıyla aynı etkileşim deseni (alan + modal + kaydır + Tamam). */
export function WheelField<T extends Item>({ label, title, icon, items, value, renderLabel, onChange }: Props<T>) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<T>(value);

  function openModal() {
    setPending(value);
    setOpen(true);
  }

  function confirm() {
    onChange(pending);
    setOpen(false);
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
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>{renderLabel(value)}</Text>
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

            <View style={styles.wheelWrap}>
              <View style={[styles.highlight, { borderColor: c.border }]} pointerEvents="none" />
              <WheelColumn items={items} value={pending} renderLabel={renderLabel} onChange={setPending} textColor={c.text} />
            </View>

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

function WheelColumn<T extends Item>({
  items,
  value,
  renderLabel,
  onChange,
  textColor,
}: {
  items: T[];
  value: T;
  renderLabel: (item: T) => string;
  onChange: (v: T) => void;
  textColor: string;
}) {
  const startIndex = Math.max(0, items.indexOf(value));

  function handleSettle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.min(items.length - 1, Math.max(0, idx));
    onChange(items[clamped]);
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item)}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: PAD }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      initialScrollIndex={startIndex}
      getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
      onMomentumScrollEnd={handleSettle}
      onScrollEndDrag={handleSettle}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item }) => (
        <View style={styles.wheelItem}>
          <Text style={[styles.wheelText, { color: textColor }]} numberOfLines={1}>
            {renderLabel(item)}
          </Text>
        </View>
      )}
    />
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
  wheelWrap: { height: PICKER_H, justifyContent: 'center' },
  highlight: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    top: PAD,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  wheel: { height: PICKER_H },
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  wheelText: { fontSize: 18, fontWeight: '700' },
  confirmWrap: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  confirmBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
