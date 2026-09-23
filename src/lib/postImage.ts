import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

/**
 * Galeriden foto seç → 'post-images' bucket'ına yükle → public URL döndür.
 * Yol: post-images/<user_id>/post_<ts>.<ext> (RLS: kullanıcı yalnız kendi klasörüne yazar).
 * İptal edilirse null.
 */
export async function pickAndUploadPostImage(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Galeri izni gerekli.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.6,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const arraybuffer = await fetch(asset.uri).then((r) => r.arrayBuffer());
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/post_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, arraybuffer, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  return supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl;
}
