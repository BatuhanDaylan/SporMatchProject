import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const barHeight = 58;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.tabBarActive,
        tabBarInactiveTintColor: c.tabBarInactive,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
          height: barHeight + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIconStyle: { marginTop: 0 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Eşleş',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Program',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Sohbet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
