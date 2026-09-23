import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { PersonRow } from '@/components/ui/person-row';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useBlockedUsers, useModeration } from '@/hooks/useModeration';
import { Spacing } from '@/constants/theme';

export default function BlockedScreen() {
  const c = useColors();
  const router = useRouter();
  const { data, isLoading } = useBlockedUsers();
  const { unblock } = useModeration();

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Engellenenler' }} />
      <AsyncState
        isLoading={isLoading}
        isEmpty={(data?.length ?? 0) === 0}
        empty={{ icon: 'ban-outline', title: 'Engellenen yok', text: 'Kimseyi engellemedin.' }}>
        <FlatList
          data={data}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingVertical: Spacing.two, gap: Spacing.two }}
          renderItem={({ item }) => {
            const name = displayName(item);
            return (
              <View style={[styles.row, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
                <Pressable onPress={() => router.push(`/user/${item.id}`)} style={styles.info}>
                  <PersonRow name={name} avatarUrl={item.avatar_url} size={44} c={c} />
                </Pressable>
                <Pressable
                  onPress={() => unblock.mutate(item.id)}
                  style={[styles.unblockBtn, { borderColor: c.border }]}>
                  <Text style={{ color: c.primary, fontWeight: '600' }}>Engeli kaldır</Text>
                </Pressable>
              </View>
            );
          }}
        />
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  unblockBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
