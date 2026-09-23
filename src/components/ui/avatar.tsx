import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

type Props = {
  name?: string | null;
  url?: string | null;
  size?: number;
};

/** Yuvarlak avatar — foto varsa gösterir, yoksa baş harf. */
export function Avatar({ name, url, size = 40 }: Props) {
  const c = useColors();
  const initial = (name || 'S').charAt(0).toUpperCase();
  const radius = size / 2;

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: c.primary },
      ]}>
      <Text style={{ color: c.onPrimary, fontSize: size * 0.42, fontWeight: '800' }}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
