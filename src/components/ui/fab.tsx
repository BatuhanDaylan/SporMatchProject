import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  onPress: () => void;
  accessibilityLabel: string;
};

/** Sağ altta sabit "oluştur" düğmesi — liste ekranlarında (Akış, Etkinlikler, Meydan Okumalar) tekrar eden desen. */
export function Fab({ icon, size = 26, onPress, accessibilityLabel }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fab, { backgroundColor: c.primary }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Ionicons name={icon} size={size} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
