import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { RichText } from '@/components/ui/rich-text';
import { useColors } from '@/hooks/useColors';
import { useCommentThread, type CommentKind, type ThreadComment } from '@/hooks/useCommentThread';
import { useModeration } from '@/hooks/useModeration';
import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { timeAgo } from '@/lib/datetime';
import { showAlert } from '@/store/alert';
import { useIsReported } from '@/store/reported';
import { Spacing } from '@/constants/theme';

/** İlk açılışta gösterilen yorum sayısı; fazlası "Tümünü göster" ile açılır. */
const PREVIEW = 3;
/** Bir yorumun altında ilk gösterilen yanıt sayısı. */
const REPLY_PREVIEW = 2;

type Props = {
  kind: CommentKind;
  targetId: string;
  /** Program/gönderi sahibi başkalarının yorumunu silebilir. */
  canModerate: boolean;
};

/** Program ve gönderi yorumları: yanıt, beğeni, düzenleme, profile geçiş, şikayet. */
export function CommentsSection({ kind, targetId, canModerate }: Props) {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading, add, edit, remove, toggleLike, currentUserId } = useCommentThread(kind, targetId);
  const { sendReport } = useModeration();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ThreadComment | null>(null);
  const [editing, setEditing] = useState<ThreadComment | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { roots, replies } = useMemo(() => {
    const list = data ?? [];
    const byParent = new Map<string, ThreadComment[]>();
    for (const cm of list) {
      if (!cm.parent_id) continue;
      byParent.set(cm.parent_id, [...(byParent.get(cm.parent_id) ?? []), cm]);
    }
    return { roots: list.filter((cm) => !cm.parent_id), replies: byParent };
  }, [data]);

  const visibleRoots = showAll ? roots : roots.slice(0, PREVIEW);
  const total = data?.length ?? 0;

  function startReply(cm: ThreadComment) {
    setEditing(null);
    setReplyTo(cm);
    inputRef.current?.focus();
  }

  function startEdit(cm: ThreadComment) {
    setReplyTo(null);
    setEditing(cm);
    setText(cm.body);
    inputRef.current?.focus();
  }

  function cancelMode() {
    if (editing) setText('');
    setEditing(null);
    setReplyTo(null);
  }

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      if (editing) {
        await edit.mutateAsync({ id: editing.id, body });
        setEditing(null);
      } else {
        // Yanıta yanıt da ana yorumun altına bağlanır (tek seviye; sunucu da aynısını yapar)
        await add.mutateAsync({ body, parentId: replyTo ? (replyTo.parent_id ?? replyTo.id) : null });
        // Yanıt verilen yorumun yanıtları görünür olsun
        if (replyTo) setShowAll(true);
        setReplyTo(null);
      }
    } catch (e) {
      setText(body); // hata olursa yazılanı geri koy
      showAlert(editing ? 'Kaydedilemedi' : 'Gönderilemedi', getErrorMessage(e));
    }
  }

  function report(cm: ThreadComment) {
    const type = kind === 'program' ? 'comment' : 'post_comment';
    const context =
      kind === 'program'
        ? { type, comment_id: cm.id, body: cm.body }
        : { type, comment_id: cm.id, post_id: targetId, body: cm.body };
    showAlert('Yorumu şikayet et', 'Bu yorum uygunsuz mu?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Şikayet et',
        style: 'destructive',
        onPress: () => sendReport({ userId: cm.author_id, reason: 'Uygunsuz yorum', context }, type, cm.id),
      },
    ]);
  }

  function openMenu(cm: ThreadComment) {
    const mine = cm.author_id === currentUserId;
    const del = {
      text: 'Sil',
      style: 'destructive' as const,
      onPress: () =>
        showAlert('Yorumu sil', 'Bu yorum (ve yanıtları) silinecek. Emin misin?', [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: () => remove.mutate(cm.id, { onError: (e) => showAlert('Silinemedi', getErrorMessage(e)) }),
          },
        ]),
    };
    if (mine) {
      showAlert('Yorum', undefined, [{ text: 'Düzenle', onPress: () => startEdit(cm) }, del, { text: 'Vazgeç', style: 'cancel' }]);
    } else if (canModerate) {
      showAlert('Yorum', undefined, [{ text: 'Şikayet et', onPress: () => report(cm) }, del, { text: 'Vazgeç', style: 'cancel' }]);
    } else {
      report(cm);
    }
  }

  function renderRow(cm: ThreadComment, isReply = false) {
    return (
      <CommentRow
        key={cm.id}
        comment={cm}
        kind={kind}
        isReply={isReply}
        liked={cm.likes.some((l) => l.user_id === currentUserId)}
        onOpenAuthor={() => router.push(`/user/${cm.author_id}`)}
        onLike={() => toggleLike.mutate({ id: cm.id, liked: cm.likes.some((l) => l.user_id === currentUserId) })}
        onReply={() => startReply(cm)}
        onMenu={() => openMenu(cm)}
      />
    );
  }

  const modeLabel = editing ? 'Yorumunu düzenliyorsun' : replyTo ? `${displayName(replyTo.author)} kişisine yanıt` : null;

  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={[styles.title, { color: c.text }]}>Yorumlar {total ? `(${total})` : ''}</Text>

      {modeLabel ? (
        <View style={[styles.modeBar, { backgroundColor: `${c.primary}14`, borderColor: `${c.primary}55` }]}>
          <Ionicons name={editing ? 'create-outline' : 'return-down-forward'} size={15} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
            {modeLabel}
          </Text>
          <Pressable onPress={cancelMode} hitSlop={8} accessibilityRole="button" accessibilityLabel="Vazgeç">
            <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Vazgeç</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.inputRow, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <TextInput
          ref={inputRef}
          placeholder={replyTo ? 'Yanıtını yaz…' : 'Yorum yaz…'}
          placeholderTextColor={c.textSecondary}
          value={text}
          onChangeText={setText}
          style={[styles.input, { color: c.text }]}
          multiline
          maxLength={2000}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim() || add.isPending || edit.isPending}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? c.primary : c.background }]}
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Kaydet' : 'Gönder'}>
          <Ionicons name={editing ? 'checkmark' : 'send'} size={18} color={text.trim() ? c.onPrimary : c.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <Text style={{ color: c.textSecondary }}>Yükleniyor…</Text>
      ) : roots.length === 0 ? (
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>İlk yorumu sen yaz.</Text>
      ) : (
        <>
          {visibleRoots.map((cm) => (
            <View key={cm.id} style={{ gap: 6 }}>
              {renderRow(cm)}
              <Replies items={replies.get(cm.id) ?? []} render={(r) => renderRow(r, true)} />
            </View>
          ))}
          {roots.length > PREVIEW ? (
            <Pressable
              onPress={() => setShowAll((v) => !v)}
              style={styles.more}
              accessibilityRole="button"
              accessibilityLabel={showAll ? 'Daha az göster' : 'Tüm yorumları göster'}>
              <Text style={{ color: c.primary, fontWeight: '700', fontSize: 14 }}>
                {showAll ? 'Daha az göster' : `Tümünü göster (${roots.length - PREVIEW} yorum daha)`}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

function Replies({ items, render }: { items: ThreadComment[]; render: (cm: ThreadComment) => ReactNode }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const shown = open ? items : items.slice(0, REPLY_PREVIEW);
  return (
    <View style={[styles.replies, { borderLeftColor: c.border }]}>
      {shown.map(render)}
      {items.length > REPLY_PREVIEW && !open ? (
        <Pressable onPress={() => setOpen(true)} hitSlop={6} accessibilityRole="button">
          <Text style={{ color: c.primary, fontWeight: '600', fontSize: 13 }}>
            {items.length - REPLY_PREVIEW} yanıtı daha göster
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CommentRow({
  comment,
  kind,
  isReply,
  liked,
  onOpenAuthor,
  onLike,
  onReply,
  onMenu,
}: {
  comment: ThreadComment;
  kind: CommentKind;
  isReply: boolean;
  liked: boolean;
  onOpenAuthor: () => void;
  onLike: () => void;
  onReply: () => void;
  onMenu: () => void;
}) {
  const c = useColors();
  const name = displayName(comment.author);
  const reported = useIsReported(kind === 'program' ? 'comment' : 'post_comment', comment.id);
  const likeCount = comment.likes.length;
  return (
    <View style={styles.row}>
      <Pressable onPress={onOpenAuthor} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${name} profili`}>
        <Avatar name={name} url={comment.author?.avatar_url} size={isReply ? 28 : 34} />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[styles.bubble, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
          <View style={styles.head}>
            <Pressable onPress={onOpenAuthor} hitSlop={4} style={{ flex: 1 }} accessibilityRole="button">
              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
            <Pressable onPress={onMenu} hitSlop={10} accessibilityRole="button" accessibilityLabel="Yorum seçenekleri">
              <Ionicons
                name={reported ? 'flag' : 'ellipsis-horizontal'}
                size={16}
                color={reported ? c.danger : c.textSecondary}
              />
            </Pressable>
          </View>
          <RichText style={{ color: c.text, fontSize: 14, lineHeight: 20 }}>{comment.body}</RichText>
          {comment.hidden_at ? (
            <Text style={{ color: c.danger, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
              Bu yorum şikayet edildiği için gizlendi.
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {timeAgo(comment.created_at)}
            {comment.edited_at ? ' · düzenlendi' : ''}
          </Text>
          <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Yanıtla">
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>Yanıtla</Text>
          </Pressable>
          <Pressable
            onPress={onLike}
            hitSlop={8}
            style={styles.like}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Beğeniyi geri al' : 'Yorumu beğen'}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={15} color={liked ? c.danger : c.textSecondary} />
            {likeCount > 0 ? (
              <Text style={{ color: liked ? c.danger : c.textSecondary, fontSize: 12, fontWeight: '700' }}>{likeCount}</Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
  modeBar: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: Spacing.three,
    paddingRight: 6,
  },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  more: { alignItems: 'center', paddingVertical: Spacing.two },
  replies: { marginLeft: 17, paddingLeft: Spacing.two, borderLeftWidth: 2, gap: 6 },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  bubble: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingLeft: 4 },
  like: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
