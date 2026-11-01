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
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text?: string;
  action?: ReactNode;
  /** Raf içi (liste altı) kullanım: ortalanmış devasa blok yerine yatay, az yer kaplayan kart. */
  compact?: boolean;
}) {
  const c = useColors();
  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <View style={[styles.compactIcon, { backgroundColor: c.background }]}>
          <Ionicons name={icon} size={22} color={c.textSecondary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.compactTitle, { color: c.text }]}>{title}</Text>
          {text ? <Text style={[styles.compactText, { color: c.textSecondary }]}>{text}</Text> : null}
          {action ? <View style={styles.compactAction}>{action}</View> : null}
        </View>
      </View>
    );
  }
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
  compact: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, padding: Spacing.three, borderRadius: 16, borderWidth: 1 },
  compactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontSize: 15, fontWeight: '700' },
  compactText: { fontSize: 13, lineHeight: 18 },
  compactAction: { marginTop: Spacing.two, alignSelf: 'flex-start' },
});
