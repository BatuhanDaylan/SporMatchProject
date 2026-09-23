import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  hidden_at: string | null;
  created_at: string;
  author: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

/** Bir gönderinin yorumları + ekleme/silme. */
export function usePostComments(postId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['post-comments', postId];

  const query = useQuery({
    queryKey,
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(
          'id,post_id,author_id,body,hidden_at,created_at,' +
            'author:profiles!post_comments_author_id_fkey(username,display_name,avatar_url)',
        )
        .eq('post_id', postId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as PostComment[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['post-detail', postId] });
  };

  const add = useMutation({
    mutationFn: async (body: string) => {
      assertClean(body);
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId!, author_id: user!.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, add, remove, currentUserId: user?.id };
}
