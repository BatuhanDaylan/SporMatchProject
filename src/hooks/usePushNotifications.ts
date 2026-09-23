import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { registerForPushNotifications, routeForNotification } from '@/lib/push';

/**
 * Oturum açıkken push kaydı yapar ve bildirime tıklanınca ilgili ekrana yönlendirir.
 * Kök layout'ta bir kez çağrılır.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();

  // 1) Oturum açılınca token kaydet
  useEffect(() => {
    if (user?.id) registerForPushNotifications(user.id);
  }, [user?.id]);

  // 2) Bildirime tıklanınca yönlendir (uygulama açıkken/arka plandayken)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const route = routeForNotification(data);
      if (route) router.push(route as never);
    });

    // 3) Uygulama bildirimle SIFIRDAN açıldıysa
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown>;
      const route = routeForNotification(data);
      if (route) router.push(route as never);
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
