import { useEffect, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { registerTarget, unregisterTarget } from '@/components/tour/registry';

type Props = {
  id: string;
  /** Sarmalanan öğenin düzen davranışını korumak için (ör. `{ flex: 1 }`). */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Tanıtımda vurgulanabilen bir öğeyi işaretler. Görünümü değiştirmez (yalnızca ölçülebilir bir
 * sarmalayıcı View). Not: sarmalayıcıya `onTouchEnd` EKLEME — bu RN sürümünde Fabric'te açılışta
 * native çökmeye yol açıyor; "dokun" adımları bunun yerine ekran değişimiyle (usePathname) ilerler.
 */
export function TourTarget({ id, style, children }: Props) {
  const ref = useRef<View>(null);

  useEffect(() => {
    registerTarget(id, ref);
    return () => unregisterTarget(id, ref);
  }, [id]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
