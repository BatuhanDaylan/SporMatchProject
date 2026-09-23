import { useProfile } from '@/hooks/useProfile';

/**
 * SporMatch Pro durumu — yalnızca GÖRÜNÜM için. Gerçek yetki her zaman sunucuda
 * (`start_match_session` RPC'si `profiles.pro_until`'ü kendi kontrol eder);
 * bu hook client'ta UI'ı doğru göstermek dışında bir yetkilendirme kaynağı değildir.
 */
export function usePro() {
  const { data: profile, isLoading } = useProfile();
  const isPro = !!profile?.pro_until && new Date(profile.pro_until) > new Date();
  return { isPro, proUntil: profile?.pro_until ?? null, isLoading };
}
