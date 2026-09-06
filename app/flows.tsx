import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { saveFlow, deleteFlow } from "../src/services/cashFlows";
import { useScreenLoad } from "../src/hooks/useScreenLoad";
import { loadFlowsData } from "../src/services/screenData";
import { LoadBoundary, BusyOverlay } from "../src/components/monitor/LoadState";
import {
  parseAmount,
  parseLocalDate,
  localDateInput,
} from "../src/domain/input";
import { useMonitorTheme } from "../src/components/monitor/theme";
import {
  Action,
  Card,
  Confirm,
  Field,
  Heading,
  IconButton,
  Label,
  Picker,
  s,
  useMoney,
} from "../src/components/monitor/primitives";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";
export default function FlowsScreen() {
  const c = useMonitorTheme(),
    { t, i18n } = useTranslation(),
    router = useRouter(),
    money = useMoney();
  const load = useScreenLoad(loadFlowsData);
  const ledger = load.data?.ledger ?? { flows: [], coverage: [] };
  const accounts = load.data?.accounts ?? [];
  const [accountId, setAccountId] = useState(""),
    [type, setType] = useState<"deposit" | "withdrawal">("deposit"),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(() => localDateInput(new Date())),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [removing, setRemoving] = useState<string>();
  const working = useRef(false);
  const selected = accountId || accounts[0]?.id || "";
  const save = async () => {
    if (working.current) return;
    const amountUSDT = parseAmount(amount),
      occurredAt = parseLocalDate(date);
    if (
      amountUSDT === undefined ||
      !occurredAt ||
      !accounts.some((a) => a.id === selected)
    ) {
      setMessage(t("monitor.invalidFlow"));
      return;
    }
    working.current = true;
    setBusy(true);
    setMessage("");
    try {
      await saveFlow({ accountId: selected, type, amountUSDT, occurredAt });
      await load.reload();
      setAmount("");
      setMessage(t("monitor.saved"));
    } catch {
      setMessage(t("monitor.storageError"));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!removing || working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await deleteFlow(removing);
      await load.reload();
      setRemoving(undefined);
    } catch {
      setMessage(t("monitor.storageError"));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            s.row,
            { paddingHorizontal: 20 },
            c.rtl && { flexDirection: "row-reverse" },
          ]}
        >
          <Heading>{t("monitor.flows")}</Heading>
          <IconButton
            label={t("monitor.back")}
            icon="close-outline"
            disabled={busy}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.page}
        >
          <LoadBoundary
            loading={load.isLoading}
            error={load.error}
            onRetry={() => void load.reload()}
          >
            {!!message && (
              <Card>
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ color: c.text }}
                >
                  {message}
                </Text>
              </Card>
            )}
            {accounts.length > 0 && Platform.OS !== "web" ? (
              <Card>
                <Heading>{t("monitor.addFlow")}</Heading>
                <Label>{t("monitor.flowManual")}</Label>
                <Picker
                  label={t("monitor.chooseAccount")}
                  disabled={busy}
                  value={selected}
                  choices={accounts.map((a) => ({
                    value: a.id,
                    label: `${EXCHANGE_CONFIG[a.exchange].label}${a.label ? ` · ${a.label}` : ""}`,
                  }))}
                  onChange={setAccountId}
                />
                <Picker
                  label={t("monitor.flowType")}
                  disabled={busy}
                  value={type}
                  choices={[
                    { value: "deposit", label: t("monitor.deposit") },
                    { value: "withdrawal", label: t("monitor.withdrawal") },
                  ]}
                  onChange={(v) => setType(v as "deposit" | "withdrawal")}
                />
                <Field
                  label={t("monitor.amount")}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  editable={!busy}
                />
                <Field
                  label={t("monitor.occurredAt")}
                  value={date}
                  onChangeText={setDate}
                  autoCapitalize="none"
                  editable={!busy}
                />
                <Action
                  primary
                  label={t("monitor.save")}
                  loading={busy}
                  disabled={busy}
                  onPress={() => void save()}
                />
                <Label>{t("monitor.confirmFlowsBody")}</Label>
              </Card>
            ) : (
              <Card>
                <Label>
                  {t(
                    Platform.OS === "web"
                      ? "monitor.unsupportedWeb"
                      : "monitor.emptyBody",
                  )}
                </Label>
              </Card>
            )}
            <Heading>{t("monitor.flows")}</Heading>
            {ledger.flows.length ? (
              ledger.flows
                .slice()
                .sort(
                  (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
                )
                .map((flow) => (
                  <Card key={flow.id}>
                    <View
                      style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}
                    >
                      <Heading>{t(`monitor.${flow.type}`)}</Heading>
                      <Text
                        style={{
                          color:
                            flow.type === "deposit" ? c.positive : c.negative,
                        }}
                      >
                        {money(flow.amountUSDT)} USDT
                      </Text>
                    </View>
                    <Label>
                      {accounts.find((a) => a.id === flow.accountId)?.label ||
                        EXCHANGE_CONFIG[
                          accounts.find((a) => a.id === flow.accountId)
                            ?.exchange || "binance"
                        ].label}{" "}
                      ·{" "}
                      {new Date(flow.occurredAt).toLocaleString(i18n.language)}
                    </Label>
                    <Action
                      label={t("monitor.remove")}
                      danger
                      disabled={busy}
                      onPress={() => setRemoving(flow.id)}
                    />
                  </Card>
                ))
            ) : (
              <Label>{t("monitor.noFlows")}</Label>
            )}
          </LoadBoundary>
        </ScrollView>
        <BusyOverlay visible={busy && !removing} />
        <Confirm
          visible={!!removing}
          title={t("monitor.deleteFlow")}
          body={t("monitor.deleteFlow")}
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setRemoving(undefined)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
