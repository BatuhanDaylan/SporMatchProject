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

  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 24;

  const geom = useMemo(() => {
    if (points.length === 0 || width === 0) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

    const coords = points.map((p, i) => {
      const x = padL + (points.length > 1 ? i * stepX : innerW / 2);
      const y = padT + innerH - ((p.value - min) / span) * innerH;
      return { x, y };
    });
    return { min, max, coords, polyline: coords.map((c) => `${c.x},${c.y}`).join(' ') };
  }, [points, width, height]);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {geom && width > 0 ? (
        <Svg width={width} height={height}>
          {/* Yatay kılavuz + eksen değerleri */}
          <Line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={c.border} strokeWidth={1} />
          <Line
            x1={padL}
            y1={height - padB}
            x2={width - padR}
            y2={height - padB}
            stroke={c.border}
            strokeWidth={1}
          />
          <SvgText x={4} y={padT + 4} fontSize={10} fill={c.textSecondary}>
            {formatNum(geom.max)}
          </SvgText>
          <SvgText x={4} y={height - padB} fontSize={10} fill={c.textSecondary}>
            {formatNum(geom.min)}
          </SvgText>

          <Polyline points={geom.polyline} fill="none" stroke={c.primary} strokeWidth={2} />
          {geom.coords.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={3} fill={c.primary} />
          ))}

          {/* İlk ve son tarih etiketi */}
          <SvgText x={padL} y={height - 6} fontSize={9} fill={c.textSecondary}>
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
      ) : (
        <View style={styles.empty}>
          <Text style={{ color: c.textSecondary }}>Grafik için yeterli veri yok.</Text>
        </View>
      )}
      {unit ? <Text style={[styles.unit, { color: c.textSecondary }]}>Birim: {unit}</Text> : null}
    </View>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unit: { fontSize: 11, marginTop: 4 },
});
