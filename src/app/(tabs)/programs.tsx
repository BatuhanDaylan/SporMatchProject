import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useSavedPrograms } from '@/hooks/useProgramSocial';
import type { DiscoverProgram } from '@/hooks/useDiscover';
import { Spacing, Type } from '@/constants/theme';

type Mode = 'mine' | 'saved';

const SEGMENT_OPTIONS = [
  { value: 'mine', label: 'Programlarım' },
  { value: 'saved', label: 'Kaydettiklerim' },
] as const;

/** Program — "antrenmanımı yönet" işi: kendi programlarım/kaydettiklerim + ilerleme (liderlik/meydan okuma). */
export default function ProgramsScreen() {
  const c = useColors();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('mine');
  const mine = useMyPrograms();
  const saved = useSavedPrograms();
  const active = mode === 'mine' ? mine : saved;

  useFocusEffect(
    useCallback(() => {
      if (mine.isStale) mine.refetch();
      if (saved.isStale) saved.refetch();
    }, [mine.isStale, saved.isStale, mine.refetch, saved.refetch]),
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>Program</Text>
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

      {/* İlerleme */}
      <View style={styles.progressRow}>
        <NavCard
          icon="trophy-outline"
          title="Liderlik"
          onPress={() => router.push('/leaderboard')}
        />
        <NavCard
          icon="flame-outline"
          title="Meydan Ok."
          onPress={() => router.push('/challenges')}
        />
      </View>

      {/* Programlarım / Kaydettiklerim */}
      <Segment
        value={mode}
        onChange={setMode}
        options={SEGMENT_OPTIONS}
        style={{ marginTop: Spacing.two, marginBottom: Spacing.two }}
      />

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
            contentContainerStyle={{ gap: Spacing.two, paddingVertical: Spacing.two, paddingBottom: Spacing.six }}
            renderItem={({ item }) => <ProgramCard program={item} onPress={() => router.push(`/program/${item.id}`)} />}
          />
        ) : (
          <FlatList
            data={saved.data}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: Spacing.two, paddingVertical: Spacing.two, paddingBottom: Spacing.six }}
            renderItem={({ item }) => <SavedCard program={item} onPress={() => router.push(`/program/${item.id}`)} />}
          />
        )}
      </AsyncState>
    </Screen>
  );
}

function NavCard({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Card onPress={onPress} style={styles.navCard} accessibilityRole="button" accessibilityLabel={title}>
      <View style={[styles.navIcon, { backgroundColor: c.primary }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.textSecondary} />
    </Card>
  );
}

function ProgramCard({ program, onPress }: { program: Program; onPress: () => void }) {
  const c = useColors();
  const dayCount = program.template.days.length;
  const exCount = program.template.days.reduce((n, d) => n + d.exercises.length, 0);
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{program.title}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          {dayCount} gün · {exCount} egzersiz · {program.visibility === 'public' ? 'Herkese açık' : 'Gizli'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
    </Card>
  );
}

function SavedCard({ program, onPress }: { program: DiscoverProgram; onPress: () => void }) {
  const c = useColors();
  const ownerName = displayName(program.owner);
  const dayCount = program.template.days.length;
  const exCount = program.template.days.reduce((n, d) => n + d.exercises.length, 0);
  return (
    <Card onPress={onPress} style={styles.card}>
      <Avatar name={ownerName} url={program.owner?.avatar_url} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{program.title}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          {ownerName} · {dayCount} gün · {exCount} egzersiz
        </Text>
      </View>
      <Ionicons name="bookmark" size={18} color={c.primary} />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Type.displayTitle },
  progressRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  navCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  navIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
});
