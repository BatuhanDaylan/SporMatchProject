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
import { useAuth } from '@/lib/auth';
import { shortDate } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

const METRIC_LABEL: Record<string, string> = { workouts: 'antrenman', active_days: 'aktif gün' };
const STATUS_LABEL: Record<string, string> = { upcoming: 'Başlamadı', active: 'Aktif', ended: 'Sona erdi' };
const MEDAL = ['🥇', '🥈', '🥉'];

/** Bitişe kalan gün (aktifse); aksi halde null. */
function daysLeft(endsAt: string, status: string): number | null {
  if (status !== 'active') return null;
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000);
  return Number.isFinite(days) ? Math.max(0, days) : null;
}

export default function ChallengeDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ch, isLoading, isError, refetch } = useChallengeDetail(id);
  const { join, leave } = useChallengeActions(id);
  const { user } = useAuth();

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Meydan Okuma' }} />
      <AsyncState isLoading={isLoading} isError={isError || !ch} onRetry={refetch}>
        {ch ? (
        <View style={{ gap: Spacing.two }}>
          {/* Hero */}
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: `${c.primary}22` }]}>
                <Text style={{ fontSize: 30 }}>{ch.sport?.icon ?? '🔥'}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.title, { color: c.text }]} numberOfLines={3}>
                  {ch.title}
                </Text>
                <View style={styles.chipRow}>
                  <View style={[styles.statusChip, { backgroundColor: ch.status === 'active' ? c.primary : c.border }]}>
                    <Text style={{ color: ch.status === 'active' ? c.onPrimary : c.textSecondary, fontSize: 11, fontWeight: '800' }}>
                      {STATUS_LABEL[ch.status] ?? ch.status}
                    </Text>
                  </View>
                  {daysLeft(ch.ends_at, ch.status) !== null ? (
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      {daysLeft(ch.ends_at, ch.status)} gün kaldı
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            {ch.description ? (
              <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{ch.description}</Text>
            ) : null}
            <View style={[styles.divider, { backgroundColor: c.border }]} />
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
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Senin ilerlemen</Text>
                {ch.completed ? (
                  <Text style={{ color: c.success, fontWeight: '700' }}>Tamamlandı 🏆</Text>
                ) : (
                  <Text style={{ color: c.textSecondary, fontWeight: '600' }}>
                    {Math.min(ch.my_progress, ch.goal)}/{ch.goal}
                  </Text>
                )}
              </View>
              <ProgressBar value={ch.goal ? ch.my_progress / ch.goal : 0} done={ch.completed} height={12} />
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                %{ch.goal ? Math.min(100, Math.round((ch.my_progress / ch.goal) * 100)) : 0} tamamlandı
              </Text>
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
                <View
                  key={p.id}
                  style={[
                    styles.leaderRow,
                    {
                      backgroundColor: p.id === user?.id ? `${c.primary}14` : c.backgroundElement,
                      borderColor: p.id === user?.id ? `${c.primary}55` : c.border,
                    },
                  ]}>
                  <Text style={[styles.rank, { color: c.textSecondary }]}>{MEDAL[i] ?? i + 1}</Text>
                  <Avatar name={name} url={p.avatar_url ?? null} size={34} />
                  <Text style={{ color: c.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {name}
                    {p.id === user?.id ? ' (sen)' : ''}
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
  title: { fontSize: 22, fontWeight: '800' },
  hero: { padding: Spacing.three, borderRadius: 18, gap: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  divider: { height: StyleSheet.hairlineWidth },
  myCard: { padding: Spacing.three, borderRadius: 16, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 17, fontWeight: '700', marginTop: Spacing.two },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 10, borderRadius: 12, borderWidth: 1 },
  rank: { width: 28, textAlign: 'center', fontWeight: '700', fontSize: 16 },
});
