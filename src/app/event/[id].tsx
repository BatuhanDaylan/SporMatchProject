import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapView } from '@/components/map-view';
import { MetaRow } from '@/components/ui/meta-row';
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
  const { join, leave, cancelEvent } = useEventActions(id);

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
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Etkinlik' }} />
      <AsyncState isLoading={isLoading} isError={isError || !ev} onRetry={refetch}>
        {ev ? (
        <View style={{ gap: Spacing.two }}>
          <Text style={[styles.title, { color: c.text }]}>{ev.title}</Text>
          {ev.status === 'cancelled' ? (
            <View style={[styles.cancelBanner, { backgroundColor: c.danger }]}>
              <Text style={{ color: c.onDanger, fontWeight: '700' }}>Bu etkinlik iptal edildi</Text>
            </View>
          ) : null}

          {/* Meta satırları */}
          <Card style={styles.metaCard}>
            <MetaRow icon="time-outline" text={eventWhen(ev.starts_at)} c={c} />
            {ev.place_name ? <MetaRow icon="location-outline" text={ev.place_name} c={c} /> : null}
            {ev.sport?.name ? (
              <MetaRow icon="fitness-outline" text={`${ev.sport.icon ?? ''} ${ev.sport.name}`.trim()} c={c} />
            ) : null}
            <MetaRow
              icon="people-outline"
              text={`${ev.participant_count} katılımcı${ev.capacity ? ` / ${ev.capacity}` : ''}`}
              c={c}
            />
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
            <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>{ev.description}</Text>
          ) : null}

          {/* Harita */}
          <MapView lat={ev.lat} lng={ev.lng} label={ev.place_name || ev.title} />

          {/* Katılımcılar */}
          <Text style={[styles.section, { color: c.text }]}>Katılımcılar ({ev.participant_count})</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ gap: Spacing.two }}>
            {ev.participants.map((p) => (
              <Pressable key={p.id} onPress={() => p.id && router.push(`/user/${p.id}`)} style={styles.pav}>
                <Avatar name={displayName(p)} url={p.avatar_url ?? null} size={48} />
                <Text style={{ color: c.textSecondary, fontSize: 11, maxWidth: 60 }} numberOfLines={1}>
                  {displayName(p)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ height: Spacing.two }} />
          {ev.status === 'open' ? (
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
  title: { fontSize: 24, fontWeight: '800' },
  cancelBanner: { padding: Spacing.two, borderRadius: 10, alignItems: 'center' },
  metaCard: { padding: Spacing.two, borderRadius: 14, borderWidth: 1, gap: 10 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14, borderWidth: 1 },
  section: { fontSize: 16, fontWeight: '700', marginTop: Spacing.two },
  pav: { alignItems: 'center', gap: 4, width: 60 },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.two, marginTop: 4 },
});
