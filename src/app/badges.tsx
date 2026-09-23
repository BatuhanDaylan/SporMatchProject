import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useProfileStats } from '@/hooks/useProfileStats';
import { rankBadges, type BadgeState } from '@/lib/badges';
import { Spacing } from '@/constants/theme';

export default function BadgesScreen() {
  const c = useColors();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { data: stats, isLoading } = useProfileStats(userId);

  const badges = useMemo(() => (stats ? rankBadges(stats) : []), [stats]);
  const earned = badges.filter((b) => b.unlocked).length;

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Rozetler' }} />

      {isLoading || !stats ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: Spacing.four }} />
      ) : (
        <>
          <Text style={[styles.summary, { color: c.textSecondary }]}>
            {badges.length} rozetten {earned} tanesini kazandın
          </Text>
          {badges.map((b) => (
            <BadgeRow key={b.key} badge={b} c={c} />
          ))}
          <View style={{ height: Spacing.four }} />
        </>
      )}
    </Screen>
  );
}

function BadgeRow({ badge, c }: { badge: BadgeState; c: ReturnType<typeof useColors> }) {
  const pct = Math.round(badge.ratio * 100);
  return (
    <View style={[styles.row, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: c.background, opacity: badge.unlocked ? 1 : 0.4 },
        ]}>
        <Text style={styles.icon}>{badge.icon}</Text>
      </View>

      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.label, { color: c.text }]}>{badge.label}</Text>
          {badge.unlocked ? (
            <View style={[styles.done, { backgroundColor: c.success }]}>
              <Text style={{ color: c.onSuccess, fontSize: 11, fontWeight: '800' }}>✓</Text>
            </View>
          ) : (
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
              {badge.current}/{badge.target}
            </Text>
          )}
        </View>

        <Text style={[styles.desc, { color: c.textSecondary }]}>{badge.description}</Text>

        {/* İlerleme çubuğu */}
        <View style={[styles.track, { backgroundColor: c.background }]}>
          <View
            style={[
              styles.fill,
              { width: `${pct}%`, backgroundColor: badge.unlocked ? c.success : c.primary },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: 14, marginBottom: Spacing.one },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '700' },
  done: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  desc: { fontSize: 13, lineHeight: 18 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 3 },
});
