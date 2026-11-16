import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks/useColors';

/** "Google ile devam et" — Google'ın marka kurallarına uygun sade beyaz düğme. */
export function GoogleButton({ onPress, loading, disabled }: { onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Google ile devam et"
      style={({ pressed }) => [
        styles.btn,
        { borderColor: c.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color="#1F1F1F" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.label}>Google ile devam et</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { color: '#1F1F1F', fontSize: 16, fontWeight: '600' },
});
