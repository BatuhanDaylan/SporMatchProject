import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PickerField } from '@/components/ui/picker-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useSports } from '@/hooks/useSports';
import { pickAndUploadAvatar } from '@/lib/avatar';
import { getErrorMessage } from '@/lib/errorMessage';
import { assertClean } from '@/lib/moderation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';
import { AVAILABILITY_OPTIONS, GOAL_OPTIONS } from '@/constants/profile-options';
import { DISTRICTS, PROVINCES } from '@/constants/tr-cities';
import type { SkillLevel } from '@/types/database';

const LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'beginner', label: 'Başlangıç' },
  { id: 'intermediate', label: 'Orta' },
  { id: 'advanced', label: 'İleri' },
];

export default function ProfileEditScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [level, setLevel] = useState<SkillLevel | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setBio(profile.bio ?? '');
      setProvince(profile.province ?? null);
      setDistrict(profile.district ?? null);
      setLevel(profile.level);
      setSelected(new Set(profile.user_sports.map((s) => s.sport_id)));
      setGoals(new Set(profile.goals ?? []));
      setAvailability(new Set(profile.availability ?? []));
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  function toggleIn(setFn: typeof setGoals, value: string) {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  function onSelectProvince(p: string) {
    setProvince(p);
    // Seçili ilçe yeni ile ait değilse temizle
    if (district && !(DISTRICTS[p] ?? []).includes(district)) setDistrict(null);
  }

  async function onPickAvatar() {
    setError(null);
    setUploading(true);
    try {
      const url = await pickAndUploadAvatar(user!.id);
      if (url) setAvatarUrl(url);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      assertClean(displayName, bio);
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          province,
          district,
          level,
          goals: [...goals],
          availability: [...availability],
          avatar_url: avatarUrl,
        })
        .eq('id', user!.id);
      if (pErr) throw pErr;

      await supabase.from('user_sports').delete().eq('user_id', user!.id);
      const rows = [...selected].map((sport_id) => ({ user_id: user!.id, sport_id, skill_level: level }));
      if (rows.length) {
        const { error: sErr } = await supabase.from('user_sports').insert(rows);
        if (sErr) throw sErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const name = displayName || profile?.username || 'Sporcu';

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Profili Düzenle', presentation: 'modal' }} />

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Pressable onPress={onPickAvatar} disabled={uploading}>
          <Avatar name={name} url={avatarUrl} size={100} />
          <View style={[styles.camera, { backgroundColor: c.primary, borderColor: c.background }]}>
            {uploading ? (
              <ActivityIndicator size="small" color={c.onPrimary} />
            ) : (
              <Text style={{ fontSize: 15 }}>📷</Text>
            )}
          </View>
        </Pressable>
        <Pressable onPress={onPickAvatar} disabled={uploading} hitSlop={6}>
          <Text style={{ color: c.primary, fontWeight: '600', marginTop: Spacing.two }}>
            Fotoğrafı değiştir
          </Text>
        </Pressable>
      </View>

      {/* Temel bilgiler */}
      <View style={{ gap: Spacing.three }}>
        <TextField label="Görünen ad" value={displayName} onChangeText={setDisplayName} placeholder="Adın" />
        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <PickerField label="İl" value={province} placeholder="İl seç" options={PROVINCES} onChange={onSelectProvince} />
          </View>
          <View style={{ flex: 1 }}>
            <PickerField
              label="İlçe"
              value={district}
              placeholder="İlçe seç"
              options={province ? DISTRICTS[province] ?? [] : []}
              onChange={setDistrict}
              disabled={!province}
              disabledHint="Önce il seç"
            />
          </View>
        </View>
        <TextField
          label="Hakkında"
          value={bio}
          onChangeText={setBio}
          placeholder="Kendinden kısaca bahset"
          multiline
        />
      </View>

      <EditSection title="Seviye" c={c}>
        {LEVELS.map((l) => (
          <Chip key={l.id} label={l.label} selected={level === l.id} onPress={() => setLevel(l.id)} />
        ))}
      </EditSection>

      <EditSection title="Hedefler" hint={goals.size ? `${goals.size} seçili` : undefined} c={c}>
        {GOAL_OPTIONS.map((g) => (
          <Chip key={g} label={g} selected={goals.has(g)} onPress={() => toggleIn(setGoals, g)} />
        ))}
      </EditSection>

      <EditSection
        title="Müsaitlik"
        hint={availability.size ? `${availability.size} seçili` : undefined}
        c={c}>
        {AVAILABILITY_OPTIONS.map((a) => (
          <Chip
            key={a}
            label={a}
            selected={availability.has(a)}
            onPress={() => toggleIn(setAvailability, a)}
          />
        ))}
      </EditSection>

      <EditSection title="Sporlar" hint={selected.size ? `${selected.size} seçili` : undefined} c={c}>
        {sports?.map((s) => (
          <Chip
            key={s.id}
            label={`${s.icon ?? ''} ${s.name}`.trim()}
            selected={selected.has(s.id)}
            onPress={() => toggleIn(setSelected, s.id)}
          />
        ))}
      </EditSection>

      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}

      <View style={{ marginTop: Spacing.two }}>
        <Button title="Kaydet" size="lg" loading={save.isPending} onPress={() => save.mutate()} />
      </View>
      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

function EditSection({
  title,
  hint,
  c,
  children,
}: {
  title: string;
  hint?: string;
  c: ReturnType<typeof useColors>;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
        {hint ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{hint}</Text> : null}
      </View>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center' },
  camera: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  locationRow: { flexDirection: 'row', gap: Spacing.two },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
});
