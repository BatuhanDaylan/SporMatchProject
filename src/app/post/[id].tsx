import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFeedActions, usePostDetail } from '@/hooks/useFeed';
import { usePostComments, type PostComment } from '@/hooks/usePostComments';
import { useModeration } from '@/hooks/useModeration';
import { timeAgo } from '@/lib/datetime';
import { Spacing, Type } from '@/constants/theme';

export default function PostDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading, isError, refetch } = usePostDetail(id);
  const { toggleLike } = useFeedActions();
  const { data: comments, isLoading: commentsLoading, add, remove, currentUserId } = usePostComments(id);
  const { report } = useModeration();
  const [text, setText] = useState('');

  function reportComment(cm: PostComment) {
    showAlert('Yorumu şikayet et', 'Bu yorum uygunsuz mu?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Şikayet et',
        style: 'destructive',
        onPress: () => {
          report.mutate({
            userId: cm.author_id,
            reason: 'Uygunsuz yorum',
            context: { type: 'post_comment', comment_id: cm.id, post_id: id, body: cm.body },
          });
          showAlert('Teşekkürler', 'Şikayetin alındı.');
        },
      },
    ]);
  }

  function confirmDelete(cid: string) {
    showAlert('Yorumu sil', 'Bu yorum silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove.mutate(cid) },
    ]);
  }

  async function onSend() {
    const body = text.trim();
    if (!body || !id) return;
    setText('');
    try {
      await add.mutateAsync(body);
    } catch (e) {
      setText(body);
      showAlert('Gönderilemedi', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Gönderi' }} />
      <AsyncState isLoading={isLoading} isError={isError || !post} onRetry={refetch}>
        {post ? (
        <View style={{ gap: Spacing.three }}>
          {/* Gönderi */}
          <Card elevated>
            <View style={styles.postInner}>
              <Pressable
                onPress={() => router.push(`/user/${post.author_id}`)}
                style={styles.who}
                accessibilityRole="button"
                accessibilityLabel="Profili aç">
                <Avatar
                  name={displayName(post.author)}
                  url={post.author?.avatar_url ?? null}
                  size={40}
                />
                <View>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>
                    {displayName(post.author)}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{timeAgo(post.created_at)}</Text>
                </View>
              </Pressable>

              {post.body ? <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{post.body}</Text> : null}
              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.image} contentFit="cover" />
              ) : null}

              <Pressable
                onPress={() => toggleLike.mutate({ postId: post.id, liked: post.liked })}
                style={styles.likeBtn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={post.liked ? 'Beğeniyi geri al' : 'Beğen'}>
                <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? c.primary : c.textSecondary} />
                <Text style={{ color: post.liked ? c.primary : c.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  {post.like_count > 0 ? post.like_count : 'Beğen'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Yorum girdisi */}
          <View style={[styles.inputRow, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
            <TextInput
              placeholder="Yorum yaz…"
              placeholderTextColor={c.textSecondary}
              value={text}
              onChangeText={setText}
              style={[styles.input, { color: c.text }]}
              multiline
            />
            <Pressable
              onPress={onSend}
              disabled={!text.trim() || add.isPending}
              style={styles.sendBtn}
              accessibilityRole="button"
              accessibilityLabel="Yorumu gönder">
              <Ionicons name="send" size={20} color={text.trim() ? c.primary : c.textSecondary} />
            </Pressable>
          </View>

          {/* Yorumlar */}
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Yorumlar {comments?.length ? `(${comments.length})` : ''}
          </Text>
          {commentsLoading ? (
            <Loading />
          ) : (comments?.length ?? 0) === 0 ? (
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>İlk yorumu sen yaz.</Text>
          ) : (
            comments!.map((cm) => (
              <CommentRow
                key={cm.id}
                comment={cm}
                canDelete={cm.author_id === currentUserId || post.is_mine}
                canReport={cm.author_id !== currentUserId}
                onDelete={() => confirmDelete(cm.id)}
                onReport={() => reportComment(cm)}
                onOpenAuthor={() => router.push(`/user/${cm.author_id}`)}
              />
            ))
          )}
        </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

function CommentRow({
  comment,
  canDelete,
  canReport,
  onDelete,
  onReport,
  onOpenAuthor,
}: {
  comment: PostComment;
  canDelete: boolean;
  canReport: boolean;
  onDelete: () => void;
  onReport: () => void;
  onOpenAuthor: () => void;
}) {
  const c = useColors();
  const name = displayName(comment.author);
  return (
    <View style={styles.commentRow}>
      <Pressable onPress={onOpenAuthor} hitSlop={4}>
        <Avatar name={name} url={comment.author?.avatar_url} size={32} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHead}>
          <Text style={[styles.commentName, { color: c.text }]}>{name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{timeAgo(comment.created_at)}</Text>
        </View>
        <Text style={{ color: c.text }}>{comment.body}</Text>
        {comment.hidden_at ? (
          <Text style={{ color: c.danger, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
            Bu yorum şikayet edildiği için gizlendi.
          </Text>
        ) : null}
      </View>
      {canReport ? (
        <Pressable onPress={onReport} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu şikayet et">
          <Ionicons name="flag-outline" size={15} color={c.textSecondary} />
        </Pressable>
      ) : null}
      {canDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yorumu sil">
          <Ionicons name="trash-outline" size={16} color={c.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  postInner: { gap: Spacing.two },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: Spacing.three,
    paddingRight: 6,
  },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingVertical: 10, fontSize: 15 },
  sendBtn: { padding: 10 },
  sectionTitle: { ...Type.sectionTitle },
  commentRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', paddingVertical: 6 },
  commentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentName: { fontSize: 14, fontWeight: '700' },
});
