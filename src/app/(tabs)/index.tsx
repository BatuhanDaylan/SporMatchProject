import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { timeAgo } from '@/lib/datetime';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TourTarget } from '@/components/tour/tour-target';
import { useColors } from '@/hooks/useColors';
import { useFeed, type FeedPost } from '@/hooks/useFeed';
import { Elevation, Spacing, Type } from '@/constants/theme';

/**
 * Keşfet — arama + Akış rafı. Programlar artık birleşik akışta (gönderilerle birlikte, spor filtreli)
 * gösterildiği için burada ayrı program rafı yok.
 */
export default function DiscoverScreen() {
  const c = useColors();
  const router = useRouter();
  const feed = useFeed();

  useFocusEffect(
    useCallback(() => {
      if (feed.isStale) feed.refetch();
    }, [feed.isStale, feed.refetch]),
  );

  return (
    <Screen scroll floatingTabBar>
      <View>
        <Text style={[styles.title, { color: c.text }]}>Keşfet</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Sporcuların paylaşımları ve programları.
        </Text>
      </View>

      {/* Arama — ikon yerine davetkâr bir çubuk */}
      <TourTarget id="kesfet.search">
      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.searchBar, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel="Sporcu veya program ara">
        <Ionicons name="search" size={17} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 14 }}>Sporcu veya program ara…</Text>
      </Pressable>
      </TourTarget>

      {/* Akış rafı */}
      <TourTarget id="kesfet.feed" style={{ gap: Spacing.two }}>
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Akış</Text>
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>Sporcuların son paylaşımları</Text>
          </View>
          <TourTarget id="kesfet.feed-all">
          <Pressable
            onPress={() => router.push('/feed')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Tüm gönderileri gör">
            <Text style={{ color: c.primary, ...Type.label }}>Tümünü Gör</Text>
          </Pressable>
          </TourTarget>
        </View>

        <AsyncState
          isLoading={feed.isLoading}
          isError={feed.isError}
          onRetry={feed.refetch}
          isEmpty={(feed.data?.length ?? 0) === 0}
          empty={{
            compact: true,
            icon: 'newspaper-outline',
            title: 'Henüz gönderi yok',
            text: 'İlk paylaşımı sen yap.',
            action: <Button title="Gönderi paylaş" onPress={() => router.push('/post/create')} />,
          }}>
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
      </TourTarget>
    </Screen>
  );
}

function Count({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: number }) {
  const c = useColors();
  return (
    <View style={styles.countChip}>
      <Ionicons name={icon} size={13} color={c.primary} />
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{value}</Text>
    </View>
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
        <Text style={[styles.postBody, { color: c.text }]} numberOfLines={4}>
          {post.body}
        </Text>
      )}
      <View style={styles.previewCounts}>
        <Count icon="heart-outline" value={post.like_count} />
        <Count icon="chatbubble-outline" value={post.comment_count} />
        <Text style={{ color: c.textSecondary, fontSize: 11, marginLeft: 'auto' }}>{timeAgo(post.created_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.displayTitle },
  subtitle: { fontSize: 14, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionSub: { fontSize: 12, marginTop: 1 },
  postBody: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { ...Type.sectionTitle },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  row: { gap: Spacing.two, paddingRight: Spacing.two, paddingBottom: 2 },
  previewCard: { width: 184, borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: 8 },
  previewOwner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewCounts: { flexDirection: 'row', gap: Spacing.two },
  previewImage: { width: '100%', height: 84, borderRadius: 8 },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
