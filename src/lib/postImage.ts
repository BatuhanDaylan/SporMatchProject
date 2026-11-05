import { pickAndUploadImage } from '@/lib/uploadImage';

/**
 * Galeriden gönderi fotoğrafı seç → post-images/<user_id>/post_<ts>.<ext> → public URL.
 * İptal edilirse null.
 */
export function pickAndUploadPostImage(userId: string): Promise<string | null> {
  return pickAndUploadImage('post-images', userId, 'post');
}
