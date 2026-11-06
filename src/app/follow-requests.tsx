import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFollowRequests } from '@/hooks/useFollow';
import { useRefresh } from '@/hooks/useRefresh';
import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { timeAgo } from '@/lib/datetime';
import { showAlert } from '@/store/alert';
import { Spacing } from '@/constants/theme';

/** Gizli hesaba gelen takip istekleri: kabul et / reddet. */
export default function FollowRequestsScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch, respond } = useFollowRequests();
  const refresh = useRefresh(refetch);

  function answer(requesterId: string, accept: boolean) {
    respond.mutate({ requesterId, accept }, { onError: (e) => showAlert('İşlem yapılamadı', getErrorMessage(e)) });
  }

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Takip istekleri' }} />
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{ icon: 'person-add-outline', title: 'Bekleyen istek yok', text: 'Biri seni takip etmek istediğinde burada görünür.' }}>
        <FlatList
          data={data}
          keyExtractor={(r) => r.requester_id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.six }}
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          renderItem={({ item }) => {
            const name = displayName(item.requester);
            return (
              <Card style={styles.card}>
                <Pressable onPress={() => router.push(`/user/${item.requester_id}`)} style={styles.info} accessibilityRole="button">
                  <Avatar name={name} url={item.requester?.avatar_url} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '700' }} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>Seni takip etmek istiyor · {timeAgo(item.created_at)}</Text>
                  </View>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => answer(item.requester_id, false)}
                    disabled={respond.isPending}
                    style={[styles.btn, { borderColor: c.border }]}
                    accessibilityRole="button">
                    <Text style={{ color: c.textSecondary, fontWeight: '600' }}>Reddet</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => answer(item.requester_id, true)}
                    disabled={respond.isPending}
                    style={[styles.btn, { backgroundColor: c.primary, borderColor: c.primary }]}
                    accessibilityRole="button">
                    <Text style={{ color: c.onPrimary, fontWeight: '700' }}>Kabul et</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  btn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
