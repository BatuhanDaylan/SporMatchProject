import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Env bağlanana kadar net bir hata ver — sessiz "undefined" hatalarından iyidir.
  throw new Error(
    'Supabase env eksik. .env dosyasına EXPO_PUBLIC_SUPABASE_URL ve ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY ekleyin (bkz. .env.example).',
  );
}

/**
 * Uygulama genelinde tek Supabase istemcisi.
 * - Oturum React Native'de AsyncStorage'da kalıcı tutulur.
 * - detectSessionInUrl kapalı: mobilde URL tabanlı oturum yakalama yok.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
