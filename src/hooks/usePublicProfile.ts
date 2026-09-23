import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/hooks/useProfile';

/** Herhangi bir kullanıcının profilini (sporlarıyla) getirir — salt okunur görüntüleme için. */
export function usePublicProfile(userId?: string) {
  return useQuery({
    queryKey: ['public-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_sports(sport_id, skill_level)')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}
