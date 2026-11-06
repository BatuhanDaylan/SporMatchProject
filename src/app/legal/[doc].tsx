import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { PRIVACY, TERMS } from '@/constants/legal-docs';
import { Spacing } from '@/constants/theme';

/** Uygulama içi yasal belge: /legal/gizlilik veya /legal/sartlar (ayrı sayfalar). */
export default function LegalScreen() {
  const c = useColors();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = doc === 'sartlar' ? TERMS : PRIVACY;

  return (
    <Screen scroll hasHeader onRefresh={false}>
      <Stack.Screen options={{ headerShown: true, title: d.title }} />
      <Text style={[styles.h1, { color: c.text }]}>SporMatch — {d.title}</Text>
      <Text selectable style={{ color: c.textSecondary, fontSize: 12 }}>
        {d.updated}
      </Text>
      <Text selectable style={[styles.p, { color: c.text }]}>
        {d.intro}
      </Text>
      {d.sections.map((s) => (
        <View key={s.title} style={{ gap: 6 }}>
          <Text style={[styles.h2, { color: c.text }]}>{s.title}</Text>
          {s.bullets?.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={{ color: c.primary }}>•</Text>
              <Text selectable style={[styles.p, { color: c.text, flex: 1 }]}>
                {b}
              </Text>
            </View>
          ))}
          {s.paragraphs?.map((p) => (
            <Text key={p} selectable style={[styles.p, { color: c.text }]}>
              {p}
            </Text>
          ))}
        </View>
      ))}
      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '800' },
  h2: { fontSize: 16, fontWeight: '700', marginTop: Spacing.two },
  p: { fontSize: 14, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: 8 },
});
