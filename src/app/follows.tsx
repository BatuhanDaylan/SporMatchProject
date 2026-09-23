import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

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
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; tab?: string }>();
  const [tab, setTab] = useState<'followers' | 'following'>(
    params.tab === 'following' ? 'following' : 'followers',
  );
  const { data, isLoading } = useFollowList(params.userId, tab);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Takip' }} />

      <Segment
        value={tab}
        onChange={setTab}
        options={TAB_OPTIONS}
        style={{ marginTop: Spacing.one }}
      />

      <AsyncState
        isLoading={isLoading}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{
          icon: 'people-outline',
          title: tab === 'followers' ? 'Takipçi yok' : 'Takip edilen yok',
          text: tab === 'followers' ? 'Henüz takipçisi yok.' : 'Henüz kimseyi takip etmiyor.',
        }}>
        <FlatList
          data={data}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
});
