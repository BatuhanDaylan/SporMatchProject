import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Elevation } from '@/constants/theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Kartı zeminden ayrıştıran hafif gölge (Notion tarzı, ağır değil). Varsayılan açık. */
  elevated?: boolean;
  disabled?: boolean;
  hitSlop?: PressableProps['hitSlop'];
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
};

/**
 * Ortak kart yüzeyi — arka plan + köşe + (isteğe bağlı) hafif derinlik tek yerden gelir.
 * Dokunulabilir olsun istenirse `onPress` verilir (Pressable'a döner, basılınca 0.85 opaklık),
 * yoksa düz View'dır.
 */
export function Card({
  children,
  onPress,
  style,
  elevated = true,
  disabled,
  hitSlop,
  accessibilityRole,
  accessibilityLabel,
}: Props) {
  const c = useColors();
  const base = [styles.card, { backgroundColor: c.backgroundElement, borderColor: c.border }, elevated && Elevation.card, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [...base, { opacity: pressed ? 0.85 : 1 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1 },
});
