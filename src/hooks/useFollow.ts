import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type FollowInfo = { followers: number; following: number; is_following: boolean };

export type FollowUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/** Bir kullanıcının takipçi/takip sayıları + takip durumu ve takip et/bırak. */
export function useFollow(userId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['follow-info', userId, user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async (): Promise<FollowInfo> => {
      const { data, error } = await supabase.rpc('get_follow_info', { p_user_id: userId! });
      if (error) throw error;
      return data as unknown as FollowInfo;
    },
  });

  const toggle = useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (currentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user!.id)
          .eq('following_id', userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user!.id, following_id: userId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['follow-list'] });
    },
  });

  return { ...query, toggle };
}

/** Bir kullanıcının takipçi ya da takip ettiği kişiler listesi. */
export function useFollowList(userId?: string, type: 'followers' | 'following' = 'followers') {
  return useQuery({
    queryKey: ['follow-list', userId, type],
    enabled: !!userId,
    queryFn: async () => {
      // followers: following_id=user → follower profilleri; following: follower_id=user → following profilleri
      const col = type === 'followers' ? 'following_id' : 'follower_id';
      const join =
        type === 'followers'
          ? 'p:profiles!follows_follower_id_fkey(id,username,display_name,avatar_url)'
          : 'p:profiles!follows_following_id_fkey(id,username,display_name,avatar_url)';
      const { data, error } = await supabase
        .from('follows')
        .select(`created_at, ${join}`)
        .eq(col, userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.p).filter(Boolean) as FollowUser[];
    },
  });
}
