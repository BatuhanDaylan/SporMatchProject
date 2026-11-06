import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
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

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00..23
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 00..59

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

type Props = {
  label?: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  /** Seçilebilecek en erken saat (ör. bugün için şu andan sonrası). Öncesi listede çıkmaz. */
  min?: { hour: number; minute: number } | null;
};

/** Takvim alanıyla tutarlı: alan + modal içinde saat/dakika kaydırmalı çark seçici (seçenek listesi yok). */
export function TimeField({ label, hour, minute, onChange, min }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [pendingH, setPendingH] = useState(hour);
  const [pendingM, setPendingM] = useState(minute);

  const hours = min ? HOURS.filter((h) => h >= min.hour) : HOURS;
  const minutes = min && pendingH === min.hour ? MINUTES.filter((m) => m >= min.minute) : MINUTES;

  function openModal() {
    setPendingH(hour);
    setPendingM(minute);
    setOpen(true);
  }

  function pickHour(h: number) {
    setPendingH(h);
    // En erken saate geçildiyse dakikayı da geçmişe düşmeyecek şekilde ileri al
    if (min && h === min.hour && pendingM < min.minute) setPendingM(min.minute);
  }

  function confirm() {
    if (min && (pendingH < min.hour || (pendingH === min.hour && pendingM < min.minute))) {
      onChange(min.hour, min.minute);
      setOpen(false);
      return;
    }
    onChange(pendingH, pendingM);
    setOpen(false);
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={openModal}
        style={[styles.field, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel="Saat seç">
        <Ionicons name="time-outline" size={18} color={c.textSecondary} />
        <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>
          {pad2(hour)}:{pad2(minute)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <SafeAreaView style={[styles.sheet, { backgroundColor: c.background }]} edges={['bottom']}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Saat seç</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={c.text} />
              </Pressable>
            </View>

            <View style={styles.wheelRow}>
              <View style={[styles.highlight, { borderColor: c.border }]} pointerEvents="none" />
              <WheelColumn key={`h${hours[0]}`} items={hours} value={pendingH} onChange={pickHour} textColor={c.text} />
              <Text style={[styles.colon, { color: c.text }]}>:</Text>
              <WheelColumn key={`m${minutes[0]}`} items={minutes} value={pendingM} onChange={setPendingM} textColor={c.text} />
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

function WheelColumn({
  items,
  value,
  onChange,
  textColor,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  textColor: string;
}) {
  const listRef = useRef<FlatList<number>>(null);
  const startIndex = Math.max(0, items.indexOf(value));

  function handleSettle(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.min(items.length - 1, Math.max(0, idx));
    onChange(items[clamped]);
  }

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(n) => String(n)}
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
          <Text style={[styles.wheelText, { color: textColor }]}>{pad2(item)}</Text>
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
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_H,
    alignSelf: 'center',
    width: 90 + 90 + 32,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  wheel: { height: PICKER_H, width: 90 },
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontSize: 22, fontWeight: '700' },
  colon: { fontSize: 22, fontWeight: '700', marginHorizontal: 4 },
  confirmWrap: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  confirmBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
