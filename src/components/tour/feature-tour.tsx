import { useRouter } from 'expo-router';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';
import { useTourHydrated, useTourStore } from '@/store/tour';
import { Elevation, Spacing } from '@/constants/theme';

/**
 * İlk giriş karşılaması: iki seçenek sunar — "Tanıtımı başlat" (etkileşimli turu açar) ve
 * "Biliyorum, geç" (bir daha otomatik gösterme). Tur kendisi `TourOverlay` ile oynar.
 * Kökte bir kez mount edilir.
 */
export function FeatureTour() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const hydrated = useTourHydrated();
  const doneFor = useTourStore((s) => s.doneFor);
  const active = useTourStore((s) => s.active);
  const markDone = useTourStore((s) => s.markDone);
  const start = useTourStore((s) => s.start);

  // Oturum var, profil kurulumu bitmiş, kayıt okunmuş, bu kullanıcı daha görmemiş ve tur oynamıyor.
  const open = !!user && !!profile?.onboarded && hydrated && !doneFor.includes(user.id) && !active;
  if (!open || !user) return null;

  function skip() {
    markDone(user!.id);
  }

  function begin() {
    start('all');
    router.navigate('/');
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={[styles.card, Elevation.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${c.primary}22` }]}>
            <Text style={{ fontSize: 34 }}>👋</Text>
          </View>
          <Text style={[styles.title, { color: c.text }]}>SporMatch'e hoş geldin!</Text>
          <Text style={[styles.text, { color: c.textSecondary }]}>
            İstersen uygulamayı gerçek ekranlarda dokunarak birlikte gezelim; sana her özelliğin nerede olduğunu
            gösterelim. Zaten biliyorsan atlayabilirsin, tanıtıma istediğin zaman Ayarlar'dan ulaşırsın.
          </Text>
          <View style={styles.stack}>
            <Button title="Tanıtımı başlat" size="lg" onPress={begin} />
            <Button title="Biliyorum, geç" variant="secondary" size="lg" onPress={skip} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  text: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  stack: { alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.one },
});
