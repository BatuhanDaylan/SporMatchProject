import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri: string | null;
  onClose: () => void;
};

/**
 * Tam ekran fotoğraf görüntüleyici: iki parmakla yakınlaştır, çift dokunuşla 2.5x / geri,
 * yakınken sürükle, yakın değilken aşağı/yukarı kaydırınca kapanır.
 * `uri` null ise kapalıdır.
 */
export function ImageViewer({ uri, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  function resetValues() {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    startX.value = 0;
    startY.value = 0;
  }

  function close() {
    resetValues();
    onClose();
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        startX.value = 0;
        startY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        tx.value = startX.value + e.translationX;
        ty.value = startY.value + e.translationY;
      } else {
        ty.value = e.translationY; // yakın değilken: kaydırarak kapat
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1) {
        startX.value = tx.value;
        startY.value = ty.value;
      } else if (Math.abs(e.translationY) > 120) {
        runOnJS(close)();
      } else {
        ty.value = withTiming(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = savedScale.value > 1 ? 1 : 2.5;
      scale.value = withTiming(next);
      savedScale.value = next;
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      startX.value = 0;
      startY.value = 0;
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: savedScale.value > 1 ? 1 : Math.max(0.35, 1 - Math.abs(ty.value) / 400),
  }));

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.fill, imageStyle]}>
            {uri ? <Image source={{ uri }} style={styles.fill} contentFit="contain" /> : null}
          </Animated.View>
        </GestureDetector>
        <View style={[styles.closeWrap, { top: insets.top + 8 }]}>
          <Pressable
            onPress={close}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı kapat">
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000' },
  fill: { flex: 1, width: '100%' },
  closeWrap: { position: 'absolute', right: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center' },
});
