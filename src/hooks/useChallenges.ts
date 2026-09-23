import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';

export type ChallengeMetric = 'workouts' | 'active_days';
export type ChallengeStatus = 'upcoming' | 'active' | 'ended';

export type ChallengeSummary = {
  id: string;
  title: string;
  description: string | null;
  metric: ChallengeMetric;
  goal: number;
  starts_at: string;
  ends_at: string;
  creator_id: string;
  participant_count: number;
  joined: boolean;
  my_progress: number;
  completed: boolean;
  status: ChallengeStatus;
  sport: { name: string; icon: string | null } | null;
};

export type ChallengeLeader = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  progress: number;
  completed: boolean;
};

export type ChallengeDetail = ChallengeSummary & {
  is_creator: boolean;
  leaderboard: ChallengeLeader[];
};

export function useChallenges(scope: 'active' | 'mine' = 'active') {
  return useQuery({
    queryKey: ['challenges', scope],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('challenges_list', { p_scope: scope, p_limit: 50 });
      if (error) throw error;
      return (data ?? []) as unknown as ChallengeSummary[];
    },
  });
}

export function useChallengeDetail(id?: string) {
  return useQuery({
    queryKey: ['challenge', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('challenge_detail', { p_challenge: id! });
      if (error) throw error;
      return data as unknown as ChallengeDetail | null;
    },
  });
}

export function useChallengeActions(id?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['challenges'] });
    qc.invalidateQueries({ queryKey: ['challenge', id] });
  };
  const join = useMutation({
    mutationFn: async (cid: string) => {
      const { error } = await supabase.rpc('join_challenge', { p_challenge: cid });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const leave = useMutation({
    mutationFn: async (cid: string) => {
      const { error } = await supabase.rpc('leave_challenge', { p_challenge: cid });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { join, leave };
}

export type CreateChallengeInput = {
  title: string;
  description: string;
  metric: ChallengeMetric;
  goal: number;
  sportId: string | null;
  startsAt: string; // YYYY-MM-DD
  endsAt: string; // YYYY-MM-DD
};

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateChallengeInput) => {
      assertClean(input.title, input.description);
      const { data, error } = await supabase.rpc('create_challenge', {
        p_title: input.title.trim(),
        p_description: input.description,
        p_metric: input.metric,
        p_goal: input.goal,
        p_sport_id: input.sportId,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
      });
      if (error) throw error;
      return data as unknown as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  });
}
