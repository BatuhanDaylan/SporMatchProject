import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';

/** Belirli bir kullanıcıyı engelledim mi? */
export function useIsBlocked(userId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-blocked', user?.id, userId],
    enabled: !!user?.id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user!.id)
        .eq('blocked_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

/** Engellediğim kullanıcılar (profil bilgisiyle). */
export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['blocked-users', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at, blocked:profiles!user_blocks_blocked_id_fkey(id,username,display_name,avatar_url)')
        .eq('blocker_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.blocked).filter(Boolean) as {
        id: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }[];
    },
  });
}

export function useModeration() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['is-blocked'] });
    qc.invalidateQueries({ queryKey: ['blocked-users'] });
    qc.invalidateQueries({ queryKey: ['discover'] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  };

  const block = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: user!.id, blocked_id: userId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unblock = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user!.id)
        .eq('blocked_id', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const report = useMutation({
    mutationFn: async ({
      userId,
      reason,
      context,
    }: {
      userId: string;
      reason: string;
      context?: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user!.id,
          reported_id: userId,
          reason,
          context: (context ?? {}) as unknown as Json,
        });
      if (error) throw error;
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
    },
  });

  return { block, unblock, report, deleteAccount };
}
