import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconSize?: number;
  backgroundColor: string;
  onPress: () => void;
  accessibilityLabel: string;
  /** Rozet/nokta gibi köşeye bindirilen ek içerik. */
  children?: ReactNode;
};

/** 40x40 dairesel ikon düğmesi — ekran başlıklarındaki tekil aksiyon. */
export function IconButton({ icon, iconColor, iconSize = 20, backgroundColor, onPress, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { backgroundColor }]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
