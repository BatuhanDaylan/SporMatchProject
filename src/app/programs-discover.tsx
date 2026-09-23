import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useDiscoverPrograms, type DiscoverProgram, type DiscoverSort } from '@/hooks/useDiscover';
import { Spacing } from '@/constants/theme';

const SORTS: { key: DiscoverSort; label: string }[] = [
  { key: 'recent', label: 'Yeni' },
  { key: 'liked', label: 'Beğeni' },
  { key: 'saved', label: 'Kayıt' },
  { key: 'hit', label: '🔥 Hit' },
];

const PERIODS: { days: number; label: string }[] = [
  { days: 7, label: 'Bu hafta' },
  { days: 30, label: 'Bu ay' },
];

/** Herkese açık programların tam listesi — sıralama/filtreyle. Keşfet'in "Tümünü Gör"ü. */
export default function ProgramsDiscoverScreen() {
  const c = useColors();
  const router = useRouter();
  const [sort, setSort] = useState<DiscoverSort>('recent');
  const [period, setPeriod] = useState(7);
  const { data, isLoading, isError, refetch, isRefetching } = useDiscoverPrograms(sort, period);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Programları Keşfet' }} />

      <View style={styles.sortChips}>
        {SORTS.map((s) => (
          <Chip key={s.key} label={s.label} selected={sort === s.key} onPress={() => setSort(s.key)} />
        ))}
      </View>

      {sort === 'hit' ? (
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Chip key={p.days} label={p.label} selected={period === p.days} onPress={() => setPeriod(p.days)} />
          ))}
        </View>
      ) : null}

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{
          icon: 'compass-outline',
          title: 'Program yok',
          text:
            sort === 'hit'
              ? `${period === 7 ? 'Bu hafta' : 'Bu ay'} öne çıkan program yok. Bir program beğen veya kaydet!`
              : 'Henüz herkese açık program yok. İlk paylaşan sen ol!',
        }}>
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: Spacing.two, paddingVertical: Spacing.two, paddingBottom: Spacing.six }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />}
          renderItem={({ item }) => (
            <DiscoverCard
              program={item}
              showHit={sort === 'hit'}
              onPress={() => router.push(`/program/${item.id}`)}
              onOpenOwner={() => router.push(`/user/${item.owner_id}`)}
            />
          )}
        />
      </AsyncState>
    </Screen>
  );
}

function DiscoverCard({
  program,
  showHit,
  onPress,
  onOpenOwner,
}: {
  program: DiscoverProgram;
  showHit?: boolean;
  onPress: () => void;
  onOpenOwner: () => void;
}) {
  const c = useColors();
  const ownerName = displayName(program.owner);
  const dayCount = program.template.days.length;
  const exCount = program.template.days.reduce((n, d) => n + d.exercises.length, 0);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable onPress={onOpenOwner} style={styles.ownerTap} hitSlop={4}>
          <Avatar name={ownerName} url={program.owner?.avatar_url} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.owner, { color: c.text }]}>{ownerName}</Text>
            {program.sport ? (
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                {program.sport.icon} {program.sport.name}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {showHit && (program.hit_score ?? 0) > 0 ? (
          <View style={[styles.hitBadge, { backgroundColor: c.danger }]}>
            <Text style={[styles.hitText, { color: c.onDanger }]}>🔥 {program.hit_score}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]}>{program.title}</Text>
      {program.description ? (
        <Text numberOfLines={2} style={{ color: c.textSecondary, fontSize: 13 }}>
          {program.description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {dayCount} gün · {exCount} egzersiz
        </Text>
        <View style={styles.counts}>
          <View style={styles.countChip}>
            <Ionicons name="heart-outline" size={13} color={c.primary} />
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>{program.like_count ?? 0}</Text>
          </View>
          <View style={styles.countChip}>
            <Ionicons name="chatbubble-outline" size={13} color={c.primary} />
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>{program.comment_count ?? 0}</Text>
          </View>
          <View style={styles.countChip}>
            <Ionicons name="bookmark-outline" size={13} color={c.primary} />
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>{program.save_count ?? 0}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sortChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  periodRow: { flexDirection: 'row', gap: Spacing.two },
  card: { borderRadius: 14, borderWidth: 1, padding: Spacing.three, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  ownerTap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  owner: { fontSize: 14, fontWeight: '700' },
  hitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  hitText: { fontSize: 12, fontWeight: '800' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counts: { flexDirection: 'row', gap: Spacing.two },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
