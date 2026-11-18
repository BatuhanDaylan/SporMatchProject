import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PostCard } from '@/components/post-card';
import { ProgramCard } from '@/components/program-card';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useUserPrograms } from '@/hooks/useDiscover';
import { useFeed } from '@/hooks/useFeed';
import { Spacing } from '@/constants/theme';

const TABS = [
  { value: 'posts', label: 'Gönderiler' },
  { value: 'programs', label: 'Programlar' },
] as const;

/** Profilde kişinin paylaşımları: gönderileri ve programları (sekmeli). */
export function ProfileContent({ userId, isMe }: { userId: string; isMe: boolean }) {
  const c = useColors();
  const [tab, setTab] = useState<'posts' | 'programs'>('posts');
  const posts = useFeed(userId);
  const programs = useUserPrograms(userId, isMe);
  const active = tab === 'posts' ? posts : programs;
  const count = (active.data ?? []).length;

  return (
    <View style={{ gap: Spacing.two }}>
      <Segment
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => ({
          ...t,
          label: `${t.label}${(t.value === 'posts' ? posts : programs).data ? ` (${(t.value === 'posts' ? posts : programs).data!.length})` : ''}`,
        }))}
      />
      {active.isLoading ? (
        <ActivityIndicator style={{ paddingVertical: Spacing.three }} color={c.primary} />
      ) : active.isError ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>Yüklenemedi. Aşağı çekip yenile.</Text>
      ) : count === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>
          {tab === 'posts'
            ? isMe
              ? 'Henüz gönderin yok. Keşfet’teki kalem düğmesiyle ilk paylaşımını yap.'
              : 'Henüz gönderi paylaşmamış.'
            : isMe
              ? 'Henüz programın yok.'
              : 'Herkese açık programı yok.'}
        </Text>
      ) : tab === 'posts' ? (
        posts.data!.map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        programs.data!.map((p) => <ProgramCard key={p.id} program={p} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', paddingVertical: Spacing.three, fontSize: 14 },
});
