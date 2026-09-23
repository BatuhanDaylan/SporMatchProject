import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useMySports, useSports } from '@/hooks/useSports';
import { cancelMyActiveSession, useIncomingMatchListener, useStartMatching } from '@/hooks/useMatch';
import { getErrorMessage } from '@/lib/errorMessage';
import { Spacing, Type } from '@/constants/theme';

const RADII = [1, 3, 5, 10, 25];

export default function MatchScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const start = useStartMatching();

  const mySports = useMySports(profile, sports);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [radiusKm, setRadiusKm] = useState(5);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  // Profil sporları gelince hepsini varsayılan seç
  const selectedIds = selected.size ? [...selected] : mySports.map((s) => s.id);

  useIncomingMatchListener((matchId) => {
    setSearching(false);
    router.push(`/match/${matchId}`);
  }, searching);

  function toggle(id: string) {
    setSelected((prev) => {
      const base = prev.size ? new Set(prev) : new Set(mySports.map((s) => s.id));
      base.has(id) ? base.delete(id) : base.add(id);
      return base;
    });
  }

  async function onStart() {
    setError(null);
    setLimitHit(false);
    if (selectedIds.length === 0) {
      setError('En az bir spor seç.');
      return;
    }
    try {
      const res = await start.mutateAsync({ sportIds: selectedIds, radiusM: radiusKm * 1000 });
      if (res.match_id) {
        router.push(`/match/${res.match_id}`);
      } else {
        setSearching(true); // beklemeye geç, realtime dinle
      }
    } catch (e) {
      const message = getErrorMessage(e);
      if (message.includes('SporMatch Pro')) {
        setLimitHit(true);
      } else {
        setError(message);
      }
    }
  }

  async function onCancel() {
    await cancelMyActiveSession();
    setSearching(false);
  }

  if (searching) {
    return (
      <Screen center>
        <View style={styles.searchBox}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.searchTitle, { color: c.text }]}>Eşleşme aranıyor…</Text>
          <Text style={[styles.searchSub, { color: c.textSecondary }]}>
            {radiusKm} km içinde aynı sporu yapan birini buluyoruz. Uygulama açık kalsın.
          </Text>
          <View style={{ height: Spacing.three }} />
          <Button title="İptal" variant="secondary" onPress={onCancel} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: c.text }]}>Eşleş</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Yapmak istediğin sporları seç, yarıçapı belirle ve aktiviteyi başlat.
      </Text>

      {/* Etkinlikler girişi */}
      <Card
        onPress={() => router.push('/events')}
        style={styles.eventsCard}
        accessibilityRole="button"
        accessibilityLabel="Planlı etkinlikleri gör">
        <View style={[styles.eventsIcon, { backgroundColor: c.primary }]}>
          <Ionicons name="calendar-outline" size={20} color={c.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Planlı etkinlikler</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Yakındaki buluşmalara katıl ya da kendi etkinliğini oluştur.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
      </Card>

      {/* Ayar kartı — spor + yarıçap tek grupta, iki ayrı yüzen bölüm yerine */}
      <View style={[styles.setupCard, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Text style={[styles.setupLabel, { color: c.textSecondary }]}>SPORLAR</Text>
        {mySports.length === 0 ? (
          <Text style={{ color: c.textSecondary }}>Önce profilinden spor eklemelisin.</Text>
        ) : (
          <View style={styles.row}>
            {mySports.map((s) => (
              <Chip
                key={s.id}
                label={`${s.icon ?? ''} ${s.name}`.trim()}
                selected={selectedIds.includes(s.id)}
                onPress={() => toggle(s.id)}
              />
            ))}
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <Text style={[styles.setupLabel, { color: c.textSecondary }]}>YARIÇAP</Text>
        <View style={styles.row}>
          {RADII.map((r) => (
            <Chip key={r} label={`${r} km`} selected={radiusKm === r} onPress={() => setRadiusKm(r)} />
          ))}
        </View>
      </View>

      {limitHit ? (
        <View style={[styles.proCard, { backgroundColor: c.backgroundElement, borderColor: c.primary }]}>
          <View style={styles.proHead}>
            <Ionicons name="flash" size={18} color={c.primary} />
            <Text style={[styles.proTitle, { color: c.text }]}>Bugünlük ücretsiz hakkın bitti</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            Ücretsiz katmanda günde 3 eşleşme başlatabilirsin. SporMatch Pro ile sınırsız eşleş.
          </Text>
          <Pressable
            onPress={() =>
              showAlert('Çok yakında', 'SporMatch Pro yakında geliyor!')
            }
            style={[styles.proBtn, { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel="SporMatch Pro'ya geç">
            <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 14 }}>Pro'ya geç</Text>
          </Pressable>
        </View>
      ) : error ? (
        <Text style={{ color: c.danger }}>{error}</Text>
      ) : null}

      <Button
        title="⚡ Aktiviteyi Başlat"
        onPress={onStart}
        loading={start.isPending}
        disabled={mySports.length === 0}
      />
      <View style={styles.hintRow}>
        <Ionicons name="lock-closed-outline" size={14} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          Tam konumun yalnızca iki taraf da onayladıktan sonra paylaşılır.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.displayTitle },
  subtitle: { fontSize: 14 },
  setupCard: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  setupLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  eventsCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 14, borderWidth: 1 },
  eventsIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  proCard: { borderRadius: 14, borderWidth: 1.5, padding: Spacing.two, gap: 8 },
  proHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proTitle: { fontSize: 15, fontWeight: '700' },
  proBtn: { height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  searchBox: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  searchTitle: { fontSize: 20, fontWeight: '700', marginTop: Spacing.two },
  searchSub: { fontSize: 14, textAlign: 'center' },
});
