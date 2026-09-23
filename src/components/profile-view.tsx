import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { WorkoutHeatmap } from '@/components/workout-heatmap';
import { useColors } from '@/hooks/useColors';
import type { ProfileStats } from '@/hooks/useProfileStats';
import { BADGES, type BadgeState } from '@/lib/badges';
import { Elevation, Spacing, Type } from '@/constants/theme';

type Props = {
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  levelLabel?: string | null;
  location?: string | null;
  bio?: string | null;
  goals?: string[];
  availability?: string[];
  sportNames: string[];
  /** Isı-haritası için kullanıcı kimliği (kendi ya da başkası). */
  userId?: string;
  stats?: ProfileStats;
  statsLoading?: boolean;
  badges: BadgeState[];
  onOpenBadges?: () => void;
  /** Takipçi/takip sayıları (varsa başlıkta gösterilir). */
  followInfo?: { followers: number; following: number; is_following: boolean };
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  /** Başlıkta gösterilen aksiyon (ör. Takip et butonu). */
  headerAction?: ReactNode;
  /** Alt aksiyonlar (Düzenle/Çıkış vb.). */
  footer?: ReactNode;
};

/** Kendi ve başka kullanıcıların profillerinde ortak kullanılan görsel profil. */
export function ProfileView({
  name,
  username,
  avatarUrl,
  levelLabel,
  location,
  bio,
  goals,
  availability,
  sportNames,
  userId,
  stats,
  statsLoading,
  badges,
  onOpenBadges,
  followInfo,
  onOpenFollowers,
  onOpenFollowing,
  headerAction,
  footer,
}: Props) {
  const c = useColors();
  const earnedCount = badges.filter((b) => b.unlocked).length;

  const metaBits = [
    levelLabel ? `Deneyim: ${levelLabel}` : null,
    location ? `📍 ${location}` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* Başlık kartı */}
      <View style={[styles.card, styles.headerCard, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Avatar name={name} url={avatarUrl ?? null} size={96} />
        <Text style={[styles.name, { color: c.text }]}>{name}</Text>
        {username ? <Text style={{ color: c.textSecondary }}>@{username}</Text> : null}
        {metaBits.length ? (
          <Text style={[styles.meta, { color: c.textSecondary }]}>{metaBits.join('  ·  ')}</Text>
        ) : null}
        {bio ? <Text style={[styles.bio, { color: c.text }]}>{bio}</Text> : null}
        {stats && stats.streak > 0 ? (
          <View style={[styles.streakPill, { backgroundColor: c.background }]}>
            <Text style={{ fontSize: 15 }}>🔥</Text>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{stats.streak} gün seri</Text>
          </View>
        ) : null}

        {followInfo ? (
          <View style={styles.followRow}>
            <Pressable onPress={onOpenFollowers} style={styles.followStat} hitSlop={4}>
              <Text style={[styles.followNum, { color: c.text }]}>{followInfo.followers}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Takipçi</Text>
            </Pressable>
            <View style={[styles.followDivider, { backgroundColor: c.border }]} />
            <Pressable onPress={onOpenFollowing} style={styles.followStat} hitSlop={4}>
              <Text style={[styles.followNum, { color: c.text }]}>{followInfo.following}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Takip</Text>
            </Pressable>
          </View>
        ) : null}

        {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
      </View>

      {/* İstatistikler */}
      <View style={[styles.card, styles.statsCard, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        {statsLoading || !stats ? (
          <ActivityIndicator style={{ flex: 1, paddingVertical: Spacing.two }} />
        ) : (
          [
            { v: stats.programs, l: 'Program' },
            { v: stats.workouts, l: 'Antrenman' },
            { v: stats.matches, l: 'Eşleşme' },
            { v: stats.comments, l: 'Yorum' },
          ].map((s, i) => (
            <View
              key={s.l}
              style={[styles.statCol, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.border }]}>
              <Text style={[styles.statValue, { color: c.text }]}>{s.v}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.l}</Text>
            </View>
          ))
        )}
      </View>

      {/* Antrenman ısı-haritası */}
      {userId ? (
        <View style={[styles.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
          <WorkoutHeatmap userId={userId} />
        </View>
      ) : null}

      {/* Rozetler */}
      {badges.length ? (
        <Section title="Rozetler" trailing={`${earnedCount}/${BADGES.length}`} onPress={onOpenBadges} c={c}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.noGrow}
            contentContainerStyle={styles.badgeRow}>
            {badges.map((b) => (
              <Pressable
                key={b.key}
                onPress={onOpenBadges}
                style={[styles.badge, { opacity: b.unlocked ? 1 : 0.35 }]}>
                <View style={[styles.badgeIconWrap, { backgroundColor: b.unlocked ? c.background : c.backgroundElement }]}>
                  <Text style={styles.badgeIcon}>{b.icon}</Text>
                </View>
                <Text style={[styles.badgeLabel, { color: c.textSecondary }]} numberOfLines={2}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {goals?.length ? (
        <Section title="Hedefler" c={c}>
          <TagRow items={goals} c={c} />
        </Section>
      ) : null}

      {availability?.length ? (
        <Section title="Müsaitlik" c={c}>
          <TagRow items={availability.map((a) => `🕑 ${a}`)} c={c} />
        </Section>
      ) : null}

      <Section title="Sporlar" c={c}>
        {sportNames.length ? (
          <TagRow items={sportNames} c={c} />
        ) : (
          <Text style={{ color: c.textSecondary }}>Henüz spor seçilmedi.</Text>
        )}
      </Section>

      {footer}
    </>
  );
}

function Section({
  title,
  trailing,
  onPress,
  c,
  children,
}: {
  title: string;
  trailing?: string;
  onPress?: () => void;
  c: ReturnType<typeof useColors>;
  children: ReactNode;
}) {
  const head = (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      <View style={styles.sectionHeadRight}>
        {trailing ? <Text style={[styles.sectionTrailing, { color: c.textSecondary }]}>{trailing}</Text> : null}
        {onPress ? <Text style={[styles.chevron, { color: c.textSecondary }]}>›</Text> : null}
      </View>
    </View>
  );
  return (
    <View style={{ gap: Spacing.two }}>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={6}>
          {head}
        </Pressable>
      ) : (
        head
      )}
      {children}
    </View>
  );
}

function TagRow({ items, c }: { items: string[]; c: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.tags}>
      {items.map((t) => (
        <View key={t} style={[styles.tag, { backgroundColor: c.backgroundElement }]}>
          <Text style={{ color: c.text, fontSize: 14 }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: Spacing.three, ...Elevation.card },
  headerCard: { alignItems: 'center', gap: 4 },
  name: { fontSize: 22, fontWeight: '800', marginTop: Spacing.two },
  meta: { fontSize: 14, marginTop: 2 },
  bio: { fontSize: 15, textAlign: 'center', marginTop: Spacing.two, lineHeight: 21 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: Spacing.three,
  },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.three },
  followStat: { alignItems: 'center', paddingHorizontal: Spacing.two },
  followNum: { fontSize: 18, fontWeight: '800' },
  followDivider: { width: 1, height: 24 },
  headerAction: { alignSelf: 'stretch', marginTop: Spacing.three },
  statsCard: { flexDirection: 'row', paddingVertical: Spacing.three },
  statCol: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { ...Type.sectionTitle },
  sectionTrailing: { fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 22, fontWeight: '400', marginTop: -2 },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  badgeRow: { gap: Spacing.three, paddingVertical: 2, paddingRight: Spacing.two },
  badge: { width: 72, alignItems: 'center', gap: 6 },
  badgeIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { fontSize: 26 },
  badgeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tag: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
});
