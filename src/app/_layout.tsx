import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/lib/auth';
import { AlertHost } from '@/components/ui/alert-host';
import { ErrorBoundary } from '@/components/error-boundary';
import { queryClient } from '@/lib/queryClient';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/store/theme';

/** Navigasyon (header/tab bar) temasını uygulama paletine bağla. */
function navTheme(scheme: 'light' | 'dark') {
  const p = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: p.background,
      card: p.background,
      text: p.text,
      border: p.border,
      primary: p.primary,
    },
  };
}

SplashScreen.preventAutoHideAsync();

/** Oturum + onboarding durumuna göre yönlendiren kapı. */
function RootNavigator() {
  const c = useColors();
  const { initializing, session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const segments = useSegments() as string[];
  const router = useRouter();

  usePushNotifications();

  const waiting = initializing || (!!session && profileLoading);

  useEffect(() => {
    if (waiting) return;
    SplashScreen.hideAsync();

    const inAuth = segments[0] === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    const needsOnboarding = !profile || !profile.onboarded;
    if (needsOnboarding) {
      if (segments[1] !== 'onboarding') router.replace('/(auth)/onboarding');
      return;
    }

    if (inAuth) router.replace('/(tabs)');
  }, [waiting, session, profile, segments, router]);

  if (waiting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, headerTitleStyle: { fontWeight: '800' } }} />;
}

export default function RootLayout() {
  const scheme = useResolvedScheme();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider value={navTheme(scheme)}>
            <RootNavigator />
            <AlertHost />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
