import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import {
  useLeaderboard,
  useMyLeaderboardRank,
  type LeaderboardEntry,
} from '@/hooks/useLeaderboard';
import { Spacing } from '@/constants/theme';

const MEDAL = ['🥇', '🥈', '🥉'];

const SEGMENT_OPTIONS = [
  { value: 'all', label: 'Herkes' },
  { value: 'city', label: 'Şehrim' },
] as const;

export default function LeaderboardScreen() {
  const c = useColors();
  const router = useRouter();
  const [scope, setScope] = useState<'all' | 'city'>('all');
  const { data, isLoading } = useLeaderboard(scope, 7);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Liderlik' }} />

      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
        Son 7 günün en düzenlileri. Eşitlikte son 30 günün düzenliliği belirler.
      </Text>

      {/* Meydan okumalar girişi */}
      <Card
        onPress={() => router.push('/challenges')}
        style={styles.challengeCard}
        accessibilityRole="button"
        accessibilityLabel="Meydan okumaları gör">
        <Text style={{ fontSize: 20 }}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Meydan Okumalar</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Süreli hedefe katıl, tamamla, rozeti kap.
          </Text>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 18 }}>›</Text>
      </Card>

      <Segment value={scope} onChange={setScope} options={SEGMENT_OPTIONS} />

      <AsyncState
        isLoading={isLoading}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{
          icon: 'trophy-outline',
          title: 'Sıralama boş',
          text:
            scope === 'city'
              ? 'Şehrinde bu hafta antrenman kaydı yok. (Profilinde il seçili mi?)'
              : 'Bu hafta henüz antrenman kaydı yok.',
        }}>
        <FlatList
          style={{ flex: 1 }}
          data={data}
          keyExtractor={(x) => x.user_id}
          contentContainerStyle={{ paddingVertical: Spacing.two, gap: Spacing.two }}
          renderItem={({ item, index }) => (
            <Row entry={item} rank={index + 1} c={c} onPress={() => router.push(`/user/${item.user_id}`)} />
          )}
        />
      </AsyncState>

      <MyRankBanner scope={scope} c={c} />
    </Screen>
  );
}

function Row({
  entry,
  rank,
  c,
  onPress,
}: {
  entry: LeaderboardEntry;
  rank: number;
  c: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const name = displayName(entry);
  const top = rank <= 3;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: c.backgroundElement,
          borderColor: top ? c.primary : 'transparent',
          borderWidth: top ? 1 : 0,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={[styles.rank, { color: top ? c.text : c.textSecondary }]}>
        {top ? MEDAL[rank - 1] : rank}
      </Text>
      <Avatar name={name} url={entry.avatar_url} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{name}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {entry.province ? `📍 ${entry.province} · ` : ''}30 günde {entry.d30} gün
        </Text>
      </View>
      <View style={styles.count}>
        <Text style={{ color: c.primary, fontWeight: '800', fontSize: 18 }}>{entry.cnt}/7</Text>
        <Text style={{ color: c.textSecondary, fontSize: 11 }}>aktif gün</Text>
      </View>
    </Pressable>
  );
}

function MyRankBanner({ scope, c }: { scope: 'all' | 'city'; c: ReturnType<typeof useColors> }) {
  const { data } = useMyLeaderboardRank(scope, 7);
  if (!data) return null;
  return (
    <View style={[styles.banner, { backgroundColor: c.primary }]}>
      {data.rank ? (
        <Text style={{ color: c.onPrimary, fontWeight: '700' }}>
          Senin sıran: #{data.rank} / {data.total} · {data.cnt}/7 aktif gün
        </Text>
      ) : (
        <Text style={{ color: c.onPrimary, fontWeight: '700' }}>
          Bu hafta listede değilsin — bir antrenman kaydet! 💪
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14, borderWidth: 1, marginVertical: Spacing.two },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14 },
  rank: { width: 28, textAlign: 'center', fontSize: 16, fontWeight: '800' },
  count: { alignItems: 'center' },
  banner: { borderRadius: 14, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.one },
});
