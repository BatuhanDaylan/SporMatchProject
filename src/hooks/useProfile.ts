import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type UserSport = {
  sport_id: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  province: string | null;
  district: string | null;
  goals: string[];
  availability: string[];
  onboarded: boolean;
  pro_until: string | null;
  created_at: string;
  updated_at: string;
  user_sports: UserSport[];
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_sports(sport_id, skill_level)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Giriş yapmış kullanıcının profilini (sporlarıyla) getirir. */
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });
}
