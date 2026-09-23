import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Uygulama açıkken de bildirim bannerı göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Push için kayıt ol + token'ı DB'ye yaz.
 * - Emulator/simülatör gerçek token alamaz → null.
 * - EAS projectId yoksa (Expo Go / dev build kurulmadıysa) sessizce devre dışı.
 */
/** Bu cihazda en son kaydedilen push token (çıkışta silmek için). */
let lastToken: string | null = null;

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Emulator'da Device.isDevice=false döner. Üretimde gerçek cihaz şart ama
  // dev build'de (Google Play'li) emulator ile push test edebilmek için __DEV__'de izin ver.
  if (!Device.isDevice && !__DEV__) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) {
    console.warn('EAS projectId yok — push devre dışı (development build gerekli).');
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayılan',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    lastToken = token;
    if (__DEV__) console.log('📲 Expo push token:', token); // test için: expo.dev/notifications'a yapıştır
    await supabase.from('push_tokens').upsert({ token, user_id: userId, platform: Platform.OS });
    return token;
  } catch (e) {
    console.warn('Push token alınamadı:', e);
    return null;
  }
}

/**
 * Çıkışta bu cihazın push token'ını sil. Böylece token bir sonraki kullanıcıya
 * "yapışmaz" ve bildirimler yanlış hesaba düşmez. (RLS: yalnız sahibi silebilir —
 * bu yüzden ÇIKIŞTAN ÖNCE, hâlâ oturum açıkken çağrılmalı.)
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    let token = lastToken;
    if (!token && Device.isDevice) {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
      if (projectId) token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    }
    if (token) {
      await supabase.from('push_tokens').delete().eq('token', token);
      lastToken = null;
    }
  } catch {
    // sessizce geç — çıkışı asla bloklama
  }
}

/** Bildirim verisinden hedef rota üret (deep link). */
export function routeForNotification(data: Record<string, unknown>): string | null {
  switch (data?.type) {
    case 'chat':
      return data.conversation_id ? `/chat/${data.conversation_id}` : null;
    case 'chat_request':
      return '/chats';
    case 'follow':
      return data.user_id ? `/user/${data.user_id}` : null;
    case 'match':
      return data.match_id ? `/match/${data.match_id}` : null;
    case 'comment':
      return data.program_id ? `/program/${data.program_id}` : null;
    case 'event':
      return data.event_id ? `/event/${data.event_id}` : null;
    case 'post':
      return '/feed';
    default:
      return null;
  }
}
