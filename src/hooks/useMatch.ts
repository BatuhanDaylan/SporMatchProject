import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

export type MatchPartner = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: string | null;
  distance_m: number | null;
  status: 'pending' | 'confirmed' | 'declined' | 'expired';
  a_confirmed: boolean;
  b_confirmed: boolean;
  i_confirmed: boolean;
  they_confirmed: boolean;
  conversation_id: string | null;
  lat?: number;
  lng?: number;
};

export type StartResult = { session_id: string; match_id: string | null };

/** Konum izni al + mevcut konumu getir (emulator için son-bilinen'e düşer). */
async function getCoords(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Konum izni gerekli. Ayarlardan izin ver.');
  let pos = await Location.getLastKnownPositionAsync();
  if (!pos) pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  if (!pos) throw new Error('Konum alınamadı. Emulator’da konum ayarlı mı?');
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** Eşleşme havuzuna gir (konum al + RPC). */
export function useStartMatching() {
  return useMutation({
    mutationFn: async ({ sportIds, radiusM }: { sportIds: string[]; radiusM: number }) => {
      const { lat, lng } = await getCoords();
      const { data, error } = await supabase.rpc('start_match_session', {
        p_sport_ids: sportIds,
        p_lat: lat,
        p_lng: lng,
        p_radius_m: radiusM,
      });
      if (error) throw error;
      return data as unknown as StartResult;
    },
  });
}

/** Aktif oturumu iptal et. */
export async function cancelMyActiveSession() {
  await supabase.from('match_sessions').update({ status: 'cancelled' }).eq('status', 'searching');
}

/** Beklerken yeni eşleşmeyi realtime yakala (RLS yalnızca kendi eşleşmelerini getirir). */
export function useIncomingMatchListener(onMatch: (matchId: string) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel('incoming-matches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, (payload) => {
        const row = payload.new as { id?: string; origin?: string };
        // Sohbet isteği kaynaklı match'leri eşleşme ekranına yönlendirme
        if (row?.origin && row.origin !== 'match') return;
        if (row?.id) onMatch(row.id);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

/** Eşleşme partner bilgisi (RPC) + realtime tazeleme. */
export function useMatchPartner(matchId?: string) {
  const qc = useQueryClient();
  const queryKey = ['matchPartner', matchId];

  const query = useQuery({
    queryKey,
    enabled: !!matchId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_match_partner', { p_match_id: matchId! });
      if (error) throw error;
      return data as unknown as MatchPartner;
    },
  });

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, () =>
        qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return query;
}

export function useMatchActions() {
  const qc = useQueryClient();
  const confirm = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc('confirm_match', { p_match_id: matchId });
      if (error) throw error;
    },
    onSuccess: (_d, matchId) => qc.invalidateQueries({ queryKey: ['matchPartner', matchId] }),
  });
  const decline = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc('decline_match', { p_match_id: matchId });
      if (error) throw error;
    },
    onSuccess: (_d, matchId) => qc.invalidateQueries({ queryKey: ['matchPartner', matchId] }),
  });
  return { confirm, decline };
}
