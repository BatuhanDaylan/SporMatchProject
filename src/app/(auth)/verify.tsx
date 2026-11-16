import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { mapAuthError } from '@/lib/authErrors';
import { Spacing } from '@/constants/theme';

const RESEND_WAIT = 60;

/** E-posta doğrulama: kayıt sonrası e-postaya gelen 6 haneli kod girilir; doğrulanınca oturum açılır. */
export default function VerifyScreen() {
  const c = useColors();
  const router = useRouter();
  const { email = '', resend } = useLocalSearchParams<{ email: string; resend?: string }>();
  const { verifySignup, resendSignup } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(RESEND_WAIT);

  // Tekrar gönderme için geri sayım
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // Girişte "e-posta doğrulanmamış" denip buraya gelindiyse yeni kod gönder
  useEffect(() => {
    if (resend === '1' && email) onResend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onVerify() {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError('E-postana gelen 6 haneli kodu gir.');
      return;
    }
    setLoading(true);
    try {
      await verifySignup(email, code);
      // Oturum açıldı → kök yönlendirici profil tamamlama ekranına götürür
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    try {
      await resendSignup(email);
      setInfo('Yeni kod gönderildi. Gereksiz (spam) klasörüne de bak.');
      setWait(RESEND_WAIT);
    } catch (e) {
      setError(mapAuthError(e));
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>E-postanı doğrula</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          <Text style={{ color: c.text, fontWeight: '700' }}>{email}</Text> adresine 6 haneli bir kod gönderdik.
          Hesabını açmak için kodu gir.
        </Text>
      </View>

      <TextField
        label="Doğrulama kodu"
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        error={error}
        style={{ fontSize: 22, letterSpacing: 6, textAlign: 'center' }}
      />
      {info ? <Text style={{ color: c.success, fontSize: 13 }}>{info}</Text> : null}

      <Button title="Doğrula" onPress={onVerify} loading={loading} />

      <Pressable onPress={onResend} disabled={wait > 0} style={styles.link} accessibilityRole="button">
        <Text style={{ color: wait > 0 ? c.textSecondary : c.primary, fontWeight: '600' }}>
          {wait > 0 ? `Kodu tekrar gönder (${wait} sn)` : 'Kodu tekrar gönder'}
        </Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(auth)/sign-up')} style={styles.link} accessibilityRole="button">
        <Text style={{ color: c.textSecondary }}>Farklı bir e-posta kullan</Text>
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
