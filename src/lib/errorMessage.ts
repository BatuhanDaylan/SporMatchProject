/**
 * Hatayı kullanıcıya gösterilecek metne çevirir.
 * Supabase (PostgREST/Auth) hataları `Error` sınıfından olmayan düz nesneler olabilir ({ message, code, … });
 * eskiden bunlar "[object Object]" ya da genel bir mesaja dönüşüyordu.
 */
export function getErrorMessage(e: unknown, fallback = 'Bir hata oluştu.'): string {
  if (typeof e === 'string' && e.trim()) return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
