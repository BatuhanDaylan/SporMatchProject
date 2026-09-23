import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

/** Tutarlı boş durum: ikon + başlık + (opsiyonel) açıklama + (opsiyonel) aksiyon. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={52} color={c.textSecondary} />
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {text ? <Text style={[styles.text, { color: c.textSecondary }]}>{text}</Text> : null}
      {action ? <View style={{ marginTop: Spacing.two }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: Spacing.four },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
