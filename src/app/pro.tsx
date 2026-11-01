import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { usePro } from '@/hooks/usePro';
import { Spacing } from '@/constants/theme';

const FEATURES = [
  {
    icon: 'infinite-outline' as const,
    title: 'Sınırsız eşleşme',
    desc: 'Ücretsiz katmanda günde en fazla 3 eşleşme başlatabilirsin — Pro ile sınır kalkar.',
  },
  {
    icon: 'heart-outline' as const,
    title: 'Topluluğu büyütmemize destek ol',
    desc: 'Pro üyelikler SporMatch’in gelişimini ve yeni özelliklerin gelmesini sağlıyor.',
  },
];

export default function ProScreen() {
  const c = useColors();
  const { isPro, proUntil } = usePro();

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'SporMatch Pro' }} />

      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: c.primary }]}>
          <Ionicons name="flash" size={30} color={c.onPrimary} />
        </View>
        <Text style={[styles.heroTitle, { color: c.text }]}>SporMatch Pro</Text>
        <Text style={[styles.heroSub, { color: c.textSecondary }]}>
          Sınırsız eşleş, topluluğun büyümesine destek ol.
        </Text>
      </View>

      {isPro ? (
        <View style={[styles.activeCard, { backgroundColor: c.backgroundElement, borderColor: c.primary }]}>
          <Ionicons name="checkmark-circle" size={22} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Pro üyeliğin aktif</Text>
            {proUntil ? (
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                {new Date(proUntil).toLocaleDateString('tr-TR')} tarihine kadar geçerli
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          <View style={{ gap: Spacing.three }}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: c.backgroundElement }]}>
                  <Ionicons name={f.icon} size={20} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{f.title}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.soonCard, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
            <Ionicons name="time-outline" size={22} color={c.primary} />
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Çok yakında</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, textAlign: 'center' }}>
              SporMatch Pro henüz satın alınamıyor. Hazır olduğunda buradan duyuracağız.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginBottom: Spacing.three },
  heroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSub: { fontSize: 14, textAlign: 'center' },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: Spacing.three,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  soonCard: {
    marginTop: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
