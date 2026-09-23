import { QueryClient } from '@tanstack/react-query';

/**
 * Tek TanStack Query istemcisi. Mobil için makul varsayılanlar:
 * - retry 1: mobil ağda sonsuz retry istemeyiz.
 * - staleTime 30sn: gereksiz refetch'i azaltır.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
