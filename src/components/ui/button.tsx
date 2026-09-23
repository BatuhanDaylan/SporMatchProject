import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Elevation, Spacing } from '@/constants/theme';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  /** 'lg' — profil düzenleme gibi tek-vurgulu tam-genişlik CTA'lar (varsayılan 'md'). */
  size?: 'md' | 'lg';
};

export function Button({ title, loading, variant = 'primary', size = 'md', disabled, ...rest }: Props) {
  const c = useColors();
  const isPrimary = variant === 'primary';
  const isLarge = size === 'lg';
  const bg = isPrimary ? c.primary : c.backgroundElement;
  const fg = isPrimary ? c.onPrimary : c.text;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isLarge && styles.large,
        isPrimary && !isDisabled && styles.elevated,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, isLarge && styles.labelLarge, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  large: { height: 52, borderRadius: 16 },
  elevated: Elevation.card,
  label: { fontSize: 16, fontWeight: '600' },
  labelLarge: { fontWeight: '700' },
});
