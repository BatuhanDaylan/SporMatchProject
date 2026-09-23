import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Type } from '@/constants/theme';

type Option<T extends string> = { value: T; label: string; accessibilityLabel?: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  style?: StyleProp<ViewStyle>;
};

/** Tam genişlik segmentli anahtar — Programlarım/Kaydettiklerim, Liderlik/Şehrim vb. ekranlarda tekrar eden desen. */
export function Segment<T extends string>({ value, onChange, options, style }: Props<T>) {
  const c = useColors();
  return (
    <View style={[styles.segment, { backgroundColor: c.backgroundElement }, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segItem, active && { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}>
            <Text style={[styles.segText, { color: active ? c.onPrimary : c.textSecondary }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segText: { ...Type.label },
});
