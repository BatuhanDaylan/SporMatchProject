import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { DiscoverProgram } from '@/hooks/useDiscover';
import type { ProgramTemplate } from '@/types/program';

export type ProgramSocial = { likeCount: number; liked: boolean; saved: boolean };

/** Bir programın beğeni sayısı + kullanıcının beğeni/kaydetme durumu ve aç/kapa aksiyonları. */
export function useProgramSocial(programId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['program-social', programId, user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!programId && !!user?.id,
    queryFn: async (): Promise<ProgramSocial> => {
      const [likeCount, liked, saved] = await Promise.all([
        supabase.from('program_likes').select('*', { count: 'exact', head: true }).eq('program_id', programId!),
        supabase.from('program_likes').select('program_id').eq('program_id', programId!).eq('user_id', user!.id).maybeSingle(),
        supabase.from('program_saves').select('program_id').eq('program_id', programId!).eq('user_id', user!.id).maybeSingle(),
      ]);
      if (likeCount.error) throw likeCount.error;
      return { likeCount: likeCount.count ?? 0, liked: !!liked.data, saved: !!saved.data };
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      const table = supabase.from('program_likes');
      const { error } = currentlyLiked
        ? await table.delete().eq('program_id', programId!).eq('user_id', user!.id)
        : await table.insert({ program_id: programId!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  const toggleSave = useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      const table = supabase.from('program_saves');
      const { error } = currentlySaved
        ? await table.delete().eq('program_id', programId!).eq('user_id', user!.id)
        : await table.insert({ program_id: programId!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['saved-programs'] });
    },
  });

  return { ...query, toggleLike, toggleSave };
}

/** Kullanıcının kaydettiği (bookmark) programlar. */
export function useSavedPrograms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-programs', user?.id],
    enabled: !!user?.id,
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_saves')
        .select(
          'created_at, program:programs!inner(id,title,description,owner_id,visibility,template,updated_at,' +
            'owner:profiles!programs_owner_id_fkey(username,display_name,avatar_url),' +
            'sport:sports!programs_sport_id_fkey(name,icon))',
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.program)
        .filter(Boolean)
        .map((p: any) => ({ ...p, template: (p.template as ProgramTemplate) ?? { days: [] } })) as DiscoverProgram[];
    },
  });
}
