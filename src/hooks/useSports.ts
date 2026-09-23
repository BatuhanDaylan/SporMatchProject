import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/hooks/useProfile';

export type Sport = { id: string; name: string; icon: string | null };

async function fetchSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('id, name, icon').order('name');
  if (error) throw error;
  return data ?? [];
}

/** Spor kataloğunu getirir (nadiren değişir → uzun staleTime). */
export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: fetchSports,
    staleTime: 60 * 60 * 1000,
  });
}

/** Kullanıcının profilindeki sporları, spor kataloğuyla eşleştirip döner. */
export function useMySports(profile: Profile | null | undefined, sports: Sport[] | undefined): Sport[] {
  return useMemo(() => {
    if (!profile || !sports) return [];
    const byId = new Map(sports.map((s) => [s.id, s]));
    return profile.user_sports.map((us) => byId.get(us.sport_id)).filter(Boolean) as Sport[];
  }, [profile, sports]);
}
