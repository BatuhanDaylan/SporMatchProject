import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { PostCard } from '@/components/post-card';
import { ProgramCard } from '@/components/program-card';
import { SportFilter } from '@/components/sport-filter';
import { AsyncState } from '@/components/ui/async-state';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useDiscoverPrograms, type DiscoverProgram } from '@/hooks/useDiscover';
import { useFeed, type FeedPost } from '@/hooks/useFeed';
import { useRefresh } from '@/hooks/useRefresh';
import { Spacing } from '@/constants/theme';

type Filter = 'all' | 'posts' | 'programs';
type Item = { kind: 'post'; date: string; post: FeedPost } | { kind: 'program'; date: string; program: DiscoverProgram };

const FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'posts', label: 'Gönderiler' },
  { value: 'programs', label: 'Programlar' },
] as const;

/** Akış: gönderiler ve herkese açık programlar tarih sırasıyla bir arada; türe ve spora göre filtrelenir. */
export default function FeedScreen() {
  const c = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [sportId, setSportId] = useState<string | null>(null);
  const posts = useFeed();
  const programs = useDiscoverPrograms('recent', 7, sportId);
  const refresh = useRefresh(() => Promise.all([posts.refetch(), programs.refetch()]));

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (filter !== 'programs') for (const p of posts.data ?? []) out.push({ kind: 'post', date: p.created_at, post: p });
    if (filter !== 'posts') for (const p of programs.data ?? []) out.push({ kind: 'program', date: p.updated_at, program: p });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [filter, posts.data, programs.data]);

  const loading = (filter !== 'programs' && posts.isLoading) || (filter !== 'posts' && programs.isLoading);
  const error = (filter !== 'programs' && posts.isError) || (filter !== 'posts' && programs.isError);

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Akış' }} />
      <View style={{ gap: Spacing.two }}>
        <Segment value={filter} onChange={setFilter} options={FILTERS} />
        {filter === 'programs' ? <SportFilter value={sportId} onChange={setSportId} /> : null}
      </View>
      <AsyncState
        isLoading={loading}
        isError={error}
        onRetry={refresh.onRefresh}
        isEmpty={items.length === 0}
        empty={{
          icon: 'newspaper-outline',
          title: filter === 'programs' ? 'Program yok' : 'Henüz gönderi yok',
          text: filter === 'programs' ? 'Bu filtrede herkese açık program yok.' : 'İlk paylaşımı sen yap — antrenmanını ya da hedefini paylaş.',
        }}>
        <FlatList
          data={items}
          keyExtractor={(it) => `${it.kind}:${it.kind === 'post' ? it.post.id : it.program.id}`}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: 96 }}
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
          renderItem={({ item }) => (item.kind === 'post' ? <PostCard post={item.post} /> : <ProgramCard program={item.program} />)}
        />
      </AsyncState>

      <Fab icon="create-outline" size={24} onPress={() => router.push('/post/create')} accessibilityLabel="Gönderi oluştur" tourId="feed.fab" />
    </Screen>
  );
}
