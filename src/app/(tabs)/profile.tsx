import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { showAlert } from '@/store/alert';

import { ProfileView } from '@/components/profile-view';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFollow } from '@/hooks/useFollow';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useSports } from '@/hooks/useSports';
import { rankBadges } from '@/lib/badges';
import { useAuth } from '@/lib/auth';
import { Spacing, Type } from '@/constants/theme';

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export default function ProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: followInfo } = useFollow(user?.id);
  const { unread } = useNotifications();

  function confirmSignOut() {
    showAlert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
    ]);
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

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Profil</Text>
        <IconButton
          icon="notifications-outline"
          iconColor={c.text}
          backgroundColor={c.backgroundElement}
          onPress={() => router.push('/notifications')}
          accessibilityLabel={unread > 0 ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'}>
          {unread > 0 ? (
            <View style={[styles.unreadDot, { backgroundColor: c.danger, borderColor: c.background }]}>
              <Text style={[styles.unreadText, { color: c.onDanger }]}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </IconButton>
      </View>

      <ProfileView
        name={name}
        username={profile?.username}
        avatarUrl={profile?.avatar_url}
        levelLabel={profile?.level ? LEVEL_LABEL[profile.level] ?? profile.level : null}
        location={location}
        bio={profile?.bio}
        goals={profile?.goals}
        availability={profile?.availability}
        sportNames={sportNames}
        userId={profile?.id}
        stats={stats}
        statsLoading={statsLoading}
        badges={badges}
        onOpenBadges={() => router.push('/badges')}
        followInfo={followInfo}
        onOpenFollowers={() => router.push(`/follows?userId=${user?.id}&tab=followers`)}
        onOpenFollowing={() => router.push(`/follows?userId=${user?.id}&tab=following`)}
        footer={
          <>
            <View style={{ marginTop: Spacing.two }}>
              <Button title="Profili Düzenle" size="lg" onPress={() => router.push('/profile-edit')} />
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { backgroundColor: c.backgroundElement, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Ionicons name="settings-outline" size={18} color={c.text} />
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>Ayarlar</Text>
            </Pressable>
            <Pressable onPress={confirmSignOut} style={styles.signOut} hitSlop={8}>
              <Text style={{ color: c.danger, fontWeight: '600' }}>Çıkış Yap</Text>
            </Pressable>
          </>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Type.displayTitle },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadText: { fontSize: 10, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOut: { alignItems: 'center', paddingVertical: Spacing.two },
});
