import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useFeedActions } from '@/hooks/useFeed';
import { useAuth } from '@/lib/auth';
import { pickAndUploadPostImage } from '@/lib/postImage';
import { Spacing } from '@/constants/theme';

export default function CreatePostScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { createPost } = useFeedActions();

  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      await createPost.mutateAsync({ body, imageUrl });
      router.back();
    } catch (e) {
      showAlert('Paylaşılamadı', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Yeni gönderi' }} />

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

      {imageUrl ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" />
          <Pressable
            onPress={() => setImageUrl(null)}
            style={styles.removeImg}
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı kaldır">
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPickImage}
          disabled={uploading}
          style={[styles.addImg, { borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf ekle">
          <Ionicons name="image-outline" size={20} color={c.primary} />
          <Text style={{ color: c.primary, fontWeight: '600' }}>
            {uploading ? 'Yükleniyor…' : 'Fotoğraf ekle'}
          </Text>
        </Pressable>
      )}

      <View style={{ height: Spacing.three }} />
      <Button title="Paylaş" onPress={onShare} loading={createPost.isPending} disabled={uploading} />
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
    marginTop: Spacing.two,
  },
  previewWrap: { marginTop: Spacing.two },
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
