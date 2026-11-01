import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { MapView } from '@/components/map-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useMatchActions, useMatchPartner } from '@/hooks/useMatch';
import { Spacing } from '@/constants/theme';

const LEVEL: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

function fmtDistance(m: number | null): string {
  if (m == null) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function MatchScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = useMatchPartner(id);
  const { confirm, decline } = useMatchActions();

  if (isLoading || !p) {
    return (
      <Screen center hasHeader>
        <Stack.Screen options={{ headerShown: true, title: 'Eşleşme' }} />
        <Loading />
      </Screen>
    );
  }

  const name = displayName(p);

  if (p.status === 'declined') {
    return (
      <Screen center hasHeader>
        <Stack.Screen options={{ headerShown: true, title: 'Eşleşme' }} />
        <View style={styles.centerBox}>
          <Ionicons name="close-circle-outline" size={56} color={c.textSecondary} />
          <Text style={[styles.h, { color: c.text }]}>Eşleşme reddedildi</Text>
          <Button title="Geri Dön" variant="secondary" onPress={() => router.replace('/(tabs)/match')} />
        </View>
      </Screen>
    );
  }

  const confirmed = p.status === 'confirmed';

  function openMaps() {
    if (!p || p.lat == null || p.lng == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`);
  }

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Eşleşme' }} />
      {confirmed ? (
        <View style={[styles.banner, { backgroundColor: c.success }]}>
          <Ionicons name="checkmark-circle" size={20} color={c.onSuccess} />
          <Text style={[styles.bannerText, { color: c.onSuccess }]}>Eşleşme onaylandı! Artık konumu görebilirsin.</Text>
        </View>
      ) : (
        <Text style={[styles.title, { color: c.text }]}>Eşleşme bulundu 🎉</Text>
      )}

      {/* Partner kartı */}
      <View style={[styles.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Avatar name={name} url={p.avatar_url} size={88} />
        <Text style={[styles.name, { color: c.text }]}>{name}</Text>
        <View style={styles.pills}>
          {p.level ? (
            <View style={[styles.pill, { backgroundColor: c.background }]}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Deneyim: {LEVEL[p.level] ?? p.level}</Text>
            </View>
          ) : null}
          {p.distance_m != null ? (
            <View style={[styles.pill, { backgroundColor: c.background }]}>
              <Ionicons name="navigate-outline" size={13} color={c.primary} />
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{fmtDistance(p.distance_m)} uzaklıkta</Text>
            </View>
          ) : null}
        </View>
      </View>

      {!confirmed ? (
        p.i_confirmed ? (
          <View style={styles.centerBox}>
            <Ionicons name="hourglass-outline" size={32} color={c.primary} />
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Onayın alındı</Text>
            <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
              Karşı tarafın onayı bekleniyor. İkiniz de onaylayınca konumlar paylaşılacak.
            </Text>
            <Button title="Vazgeç" variant="secondary" onPress={() => decline.mutate(id, { onSuccess: () => router.replace('/(tabs)/match') })} />
          </View>
        ) : (
          <View style={{ gap: Spacing.two }}>
            <Text style={{ color: c.textSecondary, textAlign: 'center', marginBottom: Spacing.one }}>
              İki taraf da onaylayınca tam konumlarınız paylaşılacak.
            </Text>
            <Button title="Onayla" onPress={() => confirm.mutate(id)} loading={confirm.isPending} />
            <Button
              title="Reddet"
              variant="secondary"
              onPress={() => decline.mutate(id, { onSuccess: () => router.replace('/(tabs)/match') })}
            />
          </View>
        )
      ) : (
        <View style={{ gap: Spacing.two }}>
          {p.lat != null && p.lng != null ? (
            <MapView lat={p.lat} lng={p.lng} label={`${name} burada`} />
          ) : null}
          <View style={[styles.locBox, { borderColor: c.border }]}>
            <Ionicons name="location" size={22} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.locTitle, { color: c.text }]}>Buluşma konumu</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}
              </Text>
            </View>
          </View>
          <Button title="🗺️ Yol Tarifi (harita uygulamasında)" onPress={openMaps} />
          {p.conversation_id ? (
            <Button
              title="💬 Sohbeti Aç"
              variant="secondary"
              onPress={() => router.push(`/chat/${p.conversation_id}`)}
            />
          ) : null}
        </View>
      )}
      <View style={{ height: Spacing.six }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.three, borderRadius: 12 },
  bannerText: { fontWeight: '600', flex: 1 },
  card: { alignItems: 'center', gap: 6, padding: Spacing.four, borderRadius: 20, borderWidth: 1, marginVertical: Spacing.three },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  name: { fontSize: 22, fontWeight: '800', marginTop: Spacing.two },
  centerBox: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  h: { fontSize: 20, fontWeight: '700' },
  locBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: 12, padding: Spacing.three },
  locTitle: { fontSize: 15, fontWeight: '700' },
});
