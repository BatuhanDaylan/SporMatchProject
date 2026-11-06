import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { CommentsSection } from '@/components/comments-section';
import { PostCard } from '@/components/post-card';
import { AsyncState } from '@/components/ui/async-state';
import { Screen } from '@/components/ui/screen';
import { usePostDetail } from '@/hooks/useFeed';
import { Spacing } from '@/constants/theme';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading, isError, refetch } = usePostDetail(id);

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Gönderi' }} />
      <AsyncState isLoading={isLoading} isError={isError || !post} onRetry={refetch}>
        {post ? (
          <View style={{ gap: Spacing.three }}>
            <PostCard post={post} detail onDeleted={() => router.back()} />
            <CommentsSection kind="post" targetId={post.id} canModerate={post.is_mine} />
          </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
