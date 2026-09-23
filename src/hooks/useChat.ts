import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type Conversation = {
  conversation_id: string;
  match_id: string;
  partner_id: string;
  partner_username: string | null;
  partner_name: string | null;
  partner_avatar: string | null;
  last_message: string | null;
  last_at: string | null;
  unread: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** Kullanıcının sohbet listesi (partner + son mesaj + okunmamış). */
export function useConversations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_conversations');
      if (error) throw error;
      return (data as unknown as Conversation[]) ?? [];
    },
  });

  // Herhangi bir mesaj değişiminde listeyi tazele (RLS zaten sınırlar)
  useEffect(() => {
    const ch = supabase
      .channel('conversations-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () =>
        qc.invalidateQueries({ queryKey: ['conversations'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return query;
}

/** Bir sohbetin mesajları + realtime + gönderme + okundu işaretleme. */
export function useMessages(conversationId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['messages', conversationId];

  const query = useQuery({
    queryKey,
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as Message[]) ?? [];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    // Açılışta karşı tarafın mesajlarını okundu yap
    supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId }).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });

    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      assertClean(body);
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId!, sender_id: user!.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { ...query, send, currentUserId: user?.id };
}
