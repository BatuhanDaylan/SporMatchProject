import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessage';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/store/alert';
import { reportKey, useReportedStore } from '@/store/reported';
import type { Json } from '@/types/database';

/** Kullanıcının storage klasörlerindeki (avatars, post-images) tüm dosyaları siler. Hesap silmeyi engellemez. */
async function removeOwnFiles(userId: string) {
  for (const bucket of ['avatars', 'post-images']) {
    try {
      const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
      const paths = (data ?? []).map((f) => `${userId}/${f.name}`);
      if (paths.length) await supabase.storage.from(bucket).remove(paths);
    } catch {
      // dosya temizliği başarısız olsa da hesap silinsin
    }
  }
}

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
  // Engel her yeri etkiler (akış, etkinlikler, sohbetler, yorumlar, profiller): tüm veriyi tazele.
  // Böylece engel kaldırılınca gizlenen etkinlik/gönderi de hemen geri gelir.
  const invalidate = () => qc.invalidateQueries();

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

  /**
   * Şikayeti gönderir ve SONUCU bildirir: yalnızca gerçekten kaydedilince "Teşekkürler" der;
   * sunucu hatası (ör. "Bunu zaten şikayet ettin", saatlik limit) kullanıcıya olduğu gibi gösterilir.
   */
  async function sendReport(
    args: { userId: string; reason: string; context: Record<string, unknown> },
    type: string,
    targetId: string,
    thanks = 'Şikayetin alındı.',
  ) {
    const key = reportKey(type, targetId);
    if (useReportedStore.getState().keys[key]) {
      showAlert('Zaten şikayet ettin', 'Bunu daha önce şikayet ettin; tekrar göndermene gerek yok.');
      return;
    }
    try {
      await report.mutateAsync(args);
      useReportedStore.getState().mark(key);
      showAlert('Teşekkürler', thanks);
    } catch (e) {
      const msg = getErrorMessage(e, 'Şikayet gönderilemedi.');
      if (/zaten şikayet/i.test(msg)) useReportedStore.getState().mark(key);
      showAlert(/zaten şikayet/i.test(msg) ? 'Zaten şikayet ettin' : 'Şikayet gönderilemedi', msg);
    }
  }

  const deleteAccount = useMutation({
    mutationFn: async () => {
      // Önce yüklenen dosyalar (RPC yalnız DB satırlarını siler; dosyalar storage'da kalırdı).
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) await removeOwnFiles(sess.session.user.id);
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
    },
  });

  return { block, unblock, report, sendReport, deleteAccount };
}
