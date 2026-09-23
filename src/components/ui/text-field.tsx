import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.danger : focused ? c.primary : c.border;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          { color: c.text, backgroundColor: c.backgroundElement, borderColor },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', marginLeft: 2 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  error: { fontSize: 12, marginLeft: 2 },
});
