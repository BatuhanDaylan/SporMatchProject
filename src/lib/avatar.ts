import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

/**
 * Galeriden foto seç → Supabase Storage'a yükle → public URL döndür.
 * Yol deseni: avatars/<user_id>/avatar_<ts>.<ext> (RLS: kullanıcı yalnız kendi klasörüne yazar).
 * İptal edilirse null döner.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Galeri izni gerekli.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const arraybuffer = await fetch(asset.uri).then((r) => r.arrayBuffer());
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arraybuffer, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
