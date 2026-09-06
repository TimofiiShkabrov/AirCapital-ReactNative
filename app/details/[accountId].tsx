import React, { useCallback, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePortfolioStore } from "../../src/store/portfolioStore";
import { getSnapshots } from "../../src/services/balanceHistory";
import { periodHistory, periodMetrics } from "../../src/domain/analytics";
import { useMonitorTheme } from "../../src/components/monitor/theme";
import {
  Card,
  Heading,
  IconButton,
  Label,
  Action,
  useMoney,
  s,
} from "../../src/components/monitor/primitives";
import HistoryChart from "../../src/components/monitor/HistoryChart";
import WalletDetails from "../../src/components/monitor/WalletDetails";
import { EXCHANGE_CONFIG } from "../../src/constants/exchanges";
import type { BalanceSnapshot } from "../../src/types/common";
export default function AccountDetails() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>(),
    router = useRouter(),
    { t } = useTranslation(),
    c = useMonitorTheme(),
    money = useMoney(),
    portfolio = usePortfolioStore();
  const loadData = usePortfolioStore((s) => s.loadData);
  const [history, setHistory] = useState<BalanceSnapshot[]>([]),
    [error, setError] = useState(false);
  const account = portfolio.accounts.find((a) => a.id === accountId),
    observation = portfolio.observations[accountId],
    sync = portfolio.sync[accountId];
  useFocusEffect(
    useCallback(() => {
      void loadData().then(async () => {
        try {
          setHistory(await getSnapshots({ type: "account", accountId }));
        } catch {
          setError(true);
        }
      });
    }, [accountId, loadData]),
  );
  const snapshots = periodHistory(history, "month", Date.now(), [accountId]),
    metrics = periodMetrics(snapshots, [accountId]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={[
          s.row,
          { paddingHorizontal: 20 },
          c.rtl && { flexDirection: "row-reverse" },
        ]}
      >
        <IconButton
          label={t("monitor.back")}
          icon="arrow-back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <Heading>
          {account
            ? EXCHANGE_CONFIG[account.exchange].label
            : t("monitor.accounts")}
        </Heading>
        <IconButton
          label={t("monitor.settings")}
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
      </View>
      <ScrollView contentContainerStyle={s.page}>
        {error && <Label>{t("monitor.storageError")}</Label>}
        <Card>
          <Label>{account?.label || t("monitor.balance")}</Label>
          <Text style={{ fontSize: 34, fontWeight: "600", color: c.text }}>
            {sync?.status === "partial" ? "≈ " : ""}
            {money(observation?.balanceUSDT)}{" "}
            <Text style={{ fontSize: 14 }}>USDT</Text>
          </Text>
          <Label>{t(`monitor.${sync?.status ?? "error"}`)}</Label>
          {sync?.error && (
            <Label>
              {t(`monitor.${sync.error}`, {
                defaultValue: t("monitor.genericError"),
              })}
            </Label>
          )}
          {metrics && (
            <Text
              style={{ color: metrics.delta < 0 ? c.negative : c.positive }}
            >
              {money(metrics.delta, true)} USDT (
              {money(metrics.percent, true, true)})
            </Text>
          )}
          <HistoryChart snapshots={snapshots} />
        </Card>
        <WalletDetails observation={observation} sync={sync} />
        <Action
          label={t("monitor.flows")}
          onPress={() => router.push("/flows")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
