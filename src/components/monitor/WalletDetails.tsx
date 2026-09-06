import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import type { AccountObservation, AccountSync } from "../../types/monitor";
import { Card, Heading, Label, useMoney, useQuantity, s } from "./primitives";
import { useMonitorTheme } from "./theme";
export default function WalletDetails({
  observation,
  sync,
}: {
  observation?: AccountObservation;
  sync?: AccountSync;
}) {
  const c = useMonitorTheme(),
    money = useMoney(),
    quantity = useQuantity(),
    { t, i18n } = useTranslation();
  return (
    <Card>
      <Heading>{t("monitor.wallets")}</Heading>
      {(observation?.wallets ?? []).map((w) => (
        <View
          key={w.id}
          style={{
            gap: 7,
            borderBottomColor: c.line,
            borderBottomWidth: 1,
            paddingVertical: 10,
          }}
        >
          <View style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}>
            <Text style={{ color: c.text, flexShrink: 1 }}>{w.name}</Text>
            <Text style={{ color: c.text }}>{money(w.balanceUSDT)} USDT</Text>
          </View>
          {w.status !== "complete" && <Label>{t(`monitor.${w.status}`)}</Label>}
          {w.assets.map((a, i) => (
            <View
              key={`${a.asset}-${i}`}
              style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}
            >
              <Label>
                {a.asset} · {quantity(a.quantity)}
              </Label>
              <Label>{money(a.valueUSDT)} USDT</Label>
            </View>
          ))}
        </View>
      ))}
      {!observation && <Label>{t("monitor.notObserved")}</Label>}
      {observation?.issues
        .filter((x) => !x.includes(":"))
        .map((issue) => (
          <Label key={issue}>
            {t(`monitor.${issue}`, { defaultValue: t("monitor.partial") })}
          </Label>
        ))}
      <Label>
        {t("monitor.lastSuccess")}:{" "}
        {sync?.lastSuccessAt
          ? new Date(sync.lastSuccessAt).toLocaleString(i18n.language)
          : "—"}
      </Label>
      {observation?.valuationSource && (
        <Label>
          {t("monitor.sourceNote")}: {observation.valuationSource}
        </Label>
      )}
    </Card>
  );
}
