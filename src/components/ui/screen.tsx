import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  /** Klavye/uzun içerik için dikey ortalamayı kapat. */
  center?: boolean;
};

/** Tema arka planlı, güvenli-alan destekli sayfa sarmalayıcı. */
export function Screen({ children, scroll = false, center = false }: Props) {
  const c = useColors();
  const inner = (
    <View style={[styles.inner, center && styles.center]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, center && styles.center]}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  center: { justifyContent: 'center' },
});
