import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { Loading } from '@/components/ui/loading';
import { PersonRow } from '@/components/ui/person-row';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useSearch } from '@/hooks/useSearch';
import { Spacing } from '@/constants/theme';

export default function SearchScreen() {
  const c = useColors();
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);
  const { data, isLoading, isFetching } = useSearch(debounced);
  const short = term.trim().length < 2;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Ara' }} />

      <View style={[styles.searchBar, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Ionicons name="search" size={18} color={c.textSecondary} />
        <TextInput
          placeholder="Sporcu veya program ara…"
          placeholderTextColor={c.textSecondary}
          value={term}
          onChangeText={setTerm}
          autoFocus
          autoCapitalize="none"
          style={{ flex: 1, color: c.text, fontSize: 16, paddingVertical: 10 }}
        />
        {term ? (
          <Pressable onPress={() => setTerm('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={c.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {short ? (
        <Text style={{ color: c.textSecondary, marginTop: Spacing.two }}>
          En az 2 harf yaz.
        </Text>
      ) : isLoading || isFetching ? (
        <Loading text="Aranıyor…" />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing.six }}>
          {/* Kullanıcılar */}
          {(data?.users.length ?? 0) > 0 && (
            <>
              <Text style={[styles.section, { color: c.textSecondary }]}>Sporcular</Text>
              {data!.users.map((u) => {
                const name = displayName(u);
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => router.push(`/user/${u.id}`)}
                    style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                    <PersonRow
                      name={name}
                      avatarUrl={u.avatar_url}
                      size={44}
                      subtitle={u.username ? `@${u.username}` : null}
                      c={c}
                    />
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Programlar */}
          {(data?.programs.length ?? 0) > 0 && (
            <>
              <Text style={[styles.section, { color: c.textSecondary }]}>Programlar</Text>
              {data!.programs.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/program/${p.id}`)}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                  <View style={[styles.progIcon, { backgroundColor: c.backgroundElement }]}>
                    <Ionicons name="barbell-outline" size={20} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{p.title}</Text>
                    {p.sport ? (
                      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                        {p.sport.icon} {p.sport.name}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </>
          )}

          {(data?.users.length ?? 0) === 0 && (data?.programs.length ?? 0) === 0 ? (
            <Text style={{ color: c.textSecondary, marginTop: Spacing.two }}>Sonuç bulunamadı.</Text>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.three, marginBottom: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  progIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
