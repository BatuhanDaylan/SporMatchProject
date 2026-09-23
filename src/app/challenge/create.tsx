import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useMySports, useSports } from '@/hooks/useSports';
import { useCreateChallenge, type ChallengeMetric } from '@/hooks/useChallenges';
import { FormSection, Spacing } from '@/constants/theme';

const METRICS: { id: ChallengeMetric; label: string }[] = [
  { id: 'workouts', label: 'Antrenman sayısı' },
  { id: 'active_days', label: 'Aktif gün' },
];
const GOALS = [3, 5, 7, 10, 15, 20, 30];
const DURATIONS = [7, 14, 21, 30];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CreateChallengeScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const create = useCreateChallenge();

  const mySports = useMySports(profile, sports);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metric, setMetric] = useState<ChallengeMetric>('workouts');
  const [goal, setGoal] = useState(5);
  const [duration, setDuration] = useState(7);
  const [sportId, setSportId] = useState<string | null>(null);

  async function onCreate() {
    if (title.trim().length < 2) {
      showAlert('Eksik', 'Meydan okumaya bir başlık ver.');
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + duration - 1);
    try {
      const res = await create.mutateAsync({
        title,
        description,
        metric,
        goal,
        sportId,
        startsAt: ymd(start),
        endsAt: ymd(end),
      });
      router.replace(`/challenge/${res.id}`);
    } catch (e) {
      showAlert('Oluşturulamadı', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Meydan okuma oluştur' }} />

      <TextField label="Başlık" placeholder="Örn. 7 günde 5 antrenman" value={title} onChangeText={setTitle} maxLength={120} />

      <Text style={[styles.section, { color: c.text }]}>Ölçüt</Text>
      <View style={styles.row}>
        {METRICS.map((m) => (
          <Chip key={m.id} label={m.label} selected={metric === m.id} onPress={() => setMetric(m.id)} />
        ))}
      </View>

      <Text style={[styles.section, { color: c.text }]}>Hedef ({metric === 'workouts' ? 'antrenman' : 'aktif gün'})</Text>
      <View style={styles.row}>
        {GOALS.map((n) => (
          <Chip key={n} label={`${n}`} selected={goal === n} onPress={() => setGoal(n)} />
        ))}
      </View>

      <Text style={[styles.section, { color: c.text }]}>Süre</Text>
      <View style={styles.row}>
        {DURATIONS.map((n) => (
          <Chip key={n} label={`${n} gün`} selected={duration === n} onPress={() => setDuration(n)} />
        ))}
      </View>

      {mySports.length ? (
        <>
          <Text style={[styles.section, { color: c.text }]}>Spor (isteğe bağlı)</Text>
          <View style={styles.row}>
            {mySports.map((s) => (
              <Chip
                key={s.id}
                label={`${s.icon ?? ''} ${s.name}`.trim()}
                selected={sportId === s.id}
                onPress={() => setSportId(sportId === s.id ? null : s.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={[styles.section, { color: c.text }]}>Açıklama (isteğe bağlı)</Text>
      <TextField
        placeholder="Kurallar, motivasyon…"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
        maxLength={1000}
      />

      <View style={[styles.summary, { backgroundColor: c.backgroundElement }]}>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          {duration} gün içinde {goal} {metric === 'workouts' ? 'antrenman' : 'aktif gün'} hedefi. İlerleme
          antrenman kayıtlarından otomatik sayılır.
        </Text>
      </View>

      <View style={{ height: Spacing.three }} />
      <Button title="Meydan okumayı başlat" onPress={onCreate} loading={create.isPending} />
      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: FormSection,
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  summary: { padding: Spacing.two, borderRadius: 12, marginTop: Spacing.three },
});
