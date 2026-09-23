import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { displayName } from '@/lib/displayName';
import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { LineChart, type ChartPoint } from '@/components/chart/line-chart';
import { CommentsSection } from '@/components/comments-section';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { useColors } from '@/hooks/useColors';
import { useProgram, useProgramMutations } from '@/hooks/usePrograms';
import { useProgramSocial } from '@/hooks/useProgramSocial';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useAuth } from '@/lib/auth';
import { computePRs } from '@/lib/prs';
import { Spacing } from '@/constants/theme';
import type { LogEntry } from '@/types/program';

const NUMERIC = new Set(['number', 'duration', 'distance']);

export default function ProgramDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: program, isLoading } = useProgram(id);
  const { data: logs } = useWorkoutLogs(id);
  const { remove, fork } = useProgramMutations();
  const { data: owner } = usePublicProfile(program?.owner_id);
  const social = useProgramSocial(id);

  const isOwner = !!program && program.owner_id === user?.id;
  const ownerName = displayName(owner);

  // Grafiklenebilir metrikler: (egzersiz, sayısal alan) çiftleri
  const metrics = useMemo(() => {
    if (!program) return [];
    const out: { key: string; exId: string; fieldKey: string; label: string; unit?: string }[] = [];
    for (const d of program.template.days)
      for (const e of d.exercises)
        for (const f of e.fields)
          if (NUMERIC.has(f.type))
            out.push({
              key: `${e.id}.${f.key}`,
              exId: e.id,
              fieldKey: f.key,
              label: `${e.name || 'Egzersiz'} · ${f.label}`,
              unit: f.unit,
            });
    return out;
  }, [program]);

  const [metricKey, setMetricKey] = useState<string | null>(null);
  const activeMetric = metrics.find((m) => m.key === metricKey) ?? metrics[0];

  const prs = useMemo(
    () => (program && logs ? computePRs(program.template, logs) : []),
    [program, logs],
  );

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (!activeMetric || !logs) return [];
    const pts: ChartPoint[] = [];
    for (const log of logs) {
      const entry = (log.data.entries as LogEntry[] | undefined)?.find(
        (en) => en.exercise_id === activeMetric.exId,
      );
      const raw = entry?.values?.[activeMetric.fieldKey];
      const val = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
      if (!Number.isNaN(val)) pts.push({ label: log.performed_at.slice(5), value: val });
    }
    return pts;
  }, [activeMetric, logs]);

  async function onFork() {
    if (!program) return;
    try {
      const copy = await fork.mutateAsync(program);
      router.replace(`/program/${copy.id}`);
    } catch (e) {
      showAlert('Hata', getErrorMessage(e));
    }
  }

  function confirmDelete() {
    showAlert('Programı sil', 'Bu program ve kayıtları silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <Screen center>
        <Loading />
      </Screen>
    );
  }
  if (!program) {
    return (
      <Screen center>
        <Text style={{ color: c.textSecondary }}>Program bulunamadı.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: program.title }} />

      <Text style={[styles.title, { color: c.text }]}>{program.title}</Text>
      {program.description ? (
        <Text style={{ color: c.textSecondary }}>{program.description}</Text>
      ) : null}

      {/* Oluşturan */}
      <Card onPress={() => router.push(`/user/${program.owner_id}`)} style={styles.creator}>
        <Avatar name={ownerName} url={owner?.avatar_url} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Oluşturan</Text>
          <Text style={{ color: c.text, fontWeight: '700' }}>{ownerName}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
      </Card>

      {/* Beğeni & kaydetme */}
      <View style={styles.socialRow}>
        <Pressable
          onPress={() => social.toggleLike.mutate(social.data?.liked ?? false)}
          disabled={social.toggleLike.isPending}
          style={[styles.socialBtn, { borderColor: c.border }]}>
          <Ionicons
            name={social.data?.liked ? 'heart' : 'heart-outline'}
            size={20}
            color={social.data?.liked ? c.danger : c.text}
          />
          <Text style={{ color: c.text, fontWeight: '600' }}>{social.data?.likeCount ?? 0}</Text>
        </Pressable>
        <Pressable
          onPress={() => social.toggleSave.mutate(social.data?.saved ?? false)}
          disabled={social.toggleSave.isPending}
          style={[
            styles.socialBtn,
            {
              borderColor: social.data?.saved ? c.primary : c.border,
              backgroundColor: social.data?.saved ? c.primary : 'transparent',
            },
          ]}>
          <Ionicons
            name={social.data?.saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={social.data?.saved ? c.onPrimary : c.text}
          />
          <Text style={{ color: social.data?.saved ? c.onPrimary : c.text, fontWeight: '600' }}>
            {social.data?.saved ? 'Kaydedildi' : 'Kaydet'}
          </Text>
        </Pressable>
      </View>

      {/* Fork künyesi */}
      {program.forked_from ? (
        <Pressable onPress={() => router.push(`/program/${program.forked_from}`)} hitSlop={4}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            📋 Bir programdan kopyalandı — <Text style={{ color: c.primary }}>orijinali gör</Text>
          </Text>
        </Pressable>
      ) : null}

      {isOwner ? (
        <View style={styles.actions}>
          <Button title="Antrenman Kaydet" onPress={() => router.push(`/program/log?programId=${id}`)} />
          <View style={styles.rowBtns}>
            <Button title="Düzenle" variant="secondary" onPress={() => router.push(`/program/edit?id=${id}`)} />
            <Pressable onPress={confirmDelete} style={[styles.deleteBtn, { borderColor: c.danger }]}>
              <Ionicons name="trash-outline" size={20} color={c.danger} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            title="Programı kopyala"
            onPress={onFork}
            loading={fork.isPending}
          />
          <Text style={{ color: c.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Kendi programına ekler; sonra antrenman kaydedip ilerlemeni takip edebilirsin.
          </Text>
        </View>
      )}

      {/* İlerleme grafiği — yalnızca kendi programında (kayıtlar kişiye özel) */}
      {metrics.length > 0 && isOwner && (
        <View style={[styles.section, { borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Senin ilerlemen</Text>
          <View style={styles.chips}>
            {metrics.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                selected={activeMetric?.key === m.key}
                onPress={() => setMetricKey(m.key)}
              />
            ))}
          </View>
          <LineChart points={chartPoints} unit={activeMetric?.unit} />
        </View>
      )}

      {/* Kişisel rekorlar */}
      {isOwner && prs.length > 0 && (
        <View style={[styles.section, { borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Rekorların 🏆</Text>
          {prs.map((pr) => (
            <View key={`${pr.exId}.${pr.fieldKey}`} style={styles.prRow}>
              <Text style={{ color: c.text, flex: 1 }} numberOfLines={1}>
                {pr.exName} · {pr.label}
              </Text>
              <Text style={{ color: c.primary, fontWeight: '800' }}>
                {pr.value}
                {pr.unit ? ` ${pr.unit}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Program yapısı */}
      <Text style={[styles.sectionTitle, { color: c.text, marginTop: Spacing.three }]}>İçerik</Text>
      {program.template.days.length === 0 ? (
        <Text style={{ color: c.textSecondary }}>Bu programda henüz gün yok.</Text>
      ) : (
        program.template.days.map((d) => (
          <Card key={d.id} style={styles.dayCard}>
            <Text style={[styles.dayName, { color: c.text }]}>{d.name}</Text>
            {d.exercises.length === 0 ? (
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>Egzersiz yok.</Text>
            ) : (
              d.exercises.map((e) => (
                <View key={e.id} style={styles.exRow}>
                  <Text style={[styles.exName, { color: c.text }]}>{e.name || 'İsimsiz egzersiz'}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                    {e.fields
                      .map((f) =>
                        f.value !== undefined && f.value !== ''
                          ? f.type === 'checkbox'
                            ? `${f.label}: ${f.value ? 'Evet' : 'Hayır'}`
                            : `${f.label}: ${f.value}${f.unit ? ' ' + f.unit : ''}`
                          : f.label + (f.unit ? ` (${f.unit})` : ''),
                      )
                      .join(' · ') || 'alan yok'}
                  </Text>
                  {e.note ? (
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>
                      📝 {e.note}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </Card>
        ))
      )}

      <View style={[styles.section, { borderColor: c.border }]}>
        <CommentsSection programId={id} canModerate={isOwner} />
      </View>

      <View style={{ height: Spacing.six }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800' },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  socialRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
  rowBtns: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { borderWidth: 1, borderRadius: 14, padding: Spacing.three, marginTop: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 4 },
  dayCard: { borderRadius: 12, borderWidth: 1, padding: Spacing.three, marginTop: Spacing.two, gap: 6 },
  dayName: { fontSize: 16, fontWeight: '700' },
  exRow: { paddingVertical: 4 },
  exName: { fontSize: 15, fontWeight: '600' },
});
