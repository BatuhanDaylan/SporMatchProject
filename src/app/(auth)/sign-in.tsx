import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GoogleButton } from '@/components/google-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { mapAuthError } from '@/lib/authErrors';
import { Spacing } from '@/constants/theme';

export default function SignInScreen() {
  const c = useColors();
  const router = useRouter();
  const { signIn, signInGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInGoogle();
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setGoogleLoading(false);
    }
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setUnconfirmed(false);
    if (!email.trim() || !password) {
      setError('E-posta ve parola gerekli.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Yönlendirmeyi kök auth-gate yapar.
    } catch (e) {
      setError(mapAuthError(e));
      if (/email not confirmed/i.test(String((e as { message?: string })?.message))) setUnconfirmed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: c.primary }]}>SporMatch</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Birlikte spor yapacağın kişileri bul
        </Text>
      </View>

      <TextField
        label="E-posta"
        placeholder="ornek@eposta.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Parola"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error}
      />

      <Button title="Giriş Yap" onPress={onSubmit} loading={loading} disabled={googleLoading} />
      {unconfirmed ? (
        <Button
          title="Doğrulama kodunu gir"
          variant="secondary"
          onPress={() => router.push(`/(auth)/verify?email=${encodeURIComponent(email.trim())}&resend=1`)}
        />
      ) : null}

      <View style={styles.orRow}>
        <View style={[styles.line, { backgroundColor: c.border }]} />
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>veya</Text>
        <View style={[styles.line, { backgroundColor: c.border }]} />
      </View>
      <GoogleButton onPress={onGoogle} loading={googleLoading} disabled={loading} />

      <View style={styles.footer}>
        <Text style={{ color: c.textSecondary }}>Hesabın yok mu? </Text>
        <Link href="/(auth)/sign-up" style={[styles.link, { color: c.primary }]}>
          Kayıt ol
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.four },
  logo: { fontSize: 34, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.two },
  link: { fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
