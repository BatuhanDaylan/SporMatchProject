import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleButton } from '@/components/google-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { mapAuthError } from '@/lib/authErrors';
import { Spacing } from '@/constants/theme';

export default function SignUpScreen() {
  const c = useColors();
  const { signUp, signInGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('E-posta ve parola gerekli.');
      return;
    }
    // Güçlü parola: en az 8 karakter, harf ve rakam
    if (password.length < 8 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/[0-9]/.test(password)) {
      setError('Parola en az 8 karakter olmalı ve harf ile rakam içermeli.');
      return;
    }
    if (!accepted) {
      setError('Devam etmek için 18+ olduğunu ve şartları kabul ettiğini onayla.');
      return;
    }
    setLoading(true);
    try {
      const { needsVerification } = await signUp(email.trim(), password);
      // Doğrulama gerekiyorsa koda; değilse oturum açılır ve kök yönlendirici profil ekranına götürür
      if (needsVerification) router.replace(`/(auth)/verify?email=${encodeURIComponent(email.trim())}`);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    if (!accepted) {
      setError('Devam etmek için 18+ olduğunu ve şartları kabul ettiğini onayla.');
      return;
    }
    setGoogleLoading(true);
    try {
      await signInGoogle();
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Screen scroll center>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: c.primary }]}>Aramıza katıl</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Birkaç saniyede hesabını oluştur
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
        placeholder="En az 8 karakter, harf ve rakam"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error}
      />

      {/* 18+ + sözleşme onayı */}
      <Pressable onPress={() => setAccepted((a) => !a)} style={styles.acceptRow} hitSlop={6}>
        <Ionicons
          name={accepted ? 'checkbox' : 'square-outline'}
          size={24}
          color={accepted ? c.primary : c.textSecondary}
        />
        <Text style={[styles.acceptText, { color: c.textSecondary }]}>
          18 yaşından büyüğüm ve{' '}
          <Text style={{ color: c.primary }} onPress={() => router.push('/legal/sartlar')}>
            Kullanım Şartları
          </Text>{' '}
          ile{' '}
          <Text style={{ color: c.primary }} onPress={() => router.push('/legal/gizlilik')}>
            Gizlilik Politikası
          </Text>
          ’nı kabul ediyorum.
        </Text>
      </Pressable>

      <Button title="Kayıt Ol" onPress={onSubmit} loading={loading} disabled={googleLoading} />
      <View style={styles.orRow}>
        <View style={[styles.line, { backgroundColor: c.border }]} />
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>veya</Text>
        <View style={[styles.line, { backgroundColor: c.border }]} />
      </View>
      <GoogleButton onPress={onGoogle} loading={googleLoading} disabled={loading} />

      <View style={styles.footer}>
        <Text style={{ color: c.textSecondary }}>Zaten hesabın var mı? </Text>
        <Link href="/(auth)/sign-in" style={[styles.link, { color: c.primary }]}>
          Giriş yap
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.four },
  logo: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.two },
  link: { fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  acceptRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', marginVertical: Spacing.two },
  acceptText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
