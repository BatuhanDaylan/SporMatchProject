import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type ChatRequest = {
  match_id: string;
  created_at: string;
  from_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type SendRequestResult = {
  status: 'sent' | 'pending' | 'existing';
  match_id?: string;
  conversation_id?: string;
};

/** Bana gelen bekleyen sohbet istekleri + kabul/red. */
export function useChatRequests() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_chat_requests');
      if (error) throw error;
      return (data as unknown as ChatRequest[]) ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['chat-requests'] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  };

  const accept = useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase.rpc('confirm_match', { p_match_id: matchId });
      if (error) throw error;
      return data as unknown as { conversation_id: string | null };
    },
    onSuccess: invalidate,
  });

  const decline = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc('decline_match', { p_match_id: matchId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, accept, decline };
}

/** Bir kullanıcıya sohbet isteği gönder (akıllı: mevcut sohbet varsa onu döndürür). */
export function useSendChatRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (toUserId: string): Promise<SendRequestResult> => {
      const { data, error } = await supabase.rpc('send_chat_request', { p_to: toUserId });
      if (error) throw error;
      return data as unknown as SendRequestResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['chat-requests'] });
    },
  });
}
