import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Fab } from '@/components/ui/fab';
import { PickerField } from '@/components/ui/picker-field';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useCityEvents, useMyEvents, type CityEvent, type MyEvent } from '@/hooks/useEvents';
import { PROVINCES } from '@/constants/tr-cities';
import { eventWhen } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

type Mode = 'city' | 'mine';

const SEGMENT_OPTIONS = [
  { value: 'city', label: 'Şehrimde', accessibilityLabel: 'Şehrimdeki etkinlikler' },
  { value: 'mine', label: 'Benimkiler', accessibilityLabel: 'Benim etkinliklerim' },
] as const;

export default function EventsScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const [mode, setMode] = useState<Mode>('city');
  // null = profil ili kullanılır; kullanıcı başka bir il seçebilir.
  const [province, setProvince] = useState<string | null>(null);
  const shownProvince = province ?? profile?.province ?? null;

  const city = useCityEvents(province);
  const mine = useMyEvents();
  const active = mode === 'city' ? city : mine;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Etkinlikler' }} />

      {/* Segment */}
      <Segment value={mode} onChange={setMode} options={SEGMENT_OPTIONS} />

      {/* İl seçici (yalnız Şehrimde) */}
      {mode === 'city' ? (
        <View style={{ marginBottom: Spacing.two }}>
          <PickerField
            label="İl"
            value={shownProvince}
            placeholder="İl seç"
            options={PROVINCES}
            onChange={(p) => setProvince(p)}
          />
        </View>
      ) : null}

      {mode === 'city' && !shownProvince ? (
        <EmptyState
          icon="location-outline"
          title="İl seçili değil"
          text="Yukarıdan bir il seç ya da profiline ilini ekle; o ildeki etkinlikler burada listelenir."
        />
      ) : (
        <AsyncState
          isLoading={active.isLoading}
          isError={active.isError}
          onRetry={active.refetch}
          isEmpty={(active.data?.length ?? 0) === 0}
          empty={{
            icon: 'calendar-outline',
            title: mode === 'city' ? `${shownProvince}'de etkinlik yok` : 'Henüz etkinliğin yok',
            text:
              mode === 'city'
                ? 'İlk etkinliği sen oluştur — ilindeki sporcular katılsın.'
                : 'Oluşturduğun ya da katıldığın etkinlikler burada görünür.',
          }}>
          {mode === 'city' ? (
            <FlatList
              data={city.data}
              keyExtractor={(e) => e.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <CityCard event={item} c={c} onPress={() => router.push(`/event/${item.id}`)} />
              )}
            />
          ) : (
            <FlatList
              data={mine.data}
              keyExtractor={(e) => e.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <MineCard event={item} c={c} onPress={() => router.push(`/event/${item.id}`)} />
              )}
            />
          )}
        </AsyncState>
      )}

      {/* Oluştur FAB */}
      <Fab icon="add" onPress={() => router.push('/event/create')} accessibilityLabel="Etkinlik oluştur" />
    </Screen>
  );
}

function CityCard({ event, c, onPress }: { event: CityEvent; c: ReturnType<typeof useColors>; onPress: () => void }) {
  const hostName = displayName(event.host);
  const full = event.capacity != null && event.participant_count >= event.capacity;
  const place = [event.district, event.place_name].filter(Boolean).join(' · ');
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
          {event.sport?.icon ? `${event.sport.icon} ` : ''}
          {event.title}
        </Text>
        {event.joined ? (
          <Badge label="Katıldın" backgroundColor={c.primary} textColor={c.onPrimary} />
        ) : full ? (
          <Badge label="Dolu" backgroundColor={c.danger} textColor={c.onDanger} />
        ) : null}
      </View>

      <View style={styles.metaLine}>
        <Ionicons name="time-outline" size={14} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>{eventWhen(event.starts_at)}</Text>
      </View>
      {place ? (
        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={14} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontSize: 13 }} numberOfLines={1}>
            {place}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFoot}>
        <Avatar name={hostName} url={event.host?.avatar_url ?? null} size={22} />
        <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
          {hostName}
        </Text>
        <Ionicons name="people-outline" size={14} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {event.participant_count}
          {event.capacity ? `/${event.capacity}` : ''}
        </Text>
      </View>
    </Card>
  );
}

function MineCard({ event, c, onPress }: { event: MyEvent; c: ReturnType<typeof useColors>; onPress: () => void }) {
  const past = new Date(event.starts_at).getTime() < Date.now() - 2 * 3600 * 1000;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={{ gap: 6, opacity: past ? 0.6 : 1 }}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
            {event.sport?.icon ? `${event.sport.icon} ` : ''}
            {event.title}
          </Text>
          <Badge
            label={event.is_host ? 'Ev sahibi' : 'Katılımcı'}
            backgroundColor={event.is_host ? c.primary : c.border}
            textColor={event.is_host ? c.onPrimary : c.textSecondary}
          />
        </View>
        <View style={styles.metaLine}>
          <Ionicons name="time-outline" size={14} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>{eventWhen(event.starts_at)}</Text>
          {event.status === 'cancelled' ? (
            <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>· İptal</Text>
          ) : null}
        </View>
        {event.place_name ? (
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={14} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }} numberOfLines={1}>
              {event.place_name}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two, paddingBottom: 96 },
  card: { borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
