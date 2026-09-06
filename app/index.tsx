import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAccountsStore } from "../src/store/accountsStore";
import { usePortfolioStore } from "../src/store/portfolioStore";
import { useSettingsStore } from "../src/store/settingsStore";
import { loadAllSnapshots } from "../src/services/balanceHistory";
import {
  loadFlows,
  confirmCoverage,
  type FlowLedger,
} from "../src/services/cashFlows";
import { createDemo } from "../src/domain/demo";
import { periodHistory, periodMetrics } from "../src/domain/analytics";
import { sum } from "../src/domain/money";
import {
  scopeEquals,
  type BalanceSnapshot,
  type ChartRange,
  type Exchange,
  type BalanceScope,
} from "../src/types/common";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";
import HistoryChart from "../src/components/monitor/HistoryChart";
import WalletDetails from "../src/components/monitor/WalletDetails";
import { useMonitorTheme } from "../src/components/monitor/theme";
import {
  Action,
  Card,
  Confirm,
  Heading,
  IconButton,
  Label,
  Picker,
  s,
  useMoney,
} from "../src/components/monitor/primitives";

type Page = "overview" | "exchanges" | "statistics";
export default function HomeScreen() {
  const c = useMonitorTheme(),
    { t, i18n } = useTranslation(),
    money = useMoney(),
    router = useRouter();
  const loadAccounts = useAccountsStore((s) => s.loadAccounts),
    loadPortfolio = usePortfolioStore((s) => s.loadData);
  const portfolio = usePortfolioStore(),
    accountStore = useAccountsStore(),
    settings = useSettingsStore();
  const [page, setPage] = useState<Page>("overview"),
    [range, setRange] = useState<ChartRange>("month"),
    [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string>(),
    [demoMode, setDemoMode] = useState(false);
  const [history, setHistory] = useState<BalanceSnapshot[]>([]),
    [ledger, setLedger] = useState<FlowLedger>({ flows: [], coverage: [] });
  const [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(false),
    [saving, setSaving] = useState(false);
  const demo = useMemo(() => createDemo(Date.now()), []);
  const reload = useCallback(async () => {
    await loadAccounts();
    await loadPortfolio();
    try {
      setHistory(await loadAllSnapshots());
      setLedger(await loadFlows());
    } catch {
      setMessage(t("monitor.storageError"));
    }
  }, [loadAccounts, loadPortfolio, t]);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  useEffect(() => {
    if (demoMode) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void reload();
    });
    const timer = setInterval(
      () => {
        if (AppState.currentState === "active") void reload();
      },
      5 * 60 * 1000,
    );
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [demoMode, reload]);
  const accounts = demoMode ? demo.accounts : accountStore.accounts;
  const observations = demoMode ? demo.observations : portfolio.observations;
  const sync = demoMode ? demo.sync : portfolio.sync;
  const sourceHistory = demoMode ? demo.history : history;
  const now = demoMode ? demo.now : Date.now();
  const selected = accounts.filter(
    (a) => filter === "all" || a.exchange === filter,
  );
  const scope: BalanceScope =
    filter === "all"
      ? { type: "total" }
      : { type: "exchange", exchange: filter as Exchange };
  const snapshots = periodHistory(
    sourceHistory.filter((snap) => scopeEquals(snap.scope, scope)),
    range,
    now,
    selected.map((a) => a.id),
  );
  const metrics = periodMetrics(
    snapshots,
    selected.map((a) => a.id),
    demoMode ? demo.flows : ledger.flows,
    demoMode ? demo.coverage : ledger.coverage,
  );
  const known = selected.flatMap((a) =>
    observations[a.id]?.balanceUSDT === undefined
      ? []
      : [observations[a.id].balanceUSDT!],
  );
  const balance = known.length ? sum(known) : undefined;
  const complete =
    selected.length > 0 &&
    selected.every((a) => sync[a.id]?.status === "fresh");
  const coverageWarnings = [
    ...new Set(
      selected.flatMap(
        (a) =>
          observations[a.id]?.issues.filter((issue) =>
            issue.startsWith("coverage"),
          ) ?? [],
      ),
    ),
  ];
  const fullyCovered = complete && coverageWarnings.length === 0;
  const unavailableCount = selected.filter(
    (a) => sync[a.id]?.status !== "fresh",
  ).length;
  const labelDate = (date: string) =>
    new Date(date).toLocaleString(i18n.language, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const color = (n?: number) =>
    n === undefined ? c.muted : n < 0 ? c.negative : c.positive;
  const periods = (
    <View
      style={[
        styles.periods,
        { backgroundColor: c.bg },
        c.rtl && { flexDirection: "row-reverse" },
      ]}
    >
      {(["day", "week", "month", "all"] as ChartRange[]).map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: range === value }}
          onPress={() => setRange(value)}
          style={{
            flex: 1,
            minHeight: 40,
            paddingVertical: 9,
            paddingHorizontal: 3,
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: range === value ? c.panel : c.bg,
          }}
        >
          <Text
            style={{
              color: range === value ? c.text : c.muted,
              textAlign: "center",
              fontSize: 12,
            }}
          >
            {t(`monitor.${value === "all" ? "allTime" : value}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
  const exchangeRows = selected.map((account) => {
    const data = observations[account.id],
      status = sync[account.id];
    const accountHistory = periodHistory(
      sourceHistory.filter(
        (x) => x.scope.type === "account" && x.scope.accountId === account.id,
      ),
      range,
      now,
      [account.id],
    );
    const change = periodMetrics(accountHistory, [account.id]);
    return (
      <View key={account.id}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${EXCHANGE_CONFIG[account.exchange].label}${account.label ? ` · ${account.label}` : ""} · ${t("monitor.details")}`}
          accessibilityState={{ expanded: expanded === account.id }}
          onPress={() =>
            setExpanded(expanded === account.id ? undefined : account.id)
          }
          style={[
            styles.exchange,
            { borderBottomColor: c.line },
            c.rtl && { flexDirection: "row-reverse" },
          ]}
        >
          <View
            style={[
              styles.mark,
              { backgroundColor: c.panel, borderColor: c.line },
            ]}
          >
            <Text style={{ color: c.text, fontWeight: "600", fontSize: 12 }}>
              {
                {
                  binance: "BN",
                  bybit: "BY",
                  okx: "OK",
                  bingx: "BX",
                  gateio: "GT",
                }[account.exchange]
              }
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                color: c.text,
                fontSize: 15,
                fontWeight: "500",
                textAlign: c.rtl ? "right" : "left",
              }}
            >
              {EXCHANGE_CONFIG[account.exchange].label}
            </Text>
            <Label>{account.label || t("monitor.balance")}</Label>
            <Label>{t(`monitor.${status?.status ?? "error"}`)}</Label>
          </View>
          <View
            style={{
              alignItems: c.rtl ? "flex-start" : "flex-end",
              gap: 5,
              maxWidth: "49%",
            }}
          >
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "500" }}>
              {status?.status === "partial" ? "≈ " : ""}
              {money(data?.balanceUSDT)}
            </Text>
            <Text style={{ color: color(change?.delta), fontSize: 12 }}>
              {money(
                status?.status === "partial" ? undefined : change?.delta,
                true,
              )}{" "}
              ·{" "}
              {money(
                status?.status === "partial" ? undefined : change?.percent,
                true,
                true,
              )}
            </Text>
          </View>
        </Pressable>
        {expanded === account.id && (
          <View style={{ marginTop: 10, gap: 10 }}>
            {status?.error && (
              <Label>
                {t(`monitor.${status.error}`, {
                  defaultValue: t("monitor.genericError"),
                })}
              </Label>
            )}
            <WalletDetails observation={data} sync={status} />
            {!demoMode && (
              <Action
                label={t("monitor.details")}
                onPress={() => router.push(`/details/${account.id}`)}
              />
            )}
          </View>
        )}
      </View>
    );
  });
  const confirmFlows = async () => {
    if (!metrics || demoMode || saving) return;
    setSaving(true);
    try {
      await confirmCoverage(
        selected.map((a) => a.id),
        metrics.first.timestamp,
        metrics.last.timestamp,
      );
      setLedger(await loadFlows());
      setConfirm(false);
    } catch {
      setMessage(t("monitor.storageError"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg }}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={[styles.shell, { backgroundColor: c.bg }]}>
        <View
          style={[styles.header, c.rtl && { flexDirection: "row-reverse" }]}
        >
          <View
            style={[
              s.row,
              { gap: 8 },
              c.rtl && { flexDirection: "row-reverse" },
            ]}
          >
            <Ionicons name="layers-outline" size={21} color={c.accent} />
            <Text
              style={{
                color: c.text,
                fontSize: 19,
                fontWeight: "600",
                letterSpacing: -0.4,
              }}
            >
              AirCapital
            </Text>
          </View>
          <View style={{ flexDirection: c.rtl ? "row-reverse" : "row" }}>
            <IconButton
              label={t(
                settings.hideAmounts ? "monitor.visible" : "monitor.hidden",
              )}
              icon={settings.hideAmounts ? "eye-off-outline" : "eye-outline"}
              onPress={() =>
                void settings
                  .setHideAmounts(!settings.hideAmounts)
                  .catch(() => setMessage(t("monitor.storageError")))
              }
            />
            <IconButton
              label={t("monitor.refresh")}
              icon="refresh-outline"
              disabled={portfolio.isLoading || demoMode}
              onPress={() => void reload()}
            />
            <IconButton
              label={t("monitor.settings")}
              icon="settings-outline"
              onPress={() => router.push("/settings")}
            />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 28,
            gap: 14,
          }}
          refreshControl={
            <RefreshControl
              refreshing={!demoMode && portfolio.isLoading}
              onRefresh={() => !demoMode && void reload()}
              tintColor={c.accent}
            />
          }
        >
          <View style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}>
            <Text
              style={{
                fontSize: 11,
                color: c.accent,
                backgroundColor: c.tint,
                borderRadius: 6,
                paddingVertical: 4,
                paddingHorizontal: 7,
              }}
            >
              {demoMode ? t("monitor.demo") : t("monitor.readOnly")}
            </Text>
            {demoMode && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDemoMode(false);
                  setFilter("all");
                  setExpanded(undefined);
                }}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={{ fontSize: 12, color: c.muted }}>
                  {t("monitor.exitDemo")}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}>
            <Text
              accessibilityRole="header"
              style={{
                color: c.text,
                fontSize: 27,
                fontWeight: "600",
                flexShrink: 1,
              }}
            >
              {t(`monitor.${page}`)}
            </Text>
            {accounts.length > 0 && (
              <Picker
                label={t("monitor.filterExchange")}
                value={filter}
                choices={[
                  { value: "all", label: t("monitor.all") },
                  ...Array.from(new Set(accounts.map((a) => a.exchange))).map(
                    (e) => ({ value: e, label: EXCHANGE_CONFIG[e].label }),
                  ),
                ]}
                onChange={(value) => {
                  setFilter(value);
                  setExpanded(undefined);
                }}
              />
            )}
          </View>
          {!!(
            message ||
            (!demoMode && (portfolio.errorMessage || accountStore.error))
          ) && (
            <Card>
              <Text accessibilityRole="alert" style={{ color: c.negative }}>
                {message || t("monitor.storageError")}
              </Text>
            </Card>
          )}
          {!accounts.length ? (
            <Card style={{ paddingVertical: 35, gap: 20 }}>
              <Ionicons name="layers-outline" size={40} color={c.accent} />
              <Heading>{t("monitor.emptyTitle")}</Heading>
              <Label>{t("monitor.emptyBody")}</Label>
              <Action
                primary
                label={t("monitor.connect")}
                icon="add-outline"
                onPress={() => router.push("/settings")}
              />
              <Action
                label={t("monitor.tryDemo")}
                onPress={() => {
                  setDemoMode(true);
                  setFilter("all");
                }}
              />
            </Card>
          ) : (
            <>
              {page === "overview" && (
                <Card>
                  <Label>
                    {t(
                      fullyCovered
                        ? filter === "all"
                          ? "monitor.total"
                          : "monitor.balance"
                        : "monitor.partialTotal",
                    )}
                  </Label>
                  <Text
                    style={{
                      color: c.text,
                      fontSize: 36,
                      fontWeight: "600",
                      letterSpacing: -1,
                      textAlign: c.rtl ? "right" : "left",
                    }}
                  >
                    {fullyCovered ? "" : "≈ "}
                    {money(balance)}{" "}
                    <Text
                      style={{
                        color: c.muted,
                        fontSize: 14,
                        fontWeight: "400",
                        letterSpacing: 0,
                      }}
                    >
                      USDT
                    </Text>
                  </Text>
                  {metrics && complete ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{
                        color: color(metrics.delta),
                        fontSize: 14,
                        textAlign: c.rtl ? "right" : "left",
                      }}
                    >
                      {money(metrics.delta, true)} USDT (
                      {money(metrics.percent, true, true)})
                    </Text>
                  ) : (
                    <Label>{t("monitor.historyNeeded")}</Label>
                  )}
                  {periods}
                  <HistoryChart snapshots={snapshots} demo={demoMode} />
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: c.line,
                      paddingTop: 10,
                    }}
                  >
                    <Label>
                      {portfolio.isLoading && !demoMode
                        ? t("monitor.refreshing")
                        : complete
                          ? t("monitor.fresh")
                          : `${t("monitor.partial")} · ${unavailableCount}`}
                      {complete &&
                      selected[0] &&
                      sync[selected[0].id]?.lastSuccessAt
                        ? ` · ${labelDate(sync[selected[0].id].lastSuccessAt!)}`
                        : ""}
                    </Label>
                  </View>
                </Card>
              )}
              {coverageWarnings.map((issue) => (
                <Label key={issue}>{t(`monitor.${issue}`)}</Label>
              ))}
              {page === "exchanges" && (
                <>
                  {periods}
                  <Action
                    label={t("monitor.addAccount")}
                    icon="add-outline"
                    onPress={() => router.push("/settings")}
                  />
                </>
              )}
              {page !== "statistics" && (
                <View style={{ gap: 2 }}>
                  <View
                    style={[
                      s.row,
                      { marginTop: 7 },
                      c.rtl && { flexDirection: "row-reverse" },
                    ]}
                  >
                    <Heading>{t("monitor.sources")}</Heading>
                    {page === "overview" && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setPage("statistics")}
                        style={{ minHeight: 44, justifyContent: "center" }}
                      >
                        <Text style={{ color: c.accent, fontSize: 13 }}>
                          {t("monitor.details")}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {exchangeRows}
                  <Label style={{ marginTop: 12 }}>
                    {t("monitor.allValues")}
                  </Label>
                </View>
              )}
              {page === "statistics" && (
                <>
                  {periods}
                  {metrics ? (
                    <>
                      <Card>
                        <Label>{t("monitor.change")}</Label>
                        <Text
                          style={{
                            color: color(metrics.delta),
                            fontSize: 32,
                            fontWeight: "600",
                          }}
                        >
                          {money(metrics.delta, true)}{" "}
                          <Text style={{ fontSize: 14 }}>USDT</Text>
                        </Text>
                        <Label>{money(metrics.percent, true, true)}</Label>
                        <Label>
                          {t("monitor.from")}:{" "}
                          {labelDate(metrics.first.timestamp)} ·{" "}
                          {t("monitor.to")}: {labelDate(metrics.last.timestamp)}
                        </Label>
                        {(
                          [
                            ["opening", metrics.first.balanceUSDT],
                            ["closing", metrics.last.balanceUSDT],
                            ["deposits", metrics.deposits],
                            ["withdrawals", metrics.withdrawals],
                          ] as const
                        ).map(([label, value]) => (
                          <View
                            key={label}
                            style={[
                              s.row,
                              {
                                borderBottomColor: c.line,
                                borderBottomWidth: 1,
                                paddingVertical: 10,
                              },
                              c.rtl && { flexDirection: "row-reverse" },
                            ]}
                          >
                            <Text
                              style={{
                                color: c.text,
                                fontSize: 14,
                                flexShrink: 1,
                              }}
                            >
                              {t(`monitor.${label}`)}
                            </Text>
                            <Text style={{ color: c.text, fontWeight: "500" }}>
                              {label === "deposits" || label === "withdrawals"
                                ? metrics.complete
                                  ? money(value)
                                  : "—"
                                : money(value)}
                            </Text>
                          </View>
                        ))}
                        <View
                          style={{
                            backgroundColor: c.tint,
                            padding: 14,
                            borderRadius: 12,
                            gap: 6,
                          }}
                        >
                          <Text style={{ color: c.text, fontSize: 14 }}>
                            {t("monitor.result")}
                          </Text>
                          <Text
                            style={{
                              color: color(metrics.result),
                              fontSize: 24,
                              fontWeight: "600",
                            }}
                          >
                            {money(metrics.result, true)} USDT
                          </Text>
                        </View>
                        <Label>
                          {t(
                            metrics.complete
                              ? demoMode
                                ? "monitor.demo"
                                : "monitor.flowComplete"
                              : "monitor.flowsUnknown",
                          )}
                        </Label>
                        {!demoMode && (
                          <>
                            <Action
                              label={t("monitor.flows")}
                              onPress={() => router.push("/flows")}
                            />
                            {!metrics.complete && (
                              <Action
                                label={t("monitor.confirmFlows")}
                                onPress={() => setConfirm(true)}
                              />
                            )}
                          </>
                        )}
                      </Card>
                      <Heading>{t("monitor.contribution")}</Heading>
                      {selected.map((account) => {
                        // Use the same exact endpoints as the aggregate; never mix differently covered periods.
                        const history = sourceHistory.filter(
                          (s) =>
                            s.scope.type === "account" &&
                            s.scope.accountId === account.id &&
                            (s.timestamp === metrics.first.timestamp ||
                              s.timestamp === metrics.last.timestamp),
                        );
                        const result =
                          history.length === 2
                            ? periodMetrics(history, [account.id])
                            : undefined;
                        return (
                          <View
                            key={account.id}
                            style={[
                              s.row,
                              c.rtl && { flexDirection: "row-reverse" },
                            ]}
                          >
                            <Text style={{ color: c.text, flexShrink: 1 }}>
                              {EXCHANGE_CONFIG[account.exchange].label}
                              {account.label ? ` · ${account.label}` : ""}
                            </Text>
                            <Text style={{ color: color(result?.delta) }}>
                              {money(result?.delta, true)} USDT
                            </Text>
                          </View>
                        );
                      })}
                    </>
                  ) : (
                    <Card>
                      <Label>{t("monitor.historyNeeded")}</Label>
                      {!demoMode && (
                        <Action
                          label={t("monitor.flows")}
                          onPress={() => router.push("/flows")}
                        />
                      )}
                    </Card>
                  )}
                </>
              )}
              {snapshots[0] && page !== "statistics" && (
                <Label>
                  {t("monitor.historySince", {
                    date: labelDate(snapshots[0].timestamp),
                  })}
                </Label>
              )}
              {!demoMode && history.some((s) => s.calculationVersion !== 2) && (
                <Label>{t("monitor.originalHistory")}</Label>
              )}
            </>
          )}
          {!demoMode && <Label>{t("monitor.background")}</Label>}
        </ScrollView>
        <View
          style={[
            styles.nav,
            { backgroundColor: c.panel, borderTopColor: c.line },
            c.rtl && { flexDirection: "row-reverse" },
          ]}
        >
          {(["overview", "exchanges", "statistics"] as Page[]).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={t(`monitor.${item}`)}
              accessibilityState={{ selected: page === item }}
              onPress={() => {
                setPage(item);
                setExpanded(undefined);
              }}
              style={{
                flex: 1,
                minHeight: 58,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderRadius: 12,
                backgroundColor: page === item ? c.tint : c.panel,
              }}
            >
              <Ionicons
                name={
                  item === "overview"
                    ? "grid-outline"
                    : item === "exchanges"
                      ? "layers-outline"
                      : "stats-chart-outline"
                }
                size={21}
                color={page === item ? c.accent : c.muted}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: page === item ? c.accent : c.muted,
                }}
              >
                {t(`monitor.${item}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Confirm
        visible={confirm}
        title={t("monitor.confirmFlows")}
        body={t("monitor.confirmFlowsBody")}
        onConfirm={() => void confirmFlows()}
        onCancel={() => setConfirm(false)}
        busy={saving}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  shell: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  periods: { flexDirection: "row", padding: 4, borderRadius: 11, gap: 3 },
  exchange: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { flexDirection: "row", padding: 8, gap: 5, borderTopWidth: 1 },
});
