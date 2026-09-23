import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type AdminReport = {
  id: string;
  reason: string;
  context: Record<string, unknown>;
  created_at: string;
  reported_id: string;
  reported: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  reporter: { username: string | null; display_name: string | null } | null;
  comment: { id: string; body: string; hidden_at: string | null; program_id: string } | null;
  post: { id: string; body: string | null; image_url: string | null; hidden_at: string | null } | null;
  post_comment: { id: string; body: string; hidden_at: string | null; post_id: string } | null;
};

/** Geçerli kullanıcı yönetici mi? Menü girişini göstermek için. */
export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('am_i_admin');
      if (error) throw error;
      return !!data;
    },
  });
}

/** Yönetici: son şikayetler + içerik + gizli durumu. */
export function useAdminReports() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-reports', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_reports', { p_limit: 100 });
      if (error) throw error;
      return (data ?? []) as unknown as AdminReport[];
    },
  });

  const setCommentHidden = useMutation({
    mutationFn: async ({ commentId, hidden }: { commentId: string; hidden: boolean }) => {
      const { error } = await supabase.rpc('admin_set_comment_hidden', {
        p_comment_id: commentId,
        p_hidden: hidden,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const clearAvatar = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_clear_avatar', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['public-profile'] });
    },
  });

  const setPostHidden = useMutation({
    mutationFn: async ({ postId, hidden }: { postId: string; hidden: boolean }) => {
      const { error } = await supabase.rpc('admin_set_post_hidden', {
        p_post_id: postId,
        p_hidden: hidden,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const setPostCommentHidden = useMutation({
    mutationFn: async ({ commentId, hidden }: { commentId: string; hidden: boolean }) => {
      const { error } = await supabase.rpc('admin_set_post_comment_hidden', {
        p_comment_id: commentId,
        p_hidden: hidden,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['post-comments'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return { ...query, setCommentHidden, clearAvatar, setPostHidden, setPostCommentHidden };
}
