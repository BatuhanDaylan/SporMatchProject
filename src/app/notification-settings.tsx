import { Stack } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AsyncState } from '@/components/ui/async-state';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { NOTIF_CATEGORIES, useNotificationPrefs, type NotifCategory } from '@/hooks/useNotificationPrefs';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';
import { Spacing } from '@/constants/theme';

/** Hangi bildirimlerin telefona anlık gelmesini istediğini seç. Kapatılanlar uygulamadaki listede yine görünür. */
export default function NotificationSettingsScreen() {
  const c = useColors();
  const { data: muted, isLoading, isError, refetch, setMuted } = useNotificationPrefs();

  function toggle(key: NotifCategory, on: boolean) {
    const cur = muted ?? [];
    const next = on ? cur.filter((k) => k !== key) : [...cur, key];
    setMuted.mutate(next, { onError: (e) => showAlert('Kaydedilemedi', getErrorMessage(e)) });
  }

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Bildirim ayarları' }} />
      <Text style={{ color: c.textSecondary, fontSize: 14, lineHeight: 20 }}>
        Kapattığın türler telefonuna anlık bildirim olarak gelmez; uygulamadaki bildirim listesinde yine görünür.
      </Text>
      <AsyncState isLoading={isLoading} isError={isError} onRetry={refetch}>
        <View style={{ gap: Spacing.two }}>
          {NOTIF_CATEGORIES.map((cat) => {
            const on = !(muted ?? []).includes(cat.key);
            return (
              <View key={cat.key} style={[styles.row, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{cat.label}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{cat.desc}</Text>
                </View>
                <Switch
                  value={on}
                  onValueChange={(v) => toggle(cat.key, v)}
                  trackColor={{ true: c.primary }}
                  accessibilityLabel={`${cat.label} bildirimleri`}
                />
              </View>
            );
          })}
        </View>
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
  },
});
