import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type HeatDay = { d: string; c: number };

/** Bir kullanıcının son p_days günlük antrenman yoğunluğu (ısı-haritası için). */
export function useHeatmap(userId?: string, days = 371) {
  return useQuery({
    queryKey: ['heatmap', userId, days],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('workout_heatmap', { p_user_id: userId!, p_days: days });
      if (error) throw error;
      return (data ?? []) as unknown as HeatDay[];
    },
  });
}
