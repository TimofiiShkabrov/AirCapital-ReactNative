import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Exchange } from '../../types/common';
import { EXCHANGE_CONFIG } from '../../constants/exchanges';
import { FontSize, Spacing } from '../../constants/theme';

export interface ChartSlice {
  exchange: Exchange;
  balance: number;
  share: number;
}

interface Props {
  slices: ChartSlice[];
  size?: number;
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const cos = Math.cos;
  const sin = Math.sin;
  const outerX1 = cx + outerR * cos(startAngle);
  const outerY1 = cy + outerR * sin(startAngle);
  const outerX2 = cx + outerR * cos(endAngle);
  const outerY2 = cy + outerR * sin(endAngle);
  const innerX1 = cx + innerR * cos(endAngle);
  const innerY1 = cy + innerR * sin(endAngle);
  const innerX2 = cx + innerR * cos(startAngle);
  const innerY2 = cy + innerR * sin(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${outerX1} ${outerY1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
    `L ${innerX1} ${innerY1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerX2} ${innerY2}`,
    'Z',
  ].join(' ');
}

const GAP_DEG = 1.5;
const GAP = (GAP_DEG * Math.PI) / 180;

export default function StructureChart({ slices, size = 160 }: Props) {
  const R = size / 2;
  const INNER = R * 0.58;

  const arcs = useMemo(() => {
    let start = -Math.PI / 2;
    return slices.map((slice) => {
      const sweep = slice.share * 2 * Math.PI;
      const s = start;
      const e = start + sweep - GAP;
      start += sweep;
      return { slice, s, e };
    });
  }, [slices]);

  if (slices.length === 0) return null;

  return (
    <View style={styles.row}>
      <Svg width={size} height={size}>
        {arcs.map(({ slice, s, e }) => (
          <Path
            key={slice.exchange}
            d={describeDonutSlice(R, R, R - 1, INNER, s, e)}
            fill={EXCHANGE_CONFIG[slice.exchange].color}
            opacity={0.9}
          />
        ))}
        <Circle cx={R} cy={R} r={INNER - 1} fill="rgba(13,18,25,0.95)" />
      </Svg>
      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.exchange} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: EXCHANGE_CONFIG[slice.exchange].color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {EXCHANGE_CONFIG[slice.exchange].label}
            </Text>
            <Text style={styles.legendPct}>{(slice.share * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  legend: {
    flex: 1,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendName: {
    flex: 1,
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  legendPct: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
});
