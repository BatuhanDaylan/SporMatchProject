import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

/** Sunucudaki bucket sınırıyla aynı (migration 0040: file_size_limit). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Galeriden foto seç → bucket'a <user_id>/<prefix>_<ts>.<ext> olarak yükle → public URL.
 * RLS: kullanıcı yalnız kendi klasörüne yazar. İptal edilirse null.
 */
export async function pickAndUploadImage(
  bucket: 'avatars' | 'post-images',
  userId: string,
  prefix: string,
  aspect?: [number, number],
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Galeri izni gerekli.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.6,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const arraybuffer = await fetch(asset.uri).then((r) => r.arrayBuffer());
  if (arraybuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Fotoğraf çok büyük (en fazla 10 MB). Daha küçük bir fotoğraf seç.');
  }
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${prefix}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arraybuffer, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
