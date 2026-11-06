import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { useSports } from '@/hooks/useSports';
import { Spacing } from '@/constants/theme';

/** Yatay kaydırılan spor filtresi: "Tümü" + her spor. */
export function SportFilter({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const { data: sports } = useSports();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
      <Chip label="Tümü" selected={value === null} onPress={() => onChange(null)} />
      {(sports ?? []).map((s) => (
        <Chip
          key={s.id}
          label={`${s.icon ?? ''} ${s.name}`.trim()}
          selected={value === s.id}
          onPress={() => onChange(value === s.id ? null : s.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  noGrow: { flexGrow: 0, flexShrink: 0 },
  row: { gap: Spacing.two, paddingRight: Spacing.two },
});
