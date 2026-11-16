import { supabase } from '@/lib/supabase';

/**
 * Google ile giriş: cihazdaki Google hesabı seçilir, Google'ın imzaladığı kimlik jetonu (idToken)
 * Supabase'e verilir; Supabase jetonu Google'a karşı doğrular ve oturum açar.
 * Aynı (doğrulanmış) e-postayla daha önce e-posta/parola hesabı açılmışsa Supabase onu bu hesaba bağlar.
 *
 * webClientId: Google Cloud'daki "Web application" OAuth istemci kimliği (Supabase'e girilenle aynı).
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');
let mod: GoogleModule | null = null;

/** Native modül yalnız gerektiğinde yüklenir: modülü içermeyen eski bir sürüm açılışta çökmesin. */
async function load(): Promise<GoogleModule> {
  if (mod) return mod;
  if (!WEB_CLIENT_ID) throw new Error('Google ile giriş henüz yapılandırılmadı (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID eksik).');
  try {
    mod = await import('@react-native-google-signin/google-signin');
  } catch {
    throw new Error('Google ile giriş bu sürümde yok. Uygulamayı güncelle.');
  }
  mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  return mod;
}

/** Google ile oturum açar. Kullanıcı vazgeçerse `false` döner (hata değildir). */
export async function signInWithGoogle(): Promise<boolean> {
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, isSuccessResponse, statusCodes } = await load();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (isCancelledResponse(res)) return false;
    if (!isSuccessResponse(res) || !res.data.idToken) throw new Error('Google kimlik bilgisi alınamadı.');
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.data.idToken });
    if (error) throw error;
    return true;
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return false;
      if (e.code === statusCodes.IN_PROGRESS) return false;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Bu cihazda Google Play Hizmetleri yok ya da güncel değil.');
      }
    }
    throw e;
  }
}

/** Çıkışta cihazdaki Google oturumunu da kapat (bir sonraki girişte hesap seçimi sorulsun). */
export async function signOutGoogle() {
  try {
    // Uygulama yeniden açıldıysa da cihazdaki Google oturumu kapansın
    if (WEB_CLIENT_ID) await (await load()).GoogleSignin.signOut();
  } catch {
    // Google oturumu yoksa ya da modül yoksa çıkışı engelleme
  }
}
