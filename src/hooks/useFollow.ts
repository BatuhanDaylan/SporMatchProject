import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type FollowInfo = {
  followers: number;
  following: number;
  is_following: boolean;
  /** Gizli hesaba takip isteği gönderdim, onay bekliyor. */
  requested?: boolean;
  is_private?: boolean;
  /** Bu profilin gönderi/program/ısı haritasını görebilir miyim? */
  can_view?: boolean;
};

export type FollowUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/** Bir kullanıcının takipçi/takip sayıları + takip durumu; takip et / isteği geri çek / bırak. */
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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ['follow-list'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['heatmap'] });
  };

  /** Açık hesap: hemen takip. Gizli hesap: takip isteği gönderilir. */
  const follow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('follow_user', { p_target: userId! });
      if (error) throw error;
      return data as unknown as { status: 'following' | 'requested' };
    },
    onSuccess: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('follows').delete().eq('follower_id', user!.id).eq('following_id', userId!);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const cancelRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', user!.id)
        .eq('target_id', userId!);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, follow, unfollow, cancelRequest };
}

export type FollowRequest = { requester_id: string; created_at: string; requester: FollowUser | null };

/** Bana gelen takip istekleri (gizli hesap) + kabul/ret. */
export function useFollowRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['follow-requests', user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('requester_id, created_at, requester:profiles!follow_requests_requester_id_fkey(id,username,display_name,avatar_url)')
        .eq('target_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FollowRequest[];
    },
  });

  const respond = useMutation({
    mutationFn: async ({ requesterId, accept }: { requesterId: string; accept: boolean }) => {
      const { error } = await supabase.rpc('respond_follow_request', { p_requester: requesterId, p_accept: accept });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['follow-info'] });
      qc.invalidateQueries({ queryKey: ['follow-list'] });
    },
  });

  return { ...query, respond };
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
