import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

type Props = {
  label?: string;
  value: string | null;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledHint?: string;
};

/** Listeden seçim yapılan, aranabilir modal alan (il/ilçe gibi). */
export function PickerField({
  label,
  value,
  placeholder = 'Seç',
  options,
  onChange,
  disabled,
  disabledHint,
}: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr');
    if (!needle) return options;
    return options.filter((o) => o.toLocaleLowerCase('tr').includes(needle));
  }, [q, options]);

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.field,
          { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: disabled ? 0.5 : 1 },
        ]}>
        <Text style={{ color: value ? c.text : c.textSecondary, fontSize: 16 }}>
          {value || (disabled && disabledHint ? disabledHint : placeholder)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{label ?? 'Seç'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={c.text} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: Spacing.four }}>
            <View style={[styles.search, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
              <Ionicons name="search" size={18} color={c.textSecondary} />
              <TextInput
                placeholder="Ara…"
                placeholderTextColor={c.textSecondary}
                value={q}
                onChangeText={setQ}
                autoFocus
                style={{ flex: 1, color: c.text, fontSize: 16, paddingVertical: 10 }}
              />
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Spacing.four, paddingBottom: Spacing.six }}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setQ('');
                    setOpen(false);
                  }}
                  style={[styles.option, { borderBottomColor: c.border }]}>
                  <Text style={{ color: selected ? c.primary : c.text, fontSize: 16, fontWeight: selected ? '700' : '400' }}>
                    {item}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: c.textSecondary, padding: Spacing.three }}>Sonuç yok.</Text>
            }
          />
        </SafeAreaView>
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
    justifyContent: 'space-between',
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
