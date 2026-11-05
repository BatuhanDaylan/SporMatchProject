import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { unregisterPushToken } from '@/lib/push';
import { queryClient } from '@/lib/queryClient';

type AuthContextValue = {
  /** Oturum hazır olana kadar true (splash göstermek için). */
  initializing: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Hesap değişince (çıkış ya da başka hesapla giriş) önbelleği boşalt: önceki kullanıcının
    // sohbetleri/istekleri yeni kullanıcıya görünmesin. Token yenilemede (aynı kullanıcı) dokunma.
    let currentUid: string | null | undefined; // undefined = henüz bilinmiyor
    const trackUser = (s: Session | null) => {
      const uid = s?.user?.id ?? null;
      if (currentUid !== undefined && uid !== currentUid) queryClient.clear();
      currentUid = uid;
    };

    // 1) Kalıcı oturumu yükle
    supabase.auth
      .getSession()
      .then(({ data }) => {
        trackUser(data.session);
        setSession(data.session);
        // Realtime soketini yetkilendir (RLS'li postgres_changes için şart)
        supabase.realtime.setAuth(data.session?.access_token ?? null);
      })
      .catch(() => {
        /* oturum okunamadı → girişsiz devam; yükleme ekranında takılma */
      })
      .finally(() => setInitializing(false));

    // 2) Değişiklikleri dinle (giriş/çıkış/token yenileme)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      trackUser(s);
      setSession(s);
      supabase.realtime.setAuth(s?.access_token ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      session,
      user: session?.user ?? null,
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        // Önce bu cihazın push token'ını sök (RLS: hâlâ oturum açıkken silinmeli),
        // sonra çıkış yap. Böylece token bir sonraki kullanıcıya yapışmaz.
        await unregisterPushToken();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [initializing, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return ctx;
}
