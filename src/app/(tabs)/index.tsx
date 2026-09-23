import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useDiscoverPrograms, useFollowingFeed, type DiscoverProgram } from '@/hooks/useDiscover';
import { useFeed, type FeedPost } from '@/hooks/useFeed';
import { Elevation, Spacing, Type } from '@/constants/theme';

/**
 * Keşfet — yalnızca "içerik keşfi" işini yapar: arama + iki net raf (Programlar, Akış).
 * Bildirim, liderlik, meydan okuma, kaydedilenler artık kendi ait oldukları sekmelerin
 * altında (bkz. tasarım planı) — burada "diğer özellikler" rafı yok.
 */
export default function DiscoverScreen() {
  const c = useColors();
  const router = useRouter();
  const [programMode, setProgramMode] = useState<'discover' | 'following'>('discover');
  const discoverPrograms = useDiscoverPrograms('recent', 7);
  const followingFeed = useFollowingFeed();
  const feed = useFeed();

  const programs = programMode === 'discover' ? discoverPrograms : followingFeed;

  useFocusEffect(
    useCallback(() => {
      if (discoverPrograms.isStale) discoverPrograms.refetch();
      if (followingFeed.isStale) followingFeed.refetch();
      if (feed.isStale) feed.refetch();
    }, [discoverPrograms.isStale, followingFeed.isStale, feed.isStale, discoverPrograms.refetch, followingFeed.refetch, feed.refetch]),
  );

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: c.text }]}>Keşfet</Text>

      {/* Arama — ikon yerine davetkâr bir çubuk */}
      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.searchBar, { backgroundColor: c.backgroundElement }]}
        accessibilityRole="button"
        accessibilityLabel="Sporcu veya program ara">
        <Ionicons name="search" size={17} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 14 }}>Sporcu veya program ara…</Text>
      </Pressable>

      {/* Programlar rafı */}
      <View style={{ gap: Spacing.two }}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Programlar</Text>
          <Pressable
            onPress={() => router.push('/programs-discover')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Tüm programları gör">
            <Text style={{ color: c.primary, ...Type.label }}>Tümünü Gör</Text>
          </Pressable>
        </View>

        <View style={[styles.segment, { backgroundColor: c.backgroundElement, alignSelf: 'flex-start' }]}>
          {(['discover', 'following'] as const).map((m) => {
            const active = programMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setProgramMode(m)}
                style={[styles.segItem, active && { backgroundColor: c.primary }]}>
                <Text style={[styles.segText, { color: active ? c.onPrimary : c.textSecondary }]}>
                  {m === 'discover' ? 'Keşfet' : 'Takip'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AsyncState
          isLoading={programs.isLoading}
          isError={programs.isError}
          onRetry={programs.refetch}
          isEmpty={(programs.data?.length ?? 0) === 0}
          empty={{
            icon: programMode === 'following' ? 'people-outline' : 'compass-outline',
            title: programMode === 'following' ? 'Takip akışın boş' : 'Program yok',
            text:
              programMode === 'following'
                ? 'Takip ettiklerinin herkese açık programı yok.'
                : 'Henüz herkese açık program yok. İlk paylaşan sen ol!',
          }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
            {(programs.data ?? []).slice(0, 8).map((p) => (
              <ProgramPreview
                key={p.id}
                program={p}
                onPress={() => router.push(`/program/${p.id}`)}
                onOpenOwner={() => router.push(`/user/${p.owner_id}`)}
              />
            ))}
          </ScrollView>
        </AsyncState>
      </View>

      {/* Akış rafı */}
      <View style={{ gap: Spacing.two }}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Akış</Text>
          <Pressable
            onPress={() => router.push('/feed')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Tüm gönderileri gör">
            <Text style={{ color: c.primary, ...Type.label }}>Tümünü Gör</Text>
          </Pressable>
        </View>

        <AsyncState
          isLoading={feed.isLoading}
          isError={feed.isError}
          onRetry={feed.refetch}
          isEmpty={(feed.data?.length ?? 0) === 0}
          empty={{ icon: 'newspaper-outline', title: 'Henüz gönderi yok', text: 'İlk paylaşımı sen yap.' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
            {(feed.data ?? []).slice(0, 8).map((p) => (
              <PostPreview
                key={p.id}
                post={p}
                onPress={() => router.push(`/post/${p.id}`)}
                onOpenAuthor={() => router.push(`/user/${p.author_id}`)}
              />
            ))}
          </ScrollView>
        </AsyncState>
      </View>
    </Screen>
  );
}

function ProgramPreview({
  program,
  onPress,
  onOpenOwner,
}: {
  program: DiscoverProgram;
  onPress: () => void;
  onOpenOwner: () => void;
}) {
  const c = useColors();
  const ownerName = displayName(program.owner);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.previewCard,
        Elevation.card,
        { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={[styles.previewTitle, { color: c.text }]} numberOfLines={2}>
        {program.sport?.icon ? `${program.sport.icon} ` : ''}
        {program.title}
      </Text>
      <Pressable onPress={onOpenOwner} style={styles.previewOwner} hitSlop={4}>
        <Avatar name={ownerName} url={program.owner?.avatar_url} size={20} />
        <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
          {ownerName}
        </Text>
      </Pressable>
      <View style={styles.previewCounts}>
        <View style={styles.countChip}>
          <Ionicons name="heart-outline" size={12} color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{program.like_count ?? 0}</Text>
        </View>
        <View style={styles.countChip}>
          <Ionicons name="chatbubble-outline" size={12} color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{program.comment_count ?? 0}</Text>
        </View>
        <View style={styles.countChip}>
          <Ionicons name="bookmark-outline" size={12} color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{program.save_count ?? 0}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function PostPreview({ post, onPress, onOpenAuthor }: { post: FeedPost; onPress: () => void; onOpenAuthor: () => void }) {
  const c = useColors();
  const authorName = displayName(post.author);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.previewCard,
        Elevation.card,
        { backgroundColor: c.backgroundElement, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Pressable onPress={onOpenAuthor} style={styles.previewOwner} hitSlop={4}>
        <Avatar name={authorName} url={post.author?.avatar_url} size={20} />
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {authorName}
        </Text>
      </Pressable>
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.previewImage} contentFit="cover" />
      ) : (
        <Text style={[styles.previewTitle, { color: c.text }]} numberOfLines={3}>
          {post.body}
        </Text>
      )}
      <View style={styles.previewCounts}>
        <View style={styles.countChip}>
          <Ionicons name="heart-outline" size={12} color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{post.like_count}</Text>
        </View>
        <View style={styles.countChip}>
          <Ionicons name="chatbubble-outline" size={12} color={c.primary} />
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{post.comment_count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.displayTitle },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...Type.sectionTitle },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  segItem: { height: 28, paddingHorizontal: 12, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 12, fontWeight: '700' },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  row: { gap: Spacing.two, paddingRight: Spacing.two, paddingBottom: 2 },
  previewCard: { width: 176, borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: 8 },
  previewTitle: { fontSize: 14, fontWeight: '700' },
  previewOwner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewCounts: { flexDirection: 'row', gap: Spacing.two },
  previewImage: { width: '100%', height: 84, borderRadius: 8 },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
