import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { FieldLabel } from '@/components/ui/field-label';
import { TextField } from '@/components/ui/text-field';
import { WheelField } from '@/components/ui/wheel-field';
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
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Meydan okuma oluştur' }} />

      <TextField label="Başlık" placeholder="Örn. 7 günde 5 antrenman" value={title} onChangeText={setTitle} maxLength={120} />

      <FieldLabel text="Ölçüt">
        <View style={styles.row}>
          {METRICS.map((m) => (
            <Chip key={m.id} label={m.label} selected={metric === m.id} onPress={() => setMetric(m.id)} />
          ))}
        </View>
      </FieldLabel>

      <WheelField
        label={`Hedef (${metric === 'workouts' ? 'antrenman' : 'aktif gün'})`}
        title="Hedef seç" icon="flag-outline" items={GOALS} value={goal} renderLabel={(n) => `${n}`} onChange={setGoal} />

      <WheelField
        label="Süre"
        title="Süre seç"
        icon="calendar-outline"
        items={DURATIONS}
        value={duration}
        renderLabel={(n) => `${n} gün`}
        onChange={setDuration}
      />

      {mySports.length ? (
        <>
          <WheelField
            label="Spor (isteğe bağlı)"
            title="Spor seç"
            icon="basketball-outline"
            items={[null, ...mySports.map((s) => s.id)]}
            value={sportId}
            renderLabel={(id) => {
              if (id === null) return 'Seçilmedi';
              const s = mySports.find((x) => x.id === id);
              return s ? `${s.icon ?? ''} ${s.name}`.trim() : 'Seçilmedi';
            }}
            onChange={setSportId}
          />
        </>
      ) : null}

      <TextField
        label="Açıklama (isteğe bağlı)"
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
