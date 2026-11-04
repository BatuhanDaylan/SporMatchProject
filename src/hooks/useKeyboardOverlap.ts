import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type View } from 'react-native';

/**
 * Klavyenin, verilen görünümün alt kısmını ne kadar kapattığını ölçer (piksel).
 * Android'de edge-to-edge açıkken pencere klavyeyle küçülmez; bu yüzden alttaki alan (mesaj kutusu)
 * klavyenin altında kalır. Dönen değer o görünüme `paddingBottom` olarak verilir.
 * Pencere zaten küçülüyorsa (eski sürümler) ölçüm 0 çıkar → çift boşluk oluşmaz.
 */
export function useKeyboardOverlap() {
  const ref = useRef<View>(null);
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, h) => setOverlap(Math.max(0, Math.round(y + h - keyboardTop))));
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setOverlap(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { ref, overlap };
}
