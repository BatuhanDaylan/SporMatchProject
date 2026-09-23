import { View } from 'react-native';

import { useColors } from '@/hooks/useColors';

/** İlerleme çubuğu (0..1). completed=true ise yeşil. */
export function ProgressBar({ value, height = 8, done }: { value: number; height?: number; done?: boolean }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.border, overflow: 'hidden' }}>
      <View
        style={{
          height,
          width: `${pct * 100}%`,
          borderRadius: height,
          backgroundColor: done ? c.success : c.primary,
        }}
      />
    </View>
  );
}
