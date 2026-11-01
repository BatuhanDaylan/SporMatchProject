import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { timeAgo } from '@/lib/datetime';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useChatRequests, type ChatRequest } from '@/hooks/useChatRequests';
import { useConversations, type Conversation } from '@/hooks/useChat';
import { BottomTabInset, Spacing, Type } from '@/constants/theme';

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
  const totalUnread = (data ?? []).reduce((n, conv) => n + conv.unread, 0);

  const Title = (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Eşleştiğin sporcularla yaz.</Text>
      </View>
      {totalUnread > 0 ? (
        <View style={[styles.unreadPill, { backgroundColor: c.primary }]}>
          <Text style={{ color: c.onPrimary, fontSize: 12, fontWeight: '800' }}>{totalUnread} yeni</Text>
        </View>
      ) : null}
    </View>
  );

  const Header = (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.two }}>
      {Title}

      {reqList.length > 0 ? (
        <View style={[styles.reqGroup, { backgroundColor: `${c.primary}14`, borderColor: `${c.primary}55` }]}>
          <View style={styles.reqHead}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Sohbet istekleri</Text>
            <View style={[styles.countBadge, { backgroundColor: c.primary }]}>
              <Text style={{ color: c.onPrimary, fontSize: 12, fontWeight: '800' }}>{reqList.length}</Text>
            </View>
          </View>
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

      {reqList.length > 0 && (data?.length ?? 0) > 0 ? (
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Mesajlar</Text>
      ) : null}
    </View>
  );

  return (
    <Screen>
      {isError ? (
        <>
          {Title}
          <ErrorState onRetry={refetch} />
        </>
      ) : isLoading ? (
        <>
          {Title}
          <Loading />
        </>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.conversation_id}
          ListHeaderComponent={Header}
          contentContainerStyle={{ paddingBottom: BottomTabInset, flexGrow: 1 }}
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
            <EmptyState
              icon="chatbubbles-outline"
              title="Henüz sohbetin yok"
              text="Biriyle eşleş ya da bir profile gidip sohbet isteği gönder."
              action={<Button title="Eşleşmeye başla" onPress={() => router.push('/match')} />}
            />
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
      <Pressable onPress={onOpenProfile} style={styles.reqInfo} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${name} profili`}>
        <Avatar name={name} url={req.avatar_url} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>Sohbet etmek istiyor · {timeAgo(req.created_at)}</Text>
        </View>
      </Pressable>
      <View style={styles.reqActions}>
        <Pressable
          onPress={onDecline}
          disabled={busy}
          accessibilityRole="button"
          style={[styles.reqBtn, { borderColor: c.border }]}>
          <Text style={{ color: c.textSecondary, fontWeight: '600' }}>Reddet</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={busy}
          accessibilityRole="button"
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
  const unread = conv.unread > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${unread ? `, ${conv.unread} okunmamış mesaj` : ''}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unread ? `${c.primary}14` : c.backgroundElement,
          borderColor: unread ? `${c.primary}55` : c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Avatar name={name} url={conv.partner_avatar} size={52} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: unread ? c.text : c.textSecondary, fontSize: 13, fontWeight: unread ? '600' : '400' }}>
          {conv.last_message ?? 'Selam ver! 👋'}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {conv.last_at ? (
          <Text style={{ color: unread ? c.primary : c.textSecondary, fontSize: 12, fontWeight: unread ? '700' : '500' }}>
            {timeAgo(conv.last_at)}
          </Text>
        ) : null}
        {unread ? (
          <View style={[styles.badge, { backgroundColor: c.primary }]}>
            <Text style={{ color: c.onPrimary, fontSize: 12, fontWeight: '700' }}>{conv.unread}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { ...Type.displayTitle },
  subtitle: { fontSize: 14, marginTop: 2 },
  unreadPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  reqGroup: { borderRadius: 18, borderWidth: 1, padding: Spacing.two, gap: Spacing.two },
  reqHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.one, paddingTop: Spacing.one },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  reqCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
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
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
