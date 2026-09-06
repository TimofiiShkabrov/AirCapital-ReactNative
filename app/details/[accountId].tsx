import React, { useCallback } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
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
import { useScreenLoad } from "../../src/hooks/useScreenLoad";
import { loadAccountData } from "../../src/services/screenData";
import { LoadBoundary } from "../../src/components/monitor/LoadState";
export default function AccountDetails() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>(),
    router = useRouter(),
    { t } = useTranslation(),
    c = useMonitorTheme(),
    money = useMoney();
  const load = useScreenLoad(
    useCallback(() => loadAccountData(accountId), [accountId]),
  );
  const { account, observation, sync, history = [] } = load.data ?? {};
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
        <LoadBoundary
          loading={load.isLoading}
          error={load.error}
          onRetry={() => void load.reload()}
        >
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
        </LoadBoundary>
      </ScrollView>
    </SafeAreaView>
  );
}
