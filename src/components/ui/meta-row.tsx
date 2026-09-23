import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  c: ReturnType<typeof useColors>;
};

/** İkon + tek satır metin — detay ekranlarındaki (etkinlik, meydan okuma) meta bilgi satırı. */
export function MetaRow({ icon, text, c }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={17} color={c.primary} />
      <Text style={{ color: c.text, fontSize: 14, flex: 1 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
