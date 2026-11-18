import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { useColors } from '@/hooks/useColors';

export type ChartPoint = { label: string; value: number };

type Props = {
  points: ChartPoint[];
  height?: number;
  unit?: string;
};

/** Bağımlılıksız, tema-duyarlı basit çizgi grafik (ilerleme takibi için). */
export function LineChart({ points, height = 180, unit }: Props) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padR = 12;
  const padT = 12;
  const padB = 24;

  const geom = useMemo(() => {
    if (points.length === 0 || width === 0) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Eksen değerlerinin genişliği kadar sol boşluk (büyük sayılar çizgiyle çakışmasın)
    const padL = Math.max(28, Math.max(formatNum(min).length, formatNum(max).length) * 6 + 10);
    // Tüm değerler eşitse çizgi eksenin dibine yapışmasın: ortada dursun
    const pad = max === min ? Math.abs(max) * 0.1 || 1 : (max - min) * 0.08;
    const lo = min - pad;
    const span = max + pad - lo;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const yOf = (v: number) => padT + innerH - ((v - lo) / span) * innerH;

    const coords = points.map((p, i) => ({
      x: padL + (points.length > 1 ? i * stepX : innerW / 2),
      y: yOf(p.value),
    }));
    return { min, max, padL, yMin: yOf(min), yMax: yOf(max), coords, polyline: coords.map((c) => `${c.x},${c.y}`).join(' ') };
  }, [points, width, height]);

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
      {geom && width > 0 ? (
        <Svg width={width} height={height}>
          {/* Eksenler */}
          <Line x1={geom.padL} y1={padT} x2={geom.padL} y2={height - padB} stroke={c.border} strokeWidth={1} />
          <Line x1={geom.padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={c.border} strokeWidth={1} />
          {/* En yüksek / en düşük değer: kendi yüksekliklerinde kesikli kılavuz + etiket */}
          <Line x1={geom.padL} y1={geom.yMax} x2={width - padR} y2={geom.yMax} stroke={c.border} strokeWidth={1} strokeDasharray="4 4" />
          <SvgText x={geom.padL - 6} y={geom.yMax + 3} fontSize={10} fill={c.textSecondary} textAnchor="end">
            {formatNum(geom.max)}
          </SvgText>
          {geom.min !== geom.max && (
            <>
              <Line x1={geom.padL} y1={geom.yMin} x2={width - padR} y2={geom.yMin} stroke={c.border} strokeWidth={1} strokeDasharray="4 4" />
              <SvgText x={geom.padL - 6} y={geom.yMin + 3} fontSize={10} fill={c.textSecondary} textAnchor="end">
                {formatNum(geom.min)}
              </SvgText>
            </>
          )}

          <Polyline points={geom.polyline} fill="none" stroke={c.primary} strokeWidth={2} />
          {geom.coords.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={3} fill={c.primary} />
          ))}

          {/* İlk ve son tarih etiketi */}
          <SvgText x={geom.padL} y={height - 6} fontSize={9} fill={c.textSecondary}>
            {points[0].label}
          </SvgText>
          {points.length > 1 && (
            <SvgText
              x={width - padR}
              y={height - 6}
              fontSize={9}
              fill={c.textSecondary}
              textAnchor="end">
              {points[points.length - 1].label}
            </SvgText>
          )}
        </Svg>
      ) : points.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
            Henüz kayıt yok. Antrenman kaydettikçe ilerlemen burada çizilir.
          </Text>
        </View>
      ) : null}
      </View>
      {unit ? <Text style={[styles.unit, { color: c.textSecondary }]}>Birim: {unit}</Text> : null}
    </View>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace('.', ',');
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unit: { fontSize: 11, marginTop: 4 },
});
