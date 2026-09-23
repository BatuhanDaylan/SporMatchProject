import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

const PRESETS = [60, 90, 120, 180];

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

/** Setler arası dinlenme sayacı — süre seç, başlat; bitince titreşir. */
export function RestTimer() {
  const c = useColors();
  const [total, setTotal] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          Vibration.vibrate(500);
          setRunning(false);
          return total;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, total]);

  function pick(sec: number) {
    setTotal(sec);
    setRemaining(sec);
    setRunning(false);
  }

  const progress = 1 - remaining / total;

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundElement }]}>
      <View style={styles.head}>
        <Ionicons name="timer-outline" size={18} color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>Dinlenme</Text>
        <Text style={[styles.time, { color: running ? c.primary : c.text }]}>{fmt(remaining)}</Text>
      </View>

      {/* İlerleme çubuğu */}
      <View style={[styles.track, { backgroundColor: c.background }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: c.primary }]} />
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Pressable
            key={p}
            onPress={() => pick(p)}
            style={[
              styles.preset,
              { borderColor: total === p ? c.primary : c.border, backgroundColor: total === p ? c.primary : 'transparent' },
            ]}>
            <Text style={{ color: total === p ? c.onPrimary : c.textSecondary, fontWeight: '600', fontSize: 13 }}>
              {p < 60 ? `${p}sn` : `${p / 60}dk`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setRunning((r) => !r)}
          style={[styles.mainBtn, { backgroundColor: c.primary }]}>
          <Ionicons name={running ? 'pause' : 'play'} size={18} color={c.onPrimary} />
          <Text style={{ color: c.onPrimary, fontWeight: '700' }}>{running ? 'Duraklat' : 'Başlat'}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setRunning(false);
            setRemaining(total);
          }}
          style={[styles.resetBtn, { borderColor: c.border }]}>
          <Ionicons name="refresh" size={18} color={c.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  time: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  presets: { flexDirection: 'row', gap: Spacing.two },
  preset: { flex: 1, height: 34, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  mainBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
