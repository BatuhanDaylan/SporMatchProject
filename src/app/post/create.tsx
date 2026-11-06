import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFeedActions, usePostDetail } from '@/hooks/useFeed';
import { useAuth } from '@/lib/auth';
import { pickAndUploadPostImage } from '@/lib/postImage';
import { Spacing } from '@/constants/theme';

/** Yeni gönderi; `?id=` verilirse o gönderinin metnini düzenler (fotoğraf değişmez). */
export default function CreatePostScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { data: existing, isLoading: loadingExisting } = usePostDetail(editId);
  const { createPost, editPost } = useFeedActions();

  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Düzenlemede mevcut metni bir kez doldur
  useEffect(() => {
    if (editId && existing && !prefilled) {
      setBody(existing.body ?? '');
      setImageUrl(existing.image_url);
      setPrefilled(true);
    }
  }, [editId, existing, prefilled]);

  async function onPickImage() {
    try {
      setUploading(true);
      const url = await pickAndUploadPostImage(user!.id);
      if (url) setImageUrl(url);
    } catch (e) {
      showAlert('Yüklenemedi', getErrorMessage(e, 'Foto yüklenemedi.'));
    } finally {
      setUploading(false);
    }
  }

  async function onShare() {
    if (!body.trim() && !imageUrl) {
      showAlert('Boş', 'Bir şeyler yaz ya da foto ekle.');
      return;
    }
    try {
      if (editId) await editPost.mutateAsync({ id: editId, body });
      else await createPost.mutateAsync({ body, imageUrl });
      router.back();
    } catch (e) {
      showAlert(editId ? 'Kaydedilemedi' : 'Paylaşılamadı', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  if (editId && loadingExisting) {
    return (
      <Screen center hasHeader>
        <Stack.Screen options={{ headerShown: true, title: 'Gönderiyi düzenle' }} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen scroll hasHeader onRefresh={false}>
      <Stack.Screen options={{ headerShown: true, title: editId ? 'Gönderiyi düzenle' : 'Yeni gönderi' }} />

      <TextInput
        placeholder="Neler yaptın? Antrenmanını, hedefini ya da motivasyonunu paylaş…"
        placeholderTextColor={c.textSecondary}
        value={body}
        onChangeText={setBody}
        style={[styles.input, { color: c.text, backgroundColor: c.backgroundElement }]}
        multiline
        maxLength={1000}
        autoFocus
      />
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>
        İpucu: #koşu, #fitness gibi etiketler ekle; aynı etiketi kullananlar birlikte görünür.
      </Text>

      {imageUrl ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" />
          {editId ? null : (
            <Pressable
              onPress={() => setImageUrl(null)}
              style={styles.removeImg}
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafı kaldır">
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      ) : editId ? null : (
        <Pressable
          onPress={onPickImage}
          disabled={uploading}
          style={[styles.addImg, { borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf ekle">
          <Ionicons name="image-outline" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: '600' }}>{uploading ? 'Yükleniyor…' : 'Fotoğraf ekle'}</Text>
        </Pressable>
      )}

      <View style={{ height: Spacing.two }} />
      <Button
        title={editId ? 'Kaydet' : 'Paylaş'}
        onPress={onShare}
        loading={createPost.isPending || editPost.isPending}
        disabled={uploading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    maxHeight: 260,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  addImg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  previewWrap: {},
  preview: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  removeImg: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000A',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
