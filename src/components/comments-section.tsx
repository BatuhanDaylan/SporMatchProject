import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Avatar } from '@/components/ui/avatar';
import { useColors } from '@/hooks/useColors';
import { useComments, type Comment } from '@/hooks/useComments';
import { useModeration } from '@/hooks/useModeration';
import { Spacing } from '@/constants/theme';

/** Program yorumları — realtime liste + ekleme + silme. */
export function CommentsSection({ programId, canModerate }: { programId: string; canModerate: boolean }) {
  const c = useColors();
  const { data: comments, isLoading, add, remove, currentUserId } = useComments(programId);
  const { report } = useModeration();
  const [text, setText] = useState('');

  function reportComment(cm: Comment) {
    showAlert('Yorumu şikayet et', 'Bu yorum uygunsuz mu?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Şikayet et',
        style: 'destructive',
        onPress: () => {
          report.mutate({
            userId: cm.author_id,
            reason: 'Uygunsuz yorum',
            context: { type: 'comment', comment_id: cm.id, body: cm.body },
          });
          showAlert('Teşekkürler', 'Şikayetin alındı.');
        },
      },
    ]);
  }

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await add.mutateAsync(body);
    } catch (e) {
      setText(body); // hata olursa geri yükle
      showAlert('Gönderilemedi', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  function confirmDelete(id: string) {
    showAlert('Yorumu sil', 'Bu yorum silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={[styles.title, { color: c.text }]}>
        Yorumlar {comments?.length ? `(${comments.length})` : ''}
      </Text>

      {/* Girdi */}
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
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? c.primary : c.textSecondary}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <Text style={{ color: c.textSecondary }}>Yükleniyor…</Text>
      ) : (comments?.length ?? 0) === 0 ? (
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>İlk yorumu sen yaz.</Text>
      ) : (
        comments!.map((cm) => (
          <CommentRow
            key={cm.id}
            comment={cm}
            canDelete={cm.author_id === currentUserId || canModerate}
            canReport={cm.author_id !== currentUserId}
            onDelete={() => confirmDelete(cm.id)}
            onReport={() => reportComment(cm)}
          />
        ))
      )}
    </View>
  );
}

function CommentRow({
  comment,
  canDelete,
  canReport,
  onDelete,
  onReport,
}: {
  comment: Comment;
  canDelete: boolean;
  canReport: boolean;
  onDelete: () => void;
  onReport: () => void;
}) {
  const c = useColors();
  const name = displayName(comment.author);
  return (
    <View style={styles.row}>
      <Avatar name={name} url={comment.author?.avatar_url} size={32} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <Text style={[styles.name, { color: c.text }]}>{name}</Text>
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

/** Basit göreli zaman (TR). */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  const d = Math.floor(h / 24);
  return `${d} gün`;
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
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
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', paddingVertical: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '700' },
});
