import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type LeaderboardEntry = {
  user_id: string;
  cnt: number; // bu haftaki aktif gün (birincil)
  d30: number; // son 30 gün aktif gün (eşitlik bozucu)
  dall: number; // tüm zamanlar aktif gün
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  province: string | null;
};

/** Son p_days içinde en çok antrenman yapan sporcular. scope: 'all' | 'city'. */
export function useLeaderboard(scope: 'all' | 'city' = 'all', days = 7) {
  return useQuery({
    queryKey: ['leaderboard', scope, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('leaderboard', {
        p_days: days,
        p_scope: scope,
        p_limit: 30,
      });
      if (error) throw error;
      return (data as unknown as LeaderboardEntry[]) ?? [];
    },
  });
}

export type MyRank = { rank: number | null; cnt: number; total: number };

/** Kullanıcının kendi liderlik sırası (listede/limit dışında olsa bile). */
export function useMyLeaderboardRank(scope: 'all' | 'city' = 'all', days = 7) {
  return useQuery({
    queryKey: ['my-rank', scope, days],
    queryFn: async (): Promise<MyRank> => {
      const { data, error } = await supabase.rpc('my_leaderboard_rank', { p_days: days, p_scope: scope });
      if (error) throw error;
      return data as unknown as MyRank;
    },
  });
}
