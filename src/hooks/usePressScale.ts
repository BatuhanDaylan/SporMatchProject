import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Basınca hafifçe küçülüp bırakınca yaylanarak geri gelen dokunma geri bildirimi.
 * Native driver ile çalışır (JS thread'i meşgul etmez).
 */
export function usePressScale(to = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 6 : 0 }).start();
  return {
    scaleStyle: { transform: [{ scale }] },
    onPressIn: () => animate(to),
    onPressOut: () => animate(1),
  };
}
