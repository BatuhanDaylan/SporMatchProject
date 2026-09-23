import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

/** Bir sorgu hata verdiğinde gösterilen tutarlı yeniden-dene durumu. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={48} color={c.textSecondary} />
      <Text style={[styles.title, { color: c.text }]}>Bir şeyler ters gitti</Text>
      <Text style={[styles.msg, { color: c.textSecondary }]}>
        {message || 'İçerik yüklenemedi. Bağlantını kontrol edip tekrar dene.'}
      </Text>
      {onRetry ? (
        <>
          <View style={{ height: Spacing.two }} />
          <Button title="Tekrar Dene" variant="secondary" onPress={onRetry} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: Spacing.four },
  title: { fontSize: 18, fontWeight: '700' },
  msg: { fontSize: 14, textAlign: 'center' },
});
