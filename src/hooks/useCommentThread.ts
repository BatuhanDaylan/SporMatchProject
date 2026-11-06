import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type CommentKind = 'program' | 'post';

export type ThreadComment = {
  id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  hidden_at: string | null;
  author: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  likes: { user_id: string }[];
};

/** Program ve gönderi yorumları aynı yapıda; yalnız tablo adları farklı. */
const CONFIG = {
  program: { table: 'comments', fk: 'program_id', likes: 'comment_likes', author: 'comments_author_id_fkey' },
  post: { table: 'post_comments', fk: 'post_id', likes: 'post_comment_likes', author: 'post_comments_author_id_fkey' },
} as const;

/** Yorumlar + yanıtlar + beğeniler; ekleme, yanıtlama, düzenleme, silme, beğenme. Realtime tazelenir. */
export function useCommentThread(kind: CommentKind, targetId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const cfg = CONFIG[kind];
  const queryKey = ['comment-thread', kind, targetId];

  const query = useQuery({
    queryKey,
    enabled: !!targetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(cfg.table)
        .select(
          `id,author_id,parent_id,body,created_at,edited_at,hidden_at,` +
            `author:profiles!${cfg.author}(username,display_name,avatar_url),likes:${cfg.likes}(user_id)`,
        )
        .eq(cfg.fk as never, targetId! as never) // iki tablonun ortak tipi yok; sütun adı CONFIG'den
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ThreadComment[];
    },
  });

  // Başkalarının yorumu/silmesi/gizlemesi anında görünsün
  useEffect(() => {
    if (!targetId) return;
    const ch = supabase
      .channel(`thread:${kind}:${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: cfg.table, filter: `${cfg.fk}=eq.${targetId}` }, () =>
        qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, targetId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    if (kind === 'post') {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post-detail', targetId] });
    } else {
      qc.invalidateQueries({ queryKey: ['discover'] });
    }
  };

  const add = useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string | null }) => {
      assertClean(body);
      const { error } = await supabase
        .from(cfg.table)
        .insert({ [cfg.fk]: targetId!, author_id: user!.id, body: body.trim(), parent_id: parentId ?? null } as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      assertClean(body);
      const { error } = await supabase.from(cfg.table).update({ body: body.trim() } as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(cfg.table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleLike = useMutation({
    mutationFn: async ({ id, liked }: { id: string; liked: boolean }) => {
      const t = supabase.from(cfg.likes);
      const { error } = liked
        ? await t.delete().eq('comment_id', id).eq('user_id', user!.id)
        : await t.insert({ comment_id: id, user_id: user!.id } as never);
      if (error) throw error;
    },
    // Anında tepki: sunucu yanıtını beklemeden kalbi çevir
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ThreadComment[]>(queryKey);
      qc.setQueryData<ThreadComment[]>(queryKey, (list) =>
        list?.map((cm) =>
          cm.id !== id
            ? cm
            : { ...cm, likes: liked ? cm.likes.filter((l) => l.user_id !== user!.id) : [...cm.likes, { user_id: user!.id }] },
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return { ...query, add, edit, remove, toggleLike, currentUserId: user?.id };
}
