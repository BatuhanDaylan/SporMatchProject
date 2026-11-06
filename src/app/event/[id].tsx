import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapView } from '@/components/map-view';
import { MetaRow } from '@/components/ui/meta-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useEventDetail, useEventActions } from '@/hooks/useEvents';
import { eventWhen } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

export default function EventDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ev, isLoading, isError, refetch } = useEventDetail(id);
  const { join, leave, cancelEvent, removeParticipant } = useEventActions(id);

  function confirmRemove(p: { id?: string; username: string | null; display_name: string | null }) {
    if (!ev || !p.id) return;
    showAlert('Katılımcıyı çıkar', `${displayName(p)} etkinlikten çıkarılsın mı? Tekrar katılamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: () =>
          removeParticipant.mutate(
            { eventId: ev.id, userId: p.id! },
            { onError: (e) => showAlert('Çıkarılamadı', getErrorMessage(e)) },
          ),
      },
    ]);
  }

  function onToggleJoin() {
    if (!ev) return;
    if (ev.joined) {
      if (ev.is_host) {
        showAlert('Bilgi', 'Ev sahibi etkinlikten ayrılamaz. İstersen etkinliği iptal edebilirsin.');
        return;
      }
      leave.mutate(ev.id);
    } else {
      join.mutate(ev.id, {
        onError: (e) => showAlert('Katılınamadı', getErrorMessage(e, 'Hata')),
      });
    }
  }

  function onCancel() {
    if (!ev) return;
    showAlert('Etkinliği iptal et', 'Bu etkinlik iptal edilecek ve listeden kalkacak. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: () => cancelEvent.mutate(ev.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Etkinlik' }} />
      <AsyncState isLoading={isLoading} isError={isError || !ev} onRetry={refetch}>
        {ev ? (
        <View style={{ gap: Spacing.two }}>
          {ev.status === 'cancelled' ? (
            <View style={[styles.cancelBanner, { backgroundColor: c.danger }]}>
              <Text style={{ color: c.onDanger, fontWeight: '700' }}>Bu etkinlik iptal edildi</Text>
            </View>
          ) : null}

          {/* Hero: spor, başlık, zaman, yer */}
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: `${c.primary}22` }]}>
                <Text style={{ fontSize: 30 }}>{ev.sport?.icon ?? '📅'}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.title, { color: c.text }]} numberOfLines={3}>
                  {ev.title}
                </Text>
                {ev.sport?.name ? (
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>{ev.sport.name}</Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <MetaRow icon="time-outline" text={eventWhen(ev.starts_at)} c={c} />
            {ev.place_name ? <MetaRow icon="location-outline" text={ev.place_name} c={c} /> : null}
            {ev.district || ev.province ? (
              <MetaRow icon="map-outline" text={[ev.district, ev.province].filter(Boolean).join(', ')} c={c} />
            ) : null}
          </Card>

          {/* Katılım doluluğu */}
          <Card style={styles.capCard}>
            <View style={styles.rowBetween}>
              <Text style={{ color: c.text, fontWeight: '700' }}>Katılım</Text>
              <Text style={{ color: c.textSecondary, fontWeight: '600' }}>
                {ev.capacity ? `${ev.participant_count}/${ev.capacity}` : `${ev.participant_count} kişi`}
              </Text>
            </View>
            {ev.capacity ? (
              <ProgressBar
                value={ev.participant_count / ev.capacity}
                done={ev.participant_count >= ev.capacity}
                height={8}
              />
            ) : (
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Kontenjan sınırı yok.</Text>
            )}
          </Card>

          {/* Ev sahibi */}
          <Card
            onPress={() => router.push(`/user/${ev.host_id}`)}
            style={styles.hostRow}
            accessibilityRole="button"
            accessibilityLabel="Ev sahibinin profilini aç">
            <Avatar name={displayName(ev.host)} url={ev.host?.avatar_url ?? null} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>Ev sahibi</Text>
              <Text style={{ color: c.text, fontWeight: '700' }}>
                {displayName(ev.host)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </Card>

          {ev.description ? (
            <Text selectable style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{ev.description}</Text>
          ) : null}

          {/* Harita */}
          <MapView lat={ev.lat} lng={ev.lng} label={ev.place_name || ev.title} />

          {/* Katılımcılar */}
          <View style={styles.rowBetween}>
            <Text style={[styles.section, { color: c.text }]}>Katılımcılar</Text>
            <View style={[styles.countBadge, { backgroundColor: c.primary }]}>
              <Text style={{ color: c.onPrimary, fontSize: 12, fontWeight: '800' }}>{ev.participant_count}</Text>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            {ev.participants.map((p) => (
              <View key={p.id} style={[styles.pRow, { borderColor: c.border }]}>
                <Pressable onPress={() => p.id && router.push(`/user/${p.id}`)} style={styles.pInfo} accessibilityRole="button">
                  <Avatar name={displayName(p)} url={p.avatar_url ?? null} size={36} />
                  <Text style={{ color: c.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {displayName(p)}
                    {p.id === ev.host_id ? ' · ev sahibi' : ''}
                  </Text>
                </Pressable>
                {ev.is_host && p.id !== ev.host_id ? (
                  <Pressable
                    onPress={() => confirmRemove(p)}
                    hitSlop={8}
                    style={[styles.removeBtn, { borderColor: c.danger }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${displayName(p)} kişisini çıkar`}>
                    <Text style={{ color: c.danger, fontWeight: '700', fontSize: 12 }}>Çıkar</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          <View style={{ height: Spacing.two }} />
          {ev.banned && !ev.joined ? (
            <View style={[styles.cancelBanner, { backgroundColor: c.backgroundElement }]}>
              <Text style={{ color: c.textSecondary, fontWeight: '600', textAlign: 'center' }}>
                Etkinlik sahibi seni bu etkinlikten çıkardı; tekrar katılamazsın.
              </Text>
            </View>
          ) : ev.status === 'open' ? (
            <>
              <Button
                title={ev.joined ? (ev.is_host ? 'Katılıyorsun (ev sahibi)' : 'Ayrıl') : 'Katıl'}
                variant={ev.joined ? 'secondary' : 'primary'}
                onPress={onToggleJoin}
                loading={join.isPending || leave.isPending}
                disabled={ev.is_host && ev.joined}
              />
              {ev.is_host ? (
                <Pressable onPress={onCancel} style={styles.cancelLink}>
                  <Text style={{ color: c.danger, fontWeight: '600' }}>Etkinliği iptal et</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          <View style={{ height: Spacing.four }} />
        </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  cancelBanner: { padding: Spacing.two, borderRadius: 10, alignItems: 'center' },
  hero: { padding: Spacing.three, borderRadius: 18, gap: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  capCard: { padding: Spacing.three, borderRadius: 16, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBadge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14, borderWidth: 1 },
  section: { fontSize: 17, fontWeight: '700' },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  pInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  removeBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.two, marginTop: 4 },
});
