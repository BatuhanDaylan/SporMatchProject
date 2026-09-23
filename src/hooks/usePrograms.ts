import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertClean } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import { uid, type ProgramTemplate } from '@/types/program';

export type Program = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  sport_id: string | null;
  visibility: 'public' | 'private';
  template: ProgramTemplate;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramInput = {
  title: string;
  description?: string | null;
  sport_id?: string | null;
  visibility: 'public' | 'private';
  template: ProgramTemplate;
  forked_from?: string | null;
};

/** Şablonu taze kimliklerle klonla (fork için — gün/egzersiz id'leri yenilenir). */
function cloneTemplate(t: ProgramTemplate): ProgramTemplate {
  return {
    days: t.days.map((d) => ({
      ...d,
      id: uid('d_'),
      exercises: d.exercises.map((e) => ({ ...e, id: uid('e_'), fields: e.fields.map((f) => ({ ...f })) })),
    })),
  };
}

function normalize(row: any): Program {
  return { ...row, template: (row.template as ProgramTemplate) ?? { days: [] } };
}

/** Giriş yapmış kullanıcının kendi programları. */
export function useMyPrograms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['programs', 'mine', user?.id],
    enabled: !!user?.id,
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('owner_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });
}

/** Tek program (herkese açık veya sahibininki — RLS filtreler). */
export function useProgram(id?: string) {
  return useQuery({
    queryKey: ['program', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
  });
}

export function useProgramMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['programs'] });
    qc.invalidateQueries({ queryKey: ['program'] });
  };

  const create = useMutation({
    mutationFn: async (input: ProgramInput) => {
      assertClean(input.title, input.description, JSON.stringify(input.template));
      const { data, error } = await supabase
        .from('programs')
        .insert({ ...input, template: input.template as unknown as Json, owner_id: user!.id })
        .select('*')
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProgramInput }) => {
      assertClean(input.title, input.description, JSON.stringify(input.template));
      const { data, error } = await supabase
        .from('programs')
        .update({ ...input, template: input.template as unknown as Json })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Başkasının programını kendi adına kopyala (fork) — plan kopyalanır, kayıtlar taşınmaz. */
  const fork = useMutation({
    mutationFn: async (src: Program) => {
      const { data, error } = await supabase
        .from('programs')
        .insert({
          owner_id: user!.id,
          title: src.title,
          description: src.description,
          sport_id: src.sport_id,
          visibility: 'private',
          template: cloneTemplate(src.template) as unknown as Json,
          forked_from: src.id,
        })
        .select('*')
        .single();
      if (error) throw error;
      return normalize(data);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove, fork };
}
