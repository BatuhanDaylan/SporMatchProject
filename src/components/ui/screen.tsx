import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerScroll, unregisterScroll } from '@/components/tour/scroll-registry';
import { useColors } from '@/hooks/useColors';
import { useRefresh } from '@/hooks/useRefresh';
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
  /**
   * Aşağı çekip yenileme (yalnız `scroll` ekranlarda). Varsayılan: ekrandaki tüm veriler yeniden çekilir.
   * Ekrana özel fonksiyon verilebilir; `false` kapatır.
   */
  onRefresh?: false | (() => Promise<unknown> | void);
};

/** Tema arka planlı, güvenli-alan destekli sayfa sarmalayıcı. */
export function Screen({
  children,
  scroll = false,
  center = false,
  floatingTabBar = false,
  hasHeader = false,
  onRefresh,
}: Props) {
  const c = useColors();
  // Tanıtım, ekran dışındaki hedefi görünür yapmak için odaktaki ScrollView'u kaydırabilsin.
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef({ y: 0 });
  const refresh = useRefresh(onRefresh || undefined);
  const [keyboard, setKeyboard] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!scroll) return;
      const entry = { ref: scrollRef, offset: offset.current };
      registerScroll(entry);
      return () => unregisterScroll(entry);
    }, [scroll]),
  );

  // Klavye açılınca: altına klavye kadar boşluk ekle ve yazılan alan klavyenin altında kaldıysa
  // yukarı kaydır. (Android'de ekran klavyeyle küçülmediği için alan aksi halde görünmez kalır.)
  useEffect(() => {
    if (!scroll) return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      setKeyboard(e.endCoordinates.height);
      const input = TextInput.State.currentlyFocusedInput();
      if (!input) return;
      setTimeout(() => {
        input.measureInWindow((_x, y, _w, h) => {
          const overflow = y + h + Spacing.three - keyboardTop;
          if (overflow > 0) scrollRef.current?.scrollTo({ y: offset.current.y + overflow, animated: true });
        });
      }, 80);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scroll]);

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
          contentContainerStyle={[styles.scrollContent, center && styles.center, keyboard ? { paddingBottom: keyboard } : null]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh === false ? undefined : (
              <RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} tintColor={c.primary} colors={[c.primary]} />
            )
          }>
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
