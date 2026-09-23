import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { ProfileView } from '@/components/profile-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useSendChatRequest } from '@/hooks/useChatRequests';
import { useFollow } from '@/hooks/useFollow';
import { useIsBlocked, useModeration } from '@/hooks/useModeration';
import { useProfileStats } from '@/hooks/useProfileStats';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useSports } from '@/hooks/useSports';
import { rankBadges } from '@/lib/badges';
import { useAuth } from '@/lib/auth';
import { Spacing } from '@/constants/theme';

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export default function PublicProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Kendi profilime yönlendirme (kendi kartıma tıklarsam)
  const isMe = user?.id === id;

  const { data: profile, isLoading } = usePublicProfile(id);
  const { data: sports } = useSports();
  const { data: stats, isLoading: statsLoading } = useProfileStats(id);
  const sendRequest = useSendChatRequest();
  const { data: blocked } = useIsBlocked(isMe ? undefined : id);
  const { block, unblock, report } = useModeration();
  const follow = useFollow(id);
  const following = follow.data?.is_following ?? false;
  const [reportOpen, setReportOpen] = useState(false);

  const REPORT_REASONS = ['Uygunsuz fotoğraf', 'Uygunsuz içerik', 'Taciz', 'Spam', 'Sahte hesap', 'Diğer'];

  function submitReport(reason: string) {
    report.mutate({ userId: id, reason, context: { type: 'profile', user_id: id } });
    setReportOpen(false);
    showAlert('Teşekkürler', 'Şikayetin alındı. Ekibimiz inceleyecek.');
  }

  function openMenu() {
    if (blocked) {
      showAlert('Seçenekler', undefined, [
        { text: 'Engeli kaldır', onPress: () => unblock.mutate(id) },
        { text: 'Şikayet et', onPress: () => setReportOpen(true) },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
    } else {
      showAlert('Seçenekler', undefined, [
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () =>
            showAlert('Engelle', 'Bu kullanıcıyı engellemek istediğine emin misin?', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Engelle', style: 'destructive', onPress: () => block.mutate(id) },
            ]),
        },
        { text: 'Şikayet et', onPress: () => setReportOpen(true) },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
    }
  }

  async function onSendRequest() {
    try {
      const res = await sendRequest.mutateAsync(id);
      if (res.status === 'existing' && res.conversation_id) {
        router.push(`/chat/${res.conversation_id}`);
      } else if (res.status === 'pending') {
        showAlert('İstek beklemede', 'Bu kişiye zaten bir sohbet isteği gönderdin.');
      } else {
        showAlert('İstek gönderildi 💬', 'Kişi kabul edince sohbet başlayacak.');
      }
    } catch (e) {
      showAlert('Hata', getErrorMessage(e));
    }
  }

  const sportNames = useMemo(() => {
    if (!profile || !sports) return [];
    const byId = new Map(sports.map((s) => [s.id, s]));
    return profile.user_sports
      .map((us) => byId.get(us.sport_id))
      .filter(Boolean)
      .map((s) => `${s!.icon ?? ''} ${s!.name}`.trim());
  }, [profile, sports]);

  const badges = useMemo(() => (stats ? rankBadges(stats) : []), [stats]);
  const name = displayName(profile);
  const location = [profile?.district, profile?.province].filter(Boolean).join(', ');

  if (isLoading) {
    return (
      <Screen center>
        <Stack.Screen options={{ headerShown: true, title: 'Profil' }} />
        <Loading />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen center>
        <Stack.Screen options={{ headerShown: true, title: 'Profil' }} />
        <EmptyState icon="person-outline" title="Profil bulunamadı" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isMe ? 'Profilim' : name,
          headerRight: isMe
            ? undefined
            : () => (
                <Pressable onPress={openMenu} hitSlop={10} style={{ paddingHorizontal: 4 }}>
                  <Ionicons name="ellipsis-horizontal" size={22} color={c.text} />
                </Pressable>
              ),
        }}
      />
      <ProfileView
        name={name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        levelLabel={profile.level ? LEVEL_LABEL[profile.level] ?? profile.level : null}
        location={location}
        bio={profile.bio}
        goals={profile.goals}
        availability={profile.availability}
        sportNames={sportNames}
        userId={id}
        stats={stats}
        statsLoading={statsLoading}
        badges={badges}
        onOpenBadges={() => router.push(`/badges?userId=${id}`)}
        followInfo={follow.data}
        onOpenFollowers={() => router.push(`/follows?userId=${id}&tab=followers`)}
        onOpenFollowing={() => router.push(`/follows?userId=${id}&tab=following`)}
        headerAction={
          isMe || blocked ? null : (
            <Pressable
              onPress={() => follow.toggle.mutate(following)}
              disabled={follow.toggle.isPending}
              style={[
                styles.followBtn,
                following
                  ? { backgroundColor: c.backgroundElement, borderColor: c.border, borderWidth: 1 }
                  : { backgroundColor: c.primary },
              ]}>
              <Ionicons
                name={following ? 'checkmark' : 'person-add'}
                size={16}
                color={following ? c.text : c.onPrimary}
              />
              <Text style={{ color: following ? c.text : c.onPrimary, fontWeight: '700' }}>
                {following ? 'Takip Ediliyor' : 'Takip Et'}
              </Text>
            </Pressable>
          )
        }
        footer={
          isMe ? null : blocked ? (
            <Pressable
              onPress={() => unblock.mutate(id)}
              style={({ pressed }) => [
                styles.chatBtn,
                { backgroundColor: c.backgroundElement, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Ionicons name="ban" size={18} color={c.danger} />
              <Text style={{ color: c.danger, fontWeight: '700', fontSize: 16 }}>Engeli kaldır</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSendRequest}
              disabled={sendRequest.isPending}
              style={({ pressed }) => [
                styles.chatBtn,
                { backgroundColor: c.primary, opacity: pressed || sendRequest.isPending ? 0.85 : 1 },
              ]}>
              {sendRequest.isPending ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses" size={18} color={c.onPrimary} />
                  <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 16 }}>
                    Sohbet isteği gönder
                  </Text>
                </>
              )}
            </Pressable>
          )
        }
      />

      {/* Şikayet sebebi seçimi (Android 3-buton Alert sınırını aşmamak için modal) */}
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setReportOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: c.backgroundElement }]}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Şikayet sebebi</Text>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => submitReport(r)}
                style={({ pressed }) => [styles.reasonRow, { borderBottomColor: c.border, opacity: pressed ? 0.6 : 1 }]}>
                <Text style={{ color: c.text, fontSize: 16 }}>{r}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setReportOpen(false)} style={styles.cancelRow}>
              <Text style={{ color: c.textSecondary, fontWeight: '600', fontSize: 16 }}>Vazgeç</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chatBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  followBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: Spacing.three },
  sheet: { borderRadius: 18, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  sheetTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.two },
  reasonRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cancelRow: { paddingVertical: 14, alignItems: 'center' },
});
