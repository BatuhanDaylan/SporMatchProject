/** Supabase auth hatalarını kullanıcı diline çevirir. */
export function mapAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid login credentials/i.test(msg)) return 'E-posta veya parola hatalı.';
  if (/user already registered/i.test(msg)) return 'Bu e-posta zaten kayıtlı.';
  if (/password should be at least/i.test(msg)) return 'Parola en az 6 karakter olmalı.';
  if (/email not confirmed/i.test(msg)) return 'E-postanı doğrulaman gerekiyor.';
  if (/unable to validate email|invalid email/i.test(msg)) return 'Geçerli bir e-posta gir.';
  return msg;
}
