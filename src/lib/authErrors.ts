import { getErrorMessage } from '@/lib/errorMessage';

/** Supabase auth hatalarını kullanıcı diline çevirir. */
export function mapAuthError(e: unknown): string {
  const msg = getErrorMessage(e);
  if (/invalid login credentials/i.test(msg)) return 'E-posta veya parola hatalı.';
  if (/user already registered/i.test(msg)) return 'Bu e-posta zaten kayıtlı.';
  if (/password should be at least/i.test(msg)) return 'Parola en az 8 karakter olmalı ve harf ile rakam içermeli.';
  if (/email not confirmed/i.test(msg)) return 'E-postanı doğrulaman gerekiyor.';
  if (/token has expired|otp.*(expired|invalid)|invalid.*token/i.test(msg)) return 'Kod hatalı ya da süresi dolmuş. Yeni kod iste.';
  if (/only request this after|rate limit|too many/i.test(msg)) return 'Çok sık denedin. Biraz bekleyip tekrar dene.';
  if (/network request failed|fetch failed/i.test(msg)) return 'İnternet bağlantını kontrol et.';
  if (/unable to validate email|invalid email/i.test(msg)) return 'Geçerli bir e-posta gir.';
  return msg;
}
