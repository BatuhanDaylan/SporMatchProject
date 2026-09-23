import type { ProgramTemplate, WorkoutLogData } from '@/types/program';

const NUMERIC = new Set(['number', 'duration', 'distance']);

export type PR = {
  exId: string;
  exName: string;
  fieldKey: string;
  label: string;
  unit?: string;
  value: number;
};

type LogLike = { data: WorkoutLogData };

/** Kayıtlardan her (egzersiz, sayısal alan) için en yüksek değeri (kişisel rekor) çıkarır. */
export function computePRs(template: ProgramTemplate, logs: LogLike[]): PR[] {
  const maxes = new Map<string, number>();
  for (const log of logs) {
    for (const entry of log.data.entries ?? []) {
      for (const [k, v] of Object.entries(entry.values)) {
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        if (Number.isNaN(num)) continue;
        const key = `${entry.exercise_id}.${k}`;
        if (!maxes.has(key) || num > maxes.get(key)!) maxes.set(key, num);
      }
    }
  }
  const out: PR[] = [];
  for (const d of template.days)
    for (const e of d.exercises)
      for (const f of e.fields) {
        if (!NUMERIC.has(f.type)) continue;
        const val = maxes.get(`${e.id}.${f.key}`);
        if (val !== undefined)
          out.push({ exId: e.id, exName: e.name || 'Egzersiz', fieldKey: f.key, label: f.label, unit: f.unit, value: val });
      }
  return out;
}

/** Bir egzersiz+alan için önceki kayıtlardaki en yüksek değer (yeni rekor tespiti için). */
export function priorMax(logs: LogLike[], exId: string, fieldKey: string): number | null {
  let max: number | null = null;
  for (const log of logs)
    for (const entry of log.data.entries ?? []) {
      if (entry.exercise_id !== exId) continue;
      const v = entry.values[fieldKey];
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (Number.isNaN(num)) continue;
      if (max === null || num > max) max = num;
    }
  return max;
}
