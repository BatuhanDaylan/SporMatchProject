import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useMyPrograms, type Program } from '@/hooks/usePrograms';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useSavedPrograms } from '@/hooks/useProgramSocial';
import { useSports } from '@/hooks/useSports';
import type { DiscoverProgram } from '@/hooks/useDiscover';
import { BottomTabInset, Spacing, Type } from '@/constants/theme';

type Mode = 'mine' | 'saved';

const SEGMENT_OPTIONS = [
  { value: 'mine', label: 'Programlarım' },
  { value: 'saved', label: 'Kaydettiklerim' },
] as const;

/** Program — "antrenmanımı yönet" işi: özet + ilerleme (liderlik/meydan okuma) + kendi programlarım/kaydettiklerim. */
export default function ProgramsScreen() {
  const c = useColors();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('mine');
  const mine = useMyPrograms();
  const saved = useSavedPrograms();
  const { data: stats } = useProfileStats();
  const { data: sports } = useSports();
  const active = mode === 'mine' ? mine : saved;

  const sportIcon = useMemo(() => {
    const byId = new Map((sports ?? []).map((s) => [s.id, s.icon]));
    return (id: string | null) => (id ? byId.get(id) ?? null : null);
  }, [sports]);

  useFocusEffect(
    useCallback(() => {
      if (mine.isStale) mine.refetch();
      if (saved.isStale) saved.refetch();
    }, [mine.isStale, saved.isStale, mine.refetch, saved.refetch]),
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>Program</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Planla, kaydet, ilerlemeni takip et.
          </Text>
        </View>
        {mode === 'mine' ? (
          <IconButton
            icon="add"
            iconSize={24}
            iconColor={c.onPrimary}
            backgroundColor={c.primary}
            onPress={() => router.push('/program/edit')}
            accessibilityLabel="Program oluştur"
          />
        ) : null}
      </View>

      {/* Özet — gerçek profil istatistikleri */}
      {stats ? (
        <Card style={styles.summary}>
          <SummaryStat emoji="🔥" value={stats.streak} label="Gün seri" />
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <SummaryStat emoji="🏋️" value={stats.workouts} label="Antrenman" />
          <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
          <SummaryStat emoji="📋" value={stats.programs} label="Program" />
        </Card>
      ) : null}

      {/* İlerleme */}
      <View style={styles.progressRow}>
        <ActionTile
          icon="trophy-outline"
          title="Liderlik"
          subtitle="Sıralamada yerini gör"
          onPress={() => router.push('/leaderboard')}
        />
        <ActionTile
          icon="flame-outline"
          title="Meydan okuma"
          subtitle="Hedef koy, yarış"
          onPress={() => router.push('/challenges')}
        />
      </View>

      {/* Programlarım / Kaydettiklerim */}
      <Segment value={mode} onChange={setMode} options={SEGMENT_OPTIONS} />

      <AsyncState
        isLoading={active.isLoading}
        isError={active.isError}
        onRetry={active.refetch}
        isEmpty={(active.data?.length ?? 0) === 0}
        empty={{
          icon: mode === 'mine' ? 'barbell-outline' : 'bookmark-outline',
          title: mode === 'mine' ? 'Henüz programın yok' : 'Kaydettiğin yok',
          text:
            mode === 'mine'
              ? 'İlk antrenman programını oluştur; günler, egzersizler ve kendi alanlarını ekle.'
              : "Keşfet'te beğendiğin programları kaydet; burada toplanır.",
          action: mode === 'mine' ? <Button title="Program Oluştur" onPress={() => router.push('/program/edit')} /> : undefined,
        }}>
        {mode === 'mine' ? (
          <FlatList
            data={mine.data}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: Spacing.two, paddingBottom: BottomTabInset }}
            renderItem={({ item }) => (
              <ProgramCard
                program={item}
                emoji={sportIcon(item.sport_id)}
                onPress={() => router.push(`/program/${item.id}`)}
              />
            )}
          />
        ) : (
          <FlatList
            data={saved.data}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: Spacing.two, paddingBottom: BottomTabInset }}
            renderItem={({ item }) => <SavedCard program={item} onPress={() => router.push(`/program/${item.id}`)} />}
          />
        )}
      </AsyncState>
    </Screen>
  );
}

function SummaryStat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  const c = useColors();
  return (
    <View style={styles.summaryCol}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={[styles.summaryValue, { color: c.text }]}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Card onPress={onPress} style={styles.tile} accessibilityRole="button" accessibilityLabel={`${title}, ${subtitle}`}>
      <View style={[styles.tileIcon, { backgroundColor: c.primary }]}>
        <Ionicons name={icon} size={18} color={c.onPrimary} />
      </View>
      <View style={{ gap: 1 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const c = useColors();
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={c.textSecondary} />
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function ProgramCard({ program, emoji, onPress }: { program: Program; emoji: string | null; onPress: () => void }) {
  const c = useColors();
  const days = program.template?.days ?? [];
  const exCount = days.reduce((n, d) => n + (d.exercises?.length ?? 0), 0);
  const dayNames = days.map((d) => d.name).filter(Boolean).join(' · ');
  const isPublic = program.visibility === 'public';
  return (
    <Card onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={program.title}>
      <View style={[styles.cardIcon, { backgroundColor: `${c.primary}22` }]}>
        <Text style={{ fontSize: 24 }}>{emoji ?? '📋'}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
          {program.title}
        </Text>
        {dayNames ? (
          <Text style={{ color: c.textSecondary, fontSize: 13 }} numberOfLines={1}>
            {dayNames}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Meta icon="calendar-outline" text={`${days.length} gün`} />
          <Meta icon="barbell-outline" text={`${exCount} egzersiz`} />
          <Meta icon={isPublic ? 'globe-outline' : 'lock-closed-outline'} text={isPublic ? 'Açık' : 'Gizli'} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
    </Card>
  );
}

function SavedCard({ program, onPress }: { program: DiscoverProgram; onPress: () => void }) {
  const c = useColors();
  const ownerName = displayName(program.owner);
  const days = program.template?.days ?? [];
  const exCount = days.reduce((n, d) => n + (d.exercises?.length ?? 0), 0);
  return (
    <Card onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={program.title}>
      <Avatar name={ownerName} url={program.owner?.avatar_url} size={48} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
          {program.sport?.icon ? `${program.sport.icon} ` : ''}
          {program.title}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }} numberOfLines={1}>
          {ownerName}
        </Text>
        <View style={styles.metaRow}>
          <Meta icon="calendar-outline" text={`${days.length} gün`} />
          <Meta icon="barbell-outline" text={`${exCount} egzersiz`} />
        </View>
      </View>
      <Ionicons name="bookmark" size={18} color={c.primary} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { ...Type.displayTitle },
  subtitle: { fontSize: 14, marginTop: 2 },
  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.three },
  summaryCol: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryDivider: { width: 1, height: 40 },
  progressRow: { flexDirection: 'row', gap: Spacing.two },
  tile: { flex: 1, padding: Spacing.three, gap: Spacing.two, borderRadius: 16 },
  tileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.three, rowGap: 2, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
