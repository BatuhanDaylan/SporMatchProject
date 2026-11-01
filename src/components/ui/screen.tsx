import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerScroll, unregisterScroll } from '@/components/tour/scroll-registry';
import { useColors } from '@/hooks/useColors';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  /** Klavye/uzun içerik için dikey ortalamayı kapat. */
  center?: boolean;
  /** Kayan (floating) sekme çubuğunun altında kalan ekranlarda içerik boşluğu bırakır. */
  floatingTabBar?: boolean;
  /** Native başlık çubuğu varsa üst güvenli alanı tekrar ekleme (çift boşluk olmasın). */
  hasHeader?: boolean;
};

/** Tema arka planlı, güvenli-alan destekli sayfa sarmalayıcı. */
export function Screen({ children, scroll = false, center = false, floatingTabBar = false, hasHeader = false }: Props) {
  const c = useColors();
  // Tanıtım, ekran dışındaki hedefi görünür yapmak için odaktaki ScrollView'u kaydırabilsin.
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef({ y: 0 });
  useFocusEffect(
    useCallback(() => {
      if (!scroll) return;
      const entry = { ref: scrollRef, offset: offset.current };
      registerScroll(entry);
      return () => unregisterScroll(entry);
    }, [scroll]),
  );
  const extraBottom = floatingTabBar ? { paddingBottom: BottomTabInset } : null;
  const inner = (
    <View style={[styles.inner, center && styles.center, extraBottom]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={hasHeader ? ['bottom'] : ['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          onScroll={(e) => {
            offset.current.y = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={32}
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
