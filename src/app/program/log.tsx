import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { showAlert } from '@/store/alert';

import { RestTimer } from '@/components/rest-timer';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useProgram } from '@/hooks/usePrograms';
import { useAddWorkoutLog, useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { getErrorMessage } from '@/lib/errorMessage';
import { priorMax } from '@/lib/prs';
import { Spacing } from '@/constants/theme';
import type { LogEntry } from '@/types/program';

type ValueMap = Record<string, Record<string, string | boolean>>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LogWorkoutScreen() {
  const c = useColors();
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { data: program } = useProgram(programId);
  const { data: priorLogs } = useWorkoutLogs(programId);
  const addLog = useAddWorkoutLog();

  const [dayId, setDayId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<ValueMap>({});
  const [error, setError] = useState<string | null>(null);

  const days = program?.template.days ?? [];
  const activeDay = useMemo(() => days.find((d) => d.id === dayId) ?? days[0], [days, dayId]);

  // Şablondaki hedef değerleri forma ön-doldur (program yüklenince).
  useEffect(() => {
    if (!program) return;
    const init: ValueMap = {};
    for (const d of program.template.days)
      for (const ex of d.exercises)
        for (const f of ex.fields)
          if (f.value !== undefined && f.value !== '') {
            init[ex.id] = {
              ...(init[ex.id] ?? {}),
              [f.key]: f.type === 'checkbox' ? !!f.value : String(f.value),
            };
          }
    setValues(init);
  }, [program]);

  function setValue(exId: string, key: string, v: string | boolean) {
    setValues((prev) => ({ ...prev, [exId]: { ...prev[exId], [key]: v } }));
  }

  async function onSave() {
    setError(null);
    if (!activeDay) {
      setError('Kaydedilecek gün yok.');
      return;
    }
    // Girilen değerlerden entries üret
    const entries: LogEntry[] = [];
    for (const ex of activeDay.exercises) {
      const raw = values[ex.id];
      if (!raw) continue;
      const out: LogEntry['values'] = {};
      for (const f of ex.fields) {
        const val = raw[f.key];
        if (val === undefined || val === '') continue;
        if (f.type === 'checkbox') out[f.key] = !!val;
        else if (f.type === 'text') out[f.key] = String(val);
        else {
          const n = parseFloat(String(val));
          if (!Number.isNaN(n)) out[f.key] = n;
        }
      }
      if (Object.keys(out).length) entries.push({ exercise_id: ex.id, values: out });
    }
    if (entries.length === 0) {
      setError('En az bir egzersize değer gir.');
      return;
    }

    // Yeni kişisel rekorları tespit et (önceki en yüksek değeri geçenler)
    const newPRs: string[] = [];
    for (const e of entries) {
      for (const [k, v] of Object.entries(e.values)) {
        if (typeof v !== 'number') continue;
        const pm = priorMax(priorLogs ?? [], e.exercise_id, k);
        if (pm !== null && v > pm) {
          const ex = activeDay.exercises.find((x) => x.id === e.exercise_id);
          const f = ex?.fields.find((ff) => ff.key === k);
          newPRs.push(`${ex?.name || 'Egzersiz'} — ${f?.label ?? k}: ${v}${f?.unit ? ' ' + f.unit : ''}`);
        }
      }
    }

    try {
      await addLog.mutateAsync({
        program_id: programId,
        day_id: activeDay.id,
        performed_at: date,
        data: { entries },
        notes: notes.trim() || null,
      });
      if (newPRs.length) {
        showAlert('Yeni rekor! 🏆', newPRs.join('\n'), [{ text: 'Harika!', onPress: () => router.back() }]);
      } else {
        router.back();
      }
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  if (!program) {
    return (
      <Screen center>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Antrenman Kaydet' }} />

      <Text style={[styles.intro, { color: c.textSecondary }]}>
        Bugün <Text style={{ fontWeight: '700', color: c.text }}>gerçekte yaptıklarını</Text> gir.
        Alanlar programındaki hedeflerle dolu gelir — farklı yaptıysan değiştir.
      </Text>

      <RestTimer />

      <TextField label="Tarih" placeholder="YYYY-AA-GG" value={date} onChangeText={setDate} autoCapitalize="none" />

      {days.length > 1 && (
        <>
          <Text style={[styles.label, { color: c.textSecondary }]}>Gün</Text>
          <View style={styles.row}>
            {days.map((d) => (
              <Chip key={d.id} label={d.name} selected={activeDay?.id === d.id} onPress={() => setDayId(d.id)} />
            ))}
          </View>
        </>
      )}

      {activeDay?.exercises.map((ex) => (
        <View key={ex.id} style={[styles.exCard, { backgroundColor: c.backgroundElement }]}>
          <Text style={[styles.exName, { color: c.text }]}>{ex.name || 'İsimsiz egzersiz'}</Text>
          {ex.note ? (
            <Text style={{ color: c.textSecondary, fontSize: 12, fontStyle: 'italic' }}>📝 {ex.note}</Text>
          ) : null}
          {ex.fields.length === 0 ? (
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Bu egzersizde alan yok.</Text>
          ) : (
            ex.fields.map((f) => {
              const hasTarget = f.value !== undefined && f.value !== '';
              if (f.type === 'checkbox') {
                return (
                  <View key={f.key} style={styles.row}>
                    <Chip
                      label={`${f.label}: ${values[ex.id]?.[f.key] ? 'Evet' : 'Hayır'}`}
                      selected={!!values[ex.id]?.[f.key]}
                      onPress={() => setValue(ex.id, f.key, !values[ex.id]?.[f.key])}
                    />
                    {hasTarget ? (
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                        hedef: {f.value ? 'Evet' : 'Hayır'}
                      </Text>
                    ) : null}
                  </View>
                );
              }
              const base = f.unit ? `${f.label} (${f.unit})` : f.label;
              return (
                <TextField
                  key={f.key}
                  label={hasTarget ? `${base}  ·  hedef ${f.value}` : base}
                  keyboardType={f.type === 'text' ? 'default' : 'numeric'}
                  value={String(values[ex.id]?.[f.key] ?? '')}
                  onChangeText={(t) => setValue(ex.id, f.key, t)}
                />
              );
            })
          )}
        </View>
      ))}

      <TextField
        label="Antrenman notu — nasıl geçti? (opsiyonel)"
        placeholder="ör. enerjim iyiydi, sol dizim ağrıdı, kolay geldi…"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      <View style={{ height: Spacing.two }} />
      <Button title="Kaydet" onPress={onSave} loading={addLog.isPending} />
      <View style={{ height: Spacing.six }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  exCard: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two, marginTop: Spacing.two },
  exName: { fontSize: 16, fontWeight: '700' },
});
