import { pickAndUploadImage } from '@/lib/uploadImage';

/**
 * Galeriden profil fotoğrafı seç → avatars/<user_id>/avatar_<ts>.<ext> → public URL.
 * İptal edilirse null döner.
 */
export function pickAndUploadAvatar(userId: string): Promise<string | null> {
  return pickAndUploadImage('avatars', userId, 'avatar', [1, 1]);
}
