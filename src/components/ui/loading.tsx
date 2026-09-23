import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

/** Ortalanmış yükleme göstergesi (opsiyonel metin). */
export function Loading({ text }: { text?: string }) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={c.primary} />
      {text ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: Spacing.six, alignItems: 'center', gap: Spacing.two },
});
