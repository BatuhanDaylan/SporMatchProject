import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useColors } from '@/hooks/useColors';
import type { DiscoverProgram } from '@/hooks/useDiscover';
import { displayName } from '@/lib/displayName';
import { Spacing } from '@/constants/theme';

/** Herkese açık program kartı (keşif listesi ve akış). */
export function ProgramCard({ program, showHit }: { program: DiscoverProgram; showHit?: boolean }) {
  const c = useColors();
  const router = useRouter();
  const ownerName = displayName(program.owner);
  const days = program.template?.days ?? [];
  const exCount = days.reduce((n, d) => n + (d.exercises?.length ?? 0), 0);

  return (
    <Card onPress={() => router.push(`/program/${program.id}`)} style={styles.card} accessibilityRole="button" accessibilityLabel={program.title}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push(`/user/${program.owner_id}`)} style={styles.ownerTap} hitSlop={4}>
          <Avatar name={ownerName} url={program.owner?.avatar_url} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.owner, { color: c.text }]} numberOfLines={1}>
              {ownerName}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>
              📋 Program{program.sport ? ` · ${program.sport.icon ?? ''} ${program.sport.name}` : ''}
            </Text>
          </View>
        </Pressable>
        {showHit && (program.hit_score ?? 0) > 0 ? (
          <View style={[styles.hitBadge, { backgroundColor: c.danger }]}>
            <Text style={{ color: c.onDanger, fontSize: 12, fontWeight: '800' }}>🔥 {program.hit_score}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, { color: c.text }]}>{program.title}</Text>
      {program.description ? (
        <Text numberOfLines={2} style={{ color: c.textSecondary, fontSize: 13 }}>
          {program.description}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {days.length} gün · {exCount} egzersiz
        </Text>
        <View style={styles.counts}>
          <Count icon="heart-outline" value={program.like_count ?? 0} />
          <Count icon="chatbubble-outline" value={program.comment_count ?? 0} />
          <Count icon="bookmark-outline" value={program.save_count ?? 0} />
        </View>
      </View>
    </Card>
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

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  ownerTap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  owner: { fontSize: 14, fontWeight: '700' },
  hitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  title: { fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counts: { flexDirection: 'row', gap: Spacing.two },
  countChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
