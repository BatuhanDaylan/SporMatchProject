import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { showAlert } from '@/store/alert';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useAdminReports, useIsAdmin, type AdminReport } from '@/hooks/useAdmin';
import { Spacing } from '@/constants/theme';

export default function ReportsScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data, isLoading, isError, refetch, setCommentHidden, clearAvatar, setPostHidden, setPostCommentHidden } =
    useAdminReports();

  function confirmClearAvatar(userId: string, name: string) {
    showAlert('Fotoğrafı kaldır', `${name} adlı kullanıcının profil fotoğrafı kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kaldır', style: 'destructive', onPress: () => clearAvatar.mutate(userId) },
    ]);
  }

  const header = <Stack.Screen options={{ headerShown: true, title: 'Şikayetler' }} />;

  // Yönetici değilse içerik gösterme.
  if (!adminLoading && !isAdmin) {
    return (
      <Screen>
        {header}
        <EmptyState icon="lock-closed-outline" title="Erişim yok" text="Bu bölüm yalnızca yöneticilere açıktır." />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      {isLoading || adminLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title="Şikayet yok" text="Bekleyen şikayet bulunmuyor." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingVertical: Spacing.two, gap: Spacing.two }}
          renderItem={({ item }) => (
            <ReportRow
              report={item}
              onOpenUser={() => router.push(`/user/${item.reported_id}`)}
              onToggleHide={(hidden) =>
                item.comment && setCommentHidden.mutate({ commentId: item.comment.id, hidden })
              }
              onTogglePostHide={(hidden) =>
                item.post && setPostHidden.mutate({ postId: item.post.id, hidden })
              }
              onTogglePostCommentHide={(hidden) =>
                item.post_comment && setPostCommentHidden.mutate({ commentId: item.post_comment.id, hidden })
              }
              onClearAvatar={() =>
                confirmClearAvatar(
                  item.reported_id,
                  displayName(item.reported),
                )
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

function ReportRow({
  report,
  onOpenUser,
  onToggleHide,
  onTogglePostHide,
  onTogglePostCommentHide,
  onClearAvatar,
}: {
  report: AdminReport;
  onOpenUser: () => void;
  onToggleHide: (hidden: boolean) => void;
  onTogglePostHide: (hidden: boolean) => void;
  onTogglePostCommentHide: (hidden: boolean) => void;
  onClearAvatar: () => void;
}) {
  const c = useColors();
  const reportedName = displayName(report.reported);
  const reporterName = report.reporter?.display_name || report.reporter?.username || 'biri';
  const hidden = !!report.comment?.hidden_at;
  const isCommentReport = !!report.comment;
  const isPostReport = !!report.post;
  const postHidden = !!report.post?.hidden_at;
  const isPostCommentReport = !!report.post_comment;
  const postCommentHidden = !!report.post_comment?.hidden_at;
  const hasAvatar = !!report.reported?.avatar_url;

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
      <View style={styles.head}>
        <Pressable onPress={onOpenUser} style={styles.who} accessibilityRole="button" accessibilityLabel={`${reportedName} profilini aç`}>
          <Avatar name={reportedName} url={report.reported?.avatar_url ?? null} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{reportedName}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>
              Şikayet eden: {reporterName}
            </Text>
          </View>
        </Pressable>
        <View style={[styles.reasonPill, { backgroundColor: c.background }]}>
          <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '600' }}>{report.reason}</Text>
        </View>
      </View>

      {/* İçerik önizleme */}
      {isCommentReport ? (
        <View style={[styles.contentBox, { backgroundColor: c.background }]}>
          <Text style={{ color: c.text, fontSize: 13, fontStyle: 'italic' }} numberOfLines={4}>
            “{report.comment!.body}”
          </Text>
        </View>
      ) : isPostCommentReport ? (
        <View style={[styles.contentBox, { backgroundColor: c.background }]}>
          <Text style={{ color: c.text, fontSize: 13, fontStyle: 'italic' }} numberOfLines={4}>
            “{report.post_comment!.body}”
          </Text>
        </View>
      ) : isPostReport ? (
        <View style={[styles.contentBox, { backgroundColor: c.background }]}>
          {report.post!.body ? (
            <Text style={{ color: c.text, fontSize: 13, fontStyle: 'italic' }} numberOfLines={4}>
              “{report.post!.body}”
            </Text>
          ) : null}
          {report.post!.image_url ? (
            <Image
              source={{ uri: report.post!.image_url }}
              style={styles.postImg}
              contentFit="cover"
            />
          ) : null}
        </View>
      ) : (
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>Kullanıcı/profil şikayeti.</Text>
      )}

      {/* Aksiyonlar */}
      {isCommentReport ? (
        <HideAction hidden={hidden} onToggle={() => onToggleHide(!hidden)} labelBase="Yorumu" c={c} />
      ) : isPostCommentReport ? (
        <HideAction
          hidden={postCommentHidden}
          onToggle={() => onTogglePostCommentHide(!postCommentHidden)}
          labelBase="Yorumu"
          c={c}
        />
      ) : isPostReport ? (
        <HideAction hidden={postHidden} onToggle={() => onTogglePostHide(!postHidden)} labelBase="Gönderiyi" c={c} />
      ) : hasAvatar ? (
        <View style={styles.actions}>
          <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }}>Profil fotoğrafı</Text>
          <Pressable
            onPress={onClearAvatar}
            accessibilityRole="button"
            accessibilityLabel="Profil fotoğrafını kaldır"
            style={[styles.toggleBtn, { borderColor: c.danger }]}>
            <Text style={{ color: c.danger, fontWeight: '600', fontSize: 13 }}>Fotoğrafı kaldır</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function HideAction({
  hidden,
  onToggle,
  labelBase,
  c,
}: {
  hidden: boolean;
  onToggle: () => void;
  labelBase: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.actions}>
      <View style={styles.statusRow}>
        <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={15} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>{hidden ? 'Gizli' : 'Görünür'}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={hidden ? `${labelBase} göster` : `${labelBase} gizle`}
        style={[styles.toggleBtn, { borderColor: hidden ? c.border : c.danger }]}>
        <Text style={{ color: hidden ? c.primary : c.danger, fontWeight: '600', fontSize: 13 }}>
          {hidden ? 'Göster' : 'Gizle'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  reasonPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  contentBox: { borderRadius: 10, padding: Spacing.two, gap: Spacing.two },
  postImg: { width: '100%', height: 160, borderRadius: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
