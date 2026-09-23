import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import type { WorkoutLogData } from '@/types/program';

export type WorkoutLog = {
  id: string;
  user_id: string;
  program_id: string;
  day_id: string | null;
  performed_at: string;
  data: WorkoutLogData;
  notes: string | null;
  created_at: string;
};

function normalize(row: any): WorkoutLog {
  return { ...row, data: (row.data as WorkoutLogData) ?? { entries: [] } };
}

/** Bir programa ait antrenman kayıtları (tarih artan — grafik için). */
export function useWorkoutLogs(programId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workout_logs', programId, user?.id],
    enabled: !!programId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('program_id', programId!)
        .order('performed_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });
}

export function useAddWorkoutLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      program_id: string;
      day_id: string | null;
      performed_at: string;
      data: WorkoutLogData;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user!.id,
          program_id: input.program_id,
          day_id: input.day_id,
          performed_at: input.performed_at,
          data: input.data as unknown as Json,
          notes: input.notes ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: (log) => {
      qc.invalidateQueries({ queryKey: ['workout_logs', log.program_id] });
    },
  });
}
