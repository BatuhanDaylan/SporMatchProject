import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type SearchUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type SearchProgram = {
  id: string;
  title: string;
  owner_id: string;
  sport: { name: string; icon: string | null } | null;
};

/** Kullanıcı (isim/kullanıcı adı) ve herkese açık program (başlık) araması. */
export function useSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ['search', q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const like = `%${q.replace(/[%,()*]/g, ' ')}%`;
      const [byU, byD, prog] = await Promise.all([
        supabase.from('profiles').select('id,username,display_name,avatar_url').ilike('username', like).limit(20),
        supabase.from('profiles').select('id,username,display_name,avatar_url').ilike('display_name', like).limit(20),
        supabase
          .from('programs')
          .select('id,title,owner_id,sport:sports!programs_sport_id_fkey(name,icon)')
          .eq('visibility', 'public')
          .ilike('title', like)
          .limit(20),
      ]);
      if (byU.error) throw byU.error;
      if (byD.error) throw byD.error;
      if (prog.error) throw prog.error;

      const map = new Map<string, SearchUser>();
      for (const u of [...(byU.data ?? []), ...(byD.data ?? [])]) map.set(u.id, u as SearchUser);
      return {
        users: [...map.values()],
        programs: (prog.data as unknown as SearchProgram[]) ?? [],
      };
    },
  });
}
