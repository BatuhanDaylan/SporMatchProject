import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useProgram, useProgramMutations } from '@/hooks/usePrograms';
import { useSports } from '@/hooks/useSports';
import { getErrorMessage } from '@/lib/errorMessage';
import { Spacing } from '@/constants/theme';
import {
  PRESET_FIELDS,
  uid,
  type Exercise,
  type ExerciseField,
  type FieldType,
  type ProgramDay,
} from '@/types/program';

const TYPE_LABELS: Record<FieldType, string> = {
  number: 'Sayı',
  text: 'Metin',
  duration: 'Süre',
  distance: 'Mesafe',
  checkbox: 'Onay',
};

/** Diziyi verilen yönde kaydır (sınırda değişmez). */
function move<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const j = idx + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = arr.slice();
  [copy[idx], copy[j]] = [copy[j], copy[idx]];
  return copy;
}

function cloneExercise(e: Exercise): Exercise {
  return { ...e, id: uid('e_'), fields: e.fields.map((f) => ({ ...f })) };
}

export default function ProgramEditScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const { data: existing } = useProgram(id);
  const { data: sports } = useSports();
  const { create, update } = useProgramMutations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sportId, setSportId] = useState<string | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setIsPublic(existing.visibility === 'public');
      setSportId(existing.sport_id ?? null);
      setDays(existing.template.days ?? []);
    }
  }, [existing]);

  // --- Gün işlemleri ---
  const addDay = () =>
    setDays((d) => [...d, { id: uid('d_'), name: `Gün ${d.length + 1}`, exercises: [] }]);
  const removeDay = (dayId: string) => setDays((d) => d.filter((x) => x.id !== dayId));
  const renameDay = (dayId: string, name: string) =>
    setDays((d) => d.map((x) => (x.id === dayId ? { ...x, name } : x)));
  const moveDay = (idx: number, dir: -1 | 1) => setDays((d) => move(d, idx, dir));
  const duplicateDay = (idx: number) =>
    setDays((d) => {
      const src = d[idx];
      const clone: ProgramDay = {
        id: uid('d_'),
        name: `${src.name} (kopya)`,
        exercises: src.exercises.map(cloneExercise),
      };
      const copy = d.slice();
      copy.splice(idx + 1, 0, clone);
      return copy;
    });

  // --- Egzersiz işlemleri (gün içinde) ---
  const mapDay = (dayId: string, fn: (ex: Exercise[]) => Exercise[]) =>
    setDays((d) => d.map((x) => (x.id === dayId ? { ...x, exercises: fn(x.exercises) } : x)));

  const addExercise = (dayId: string) =>
    mapDay(dayId, (ex) => [...ex, { id: uid('e_'), name: '', fields: [] }]);
  const removeExercise = (dayId: string, exId: string) =>
    mapDay(dayId, (ex) => ex.filter((e) => e.id !== exId));
  const renameExercise = (dayId: string, exId: string, name: string) =>
    mapDay(dayId, (ex) => ex.map((e) => (e.id === exId ? { ...e, name } : e)));
  const setExerciseNote = (dayId: string, exId: string, note: string) =>
    mapDay(dayId, (ex) => ex.map((e) => (e.id === exId ? { ...e, note } : e)));
  const moveExercise = (dayId: string, idx: number, dir: -1 | 1) =>
    mapDay(dayId, (ex) => move(ex, idx, dir));
  const duplicateExercise = (dayId: string, idx: number) =>
    mapDay(dayId, (ex) => {
      const copy = ex.slice();
      copy.splice(idx + 1, 0, cloneExercise(ex[idx]));
      return copy;
    });

  // --- Alan işlemleri ---
  const addField = (dayId: string, exId: string, field: ExerciseField) =>
    mapDay(dayId, (ex) =>
      ex.map((e) =>
        e.id === exId && !e.fields.some((f) => f.key === field.key)
          ? { ...e, fields: [...e.fields, field] }
          : e,
      ),
    );
  const removeField = (dayId: string, exId: string, key: string) =>
    mapDay(dayId, (ex) =>
      ex.map((e) => (e.id === exId ? { ...e, fields: e.fields.filter((f) => f.key !== key) } : e)),
    );
  const setFieldValue = (dayId: string, exId: string, key: string, value: string | boolean) =>
    mapDay(dayId, (ex) =>
      ex.map((e) =>
        e.id === exId ? { ...e, fields: e.fields.map((f) => (f.key === key ? { ...f, value } : f)) } : e,
      ),
    );

  async function onSave() {
    setError(null);
    if (!title.trim()) {
      setError('Program başlığı gerekli.');
      return;
    }
    const input = {
      title: title.trim(),
      description: description.trim() || null,
      sport_id: sportId,
      visibility: (isPublic ? 'public' : 'private') as 'public' | 'private',
      template: { days },
    };
    try {
      if (editing) await update.mutateAsync({ id: id!, input });
      else await create.mutateAsync(input);
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: editing ? 'Programı Düzenle' : 'Yeni Program' }} />
      <TextField label="Program başlığı" placeholder="ör. Push Pull Legs" value={title} onChangeText={setTitle} />
      <TextField
        label="Açıklama (opsiyonel)"
        placeholder="Kısa açıklama"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Spor */}
      <Text style={[styles.label, { color: c.textSecondary }]}>Spor (opsiyonel)</Text>
      <View style={styles.row}>
        {sports?.map((s) => (
          <Chip
            key={s.id}
            label={`${s.icon ?? ''} ${s.name}`.trim()}
            selected={sportId === s.id}
            onPress={() => setSportId((cur) => (cur === s.id ? null : s.id))}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: c.textSecondary }]}>Görünürlük</Text>
      <View style={styles.row}>
        <Chip label="Herkese açık" selected={isPublic} onPress={() => setIsPublic(true)} />
        <Chip label="Gizli" selected={!isPublic} onPress={() => setIsPublic(false)} />
      </View>

      <View style={styles.divider} />

      {days.map((day, dayIdx) => (
        <View key={day.id} style={[styles.dayCard, { borderColor: c.border }]}>
          <View style={styles.dayHeader}>
            <TextField value={day.name} onChangeText={(t) => renameDay(day.id, t)} style={{ flex: 1 }} />
            <IconBtn name="chevron-up" color={c.textSecondary} disabled={dayIdx === 0} onPress={() => moveDay(dayIdx, -1)} />
            <IconBtn name="chevron-down" color={c.textSecondary} disabled={dayIdx === days.length - 1} onPress={() => moveDay(dayIdx, 1)} />
            <IconBtn name="copy-outline" color={c.textSecondary} onPress={() => duplicateDay(dayIdx)} />
            <IconBtn name="trash-outline" color={c.danger} onPress={() => removeDay(day.id)} />
          </View>

          {day.exercises.map((ex, exIdx) => (
            <ExerciseEditor
              key={ex.id}
              exercise={ex}
              canUp={exIdx > 0}
              canDown={exIdx < day.exercises.length - 1}
              onRename={(t) => renameExercise(day.id, ex.id, t)}
              onNote={(t) => setExerciseNote(day.id, ex.id, t)}
              onRemove={() => removeExercise(day.id, ex.id)}
              onMoveUp={() => moveExercise(day.id, exIdx, -1)}
              onMoveDown={() => moveExercise(day.id, exIdx, 1)}
              onDuplicate={() => duplicateExercise(day.id, exIdx)}
              onAddField={(f) => addField(day.id, ex.id, f)}
              onRemoveField={(k) => removeField(day.id, ex.id, k)}
              onSetFieldValue={(k, v) => setFieldValue(day.id, ex.id, k, v)}
            />
          ))}

          <Pressable onPress={() => addExercise(day.id)} style={styles.addRow}>
            <Ionicons name="add-circle-outline" size={20} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '600' }}>Egzersiz ekle</Text>
          </Pressable>
        </View>
      ))}

      <Button title="+ Gün ekle" variant="secondary" onPress={addDay} />

      {error ? <Text style={{ color: c.danger, marginTop: Spacing.two }}>{error}</Text> : null}
      <View style={{ height: Spacing.two }} />
      <Button
        title={editing ? 'Kaydet' : 'Oluştur'}
        onPress={onSave}
        loading={create.isPending || update.isPending}
      />
      <View style={{ height: Spacing.six }} />
    </Screen>
  );
}

