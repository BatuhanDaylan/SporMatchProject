import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncState } from '@/components/ui/async-state';
import { useColors } from '@/hooks/useColors';
import { useMessages, type Message } from '@/hooks/useChat';
import { Spacing } from '@/constants/theme';

export default function ChatThreadScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: messages, isLoading, send, currentUserId } = useMessages(id);
  const [text, setText] = useState('');

  // Ters liste (en yeni altta) — inverted FlatList için tersle
  const reversed = useMemo(() => (messages ? [...messages].reverse() : []), [messages]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => <Bubble msg={item} mine={item.sender_id === currentUserId} />,
    [currentUserId],
  );

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await send.mutateAsync(body);
    } catch (e) {
      setText(body);
      showAlert('Gönderilemedi', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <Stack.Screen options={{ headerShown: true, title: 'Sohbet' }} />
      <AsyncState
        isLoading={isLoading}
        isEmpty={reversed.length === 0}
        empty={{ icon: 'chatbubbles-outline', title: 'Sohbet başlasın', text: 'İlk mesajı sen gönder 👋' }}>
        <FlatList
          data={reversed}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={{ padding: Spacing.three, gap: 8 }}
          renderItem={renderItem}
        />
      </AsyncState>

      <View
        style={[
          styles.inputBar,
          { backgroundColor: c.background, borderTopColor: c.border, paddingBottom: insets.bottom + 8 },
        ]}>
        <TextInput
          placeholder="Mesaj yaz…"
          placeholderTextColor={c.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          style={[styles.input, { color: c.text, backgroundColor: c.backgroundElement }]}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim()}
          style={styles.send}
          accessibilityRole="button"
          accessibilityLabel="Mesajı gönder">
          <Ionicons name="send" size={22} color={text.trim() ? c.primary : c.textSecondary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const Bubble = memo(function Bubble({ msg, mine }: { msg: Message; mine: boolean }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.bubble,
        mine
          ? { backgroundColor: c.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 }
          : { backgroundColor: c.backgroundElement, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
      ]}>
      <Text style={{ color: mine ? c.onPrimary : c.text, fontSize: 15 }}>{msg.body}</Text>
      <Text style={[styles.time, { color: mine ? c.onPrimary : c.textSecondary }]}>
        {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  time: { fontSize: 10, marginTop: 3, alignSelf: 'flex-end', opacity: 0.8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  send: { padding: 10 },
});
