import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { useColors } from '@/hooks/useColors';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { useConversationList, useDeleteConversation, useMessages, type Message } from '@/hooks/useChat';
import { shortDate, startOfDay } from '@/lib/datetime';
import { Spacing } from '@/constants/theme';

/** Gün ayracı etiketi: Bugün / Dün / 12 Kas. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86400000);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return shortDate(d);
}

const sameDay = (a: string, b: string) => startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();

export default function ChatThreadScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: messages, isLoading, send, currentUserId } = useMessages(id);
  const [text, setText] = useState('');
  const router = useRouter();
  const del = useDeleteConversation();
  const { ref: boxRef, overlap } = useKeyboardOverlap();

  // Karşı taraf: sohbet listesinden (önbellekte yoksa — ör. bildirimden açılış — kendisi çeker).
  const { data: convs } = useConversationList();
  const partner = convs?.find((x) => x.conversation_id === id);
  const title = partner ? displayName({ display_name: partner.partner_name, username: partner.partner_username }) : 'Sohbet';

  function openProfile() {
    if (partner?.partner_id) router.push(`/user/${partner.partner_id}`);
  }

  function confirmDelete() {
    showAlert('Sohbeti sil', 'Bu sohbet yalnızca senin tarafında silinir; karşı taraf etkilenmez. Yeni mesaj gelirse yeniden görünür.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await del.mutateAsync(id);
            router.back();
          } catch (e) {
            showAlert('Silinemedi', getErrorMessage(e, 'Bir hata oluştu.'));
          }
        },
      },
    ]);
  }

  // Ters liste (en yeni altta) — inverted FlatList için tersle
  const reversed = useMemo(() => (messages ? [...messages].reverse() : []), [messages]);

  // Liste ters (en yeni önce): bir mesajın "bir öncesi" index+1'dir. Gün değişiyorsa ayraç göster.
  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const older = reversed[index + 1];
      const showDay = !older || !sameDay(older.created_at, item.created_at);
      return (
        <View style={{ gap: 8 }}>
          {showDay ? <Text style={[styles.day, { color: c.textSecondary }]}>{dayLabel(item.created_at)}</Text> : null}
          <Bubble msg={item} mine={item.sender_id === currentUserId} />
        </View>
      );
    },
    [currentUserId, reversed, c.textSecondary],
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
    <View ref={boxRef} style={{ flex: 1, backgroundColor: c.background, paddingBottom: overlap }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerTitle: () => (
            <Pressable
              onPress={openProfile}
              disabled={!partner}
              hitSlop={8}
              style={styles.headerTitle}
              accessibilityRole="button"
              accessibilityLabel={`${title} profilini aç`}>
              {partner ? <Avatar name={title} url={partner.partner_avatar} size={30} /> : null}
              <Text style={[styles.headerName, { color: c.text }]} numberOfLines={1}>
                {title}
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Sohbeti sil">
              <Ionicons name="trash-outline" size={22} color={c.text} />
            </Pressable>
          ),
        }}
      />
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
          // Klavye açıkken alt güvenli alan boşluğu gereksiz (klavye zaten altta)
          { backgroundColor: c.background, borderTopColor: c.border, paddingBottom: (overlap > 0 ? 0 : insets.bottom) + 8 },
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
          style={[styles.send, { backgroundColor: text.trim() ? c.primary : c.backgroundElement }]}
          accessibilityRole="button"
          accessibilityLabel="Mesajı gönder">
          <Ionicons name="send" size={20} color={text.trim() ? c.onPrimary : c.textSecondary} />
        </Pressable>
      </View>
    </View>
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
      <View style={styles.meta}>
        <Text style={[styles.time, { color: mine ? c.onPrimary : c.textSecondary }]}>
          {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {mine ? (
          // ✓ gönderildi, ✓✓ okundu (okununca vurgulu renk)
          <Ionicons
            name={msg.read_at ? 'checkmark-done' : 'checkmark'}
            size={15}
            color={msg.read_at ? '#BAE6FD' : c.onPrimary}
            style={{ opacity: msg.read_at ? 1 : 0.7 }}
            accessibilityLabel={msg.read_at ? 'Okundu' : 'Gönderildi'}
          />
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 3 },
  time: { fontSize: 10, opacity: 0.8 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 220 },
  headerName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  day: { alignSelf: 'center', fontSize: 12, fontWeight: '600', marginVertical: 6 },
});
