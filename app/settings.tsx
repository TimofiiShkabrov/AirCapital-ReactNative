import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as LocalAuthentication from "expo-local-authentication";
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
} from "../src/components/monitor/primitives";
import { useMonitorTheme } from "../src/components/monitor/theme";
import { useAccountsStore } from "../src/store/accountsStore";
import { useSettingsStore } from "../src/store/settingsStore";
import {
  observeAccount,
  usdToUSDT,
  verifyReadOnly,
} from "../src/services/observations";
import { exportData } from "../src/services/exportData";
import { loadArchivedPlans } from "../src/services/legacyPlans";
import {
  ALL_EXCHANGES,
  type Exchange,
  type ExchangeAccount,
} from "../src/types/common";
import type { ArchivedPlan } from "../src/types/monitor";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";

export default function SettingsScreen() {
  const c = useMonitorTheme(),
    { t } = useTranslation(),
    router = useRouter();
  const accounts = useAccountsStore(),
    settings = useSettingsStore();
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const [exchange, setExchange] = useState<Exchange>("binance"),
    [label, setLabel] = useState(""),
    [apiKey, setApiKey] = useState(""),
    [secret, setSecret] = useState(""),
    [passphrase, setPassphrase] = useState(""),
    [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failure, setFailure] = useState(false),
    [deleting, setDeleting] = useState<ExchangeAccount>(),
    [exporting, setExporting] = useState(false),
    [plans, setPlans] = useState<ArchivedPlan[]>([]);
  const working = useRef(false);
  useEffect(() => {
    void loadAccounts();
    void loadArchivedPlans()
      .then(setPlans)
      .catch(() => {
        setFailure(true);
        setMessage(t("monitor.storageError"));
      });
  }, [loadAccounts, t]);
  const report = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    setFailure(true);
    setMessage(
      t(`monitor.${code}`, { defaultValue: t("monitor.genericError") }),
    );
  };
  const connect = async () => {
    if (working.current) return;
    if (Platform.OS === "web") {
      report(new Error("unsupportedWeb"));
      return;
    }
    if (
      !apiKey.trim() ||
      !secret.trim() ||
      (exchange === "okx" && !passphrase.trim()) ||
      !acknowledged
    ) {
      report(new Error("required"));
      return;
    }
    working.current = true;
    setBusy(true);
    setMessage("");
    setFailure(false);
    const keys = {
      apiKey: apiKey.trim(),
      secretKey: secret.trim(),
      passphrase: exchange === "okx" ? passphrase.trim() : undefined,
    };
    try {
      await verifyReadOnly(exchange, keys);
      const rate =
        exchange === "okx" || exchange === "bybit"
          ? await usdToUSDT()
          : undefined;
      const result = await observeAccount(
        {
          id: "connection-check",
          exchange,
          createdAt: new Date().toISOString(),
        },
        keys,
        rate,
      );
      if (result.balanceUSDT === undefined) throw new Error("invalidResponse");
      await accounts.addAccount(keys, exchange, label);
      setApiKey("");
      setSecret("");
      setPassphrase("");
      setLabel("");
      setAcknowledged(false);
      setMessage(
        t(result.complete ? "monitor.connected" : "monitor.partialConnection"),
      );
    } catch (e) {
      report(e);
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting || working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await accounts.removeAccount(deleting);
      setDeleting(undefined);
      setMessage(t("monitor.saved"));
      setFailure(false);
    } catch {
      setDeleting(undefined);
      report(new Error("deletePending"));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const toggleLock = async (enabled: boolean) => {
    if (working.current || Platform.OS === "web") return;
    working.current = true;
    setBusy(true);
    try {
      if (
        (await LocalAuthentication.getEnrolledLevelAsync()) ===
        LocalAuthentication.SecurityLevel.NONE
      )
        throw new Error("authUnavailable");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("monitor.unlock"),
        cancelLabel: t("monitor.cancel"),
        disableDeviceFallback: false,
      });
      if (!result.success) throw new Error("authFailed");
      await settings.setLockEnabled(enabled);
    } catch (e) {
      report(e);
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const doExport = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await exportData();
      setExporting(false);
    } catch (e) {
      setExporting(false);
      report(e);
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
            { paddingHorizontal: 20, paddingVertical: 8 },
            c.rtl && { flexDirection: "row-reverse" },
          ]}
        >
          <Heading>{t("monitor.settings")}</Heading>
          <IconButton
            label={t("monitor.close")}
            icon="close-outline"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.page}
        >
          {!!message && (
            <Card>
              <Text
                accessibilityRole={failure ? "alert" : undefined}
                accessibilityLiveRegion="polite"
                style={{ color: failure ? c.negative : c.positive }}
              >
                {message}
              </Text>
            </Card>
          )}
          <Card>
            <Heading>{t("monitor.theme")}</Heading>
            <Picker
              label={t("monitor.theme")}
              value={settings.theme}
              choices={(["system", "light", "dark"] as const).map((value) => ({
                value,
                label: t(`monitor.${value}`),
              }))}
              onChange={(v) =>
                void settings
                  .setTheme(v as "system" | "light" | "dark")
                  .catch(report)
              }
            />
            <Heading>{t("monitor.language")}</Heading>
            <Picker
              label={t("monitor.language")}
              value={settings.language}
              choices={[
                { value: "ru", label: "Русский" },
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
              ]}
              onChange={(v) => void settings.setLanguage(v).catch(report)}
            />
          </Card>
          <Card>
            <Heading>{t("monitor.connect")}</Heading>
            <Label>{t("monitor.instruction")}</Label>
            {Platform.OS === "web" ? (
              <Label>{t("monitor.unsupportedWeb")}</Label>
            ) : (
              <>
                <Picker
                  label={t("monitor.exchanges")}
                  value={exchange}
                  choices={ALL_EXCHANGES.map((e) => ({
                    value: e,
                    label: EXCHANGE_CONFIG[e].label,
                  }))}
                  onChange={(v) => {
                    setExchange(v as Exchange);
                    setApiKey("");
                    setSecret("");
                    setPassphrase("");
                    setAcknowledged(false);
                  }}
                />
                {(exchange === "bingx" || exchange === "gateio") && (
                  <Label>{t("monitor.permissionDeclared")}</Label>
                )}
                <Field
                  label={t("monitor.name")}
                  placeholder={t("monitor.optional")}
                  value={label}
                  onChangeText={setLabel}
                  maxLength={60}
                  editable={!busy}
                />
                <Field
                  label={t("monitor.apiKey")}
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="none"
                  autoComplete="off"
                  editable={!busy}
                />
                <Field
                  label={t("monitor.secret")}
                  value={secret}
                  onChangeText={setSecret}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="none"
                  autoComplete="off"
                  editable={!busy}
                />
                {exchange === "okx" && (
                  <Field
                    label={t("monitor.passphrase")}
                    value={passphrase}
                    onChangeText={setPassphrase}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                    textContentType="none"
                    autoComplete="off"
                    editable={!busy}
                  />
                )}
                <View
                  style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}
                >
                  <View style={{ flex: 1 }}>
                    <Label>{t("monitor.acknowledge")}</Label>
                  </View>
                  <Switch
                    accessibilityLabel={t("monitor.acknowledge")}
                    value={acknowledged}
                    disabled={busy}
                    onValueChange={setAcknowledged}
                  />
                </View>
                <Action
                  primary
                  icon="shield-checkmark-outline"
                  label={t(
                    busy ? "monitor.checking" : "monitor.checkConnection",
                  )}
                  disabled={busy || !acknowledged}
                  onPress={() => void connect()}
                />
              </>
            )}
          </Card>
          {accounts.accounts.length > 0 && (
            <Card>
              <Heading>{t("monitor.accounts")}</Heading>
              {accounts.accounts.map((account) => (
                <View
                  key={account.id}
                  style={{
                    paddingVertical: 10,
                    gap: 9,
                    borderBottomWidth: 1,
                    borderBottomColor: c.line,
                  }}
                >
                  <Text style={{ color: c.text, fontWeight: "500" }}>
                    {EXCHANGE_CONFIG[account.exchange].label}
                    {account.label ? ` · ${account.label}` : ""}
                  </Text>
                  {account.state === "setupPending" && (
                    <Label>{t("monitor.incompleteSetup")}</Label>
                  )}
                  {account.state === "deletionPending" && (
                    <Label>{t("monitor.deletePending")}</Label>
                  )}
                  <Action
                    label={t(
                      account.state === "deletionPending"
                        ? "monitor.retryDelete"
                        : "monitor.remove",
                    )}
                    danger
                    disabled={busy}
                    onPress={() => setDeleting(account)}
                  />
                </View>
              ))}
            </Card>
          )}
          <Card>
            <Heading>{t("monitor.privacy")}</Heading>
            <View style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}>
              <View style={{ flex: 1 }}>
                <Label>{t("monitor.hidden")}</Label>
              </View>
              <Switch
                accessibilityLabel={t("monitor.hidden")}
                value={settings.hideAmounts}
                onValueChange={(v) =>
                  void settings.setHideAmounts(v).catch(report)
                }
              />
            </View>
            {Platform.OS !== "web" && (
              <View style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}>
                <View style={{ flex: 1 }}>
                  <Label>{t("monitor.appLock")}</Label>
                </View>
                <Switch
                  accessibilityLabel={t("monitor.appLock")}
                  value={settings.lockEnabled}
                  disabled={busy}
                  onValueChange={(v) => void toggleLock(v)}
                />
              </View>
            )}
            <Label>{t("monitor.securityNote")}</Label>
            <Action
              label={t("monitor.export")}
              icon="download-outline"
              disabled={busy || Platform.OS === "web"}
              onPress={() => setExporting(true)}
            />
          </Card>
          <Card>
            <Heading>{t("monitor.readOnly")}</Heading>
            <Label>{t("monitor.migration")}</Label>
            {plans.length > 0 && (
              <>
                <Heading>{t("monitor.archive")}</Heading>
                {plans.map((plan) => (
                  <View key={plan.id} style={{ gap: 5, paddingVertical: 8 }}>
                    <Text style={{ color: c.text }}>
                      {plan.exchange} · {plan.instrument}
                    </Text>
                    <Label>
                      {t("monitor.orderIds")}: {plan.orderIds.join(", ") || "—"}
                    </Label>
                  </View>
                ))}
              </>
            )}
          </Card>
          <Label>{t("monitor.background")}</Label>
        </ScrollView>
        <Confirm
          visible={!!deleting}
          title={t("monitor.remove")}
          body={t("monitor.confirmDelete")}
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(undefined)}
          busy={busy}
        />
        <Confirm
          visible={exporting}
          title={t("monitor.exportAction")}
          body={t("monitor.exportNote")}
          onConfirm={() => void doExport()}
          onCancel={() => setExporting(false)}
          busy={busy}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
