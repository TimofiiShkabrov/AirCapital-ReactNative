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

  const filtered = useMemo(() => {
    const start = chartRangeStartDate(range);
    return snapshots
      .filter((s) => new Date(s.timestamp) >= start)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [snapshots, range]);

  if (filtered.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>{t('chart.not_enough_data')}</Text>
      </View>
    );
  }

  const values = filtered.map((s) => s.balanceUSDT);
  const times = filtered.map((s) => new Date(s.timestamp).getTime());

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  const rangeV = maxV - minV || 1;
  const rangeT = maxT - minT || 1;

  const PAD = { top: 8, bottom: 20, left: 4, right: 4 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const points = filtered.map((s, i) => {
    const x = PAD.left + ((times[i] - minT) / rangeT) * chartW;
    const y = PAD.top + chartH - ((s.balanceUSDT - minV) / rangeV) * chartH;
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
