import { Pressable, StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks/useColors';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Seçilebilir etiket (spor/seviye seçimi için). */
export function Chip({ label, selected, onPress }: Props) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.primary : c.backgroundElement,
          borderColor: selected ? c.primary : c.border,
        },
      ]}>
      <Text style={[styles.label, { color: selected ? c.onPrimary : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 14, fontWeight: '600' },
});
