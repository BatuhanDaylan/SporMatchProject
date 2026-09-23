import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

/** Uygulama-içi bildirim geçmişi + okunmamış sayısı + realtime + hepsini okundu yap. */
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const channelId = useId(); // her kullanım için benzersiz kanal adı (çift abonelik hatasını önler)

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id,type,title,body,data,read_at,created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as unknown as AppNotification[]) ?? [];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`notifications-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ['notifications', user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc, channelId]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const unread = (query.data ?? []).filter((n) => !n.read_at).length;

  return { ...query, unread, markAllRead };
}
