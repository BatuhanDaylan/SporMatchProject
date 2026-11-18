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
  sport_id?: string | null;
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
 * @param sportId yalnız bu sporun programları (null: hepsi)
 */
export function useDiscoverPrograms(sort: DiscoverSort = 'recent', periodDays = 7, sportId: string | null = null) {
  return useQuery({
    queryKey: ['discover', 'programs', sort, periodDays, sportId ?? 'all'],
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('discover_programs', {
        p_sort: sort,
        p_period_days: periodDays,
        p_limit: 50,
        p_sport_id: sportId,
      });
      if (error) throw error;
      return ((data as unknown as DiscoverProgram[]) ?? []).map((p) => ({
        ...p,
        template: (p.template as ProgramTemplate) ?? { days: [] },
      }));
    },
  });
}

/**
 * Bir kullanıcının programları (profil sayfası için). Başkasının profilinde yalnız herkese açıklar;
 * kendi profilinde gizliler de görünür. Görünürlük ayrıca RLS ile korunur (gizli hesap vb.).
 */
export function useUserPrograms(userId: string | undefined, isMe: boolean) {
  return useQuery({
    queryKey: ['user-programs', userId, isMe],
    enabled: !!userId,
    staleTime: 20_000,
    queryFn: async () => {
      let q = supabase
        .from('programs')
        .select(
          'id,title,description,owner_id,visibility,template,updated_at,sport_id,' +
            'owner:profiles!programs_owner_id_fkey(username,display_name,avatar_url),' +
            'sport:sports!programs_sport_id_fkey(name,icon)',
        )
        .eq('owner_id', userId!)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (!isMe) q = q.eq('visibility', 'public');
      const { data, error } = await q;
      if (error) throw error;
      return ((data as unknown as DiscoverProgram[]) ?? []).map((p) => ({
        ...p,
        template: (p.template as ProgramTemplate) ?? { days: [] },
      }));
    },
  });
}
