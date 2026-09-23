import { Stack } from 'expo-router';

import { useColors } from '@/hooks/useColors';

export default function ProgramLayout() {
  const c = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}>
      <Stack.Screen name="[id]" options={{ title: 'Program' }} />
      <Stack.Screen name="edit" options={{ title: 'Program Düzenle', presentation: 'modal' }} />
      <Stack.Screen name="log" options={{ title: 'Antrenman Kaydet', presentation: 'modal' }} />
    </Stack>
  );
}
