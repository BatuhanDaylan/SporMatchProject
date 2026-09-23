import { Stack } from 'expo-router';

import { useColors } from '@/hooks/useColors';

export default function ChatStackLayout() {
  const c = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
        title: 'Sohbet',
      }}
    />
  );
}