function IconBtn({
  name,
  color,
  disabled,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4} style={[styles.iconBtn, { opacity: disabled ? 0.3 : 1 }]}>
      <Ionicons name={name} size={19} color={color} />
    </Pressable>
  );
}

function ExerciseEditor({
  exercise,
  canUp,
  canDown,
  onRename,
  onNote,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddField,
  onRemoveField,
  onSetFieldValue,
}: {
  exercise: Exercise;
  canUp: boolean;
  canDown: boolean;
  onRename: (t: string) => void;
  onNote: (t: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onAddField: (f: ExerciseField) => void;
  onRemoveField: (key: string) => void;
  onSetFieldValue: (key: string, value: string | boolean) => void;
}) {
  const c = useColors();
  const { name, fields, note } = exercise;
  const [showCustom, setShowCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customType, setCustomType] = useState<FieldType>('number');
  const [customUnit, setCustomUnit] = useState('');

  const available = PRESET_FIELDS.filter((p) => !fields.some((f) => f.key === p.key));

  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    const key = 'c_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    onAddField({ key: key || uid('c_'), label, type: customType, unit: customUnit.trim() || undefined });
    setCustomLabel('');
    setCustomUnit('');
    setCustomType('number');
    setShowCustom(false);
  }

  return (
    <View style={[styles.exCard, { backgroundColor: c.backgroundElement }]}>
      <View style={styles.dayHeader}>
        <TextField placeholder="Egzersiz adı (ör. Bench Press)" value={name} onChangeText={onRename} style={{ flex: 1 }} />
        <IconBtn name="chevron-up" color={c.textSecondary} disabled={!canUp} onPress={onMoveUp} />
        <IconBtn name="chevron-down" color={c.textSecondary} disabled={!canDown} onPress={onMoveDown} />
        <IconBtn name="copy-outline" color={c.textSecondary} onPress={onDuplicate} />
        <IconBtn name="close" color={c.textSecondary} onPress={onRemove} />
      </View>

      {/* Not */}
      <TextField
        placeholder="Not (ör. tempo 3-1-1, form ipucu)"
        value={note ?? ''}
        onChangeText={onNote}
        style={styles.noteInput}
      />

      {/* Seçili alanlar — her birine hedef değer girilebilir */}
      {fields.length > 0 && (
        <View style={{ gap: 6 }}>
          {fields.map((f) => (
            <View key={f.key} style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: c.text }]} numberOfLines={1}>
                {f.label}
                {f.unit ? ` (${f.unit})` : ''}
              </Text>
              {f.type === 'checkbox' ? (
                <Chip
                  label={f.value ? 'Evet' : 'Hayır'}
                  selected={!!f.value}
                  onPress={() => onSetFieldValue(f.key, !f.value)}
                />
              ) : (
                <View style={{ width: 96 }}>
                  <TextField
                    placeholder="hedef"
                    keyboardType={f.type === 'text' ? 'default' : 'numeric'}
                    value={f.value != null ? String(f.value) : ''}
                    onChangeText={(t) => onSetFieldValue(f.key, t)}
                    style={styles.valueInput}
                  />
                </View>
              )}
              <Pressable onPress={() => onRemoveField(f.key)} hitSlop={6} style={styles.iconBtn}>
                <Ionicons name="close" size={16} color={c.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Hazır alanlar */}
      {available.length > 0 && (
        <>
          <Text style={[styles.hint, { color: c.textSecondary }]}>Hazır alan ekle:</Text>
          <View style={styles.row}>
            {available.map((p) => (
              <Chip key={p.key} label={p.label} selected={false} onPress={() => onAddField(p)} />
            ))}
          </View>
        </>
      )}

      {/* Özel alan */}
      {showCustom ? (
        <View style={[styles.customBox, { borderColor: c.border }]}>
          <TextField label="Alan adı" placeholder="ör. RPE" value={customLabel} onChangeText={setCustomLabel} />
          <Text style={[styles.hint, { color: c.textSecondary }]}>Tür:</Text>
          <View style={styles.row}>
            {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
              <Chip key={t} label={TYPE_LABELS[t]} selected={customType === t} onPress={() => setCustomType(t)} />
            ))}
          </View>
          <TextField label="Birim (opsiyonel)" placeholder="kg, km, dk…" value={customUnit} onChangeText={setCustomUnit} />
          <View style={styles.row}>
            <Button title="Ekle" onPress={addCustom} />
            <Button title="Vazgeç" variant="secondary" onPress={() => setShowCustom(false)} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setShowCustom(true)} style={styles.addRow}>
          <Ionicons name="create-outline" size={18} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: '600' }}>Özel alan</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', marginTop: Spacing.one },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  divider: { height: 1, marginVertical: Spacing.two },
  dayCard: { borderWidth: 1, borderRadius: 14, padding: Spacing.two, gap: Spacing.two },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 5 },
  exCard: { borderRadius: 12, padding: Spacing.two, gap: Spacing.two },
  noteInput: { minHeight: 40, fontSize: 14 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  fieldLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  valueInput: { height: 40, fontSize: 14, textAlign: 'center' },
  hint: { fontSize: 12 },
  customBox: { borderWidth: 1, borderRadius: 10, padding: Spacing.two, gap: Spacing.two },
});
