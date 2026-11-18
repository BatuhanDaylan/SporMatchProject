import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { useColors } from '@/hooks/useColors';
import { useNotifications } from '@/hooks/useNotifications';

/** Zil düğmesi + okunmamış sayısı rozeti; bildirimler ekranını açar. */
export function NotificationBell() {
  const c = useColors();
  const router = useRouter();
  const { unread } = useNotifications();
  return (
    <IconButton
      icon="notifications-outline"
      iconColor={c.text}
      backgroundColor={c.backgroundElement}
      onPress={() => router.push('/notifications')}
      accessibilityLabel={unread > 0 ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'}>
      {unread > 0 ? (
        <View style={[styles.dot, { backgroundColor: c.danger, borderColor: c.background }]}>
          <Text style={[styles.text, { color: c.onDanger }]}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </IconButton>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: { fontSize: 10, fontWeight: '800' },
});
