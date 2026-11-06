import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { isLiveMatch, useMatchHistory, type MatchHistoryItem } from '@/hooks/useMatch';
import { useRefresh } from '@/hooks/useRefresh';
import { displayName } from '@/lib/displayName';
import { timeAgo } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

type Tab = 'live' | 'past';
const TABS = [
  { value: 'live', label: 'Canlı' },
  { value: 'past', label: 'Önceki' },
] as const;

function statusText(m: MatchHistoryItem, live: boolean): { text: string; tone: 'primary' | 'success' | 'muted' } {
  if (m.status === 'confirmed') return { text: live ? 'Onaylandı · konum paylaşıldı' : 'Buluşuldu', tone: 'success' };
  if (m.status === 'declined') return { text: 'Reddedildi', tone: 'muted' };
  if (m.status === 'expired' || !live) return { text: 'Süresi doldu', tone: 'muted' };
  return { text: m.i_confirmed ? 'Onayladın · karşı tarafı bekliyor' : 'Seni bekliyor · onayla', tone: 'primary' };
}

/** Eşleşme geçmişi: son 24 saatteki aktif eşleşmeler (Canlı) ve öncekiler. */
export default function MatchHistoryScreen() {
  const c = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('live');
  const { data, isLoading, isError, refetch } = useMatchHistory();
  const refresh = useRefresh(refetch);
  const list = (data ?? []).filter((m) => (tab === 'live' ? isLiveMatch(m) : !isLiveMatch(m)));

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Eşleşme geçmişi' }} />
      <Segment value={tab} onChange={setTab} options={TABS} />
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={list.length === 0}
        empty={{
          icon: tab === 'live' ? 'flash-outline' : 'time-outline',
          title: tab === 'live' ? 'Canlı eşleşmen yok' : 'Önceki eşleşme yok',
          text: tab === 'live' ? 'Eşleş sekmesinden yeni bir eşleşme başlat.' : 'Eşleştiğin sporcular burada listelenir.',
        }}>
        <FlatList
          data={list}
          keyExtractor={(m) => m.match_id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.six }}
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          renderItem={({ item }) => {
            const live = isLiveMatch(item);
            const st = statusText(item, live);
            const color = st.tone === 'success' ? c.success : st.tone === 'primary' ? c.primary : c.textSecondary;
            const name = displayName(item);
            return (
              <Card
                onPress={() => router.push(`/match/${item.match_id}`)}
                style={[styles.card, live && { borderColor: c.primary, borderWidth: 1.5 }]}
                accessibilityRole="button"
                accessibilityLabel={`${name} ile eşleşme, ${st.text}`}>
                <Avatar name={name} url={item.avatar_url} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>
                    {[
                      item.sport_name ? `${item.sport_icon ?? ''} ${item.sport_name}`.trim() : null,
                      item.distance_m != null ? `${(item.distance_m / 1000).toFixed(1)} km` : null,
                      timeAgo(item.created_at),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{st.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
              </Card>
            );
          }}
        />
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14 },
});
