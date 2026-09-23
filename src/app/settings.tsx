import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { showAlert } from '@/store/alert';

import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useModeration } from '@/hooks/useModeration';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessage';
import { useThemeStore, type ThemeMode } from '@/store/theme';
import { Spacing } from '@/constants/theme';
import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'Sistem' },
  { id: 'light', label: 'Açık' },
  { id: 'dark', label: 'Koyu' },
];

export default function SettingsScreen() {
  const c = useColors();
  const router = useRouter();
  const { signOut } = useAuth();
  const { mode, setMode } = useThemeStore();
  const { deleteAccount } = useModeration();
  const { data: isAdmin } = useIsAdmin();

  function confirmDelete() {
    showAlert(
      'Hesabı sil',
      'Tüm verilerin (programlar, kayıtlar, sohbetler) kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              await signOut();
            } catch (e) {
              showAlert('Hata', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Ayarlar' }} />

      {/* Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Görünüm</Text>
        <View style={styles.row}>
          {THEME_OPTIONS.map((o) => (
            <Chip key={o.id} label={o.label} selected={mode === o.id} onPress={() => setMode(o.id)} />
          ))}
        </View>
      </View>

      {/* Güvenlik */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Gizlilik & Güvenlik</Text>
        <NavRow
          icon="ban"
          label="Engellenen kullanıcılar"
          c={c}
          onPress={() => router.push('/blocked')}
        />
      </View>

      {/* Yasal */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Yasal</Text>
        <NavRow
          icon="shield-checkmark-outline"
          label="Gizlilik Politikası"
          c={c}
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <NavRow
          icon="document-text-outline"
          label="Kullanım Şartları"
          c={c}
          onPress={() => Linking.openURL(TERMS_URL)}
        />
      </View>

      {/* Yönetici (yalnız yöneticilere görünür) */}
      {isAdmin ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Yönetim</Text>
          <NavRow
            icon="flag-outline"
            label="Şikayetleri gör"
            c={c}
            onPress={() => router.push('/reports')}
          />
        </View>
      ) : null}

      {/* Hesap */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Hesap</Text>
        <NavRow icon="log-out-outline" label="Çıkış yap" c={c} onPress={() => signOut()} />
        <NavRow
          icon="trash-outline"
          label="Hesabı sil"
          danger
          c={c}
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

function NavRow({
  icon,
  label,
  danger,
  c,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  c: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const color = danger ? c.danger : c.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navRow,
        { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color, fontSize: 16, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
});
