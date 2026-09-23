import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type FeedPost = {
  id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  author_id: string;
  hidden_at: string | null;
  like_count: number;
  comment_count: number;
  liked: boolean;
  is_mine: boolean;
  author: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

/** Aktivite akışı (son gönderiler) veya belirli kullanıcının gönderileri. */
export function useFeed(authorId?: string) {
  return useQuery({
    queryKey: ['feed', authorId ?? 'all'],
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('feed_posts', {
        p_limit: 50,
        p_author: authorId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });
}

/** Tek gönderi (yorum ekranı için). */
export function usePostDetail(postId?: string) {
  return useQuery({
    queryKey: ['post-detail', postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('post_detail', { p_post_id: postId! });
      if (error) throw error;
      return data as unknown as FeedPost | null;
    },
  });
}

export function useFeedActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['post-detail'] });
  };

  const createPost = useMutation({
    mutationFn: async ({ body, imageUrl }: { body: string; imageUrl: string | null }) => {
      assertClean(body);
      const trimmed = body.trim();
      if (!trimmed && !imageUrl) throw new Error('Bir şeyler yaz ya da foto ekle.');
      const { error } = await supabase
        .from('posts')
        .insert({ author_id: user!.id, body: trimmed || null, image_url: imageUrl });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  return { createPost, deletePost, toggleLike };
}
