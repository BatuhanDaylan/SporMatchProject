import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

/** Henüz gelmemiş özellikler için tutarlı boş-durum ekranı. */
export function Placeholder({ icon, title, subtitle }: Props) {
  const c = useColors();
  return (
    <Screen center>
      <View style={styles.wrap}>
        <Ionicons name={icon} size={56} color={c.textSecondary} />
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center' },
});
