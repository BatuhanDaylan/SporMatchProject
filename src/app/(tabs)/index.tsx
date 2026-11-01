import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { timeAgo } from '@/lib/datetime';
import { AsyncState } from '@/components/ui/async-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    <Screen scroll floatingTabBar>
      <View>
        <Text style={[styles.title, { color: c.text }]}>Keşfet</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Yeni programlar ve sporcuların paylaşımları.
        </Text>
      </View>

      {/* Arama — ikon yerine davetkâr bir çubuk */}
      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.searchBar, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel="Sporcu veya program ara">
        <Ionicons name="search" size={17} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 14 }}>Sporcu veya program ara…</Text>
      </Pressable>

      {/* Programlar rafı */}
      <View style={{ gap: Spacing.two }}>
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Programlar</Text>
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>Herkese açık antrenman programları</Text>
          </View>
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
                  {m === 'discover' ? 'Herkes' : 'Takip ettiklerim'}
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
            compact: true,
            icon: programMode === 'following' ? 'people-outline' : 'compass-outline',
            title: programMode === 'following' ? 'Takip akışın boş' : 'Program yok',
            text:
              programMode === 'following'
                ? 'Takip ettiklerinin herkese açık programı yok.'
                : 'Henüz herkese açık program yok. İlk paylaşan sen ol!',
            action:
              programMode === 'following' ? undefined : (
                <Button title="Program oluştur" onPress={() => router.push('/program/edit')} />
              ),
          }}>
          {programs.data?.[0] ? (
            <ProgramHero
              program={programs.data[0]}
              onPress={() => router.push(`/program/${programs.data![0].id}`)}
              onOpenOwner={() => router.push(`/user/${programs.data![0].owner_id}`)}
            />
          ) : null}
          {(programs.data?.length ?? 0) > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
              {(programs.data ?? []).slice(1, 9).map((p) => (
                <ProgramPreview
                  key={p.id}
                  program={p}
                  onPress={() => router.push(`/program/${p.id}`)}
                  onOpenOwner={() => router.push(`/user/${p.owner_id}`)}
                />
              ))}
            </ScrollView>
          ) : null}
        </AsyncState>
      </View>

      {/* Akış rafı */}
      <View style={{ gap: Spacing.two }}>
        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Akış</Text>
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>Sporcuların son paylaşımları</Text>
          </View>
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
      </View>
    </Screen>
  );
}

/** Listenin ilk programı — geniş, öne çıkan kart. */
function ProgramHero({
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
      accessibilityRole="button"
      accessibilityLabel={`${program.title}, ${ownerName}`}
      style={({ pressed }) => [
        styles.hero,
        Elevation.card,
        { backgroundColor: c.backgroundElement, borderColor: c.primary, opacity: pressed ? 0.9 : 1 },
      ]}>
      <View style={[styles.heroIcon, { backgroundColor: `${c.primary}22` }]}>
        <Text style={{ fontSize: 30 }}>{program.sport?.icon ?? '🏋️'}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={[styles.newBadge, { backgroundColor: c.primary }]}>
          <Text style={{ color: c.onPrimary, fontSize: 10, fontWeight: '800' }}>YENİ</Text>
        </View>
        <Text style={[styles.heroTitle, { color: c.text }]} numberOfLines={2}>
          {program.title}
        </Text>
        <Pressable onPress={onOpenOwner} style={styles.previewOwner} hitSlop={4}>
          <Avatar name={ownerName} url={program.owner?.avatar_url} size={20} />
          <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
            {ownerName}
            {program.sport?.name ? ` · ${program.sport.name}` : ''}
          </Text>
        </Pressable>
        <View style={styles.previewCounts}>
          <Count icon="heart-outline" value={program.like_count ?? 0} />
          <Count icon="chatbubble-outline" value={program.comment_count ?? 0} />
          <Count icon="bookmark-outline" value={program.save_count ?? 0} />
        </View>
      </View>
    </Pressable>
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
      <View style={[styles.previewIcon, { backgroundColor: `${c.primary}22` }]}>
        <Text style={{ fontSize: 20 }}>{program.sport?.icon ?? '🏋️'}</Text>
      </View>
      <Text style={[styles.previewTitle, { color: c.text }]} numberOfLines={2}>
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
  hero: { flexDirection: 'row', gap: Spacing.three, borderRadius: 18, borderWidth: 1.5, padding: Spacing.three },
  heroIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  newBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  previewIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  postBody: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { ...Type.sectionTitle },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  segItem: { height: 28, paddingHorizontal: 12, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 12, fontWeight: '700' },
  noGrow: { flexGrow: 0, flexShrink: 0 },
  row: { gap: Spacing.two, paddingRight: Spacing.two, paddingBottom: 2 },
  previewCard: { width: 184, borderRadius: 14, borderWidth: 1, padding: Spacing.two, gap: 8 },
  previewTitle: { fontSize: 14, fontWeight: '700' },
  previewOwner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewCounts: { flexDirection: 'row', gap: Spacing.two },
  previewImage: { width: '100%', height: 84, borderRadius: 8 },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
