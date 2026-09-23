import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AsyncState } from '@/components/ui/async-state';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { routeForNotification } from '@/lib/push';
import { Spacing } from '@/constants/theme';

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  chat: 'chatbubble-ellipses',
  chat_request: 'person-add',
  follow: 'person',
  match: 'flash',
  comment: 'chatbox',
  genel: 'notifications',
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} gün`;
}

export default function NotificationsScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch, markAllRead } = useNotifications();

  // Ekran açılınca hepsini okundu yap
  useEffect(() => {
    markAllRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNotification(n: AppNotification) {
    const route = routeForNotification(n.data);
    if (!route) return;
    try {
      router.push(route as never);
    } catch {
      /* geçersiz rota — yok say */
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Bildirimler' }} />
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{ icon: 'notifications-off-outline', title: 'Bildirim yok', text: 'Yeni bir şey olduğunda burada görürsün.' }}>
        <FlatList
          data={data}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingVertical: Spacing.two, gap: Spacing.two, paddingBottom: Spacing.six }}
          renderItem={({ item }) => (
            <NotificationRow n={item} c={c} onPress={() => openNotification(item)} />
          )}
        />
      </AsyncState>
    </Screen>
  );
}

function NotificationRow({
  n,
  c,
  onPress,
}: {
  n: AppNotification;
  c: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const unread = !n.read_at;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: c.background }]}>
        <Ionicons name={ICON[n.type] ?? ICON.genel} size={20} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.head}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {n.title}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{timeAgo(n.created_at)}</Text>
        </View>
        {n.body ? (
          <Text numberOfLines={2} style={{ color: c.textSecondary, fontSize: 13 }}>
            {n.body}
          </Text>
        ) : null}
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 14, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
