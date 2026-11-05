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
  /** Son mesajı ben mi attım? (✓ / ✓✓ göstermek için) */
  last_from_me?: boolean | null;
  /** Son mesaj karşı tarafça okundu mu? */
  last_read?: boolean | null;
  /** Son mesaj karşı tarafa iletildi mi (bildirim gitti ya da okundu)? */
  last_delivered?: boolean | null;
  unread: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  /** Karşı tarafa bildirim gönderildiği an (✓✓ gri). */
  delivered_at?: string | null;
  created_at: string;
};

/** Mesaj durumu: ✓ gönderildi · ✓✓ iletildi (gri) · ✓✓ okundu (mavi). */
export function tickState(read: boolean, delivered: boolean) {
  if (read) return { icon: 'checkmark-done', read: true, label: 'Okundu' } as const;
  if (delivered) return { icon: 'checkmark-done', read: false, label: 'İletildi' } as const;
  return { icon: 'checkmark', read: false, label: 'Gönderildi' } as const;
}

export async function fetchConversations() {
  const { data, error } = await supabase.rpc('list_conversations');
  if (error) throw error;
  return (data as unknown as Conversation[]) ?? [];
}

/** Sohbet listesi, realtime kanalı OLMADAN (tek sohbet ekranı karşı tarafı bulmak için). */
export function useConversationList() {
  return useQuery({ queryKey: ['conversations'], queryFn: fetchConversations, staleTime: 30_000 });
}

/** Sohbeti yalnız kendi tarafımda sil (karşı taraf etkilenmez). */
export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('delete_conversation', { p_conversation_id: conversationId });
      if (error) throw error;
    },
    onSuccess: (_d, conversationId) => {
      qc.removeQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Kullanıcının sohbet listesi (partner + son mesaj + okunmamış). */
export function useConversations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
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
        (payload) => {
          qc.invalidateQueries({ queryKey });
          // Sohbet açıkken karşı taraftan gelen yeni mesaj hemen okundu işaretlenir (✓✓ onun tarafında görünsün)
          const row = payload.new as Partial<Message> | undefined;
          if (payload.eventType === 'INSERT' && row?.sender_id && row.sender_id !== user?.id) {
            supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId }).then(() => {
              qc.invalidateQueries({ queryKey: ['conversations'] });
            });
          }
        },
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
