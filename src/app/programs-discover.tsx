import { Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ProgramCard } from '@/components/program-card';
import { SportFilter } from '@/components/sport-filter';
import { AsyncState } from '@/components/ui/async-state';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useDiscoverPrograms, type DiscoverSort } from '@/hooks/useDiscover';
import { useRefresh } from '@/hooks/useRefresh';
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

/** Herkese açık programların tam listesi — sıralama + spor filtresiyle. Keşfet'in "Tümünü Gör"ü. */
export default function ProgramsDiscoverScreen() {
  const c = useColors();
  const [sort, setSort] = useState<DiscoverSort>('recent');
  const [period, setPeriod] = useState(7);
  const [sportId, setSportId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useDiscoverPrograms(sort, period, sportId);
  const refresh = useRefresh(refetch);

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Programları Keşfet' }} />

      <View style={{ gap: Spacing.two }}>
        <SportFilter value={sportId} onChange={setSportId} />
        <View style={styles.chips}>
          {SORTS.map((s) => (
            <Chip key={s.key} label={s.label} selected={sort === s.key} onPress={() => setSort(s.key)} />
          ))}
        </View>
        {sort === 'hit' ? (
          <View style={styles.chips}>
            {PERIODS.map((p) => (
              <Chip key={p.days} label={p.label} selected={period === p.days} onPress={() => setPeriod(p.days)} />
            ))}
          </View>
        ) : null}
      </View>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{
          icon: 'compass-outline',
          title: 'Program yok',
          text:
            sportId
              ? 'Bu sporda herkese açık program yok.'
              : sort === 'hit'
                ? `${period === 7 ? 'Bu hafta' : 'Bu ay'} öne çıkan program yok. Bir program beğen veya kaydet!`
                : 'Henüz herkese açık program yok. İlk paylaşan sen ol!',
        }}>
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.six }}
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          renderItem={({ item }) => <ProgramCard program={item} showHit={sort === 'hit'} />}
        />
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
