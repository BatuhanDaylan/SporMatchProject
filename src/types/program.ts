/**
 * Program şablonu domain tipleri.
 *
 * "Yapılandırılmış ama esnek": her egzersizin alanları (fields) kullanıcı tarafından
 * tanımlanabilir. Hazır alanlar (set/tekrar/ağırlık...) sunulur ama kullanıcı kendi
 * alanını ekleyebilir. Şablon programs.template (JSONB) içinde saklanır.
 */

export type FieldType = 'number' | 'text' | 'duration' | 'distance' | 'checkbox';

export type ExerciseField = {
  key: string; // benzersiz alan anahtarı (ör. 'weight')
  label: string; // görünen ad (ör. 'Ağırlık')
  type: FieldType;
  unit?: string; // ör. 'kg', 'km', 'dk'
  value?: string | number | boolean; // şablondaki planlanan hedef değer (ör. Set=3)
};

export type Exercise = {
  id: string;
  name: string;
  fields: ExerciseField[];
  note?: string; // opsiyonel not (ör. tempo 3-1-1, form ipucu)
};

export type ProgramDay = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type ProgramTemplate = {
  days: ProgramDay[];
};

/** Bir antrenman kaydındaki tek egzersiz girdisi. */
export type LogEntry = {
  exercise_id: string;
  values: Record<string, number | string | boolean>;
};

export type WorkoutLogData = {
  entries: LogEntry[];
};

/** Hazır alan şablonları — editörde "hızlı ekle" için. */
export const PRESET_FIELDS: ExerciseField[] = [
  { key: 'sets', label: 'Set', type: 'number' },
  { key: 'reps', label: 'Tekrar', type: 'number' },
  { key: 'weight', label: 'Ağırlık', type: 'number', unit: 'kg' },
  { key: 'duration', label: 'Süre', type: 'duration', unit: 'dk' },
  { key: 'distance', label: 'Mesafe', type: 'distance', unit: 'km' },
  { key: 'rest', label: 'Dinlenme', type: 'duration', unit: 'sn' },
  { key: 'done', label: 'Yapıldı', type: 'checkbox' },
];

/** Basit benzersiz kimlik (crypto gerektirmez, istemci-içi yeterli). */
export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
