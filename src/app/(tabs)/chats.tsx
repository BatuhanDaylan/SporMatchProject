import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { displayName } from '@/lib/displayName';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useChatRequests, type ChatRequest } from '@/hooks/useChatRequests';
import { useConversations, type Conversation } from '@/hooks/useChat';
import { Spacing, Type } from '@/constants/theme';

export default function ChatsScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useConversations();
  const requests = useChatRequests();

  async function onAccept(matchId: string) {
    const res = await requests.accept.mutateAsync(matchId);
    if (res.conversation_id) router.push(`/chat/${res.conversation_id}`);
  }

  const reqList = requests.data ?? [];

  const Header = (
    <View>
      <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>

      {reqList.length > 0 ? (
        <View style={{ marginBottom: Spacing.three, gap: Spacing.two }}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
            Sohbet istekleri ({reqList.length})
          </Text>
          {reqList.map((r) => (
            <RequestRow
              key={r.match_id}
              req={r}
              c={c}
              busy={requests.accept.isPending || requests.decline.isPending}
              onAccept={() => onAccept(r.match_id)}
              onDecline={() => requests.decline.mutate(r.match_id)}
              onOpenProfile={() => router.push(`/user/${r.from_id}`)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      {isError ? (
        <>
          <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
          <ErrorState onRetry={refetch} />
        </>
      ) : isLoading ? (
        <>
          <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
          <Loading />
        </>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.conversation_id}
          ListHeaderComponent={Header}
          contentContainerStyle={{ paddingBottom: Spacing.six }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
                requests.refetch();
              }}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color={c.textSecondary} />
              <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
                Henüz sohbetin yok. Bir profile gidip sohbet isteği gönder ya da biriyle eşleş.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow conv={item} onPress={() => router.push(`/chat/${item.conversation_id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

function RequestRow({
  req,
  c,
  busy,
  onAccept,
  onDecline,
  onOpenProfile,
}: {
  req: ChatRequest;
  c: ReturnType<typeof useColors>;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onOpenProfile: () => void;
}) {
  const name = displayName(req);
  return (
    <Card style={styles.reqCard}>
      <Pressable onPress={onOpenProfile} style={styles.reqInfo} hitSlop={4}>
        <Avatar name={name} url={req.avatar_url} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>Sohbet etmek istiyor</Text>
        </View>
      </Pressable>
      <View style={styles.reqActions}>
        <Pressable
          onPress={onDecline}
          disabled={busy}
          style={[styles.reqBtn, { borderColor: c.border }]}>
          <Text style={{ color: c.textSecondary, fontWeight: '600' }}>Reddet</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={busy}
          style={[styles.reqBtn, { backgroundColor: c.primary, borderColor: c.primary }]}>
          {busy ? (
            <ActivityIndicator size="small" color={c.onPrimary} />
          ) : (
            <Text style={{ color: c.onPrimary, fontWeight: '700' }}>Kabul et</Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function ConversationRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const c = useColors();
  const name = conv.partner_name || conv.partner_username || 'Sporcu';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Avatar name={name} url={conv.partner_avatar} size={52} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]}>{name}</Text>
        <Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 13 }}>
          {conv.last_message ?? 'Selam ver! 👋'}
        </Text>
      </View>
      {conv.unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={{ color: c.onPrimary, fontSize: 12, fontWeight: '700' }}>{conv.unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.displayTitle, marginBottom: Spacing.two },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  reqCard: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  reqInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  reqActions: { flexDirection: 'row', gap: Spacing.two },
  reqBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
