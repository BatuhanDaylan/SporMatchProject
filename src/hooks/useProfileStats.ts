import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type ProfileStats = {
  programs: number;
  workouts: number;
  matches: number;
  comments: number;
  streak: number;
  member_since: string | null;
};

async function fetchStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('get_profile_stats', { p_user_id: userId });
  if (error) throw error;
  return data as ProfileStats;
}

/** Bir kullanıcının profil istatistiklerini (sayımlar + streak) getirir. */
export function useProfileStats(userId?: string) {
  const { user } = useAuth();
  const id = userId ?? user?.id;
  return useQuery({
    queryKey: ['profile-stats', id],
    queryFn: () => fetchStats(id!),
    enabled: !!id,
  });
}
