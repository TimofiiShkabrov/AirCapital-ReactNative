import React, { useMemo, useState } from "react";
import { View, Pressable, Text as NativeText } from "react-native";
import Svg, { Path, Line, Circle, Text } from "react-native-svg";
import { useTranslation } from "react-i18next";
import type { BalanceSnapshot } from "../../types/common";
import { useMonitorTheme } from "./theme";
import { useSettingsStore } from "../../store/settingsStore";
import { Label, useMoney } from "./primitives";

export default function HistoryChart({
  snapshots,
  demo = false,
}: {
  snapshots: BalanceSnapshot[];
  demo?: boolean;
}) {
  const c = useMonitorTheme(),
    { t, i18n } = useTranslation(),
    money = useMoney();
  const hidden = useSettingsStore((s) => s.hideAmounts);
  const [width, setWidth] = useState(300),
    [selected, setSelected] = useState<number>();
  const values = useMemo(() => {
    if (snapshots.length <= 300) return snapshots;
    const result: BalanceSnapshot[] = [];
    const step = Math.ceil(snapshots.length / 140);
    for (let i = 0; i < snapshots.length; i += step) {
      const group = snapshots.slice(i, i + step);
      const min = group.reduce((a, b) =>
          a.balanceUSDT < b.balanceUSDT ? a : b,
        ),
        max = group.reduce((a, b) => (a.balanceUSDT > b.balanceUSDT ? a : b));
      result.push(min, max);
    }
    return [
      ...new Set([snapshots[0], ...result, snapshots[snapshots.length - 1]]),
    ].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }, [snapshots]);
  if (hidden)
    return (
      <View
        style={{ height: 190, alignItems: "center", justifyContent: "center" }}
      >
        <Label>••••</Label>
      </View>
    );
  if (!values.length)
    return (
      <View style={{ paddingVertical: 30 }}>
        <Label>{t("monitor.noHistory")}</Label>
      </View>
    );
  const h = 188,
    left = 76,
    right = 12,
    top = 20,
    bottom = 42;
  const low = Math.min(...values.map((v) => v.balanceUSDT)),
    high = Math.max(...values.map((v) => v.balanceUSDT));
  const padding = Math.max((high - low) * 0.22, Math.abs(high) * 0.002, 0.01);
  const min = low - padding,
    max = high + padding;
  const start = Date.parse(values[0].timestamp),
    end = Date.parse(values[values.length - 1].timestamp);
  const x = (date: string) =>
    left +
    (end === start ? 0.5 : (Date.parse(date) - start) / (end - start)) *
      Math.max(1, width - left - right);
  const y = (value: number) =>
    top + ((max - value) / (max - min)) * (h - top - bottom);
  const path = values
    .map(
      (v, i) =>
        `${!i || (!demo && Date.parse(v.timestamp) - Date.parse(values[i - 1].timestamp) > 30 * 60000) ? "M" : "L"}${x(v.timestamp)},${y(v.balanceUSDT)}`,
    )
    .join(" ");
  const date = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    });
  const active =
    selected === undefined
      ? undefined
      : values[Math.min(selected, values.length - 1)];
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("monitor.change")}: ${date(values[0].timestamp)} ${money(values[0].balanceUSDT)} USDT; ${date(values[values.length - 1].timestamp)} ${money(values[values.length - 1].balanceUSDT)} USDT`}
        onPress={(e) => {
          const px = e.nativeEvent.locationX;
          setSelected(
            values.reduce(
              (best, p, i) =>
                Math.abs(x(p.timestamp) - px) <
                Math.abs(x(values[best].timestamp) - px)
                  ? i
                  : best,
              0,
            ),
          );
        }}
      >
        <Svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`}>
          <Text x={0} y={12} fill={c.muted} fontSize={11}>
            USDT
          </Text>
          {[low, (low + high) / 2, high]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((v, i) => (
              <React.Fragment key={i}>
                <Line
                  x1={left}
                  x2={width - right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={c.line}
                />
                <Text
                  x={left - 8}
                  y={y(v) + 4}
                  textAnchor="end"
                  fill={c.muted}
                  fontSize={11}
                >
                  {new Intl.NumberFormat(i18n.language, {
                    notation:
                      v !== 0 && Math.abs(v) < 0.01 ? "scientific" : "compact",
                    maximumFractionDigits: 1,
                  }).format(v)}
                </Text>
              </React.Fragment>
            ))}
          <Path
            d={path}
            fill="none"
            stroke={c.accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {values.length < 20 &&
            values.map((v) => (
              <Circle
                key={v.id}
                cx={x(v.timestamp)}
                cy={y(v.balanceUSDT)}
                r={3}
                fill={c.accent}
              />
            ))}
          <Text x={left} y={h - 22} fill={c.muted} fontSize={11}>
            {date(values[0].timestamp)}
          </Text>
          <Text
            x={width - right}
            y={h - 22}
            textAnchor="end"
            fill={c.muted}
            fontSize={11}
          >
            {date(values[values.length - 1].timestamp)}
          </Text>
          <Text
            x={(left + width - right) / 2}
            y={h - 4}
            textAnchor="middle"
            fill={c.muted}
            fontSize={11}
          >
            {t("monitor.date")}
          </Text>
          {active && (
            <Circle
              cx={x(active.timestamp)}
              cy={y(active.balanceUSDT)}
              r={5}
              fill={c.accent}
              stroke={c.panel}
              strokeWidth={2}
            />
          )}
        </Svg>
      </Pressable>
      {active && (
        <NativeText
          accessibilityLiveRegion="polite"
          style={{ color: c.text, fontSize: 12, textAlign: "center" }}
        >
          {new Date(active.timestamp).toLocaleString(i18n.language)} ·{" "}
          {money(active.balanceUSDT)} USDT
        </NativeText>
      )}
    </View>
  );
}
