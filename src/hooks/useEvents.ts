import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type MiniProfile = {
  id?: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};
export type MiniSport = { name: string; icon: string | null } | null;

export type NearbyEvent = {
  id: string;
  title: string;
  description: string | null;
  place_name: string | null;
  province: string | null;
  district: string | null;
  starts_at: string;
  capacity: number | null;
  host_id: string;
  status: 'open' | 'cancelled';
  distance_m: number;
  lat: number;
  lng: number;
  participant_count: number;
  joined: boolean;
  host: MiniProfile | null;
  sport: MiniSport;
};

export type CityEvent = {
  id: string;
  title: string;
  description: string | null;
  place_name: string | null;
  province: string | null;
  district: string | null;
  starts_at: string;
  capacity: number | null;
  host_id: string;
  status: 'open' | 'cancelled';
  lat: number;
  lng: number;
  participant_count: number;
  joined: boolean;
  host: MiniProfile | null;
  sport: MiniSport;
};

export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  place_name: string | null;
  province: string | null;
  district: string | null;
  starts_at: string;
  capacity: number | null;
  host_id: string;
  status: 'open' | 'cancelled';
  sport_id: string | null;
  lat: number;
  lng: number;
  participant_count: number;
  joined: boolean;
  is_host: boolean;
  host: MiniProfile | null;
  sport: MiniSport;
  participants: MiniProfile[];
};

export type MyEvent = {
  id: string;
  title: string;
  place_name: string | null;
  starts_at: string;
  status: 'open' | 'cancelled';
  host_id: string;
  is_host: boolean;
  participant_count: number;
  sport: MiniSport;
};

/** Konum izni + koordinat (emulator'da son-bilinen'e düşer). */
async function getCoords(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Konum izni gerekli. Ayarlardan izin ver.');
  let pos = await Location.getLastKnownPositionAsync();
  if (!pos) pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  if (!pos) throw new Error('Konum alınamadı. Konum servisleri açık mı?');
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export { getCoords };

/**
 * Yakındaki yaklaşan etkinlikler.
 * center verilirse o noktadan arar; verilmezse cihazın GPS konumunu kullanır.
 */
export function useNearbyEvents(
  center?: { lat: number; lng: number } | null,
  sportId?: string | null,
  radiusM = 50000,
) {
  return useQuery({
    queryKey: ['nearby-events', center ? `${center.lat.toFixed(3)},${center.lng.toFixed(3)}` : 'gps', sportId ?? 'all', radiusM],
    queryFn: async () => {
      const point = center ?? (await getCoords());
      const { data, error } = await supabase.rpc('nearby_events', {
        p_lat: point.lat,
        p_lng: point.lng,
        p_radius_m: radiusM,
        p_sport_id: sportId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as unknown as NearbyEvent[];
    },
  });
}

/**
 * Şehir bazlı etkinlikler. province verilmezse kullanıcının profil ili kullanılır.
 * GPS gerektirmez.
 */
export function useCityEvents(province?: string | null) {
  return useQuery({
    queryKey: ['city-events', province ?? 'profile'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('city_events', {
        p_province: province ?? null,
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as unknown as CityEvent[];
    },
  });
}

/** Ev sahibi olduğum ya da katıldığım etkinlikler. */
export function useMyEvents() {
  return useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_events');
      if (error) throw error;
      return (data ?? []) as unknown as MyEvent[];
    },
  });
}

/** Tek etkinlik detayı + realtime katılımcı tazeleme. */
export function useEventDetail(eventId?: string) {
  const qc = useQueryClient();
  const queryKey = ['event-detail', eventId];
  const query = useQuery({
    queryKey,
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_detail', { p_event_id: eventId! });
      if (error) throw error;
      return data as unknown as EventDetail | null;
    },
  });
  return { ...query, refetchKey: queryKey, qc };
}

export function useEventActions(eventId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['event-detail', eventId] });
    qc.invalidateQueries({ queryKey: ['nearby-events'] });
    qc.invalidateQueries({ queryKey: ['my-events'] });
  };

  const join = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('join_event', { p_event_id: id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('leave_event', { p_event_id: id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const cancelEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { join, leave, cancelEvent };
}

export type CreateEventInput = {
  sportId: string | null;
  title: string;
  description: string;
  placeName: string;
  province: string | null;
  district: string | null;
  startsAt: Date;
  capacity: number | null;
  /** Buluşma noktası — haritadan seçilir (mevcut GPS değil). */
  lat: number;
  lng: number;
};

/** Etkinlik oluştur (seçilen konum + moderasyon + RPC). */
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      assertClean(input.title, input.description, input.placeName);
      const { data, error } = await supabase.rpc('create_event', {
        p_sport_id: input.sportId,
        p_title: input.title.trim(),
        p_description: input.description,
        p_lat: input.lat,
        p_lng: input.lng,
        p_place_name: input.placeName,
        p_province: input.province,
        p_district: input.district,
        p_starts_at: input.startsAt.toISOString(),
        p_capacity: input.capacity,
      });
      if (error) throw error;
      return data as unknown as { id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nearby-events'] });
      qc.invalidateQueries({ queryKey: ['my-events'] });
    },
  });
}
