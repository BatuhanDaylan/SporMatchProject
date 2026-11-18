import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** Telefona anlık bildirimi susturulabilen kategoriler (sunucudaki notif_category ile aynı). */
export const NOTIF_CATEGORIES = [
  { key: 'chat', label: 'Mesajlar', desc: 'Yeni mesaj ve sohbet istekleri' },
  { key: 'match', label: 'Eşleşmeler', desc: 'Canlı eşleşme bulunduğunda' },
  { key: 'social', label: 'Takip', desc: 'Yeni takipçi ve takip istekleri' },
  { key: 'comment', label: 'Yorumlar', desc: 'Programına, gönderine ya da yorumuna yanıt' },
  { key: 'like', label: 'Beğeniler', desc: 'Gönderin beğenildiğinde' },
  { key: 'event', label: 'Etkinlikler', desc: 'Katıldığın etkinliklerdeki gelişmeler' },
] as const;

export type NotifCategory = (typeof NOTIF_CATEGORIES)[number]['key'];

/** Susturulan kategoriler (satır yoksa hiçbiri susturulmamış). */
export function useNotificationPrefs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['notification-prefs', user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_prefs').select('muted').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return (data?.muted ?? []) as NotifCategory[];
    },
  });

  const setMuted = useMutation({
    mutationFn: async (muted: NotifCategory[]) => {
      const { error } = await supabase
        .from('notification_prefs')
        .upsert({ user_id: user!.id, muted, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    // Anahtarı hemen çevir; hata olursa geri al
    onMutate: async (muted) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<NotifCategory[]>(queryKey);
      qc.setQueryData(queryKey, muted);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(queryKey, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return { ...query, setMuted };
}
