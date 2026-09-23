import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/store/theme';

/** Aktif renk paletini (tema tercihine göre light/dark) döndürür. */
export function useColors() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
