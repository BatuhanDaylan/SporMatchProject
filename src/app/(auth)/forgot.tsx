import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { mapAuthError, passwordProblem } from '@/lib/authErrors';
import { Spacing } from '@/constants/theme';

const RESEND_WAIT = 60;

/**
 * Parolamı unuttum: 1) e-postaya 6 haneli kod gönderilir, 2) kod + yeni parola girilir.
 * Kod doğrulanınca oturum açılır ve yeni parola kaydedilir; kök yönlendirici ana ekrana geçirir.
 */
export default function ForgotPasswordScreen() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function onSend() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Geçerli bir e-posta gir.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      setWait(RESEND_WAIT);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onReset() {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError('E-postana gelen 6 haneli kodu gir.');
      return;
    }
    const pw = passwordProblem(password);
    if (pw) {
      setError(pw);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      // Oturum açıldı → kök yönlendirici uygulamaya geçirir
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Parolanı sıfırla</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {sent
            ? `${email.trim()} adresine 6 haneli bir kod gönderdik. Kodu ve yeni parolanı gir.`
            : 'Hesabının e-postasını gir; parolanı sıfırlaman için bir kod gönderelim.'}
        </Text>
      </View>

      {!sent ? (
        <>
          <TextField
            label="E-posta"
            placeholder="ornek@eposta.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={error}
          />
          <Button title="Kod gönder" onPress={onSend} loading={loading} />
        </>
      ) : (
        <>
          <TextField
            label="Doğrulama kodu"
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            style={{ fontSize: 22, letterSpacing: 6, textAlign: 'center' }}
          />
          <TextField
            label="Yeni parola"
            placeholder="En az 8 karakter, harf ve rakam"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />
          <Button title="Parolayı kaydet" onPress={onReset} loading={loading} />
          <Text style={{ color: c.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Kod gelmediyse gereksiz (spam) klasörüne de bak.
          </Text>
          <Pressable onPress={onSend} disabled={wait > 0 || loading} style={styles.link} accessibilityRole="button">
            <Text style={{ color: wait > 0 ? c.textSecondary : c.primary, fontWeight: '600' }}>
              {wait > 0 ? `Kodu tekrar gönder (${wait} sn)` : 'Kodu tekrar gönder'}
            </Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.back()} style={styles.link} accessibilityRole="button">
        <Text style={{ color: c.textSecondary }}>Girişe dön</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  link: { alignItems: 'center', paddingVertical: Spacing.two },
});
