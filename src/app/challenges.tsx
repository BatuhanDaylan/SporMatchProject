import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AsyncState } from '@/components/ui/async-state';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useChallenges, type ChallengeSummary } from '@/hooks/useChallenges';
import { shortDate } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

type Scope = 'active' | 'mine';

const METRIC_LABEL: Record<string, string> = { workouts: 'antrenman', active_days: 'aktif gün' };
const STATUS_LABEL: Record<string, string> = { upcoming: 'Yakında', active: 'Sürüyor', ended: 'Bitti' };
const SEGMENT_OPTIONS = [
  { value: 'active', label: 'Aktif', accessibilityLabel: 'Aktif meydan okumalar' },
  { value: 'mine', label: 'Benimkiler', accessibilityLabel: 'Benim meydan okumalarım' },
] as const;

export default function ChallengesScreen() {
  const c = useColors();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('active');
  const q = useChallenges(scope);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Meydan Okumalar' }} />

      <Segment value={scope} onChange={setScope} options={SEGMENT_OPTIONS} />

      <AsyncState
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={q.refetch}
        isEmpty={(q.data?.length ?? 0) === 0}
        empty={{
          icon: 'flame-outline',
          title: scope === 'active' ? 'Aktif meydan okuma yok' : 'Henüz katılmadın',
          text: 'İlk meydan okumayı sen başlat — hedefini koy, arkadaşların katılsın.',
        }}>
        <FlatList
          data={q.data}
          keyExtractor={(ch) => ch.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: 96, paddingTop: Spacing.one }}
          renderItem={({ item }) => (
            <ChallengeCard challenge={item} c={c} onPress={() => router.push(`/challenge/${item.id}`)} />
          )}
        />
      </AsyncState>

      <Fab icon="add" onPress={() => router.push('/challenge/create')} accessibilityLabel="Meydan okuma oluştur" />
    </Screen>
  );
}

function ChallengeCard({
  challenge,
  c,
  onPress,
}: {
  challenge: ChallengeSummary;
  c: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const ratio = challenge.goal ? challenge.my_progress / challenge.goal : 0;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
          {challenge.sport?.icon ? `${challenge.sport.icon} ` : '🔥 '}
          {challenge.title}
        </Text>
        {challenge.completed ? (
          <Badge label="Tamamlandı 🏆" backgroundColor={c.success} textColor={c.onSuccess} />
        ) : (
          <Badge label={STATUS_LABEL[challenge.status]} backgroundColor={c.background} textColor={c.textSecondary} />
        )}
      </View>

      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
        Hedef: {challenge.goal} {METRIC_LABEL[challenge.metric]} · {shortDate(new Date(challenge.starts_at))} – {shortDate(new Date(challenge.ends_at))}
      </Text>

      {challenge.joined ? (
        <View style={{ gap: 4, marginTop: 2 }}>
          <ProgressBar value={ratio} done={challenge.completed} />
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {Math.min(challenge.my_progress, challenge.goal)}/{challenge.goal}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFoot}>
        <Ionicons name="people-outline" size={14} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>{challenge.participant_count} katılımcı</Text>
        {challenge.joined ? (
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: '600' }}>· Katıldın</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
