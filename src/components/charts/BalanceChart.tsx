import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Polyline } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { BalanceSnapshot, ChartRange } from '../../types/common';
import { chartRangeStartDate } from '../../types/common';
import { FontSize } from '../../constants/theme';

interface Props {
  snapshots: BalanceSnapshot[];
  range: ChartRange;
  height?: number;
}

export default function BalanceChart({ snapshots, range, height = 120 }: Props) {
  const { t } = useTranslation();
  const WIDTH = 340;

  const pointsData = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const hasNonZero = sorted.some((s) => s.balanceUSDT > 0.000001);
    const usable = hasNonZero ? sorted.filter((s) => s.balanceUSDT > 0.000001) : sorted;
    if (usable.length < 2) return [];

    const start = chartRangeStartDate(range).getTime();
    const end = Date.now();
    const inRange = usable.filter((s) => {
      const time = new Date(s.timestamp).getTime();
      return time >= start && time <= end;
    });

    if (inRange.length === 0) {
      const latest = [...usable].reverse().find((s) => new Date(s.timestamp).getTime() <= end);
      if (!latest) return [];
      return [
        { timestamp: start, balanceUSDT: latest.balanceUSDT },
        { timestamp: end, balanceUSDT: latest.balanceUSDT },
      ];
    }

    const points = inRange.map((s) => ({
      timestamp: new Date(s.timestamp).getTime(),
      balanceUSDT: s.balanceUSDT,
    }));

    const beforeRange = [...usable]
      .reverse()
      .find((s) => new Date(s.timestamp).getTime() < start);
    if (beforeRange) {
      points.unshift({ timestamp: start, balanceUSDT: beforeRange.balanceUSDT });
    } else if (points[0].timestamp > start) {
      points.unshift({ timestamp: start, balanceUSDT: points[0].balanceUSDT });
    }

    const last = points[points.length - 1];
    if (last.timestamp < end) {
      points.push({ timestamp: end, balanceUSDT: last.balanceUSDT });
    }

    return points;
  }, [snapshots, range]);

  if (pointsData.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>{t('chart.not_enough_data')}</Text>
      </View>
    );
  }

  const values = pointsData.map((s) => s.balanceUSDT);
  const times = pointsData.map((s) => s.timestamp);

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  const yPadding = minV === maxV ? Math.max(1, minV * 0.05) : (maxV - minV) * 0.25;
  const lowerV = minV - yPadding;
  const upperV = maxV + yPadding;
  const rangeV = upperV - lowerV || 1;
  const rangeT = maxT - minT || 1;

  const PAD = { top: 8, bottom: 20, left: 4, right: 4 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const points = pointsData.map((s, i) => {
    const x = PAD.left + ((times[i] - minT) / rangeT) * chartW;
    const y = PAD.top + chartH - ((s.balanceUSDT - lowerV) / rangeV) * chartH;
    return `${x},${y}`;
  });

  const isPositive = values[values.length - 1] >= values[0];
  const lineColor = isPositive ? '#34C759' : '#FF3B30';
  const gradId = 'balGrad';

  const lastPt = points[points.length - 1].split(',');
  const firstX = points[0].split(',')[0];

  const areaPath = `M ${points.join(' L ')} L ${lastPt[0]},${PAD.top + chartH} L ${firstX},${PAD.top + chartH} Z`;

  const formatUsdt = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${WIDTH} ${height}`}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.30" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0.00" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill={`url(#${gradId})`} />
        <Polyline
          points={points.join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.yLabels}>
        <Text style={styles.yLabel}>{formatUsdt(maxV)}</Text>
        <Text style={styles.yLabel}>{formatUsdt(minV)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.40)',
  },
  yLabels: {
    position: 'absolute',
    top: 8,
    right: 8,
    bottom: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontVariant: ['tabular-nums'],
  },
});
