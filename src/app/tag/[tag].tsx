import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl } from 'react-native';

import { PostCard } from '@/components/post-card';
import { AsyncState } from '@/components/ui/async-state';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFeed } from '@/hooks/useFeed';
import { useRefresh } from '@/hooks/useRefresh';
import { Spacing } from '@/constants/theme';

/** Bir #etiketi taşıyan gönderiler. */
export default function TagScreen() {
  const c = useColors();
  const { tag: raw } = useLocalSearchParams<{ tag: string }>();
  const tag = decodeURIComponent(raw ?? '').replace(/^#/, '');
  const { data, isLoading, isError, refetch } = useFeed(undefined, tag);
  const refresh = useRefresh(refetch);

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: `#${tag}` }} />
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{ icon: 'pricetag-outline', title: 'Gönderi yok', text: `#${tag} etiketiyle henüz paylaşım yapılmadı.` }}>
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.six }}
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      </AsyncState>
    </Screen>
  );
}
