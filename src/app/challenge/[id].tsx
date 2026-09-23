import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetaRow } from '@/components/ui/meta-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useChallengeDetail, useChallengeActions } from '@/hooks/useChallenges';
import { shortDate } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

const METRIC_LABEL: Record<string, string> = { workouts: 'antrenman', active_days: 'aktif gün' };

export default function ChallengeDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ch, isLoading, isError, refetch } = useChallengeDetail(id);
  const { join, leave } = useChallengeActions(id);

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Meydan Okuma' }} />
      <AsyncState isLoading={isLoading} isError={isError || !ch} onRetry={refetch}>
        {ch ? (
        <View style={{ gap: Spacing.two }}>
          <Text style={[styles.title, { color: c.text }]}>
            {ch.sport?.icon ? `${ch.sport.icon} ` : '🔥 '}
            {ch.title}
          </Text>
          {ch.description ? (
            <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{ch.description}</Text>
          ) : null}

          <Card style={styles.metaCard}>
            <MetaRow icon="flag-outline" text={`Hedef: ${ch.goal} ${METRIC_LABEL[ch.metric]}`} c={c} />
            <MetaRow
              icon="calendar-outline"
              text={`${shortDate(new Date(ch.starts_at))} – ${shortDate(new Date(ch.ends_at))}`}
              c={c}
            />
            <MetaRow icon="people-outline" text={`${ch.participant_count} katılımcı`} c={c} />
          </Card>

          {/* Kendi ilerlemem */}
          {ch.joined ? (
            <Card style={styles.myCard}>
              <View style={styles.rowBetween}>
                <Text style={{ color: c.text, fontWeight: '700' }}>Senin ilerlemen</Text>
                {ch.completed ? (
                  <Text style={{ color: c.success, fontWeight: '700' }}>Tamamlandı 🏆</Text>
                ) : (
                  <Text style={{ color: c.textSecondary }}>
                    {Math.min(ch.my_progress, ch.goal)}/{ch.goal}
                  </Text>
                )}
              </View>
              <ProgressBar value={ch.goal ? ch.my_progress / ch.goal : 0} done={ch.completed} height={10} />
            </Card>
          ) : null}

          {/* Sıralama */}
          <Text style={[styles.section, { color: c.text }]}>Sıralama</Text>
          {ch.leaderboard.length === 0 ? (
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Henüz katılımcı yok.</Text>
          ) : (
            ch.leaderboard.map((p, i) => {
              const name = displayName(p);
              return (
                <View key={p.id} style={[styles.leaderRow, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
                  <Text style={[styles.rank, { color: c.textSecondary }]}>{i + 1}</Text>
                  <Avatar name={name} url={p.avatar_url ?? null} size={34} />
                  <Text style={{ color: c.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {name}
                  </Text>
                  {p.completed ? <Text style={{ fontSize: 15 }}>🏆</Text> : null}
                  <Text style={{ color: c.textSecondary, fontWeight: '700' }}>
                    {Math.min(p.progress, ch.goal)}/{ch.goal}
                  </Text>
                </View>
              );
            })
          )}

          <View style={{ height: Spacing.two }} />
          {ch.status !== 'ended' ? (
            <Button
              title={ch.joined ? 'Ayrıl' : 'Katıl'}
              variant={ch.joined ? 'secondary' : 'primary'}
              onPress={() => (ch.joined ? leave.mutate(ch.id) : join.mutate(ch.id))}
              loading={join.isPending || leave.isPending}
            />
          ) : (
            <Text style={{ color: c.textSecondary, textAlign: 'center' }}>Bu meydan okuma sona erdi.</Text>
          )}
          <View style={{ height: Spacing.four }} />
        </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800' },
  metaCard: { padding: Spacing.two, borderRadius: 14, borderWidth: 1, gap: 10 },
  myCard: { padding: Spacing.two, borderRadius: 14, borderWidth: 1, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 16, fontWeight: '700', marginTop: Spacing.two },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 10, borderRadius: 12, borderWidth: 1 },
  rank: { width: 20, textAlign: 'center', fontWeight: '700' },
});
