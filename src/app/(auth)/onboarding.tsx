import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useSports } from '@/hooks/useSports';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessage';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';
import type { SkillLevel } from '@/types/database';

const LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'beginner', label: 'Başlangıç' },
  { id: 'intermediate', label: 'Orta' },
  { id: 'advanced', label: 'İleri' },
];

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function OnboardingScreen() {
  const c = useColors();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: sports, isLoading: sportsLoading } = useSports();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [level, setLevel] = useState<SkillLevel | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggleSport(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Oturum yok.');

      const { error: pErr } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim(),
        display_name: displayName.trim() || username.trim(),
        level,
        onboarded: true,
      });
      if (pErr) throw pErr;

      // Sporları sıfırla + yeniden yaz (idempotent)
      const { error: dErr } = await supabase.from('user_sports').delete().eq('user_id', user.id);
      if (dErr) throw dErr;

      const rows = [...selected].map((sport_id) => ({
        user_id: user.id,
        sport_id,
        skill_level: level,
      }));
      if (rows.length) {
        const { error: iErr } = await supabase.from('user_sports').insert(rows);
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      // auth-gate profil onboarded=true görünce (tabs)'e geçer.
    },
    onError: (e) => setError(mapError(e)),
  });

  function onSubmit() {
    setError(null);
    if (!USERNAME_RE.test(username.trim())) {
      setError('Kullanıcı adı 3-20 karakter olmalı (harf, rakam, _).');
      return;
    }
    if (!level) {
      setError('Bir seviye seç.');
      return;
    }
    if (selected.size === 0) {
      setError('En az bir spor seç.');
      return;
    }
    save.mutate();
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: c.text }]}>Profilini tamamla</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Seni doğru kişilerle eşleştirebilmemiz için birkaç bilgi.
      </Text>

      <TextField
        label="Kullanıcı adı"
        placeholder="ör. batuhan_23"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextField
        label="Görünen ad (opsiyonel)"
        placeholder="Adın veya takma adın"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <Text style={[styles.section, { color: c.text }]}>Genel seviyen</Text>
      <View style={styles.row}>
        {LEVELS.map((l) => (
          <Chip key={l.id} label={l.label} selected={level === l.id} onPress={() => setLevel(l.id)} />
        ))}
      </View>

      <Text style={[styles.section, { color: c.text }]}>Yaptığın sporlar</Text>
      {sportsLoading ? (
        <Text style={{ color: c.textSecondary }}>Sporlar yükleniyor…</Text>
      ) : (
        <View style={styles.row}>
          {sports?.map((s) => (
            <Chip
              key={s.id}
              label={`${s.icon ?? ''} ${s.name}`.trim()}
              selected={selected.has(s.id)}
              onPress={() => toggleSport(s.id)}
            />
          ))}
        </View>
      )}

      {/* Güvenlik uyarısı */}
      <View style={[styles.safety, { backgroundColor: c.backgroundElement }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={c.primary} />
        <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1, lineHeight: 17 }}>
          Güvenlik: Eşleşip buluşurken ilk buluşmaları halka açık yerlerde yap, yakınlarını
          bilgilendir. Rahatsız edilirsen kişiyi engelle/şikayet et.
        </Text>
      </View>

      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

      <View style={{ height: Spacing.two }} />
      <Button title="Tamamla ve Başla" onPress={onSubmit} loading={save.isPending} />
    </Screen>
  );
}

function mapError(e: unknown): string {
  const msg = getErrorMessage(e);
  if (/duplicate key|23505|already exists/i.test(msg)) return 'Bu kullanıcı adı alınmış, başka dene.';
  if (/profiles_username_format/i.test(msg)) return 'Kullanıcı adı geçersiz.';
  return msg;
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginBottom: Spacing.two },
  section: { fontSize: 16, fontWeight: '700', marginTop: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  safety: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.three,
  },
  error: { fontSize: 13, marginTop: Spacing.two },
});
