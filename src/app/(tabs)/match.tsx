import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

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

/** Arama ekranındaki yayılan halka animasyonu (native driver, JS thread'i meşgul etmez). */
function PulseRing({ color }: { color: string }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          borderColor: color,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] }) }],
        },
      ]}
    />
  );
}

export default function MatchScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const start = useStartMatching();

  const mySports = useMySports(profile, sports);

  // null = kullanıcı henüz dokunmadı → profil sporlarının hepsi seçili sayılır.
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  const selectedSet = selected ?? new Set(mySports.map((s) => s.id));
  const chosen = mySports.filter((s) => selectedSet.has(s.id));
  const summary = chosen.map((s) => s.name).join(', ');

  function toggleSport(id: string) {
    const next = new Set(selectedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setError(null);
  }

  useIncomingMatchListener((matchId) => {
    setSearching(false);
    router.push(`/match/${matchId}`);
  }, searching);

  async function onStart() {
    setError(null);
    setLimitHit(false);
    if (chosen.length === 0) {
      setError('En az bir spor seç.');
      return;
    }
    try {
      const res = await start.mutateAsync({ sportIds: chosen.map((s) => s.id), radiusM: radiusKm * 1000 });
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
      <Screen center floatingTabBar>
        <View style={styles.searchBox}>
          <View style={styles.pulseWrap}>
            <PulseRing color={c.primary} />
            <View style={[styles.pulseCore, { backgroundColor: c.primary }]}>
              <Ionicons name="flash" size={34} color={c.onPrimary} />
            </View>
          </View>
          <Text style={[styles.searchTitle, { color: c.text }]}>Eşleşme aranıyor…</Text>
          <Text style={[styles.searchSub, { color: c.textSecondary }]}>
            {radiusKm} km içinde {summary || 'aynı sporu'} yapan birini buluyoruz. Uygulama açık kalsın.
          </Text>
          <View style={{ height: Spacing.three }} />
          <Button title="İptal" variant="secondary" onPress={onCancel} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll floatingTabBar>
      <View>
        <Text style={[styles.title, { color: c.text }]}>Eşleş</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Spor ve mesafeni seç, yakınındaki sporcuyla eşleş.
        </Text>
      </View>

      {/* 1) Spor seçimi — tüm seçenekler görünür, dokununca işaretlenir */}
      <View style={{ gap: Spacing.two }}>
        <View style={styles.stepHead}>
          <Text style={[styles.step, { color: c.text }]}>Ne yapmak istiyorsun?</Text>
          {mySports.length > 0 ? (
            <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
              {chosen.length}/{mySports.length} seçili
            </Text>
          ) : null}
        </View>
        {mySports.length === 0 ? (
          <Card style={styles.noSports}>
            <Ionicons name="barbell-outline" size={28} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
              Eşleşmek için profiline en az bir spor eklemelisin.
            </Text>
            <Button title="Spor ekle" size="md" onPress={() => router.push('/profile-edit')} />
          </Card>
        ) : (
          <View style={styles.grid}>
            {mySports.map((s) => {
              const on = selectedSet.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggleSport(s.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${s.name}${on ? ', seçili' : ''}`}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      backgroundColor: on ? `${c.primary}22` : c.backgroundElement,
                      borderColor: on ? c.primary : c.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text style={styles.tileEmoji}>{s.icon ?? '🏅'}</Text>
                  <Text style={[styles.tileName, { color: c.text }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {on ? (
                    <View style={[styles.tick, { backgroundColor: c.primary }]}>
                      <Ionicons name="checkmark" size={12} color={c.onPrimary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* 2) Mesafe */}
      <View style={{ gap: Spacing.two }}>
        <Text style={[styles.step, { color: c.text }]}>Ne kadar uzakta?</Text>
        <View style={styles.radii}>
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
            onPress={() => router.push('/pro')}
            style={[styles.proBtn, { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel="SporMatch Pro'ya geç">
            <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 14 }}>Pro'ya geç</Text>
          </Pressable>
        </View>
      ) : error ? (
        <Text style={{ color: c.danger }}>{error}</Text>
      ) : null}

      {/* Ana aksiyon + özet */}
      <View style={{ gap: Spacing.two }}>
        <Button
          title="⚡ Eşleşmeyi Başlat"
          onPress={onStart}
          loading={start.isPending}
          disabled={mySports.length === 0 || chosen.length === 0}
        />
        {chosen.length > 0 ? (
          <Text style={[styles.summary, { color: c.textSecondary }]} numberOfLines={2}>
            {summary} · {radiusKm} km içinde
          </Text>
        ) : null}
        <View style={styles.hintRow}>
          <Ionicons name="lock-closed-outline" size={14} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            Tam konumun yalnızca iki taraf da onayladıktan sonra paylaşılır.
          </Text>
        </View>
      </View>

      {/* İkincil: planlı etkinlikler */}
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
            Hemen eşleşmek yerine yakındaki bir buluşmaya katıl ya da kendi etkinliğini oluştur.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.displayTitle },
  subtitle: { fontSize: 14, marginTop: 2 },
  stepHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  step: { ...Type.sectionTitle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  tileEmoji: { fontSize: 30 },
  tileName: { fontSize: 13, fontWeight: '700' },
  tick: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSports: { alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  radii: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  summary: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
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
  pulseWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  pulseCore: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
});
