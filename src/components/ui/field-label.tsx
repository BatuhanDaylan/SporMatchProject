import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

/** TextField/PickerField etiketiyle aynı stilde etiket + içerik (chip satırı gibi etiketsiz alanlar için). */
export function FieldLabel({ text, children }: { text: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{text}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', marginLeft: 2 },
});
