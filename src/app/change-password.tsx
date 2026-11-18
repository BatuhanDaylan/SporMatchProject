import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { mapAuthError, passwordProblem } from '@/lib/authErrors';
import { showAlert } from '@/store/alert';

/** Oturum açıkken parola değiştirme (önce mevcut parola sorulur). */
export default function ChangePasswordScreen() {
  const c = useColors();
  const router = useRouter();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSave() {
    setError(null);
    if (!current) return setError('Mevcut parolanı gir.');
    const pw = passwordProblem(next);
    if (pw) return setError(pw);
    if (next !== repeat) return setError('Yeni parolalar eşleşmiyor.');
    setLoading(true);
    try {
      await changePassword(current, next);
      showAlert('Parola değişti ✅', 'Bir dahaki girişte yeni parolanı kullan.', [{ text: 'Tamam', onPress: () => router.back() }]);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Parolayı değiştir' }} />
      <TextField label="Mevcut parola" secureTextEntry value={current} onChangeText={setCurrent} />
      <TextField
        label="Yeni parola"
        placeholder="En az 8 karakter, harf ve rakam"
        secureTextEntry
        value={next}
        onChangeText={setNext}
      />
      <TextField label="Yeni parola (tekrar)" secureTextEntry value={repeat} onChangeText={setRepeat} error={error} />
      <Button title="Parolayı kaydet" onPress={onSave} loading={loading} />
      <Text style={{ color: c.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Parolanı hatırlamıyorsan çıkış yapıp giriş ekranındaki “Parolamı unuttum” bağlantısını kullan.
      </Text>
    </Screen>
  );
}
