import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRefresh } from '@/hooks/useRefresh';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { PersonRow } from '@/components/ui/person-row';
import { Screen } from '@/components/ui/screen';
import { Segment } from '@/components/ui/segment';
import { useColors } from '@/hooks/useColors';
import { useFollowList } from '@/hooks/useFollow';
import { Spacing } from '@/constants/theme';

const TAB_OPTIONS = [
  { value: 'followers', label: 'Takipçiler' },
  { value: 'following', label: 'Takip edilenler' },
] as const;

export default function FollowsScreen() {
  const c = useColors();
  const refresh = useRefresh();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; tab?: string }>();
  const [tab, setTab] = useState<'followers' | 'following'>(
    params.tab === 'following' ? 'following' : 'followers',
  );
  const { data, isLoading } = useFollowList(params.userId, tab);
  const [query, setQuery] = useState('');

  // Ad ya da kullanıcı adına göre süz (Türkçe yerel ayarla küçültülerek karşılaştırılır)
  const q = query.trim().toLocaleLowerCase('tr');
  const filtered = q
    ? (data ?? []).filter((u) => `${u.display_name ?? ''} ${u.username ?? ''}`.toLocaleLowerCase('tr').includes(q))
    : data;

  return (
    <Screen hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Takip' }} />

      <Segment
        value={tab}
        onChange={setTab}
        options={TAB_OPTIONS}
        style={{ marginTop: Spacing.one }}
      />

      <View style={[styles.search, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Ionicons name="search" size={18} color={c.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ad veya kullanıcı adı ara…"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.searchInput, { color: c.text }]}
          accessibilityLabel="Listede ara"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
            <Ionicons name="close-circle" size={18} color={c.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <AsyncState
        isLoading={isLoading}
        isEmpty={(filtered?.length ?? 0) === 0}
        empty={
          q
            ? { icon: 'search-outline', title: 'Sonuç yok', text: `"${query.trim()}" ile eşleşen kimse bulunamadı.` }
            : {
                icon: 'people-outline',
                title: tab === 'followers' ? 'Takipçi yok' : 'Takip edilen yok',
                text: tab === 'followers' ? 'Henüz takipçisi yok.' : 'Henüz kimseyi takip etmiyor.',
              }
        }>
        <FlatList
          refreshControl={<RefreshControl {...refresh} tintColor={c.primary} colors={[c.primary]} />}
          data={filtered}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingVertical: Spacing.two }}
          renderItem={({ item }) => {
            const name = displayName(item);
            return (
              <Pressable
                onPress={() => router.push(`/user/${item.id}`)}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                <PersonRow
                  name={name}
                  avatarUrl={item.avatar_url}
                  size={48}
                  subtitle={item.username ? `@${item.username}` : null}
                  c={c}
                />
              </Pressable>
            );
          }}
        />
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
});
