import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type Comment = {
  id: string;
  program_id: string;
  author_id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  author: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

/** Bir programın yorumları + realtime güncelleme + ekleme/silme. */
export function useComments(programId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['comments', programId];

  const query = useQuery({
    queryKey,
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(
          'id,program_id,author_id,body,created_at,hidden_at,' +
            'author:profiles!comments_author_id_fkey(username,display_name,avatar_url)',
        )
        .eq('program_id', programId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as Comment[];
    },
  });

  // Realtime: bu programın yorumlarında değişiklik olunca yeniden çek
  useEffect(() => {
    if (!programId) return;
    const channel = supabase
      .channel(`comments:${programId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `program_id=eq.${programId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const add = useMutation({
    mutationFn: async (body: string) => {
      assertClean(body);
      const { error } = await supabase
        .from('comments')
        .insert({ program_id: programId!, author_id: user!.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { ...query, add, remove, currentUserId: user?.id };
}
