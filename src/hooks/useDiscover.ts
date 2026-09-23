import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ProgramTemplate } from '@/types/program';

export type DiscoverSort = 'recent' | 'liked' | 'saved' | 'hit';

export type DiscoverProgram = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  visibility: 'public' | 'private';
  template: ProgramTemplate;
  updated_at: string;
  owner: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  sport: { name: string; icon: string | null } | null;
  like_count?: number;
  save_count?: number;
  comment_count?: number;
  hit_score?: number;
};

/**
 * Herkese açık programlar akışı — sıralama/filtre RPC'siyle.
 * @param sort 'recent' | 'liked' | 'saved' | 'hit'
 * @param periodDays 'hit' için pencere (gün)
 */
export function useDiscoverPrograms(sort: DiscoverSort = 'recent', periodDays = 7) {
  return useQuery({
    queryKey: ['discover', 'programs', sort, periodDays],
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('discover_programs', {
        p_sort: sort,
        p_period_days: periodDays,
        p_limit: 50,
      });
      if (error) throw error;
      return ((data as unknown as DiscoverProgram[]) ?? []).map((p) => ({
        ...p,
        template: (p.template as ProgramTemplate) ?? { days: [] },
      }));
    },
  });
}

/** Takip akışı — takip ettiğin kullanıcıların herkese açık programları. */
export function useFollowingFeed() {
  return useQuery({
    queryKey: ['discover', 'following'],
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('following_feed', { p_limit: 50 });
      if (error) throw error;
      return ((data as unknown as DiscoverProgram[]) ?? []).map((p) => ({
        ...p,
        template: (p.template as ProgramTemplate) ?? { days: [] },
      }));
    },
  });
}
