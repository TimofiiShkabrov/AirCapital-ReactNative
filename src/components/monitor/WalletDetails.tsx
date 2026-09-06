import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import type { AccountObservation, AccountSync } from "../../types/monitor";
import { Card, Heading, Label, useMoney, useQuantity, s } from "./primitives";
import { useMonitorTheme } from "./theme";
import { isWalletVisible } from "../../domain/walletVisibility";
import { walletNameKey, valuationKey } from "../../i18n/walletNames";
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
  const wallets = observation?.wallets.filter(isWalletVisible) ?? [];
  return (
    <Card>
      <Heading>{t("monitor.wallets")}</Heading>
      {sync?.status === "stale" && observation && (
        <Label>
          {t("monitor.savedAt", {
            date: new Date(observation.observedAt).toLocaleString(
              i18n.language,
            ),
          })}
        </Label>
      )}
      {wallets.map((w) => (
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
            <Text style={{ color: c.text, flexShrink: 1 }}>
              {walletNameKey(w.name) ? t(walletNameKey(w.name)!) : w.name}
            </Text>
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
      {observation && wallets.length === 0 && (
        <Label>{t("monitor.noVisibleWallets")}</Label>
      )}
      {!observation && <Label>{t("monitor.notObserved")}</Label>}
      {observation?.issues
        .filter((x) => !x.includes(":"))
        .map((issue) => (
          <Label key={issue}>
            {t(`monitor.${issue}`, { defaultValue: t("monitor.partial") })}
          </Label>
        ))}
      {sync?.lastSuccessAt && (
        <Label>
          {t("monitor.lastSuccess")}:{" "}
          {sync?.lastSuccessAt
            ? new Date(sync.lastSuccessAt).toLocaleString(i18n.language)
            : "—"}
        </Label>
      )}
      {observation?.valuationSource && (
        <Label>
          {t("monitor.sourceNote")}:{" "}
          {valuationKey(observation.valuationSource)
            ? t(valuationKey(observation.valuationSource)!)
            : observation.valuationSource}
        </Label>
      )}
    </Card>
  );
}
