import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ImageViewer } from '@/components/ui/image-viewer';
import { RichText } from '@/components/ui/rich-text';
import { useColors } from '@/hooks/useColors';
import { useFeedActions, type FeedPost } from '@/hooks/useFeed';
import { useModeration } from '@/hooks/useModeration';
import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { timeAgo } from '@/lib/datetime';
import { showAlert } from '@/store/alert';
import { Spacing } from '@/constants/theme';

type Props = {
  post: FeedPost;
  /** Detay ekranında kart dokunulabilir değildir ve metin kısaltılmaz. */
  detail?: boolean;
  /** Silinince (detay ekranından geri dönmek için). */
  onDeleted?: () => void;
};

/** Gönderi kartı: dokununca gönderi açılır, fotoğraf büyütülür, #etiketler dokunulabilir. */
export function PostCard({ post, detail = false, onDeleted }: Props) {
  const c = useColors();
  const router = useRouter();
  const { toggleLike, deletePost } = useFeedActions();
  const { sendReport } = useModeration();
  const [viewer, setViewer] = useState<string | null>(null);
  const name = displayName(post.author);

  function openMenu() {
    if (post.is_mine) {
      showAlert('Gönderi', undefined, [
        { text: 'Düzenle', onPress: () => router.push(`/post/create?id=${post.id}`) },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () =>
            showAlert('Gönderiyi sil', 'Bu gönderi silinecek. Emin misin?', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: () =>
                  deletePost.mutate(post.id, {
                    onSuccess: onDeleted,
                    onError: (e) => showAlert('Silinemedi', getErrorMessage(e)),
                  }),
              },
            ]),
        },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
    } else {
      showAlert('Gönderiyi şikayet et', 'Bu gönderi uygunsuz mu?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Şikayet et',
          style: 'destructive',
          onPress: () =>
            sendReport(
              { userId: post.author_id, reason: 'Uygunsuz gönderi', context: { type: 'post', post_id: post.id, body: post.body } },
              'post',
              post.id,
            ),
        },
      ]);
    }
  }

  const content = (
    <>
      <View style={styles.head}>
        <Pressable
          onPress={() => router.push(`/user/${post.author_id}`)}
          style={styles.who}
          accessibilityRole="button"
          accessibilityLabel={`${name} profilini aç`}>
          <Avatar name={name} url={post.author?.avatar_url ?? null} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {timeAgo(post.created_at)}
              {post.edited_at ? ' · düzenlendi' : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={openMenu}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={post.is_mine ? 'Gönderi seçenekleri' : 'Gönderiyi şikayet et'}>
          <Ionicons name={post.is_mine ? 'ellipsis-horizontal' : 'flag-outline'} size={18} color={c.textSecondary} />
        </Pressable>
      </View>

      {post.hidden_at ? (
        <Text style={{ color: c.danger, fontSize: 12, fontStyle: 'italic' }}>Bu gönderi şikayet edildiği için gizlendi.</Text>
      ) : null}

      {post.body ? (
        <RichText
          numberOfLines={detail ? undefined : 8}
          style={{ color: c.text, fontSize: detail && !post.image_url ? 18 : 15, lineHeight: detail && !post.image_url ? 26 : 21 }}>
          {post.body}
        </RichText>
      ) : null}

      {post.image_url ? (
        <Pressable onPress={() => setViewer(post.image_url)} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı büyüt">
          <Image source={{ uri: post.image_url }} style={styles.image} contentFit="cover" transition={150} />
        </Pressable>
      ) : null}

      <View style={styles.foot}>
        <Pressable
          onPress={() => toggleLike.mutate({ postId: post.id, liked: post.liked })}
          style={[styles.pill, { backgroundColor: post.liked ? `${c.primary}22` : c.background }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={post.liked ? 'Beğeniyi geri al' : 'Beğen'}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={19} color={post.liked ? c.primary : c.textSecondary} />
          <Text style={{ color: post.liked ? c.primary : c.textSecondary, fontWeight: '700', fontSize: 13 }}>
            {post.like_count > 0 ? post.like_count : 'Beğen'}
          </Text>
        </Pressable>
        <Pressable
          onPress={detail ? undefined : () => router.push(`/post/${post.id}`)}
          disabled={detail}
          style={[styles.pill, { backgroundColor: c.background }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Yorumlar">
          <Ionicons name="chatbubble-outline" size={18} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: 13 }}>
            {post.comment_count > 0 ? post.comment_count : 'Yorum yap'}
          </Text>
        </Pressable>
      </View>
      <ImageViewer uri={viewer} onClose={() => setViewer(null)} />
    </>
  );

  return detail ? (
    <Card elevated style={styles.card}>
      {content}
    </Card>
  ) : (
    <Card style={styles.card} onPress={() => router.push(`/post/${post.id}`)} accessibilityRole="button" accessibilityLabel={`${name} gönderisi`}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#0002' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
