import React, { useMemo, useState } from "react";
import { View, Pressable, Text as NativeText } from "react-native";
import Svg, { Path, Line, Circle, Text } from "react-native-svg";
import { useTranslation } from "react-i18next";
import type { BalanceSnapshot } from "../../types/common";
import { historyChartModel } from "../../domain/historyChart";
import { useMonitorTheme } from "./theme";
import { useSettingsStore } from "../../store/settingsStore";
import { Label, useMoney } from "./primitives";

export default function HistoryChart({ snapshots, demo = false, height = 188 }: {
  snapshots: BalanceSnapshot[];
  demo?: boolean;
  height?: number;
}) {
  const c = useMonitorTheme(), { t, i18n } = useTranslation(), money = useMoney();
  const hidden = useSettingsStore((s) => s.hideAmounts);
  const [width, setWidth] = useState(300), [selectedTime, setSelectedTime] = useState<number>();
  const chart = useMemo(() => historyChartModel(snapshots, width, height, i18n.language, demo),
    [snapshots, width, height, i18n.language, demo]);
  if (hidden) return <View style={{ height, alignItems: "center", justifyContent: "center" }}><Label>••••</Label></View>;
  if (!chart) return <View style={{ paddingVertical: 30 }}><Label>{t("monitor.noHistory")}</Label></View>;
  const { points } = chart;
  const first = points[0], last = points[points.length - 1];
  const active = points.find((point) => point.time === selectedTime);
  const dots = points.length < 20 ? points : [first, last];
  const fullDate = (time: number) => new Date(time).toLocaleString(i18n.language);
  return <View onLayout={(event) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0) setWidth(next);
  }}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("monitor.change")}: ${fullDate(first.time)} ${money(first.snapshot.balanceUSDT)} USDT; ${fullDate(last.time)} ${money(last.snapshot.balanceUSDT)} USDT`}
      onPress={(event) => {
        const px = event.nativeEvent.locationX * chart.width / width;
        const closest = points.reduce((best, point) => Math.abs(point.x - px) < Math.abs(best.x - px) ? point : best);
        setSelectedTime(closest.time);
      }}
    >
      <Svg width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
        <Text x={0} y={12} fill={c.muted} fontSize={11}>USDT</Text>
        {chart.ticks.map((tick, i) => <React.Fragment key={i}>
          <Line x1={chart.left} x2={chart.right} y1={tick.y} y2={tick.y} stroke={c.line} />
          <Text x={chart.left - 8} y={tick.y + 4} textAnchor="end" fill={c.muted} fontSize={11}>{tick.label}</Text>
        </React.Fragment>)}
        {!!chart.gapPath && <Path d={chart.gapPath} fill="none" stroke={c.accent} strokeWidth={2}
          strokeDasharray="5 5" strokeLinecap="round" />}
        <Path d={chart.solidPath} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {dots.map((point) => <Circle key={point.time} cx={point.x} cy={point.y} r={3} fill={c.accent} />)}
        {points.length === 1 ? <Text x={first.x} y={chart.height - 24} textAnchor="middle" fill={c.muted} fontSize={11}>{chart.startLabel}</Text> : <>
          <Text x={chart.left} y={chart.height - 24} fill={c.muted} fontSize={11}>{chart.startLabel}</Text>
          <Text x={chart.right} y={chart.height - 24} textAnchor="end" fill={c.muted} fontSize={11}>{chart.endLabel}</Text>
        </>}
        <Text x={(chart.left + chart.right) / 2} y={chart.height - 5} textAnchor="middle" fill={c.muted} fontSize={11}>
          {chart.sameDay ? new Date(first.time).toLocaleDateString(i18n.language, { day: "numeric", month: "short" }) : t("monitor.date")}
        </Text>
        {active && <Circle cx={active.x} cy={active.y} r={5} fill={c.accent} stroke={c.panel} strokeWidth={2} />}
      </Svg>
    </Pressable>
    {!!chart.gapPath && <Label style={{ fontSize: 11 }}>{t("monitor.historyGaps")}</Label>}
    {active && <NativeText accessibilityLiveRegion="polite" style={{ color: c.text, fontSize: 12, textAlign: "center" }}>
      {fullDate(active.time)} · {money(active.snapshot.balanceUSDT)} USDT
    </NativeText>}
  </View>;
}
