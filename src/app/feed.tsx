import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { showAlert } from '@/store/alert';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFeed, useFeedActions, type FeedPost } from '@/hooks/useFeed';
import { useModeration } from '@/hooks/useModeration';
import { timeAgo } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

export default function FeedScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useFeed();
  const { toggleLike, deletePost } = useFeedActions();
  const { report } = useModeration();

  function confirmDelete(id: string) {
    showAlert('Gönderiyi sil', 'Bu gönderi silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deletePost.mutate(id) },
    ]);
  }

  function reportPost(post: FeedPost) {
    showAlert('Gönderiyi şikayet et', 'Bu gönderi uygunsuz mu?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Şikayet et',
        style: 'destructive',
        onPress: () => {
          report.mutate({
            userId: post.author_id,
            reason: 'Uygunsuz gönderi',
            context: { type: 'post', post_id: post.id, body: post.body },
          });
          showAlert('Teşekkürler', 'Şikayetin alındı.');
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Akış' }} />
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{
          icon: 'newspaper-outline',
          title: 'Henüz gönderi yok',
          text: 'İlk paylaşımı sen yap — antrenmanını ya da hedefini paylaş.',
        }}>
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: 96, paddingTop: Spacing.one }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              c={c}
              onOpenAuthor={() => router.push(`/user/${item.author_id}`)}
              onOpenPost={() => router.push(`/post/${item.id}`)}
              onToggleLike={() => toggleLike.mutate({ postId: item.id, liked: item.liked })}
              onDelete={() => confirmDelete(item.id)}
              onReport={() => reportPost(item)}
            />
          )}
        />
      </AsyncState>

      <Fab icon="create-outline" size={24} onPress={() => router.push('/post/create')} accessibilityLabel="Gönderi oluştur" />
    </Screen>
  );
}

function PostCard({
  post,
  c,
  onOpenAuthor,
  onOpenPost,
  onToggleLike,
  onDelete,
  onReport,
}: {
  post: FeedPost;
  c: ReturnType<typeof useColors>;
  onOpenAuthor: () => void;
  onOpenPost: () => void;
  onToggleLike: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const name = displayName(post.author);
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Pressable onPress={onOpenAuthor} style={styles.who} accessibilityRole="button" accessibilityLabel={`${name} profilini aç`}>
          <Avatar name={name} url={post.author?.avatar_url ?? null} size={40} />
          <View>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{name}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>{timeAgo(post.created_at)}</Text>
          </View>
        </Pressable>
        {post.is_mine ? (
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Gönderiyi sil">
            <Ionicons name="trash-outline" size={18} color={c.textSecondary} />
          </Pressable>
        ) : (
          <Pressable onPress={onReport} hitSlop={8} accessibilityRole="button" accessibilityLabel="Gönderiyi şikayet et">
            <Ionicons name="flag-outline" size={16} color={c.textSecondary} />
          </Pressable>
        )}
      </View>

      {post.hidden_at ? (
        <Text style={{ color: c.danger, fontSize: 12, fontStyle: 'italic' }}>
          Bu gönderi şikayet edildiği için gizlendi.
        </Text>
      ) : null}

      {post.body ? <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{post.body}</Text> : null}

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
      ) : null}

      <View style={styles.foot}>
        <Pressable
          onPress={onToggleLike}
          style={styles.likeBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={post.liked ? 'Beğeniyi geri al' : 'Beğen'}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? c.primary : c.textSecondary} />
          <Text style={{ color: post.liked ? c.primary : c.textSecondary, fontWeight: '600', fontSize: 13 }}>
            {post.like_count > 0 ? post.like_count : 'Beğen'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenPost}
          style={styles.likeBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Yorumları gör">
          <Ionicons name="chatbubble-outline" size={19} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontWeight: '600', fontSize: 13 }}>
            {post.comment_count > 0 ? post.comment_count : 'Yorum yap'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: Spacing.two, gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#0002' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
