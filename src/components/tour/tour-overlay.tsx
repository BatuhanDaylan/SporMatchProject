import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { measureTarget, type Rect } from '@/components/tour/registry';
import { activeScroll } from '@/components/tour/scroll-registry';
import { TOURS } from '@/components/tour/tours';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useTourStore } from '@/store/tour';
import { Elevation, Spacing } from '@/constants/theme';

const PAD = 6; // hedefin etrafındaki boşluk
const MASK = 'rgba(0,0,0,0.72)';
const WAIT_MS = 2200; // hedef bu sürede görünmezse kullanıcıya "adımı atla" seçeneği sun
const NAV_FALLBACK_MS = 2500; // adımın ekranında değilsek bu süre sonra oraya yönlendir

const sameRect = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1;

/**
 * Etkileşimli tanıtım katmanı. Hedefin dışını karartan dört panel kullanır; hedef alanı AÇIK kalır,
 * böylece dokunuş gerçek öğeye ulaşır. Kökte bir kez mount edilir; tanıtım yokken hiçbir şey çizmez.
 */
export function TourOverlay() {
  const c = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { width: W, height: H } = useWindowDimensions();

  const active = useTourStore((s) => s.active);
  const setIndex = useTourStore((s) => s.setIndex);
  const stop = useTourStore((s) => s.stop);
  const markDone = useTourStore((s) => s.markDone);

  const steps = active ? TOURS[active.id] : null;
  const step = steps && active ? steps[active.index] : undefined;
  const homes = step ? (Array.isArray(step.home) ? step.home : [step.home]) : [];
  const atHome = !!step && homes.includes(pathname);

  const rootRef = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState<Rect | null>(null);
  const [waitedLong, setWaitedLong] = useState(false);
  const scrolledFor = useRef('');

  // Adıma girdiğimiz ekran: 'tap' adımında hedef ekrana GEÇİNCE ilerlemek için (zaten oradaysak "Devam").
  const stepKey = active ? `${active.id}:${active.index}` : '';
  const entry = useRef({ key: '', path: '' });
  if (entry.current.key !== stepKey) entry.current = { key: stepKey, path: pathname };
  const alreadyThere = step?.advance === 'tap' && !!step.route && entry.current.path === step.route;

  const finish = useCallback(() => {
    if (user) markDone(user.id);
    stop();
  }, [user, markDone, stop]);

  // Adımlar bittiyse (son adımdan sonra) turu kapat.
  useEffect(() => {
    if (active && !step) finish();
  }, [active, step, finish]);

  // Oturum kapanırsa tur da kapansın.
  useEffect(() => {
    if (!user && active) stop();
  }, [user, active, stop]);

  // Katmanın pencere içindeki başlangıç noktası (hedef koordinatları pencereye göre ölçülür).
  useEffect(() => {
    rootRef.current?.measureInWindow((x, y) => setOrigin({ x, y }));
  }, [atHome, W, H]);

  // Hedefi düzenli ölç; görünür alan dışındaysa ekranı kaydır.
  useEffect(() => {
    setRect(null);
    setWaitedLong(false);
    scrolledFor.current = '';
    if (!active || !step?.target || !atHome) return;
    const key = `${active.id}:${active.index}`;
    let alive = true;
    const waitTimer = setTimeout(() => alive && setWaitedLong(true), WAIT_MS);
    const tick = () =>
      measureTarget(step.target!, (r) => {
        if (!alive) return;
        setRect((prev) => (prev && r && sameRect(prev, r) ? prev : r));
        if (r && scrolledFor.current !== key) {
          scrolledFor.current = key;
          if (!step.fixed && (r.y < 90 || r.y + r.h > H - 240)) {
            const sc = activeScroll();
            sc?.ref.current?.scrollTo({ y: Math.max(0, sc.offset.y + (r.y - H * 0.28)), animated: true });
          }
        }
      });
    tick();
    const t = setInterval(tick, 250);
    return () => {
      alive = false;
      clearInterval(t);
      clearTimeout(waitTimer);
    };
  }, [active?.id, active?.index, atHome, H]); // eslint-disable-line react-hooks/exhaustive-deps

  // 'tap'/'route' adımı: kullanıcı beklenen ekrana geçince otomatik ilerle.
  useEffect(() => {
    if (!active || !step?.route) return;
    if (step.advance !== 'tap' && step.advance !== 'route') return;
    if (pathname === step.route && entry.current.path !== step.route) setIndex(active.index + 1);
  }, [pathname, active?.id, active?.index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adımın ekranında değilsek (ör. kullanıcı geri döndü) kısa süre sonra oraya götür.
  useEffect(() => {
    if (!active || !step || atHome) return;
    if ((step.advance === 'route' || step.advance === 'tap') && pathname === step.route) return;
    const t = setTimeout(() => router.navigate(homes[0] as never), NAV_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [active?.id, active?.index, atHome, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !step || !steps) return null;

  const isLast = active.index === steps.length - 1;
  const next = () => setIndex(active.index + 1);
  const hasTarget = !!step.target;
  const effectiveAdvance = alreadyThere ? 'next' : step.advance;
  const showSpot = atHome && hasTarget && !!rect;
  const targetMissing = atHome && hasTarget && !rect && waitedLong;

  // Hedef çerçevesi (kök koordinatlarına çevrilmiş, kenarlıkla genişletilmiş).
  const R = rect
    ? {
        x: Math.max(0, rect.x - origin.x - PAD),
        y: Math.max(0, rect.y - origin.y - PAD),
        w: rect.w + PAD * 2,
        h: rect.h + PAD * 2,
      }
    : null;

  // Kart: hedefin altında/üstünde, hangisinde yer fazlaysa.
  let cardPos: { top?: number; bottom?: number } = { bottom: 28 };
  if (showSpot && R) {
    const below = H - (R.y + R.h);
    const above = R.y;
    if (below >= above && below > 190) cardPos = { top: R.y + R.h + 12 };
    else if (above > 190) cardPos = { bottom: H - R.y + 12 };
  } else if (atHome && !hasTarget && effectiveAdvance === 'next') {
    cardPos = { top: H * 0.3 };
  }

  const card = (
    <View
      style={[
        styles.card,
        Elevation.card,
        cardPos,
        { backgroundColor: c.backgroundElement, borderColor: c.border },
      ]}>
      <View style={styles.cardTop}>
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>
          {active.index + 1} / {steps.length}
        </Text>
        <Pressable onPress={finish} hitSlop={10} accessibilityRole="button" accessibilityLabel="Turu kapat">
          <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700' }}>Turu kapat</Text>
        </Pressable>
      </View>
      <Text style={[styles.title, { color: c.text }]}>{step.title}</Text>
      <Text style={[styles.text, { color: c.textSecondary }]}>
        {targetMissing
          ? 'Bu öğe şu an ekranda görünmüyor. İstersen adımı atlayabilirsin.'
          : alreadyThere
            ? step.here ?? 'Zaten bu ekrandasın, devam edelim.'
            : step.text}
      </Text>
      {effectiveAdvance === 'next' && !targetMissing ? (
        <Pressable
          onPress={next}
          style={[styles.btn, { backgroundColor: c.primary }]}
          accessibilityRole="button">
          <Text style={{ color: c.onPrimary, fontWeight: '800', fontSize: 15 }}>{isLast ? 'Bitir' : 'Devam'}</Text>
        </Pressable>
      ) : (
        <View style={styles.hintRow}>
          <Text style={{ color: c.primary, fontSize: 13, fontWeight: '700', flex: 1 }}>
            {effectiveAdvance === 'tap' && !targetMissing ? '👆 Vurgulanan yere dokun' : ''}
          </Text>
          <Pressable onPress={next} hitSlop={8} accessibilityRole="button" accessibilityLabel="Adımı atla">
            <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700' }}>Adımı atla</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View ref={rootRef} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {atHome && showSpot && R ? (
        <>
          {/* Hedefin etrafındaki 4 karartma paneli — hedef alanı boş bırakır, dokunuş içeri geçer. */}
          <View style={[styles.mask, { top: 0, left: 0, right: 0, height: R.y }]} />
          <View style={[styles.mask, { top: R.y + R.h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.mask, { top: R.y, left: 0, width: R.x, height: R.h }]} />
          <View style={[styles.mask, { top: R.y, left: R.x + R.w, right: 0, height: R.h }]} />
          <View
            pointerEvents="none"
            style={[styles.ring, { top: R.y, left: R.x, width: R.w, height: R.h, borderColor: c.primary }]}
          />
          {card}
        </>
      ) : atHome && !hasTarget && effectiveAdvance === 'next' ? (
        <>
          <View style={[styles.mask, StyleSheet.absoluteFill]} />
          {card}
        </>
      ) : atHome && (!hasTarget || targetMissing) ? (
        /* Hedefsiz 'geri dön' ipucu veya bulunamayan hedef: karartmadan yalnızca kart. */
        card
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: MASK },
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 14 },
  card: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800' },
  text: { fontSize: 14, lineHeight: 20 },
  btn: { height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
});
