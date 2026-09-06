import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as LocalAuthentication from "expo-local-authentication";
import { privacySession } from "../src/services/privacySession";
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
import {
  SettingsGroup,
  SettingsRow,
  SettingsDetail,
} from "../src/components/monitor/SettingsGroup";
import { useMonitorTheme } from "../src/components/monitor/theme";
import { useAccountsStore } from "../src/store/accountsStore";
import { useSettingsStore } from "../src/store/settingsStore";
import {
  observeAccount,
  usdToUSDT,
  verifyReadOnly,
} from "../src/services/observations";
import { pickBackup } from "../src/services/importFile";
import {
  inspectBackup,
  importBackup,
  deleteAllData,
} from "../src/services/backup";
import { replaceAccountKeys } from "../src/services/secureStore";
import {
  pauseMonitoring,
  clearPortfolioMemory,
} from "../src/store/portfolioStore";
import { exportData } from "../src/services/exportData";
import {
  ALL_EXCHANGES,
  type Exchange,
  type ExchangeAccount,
} from "../src/types/common";
import { useScreenLoad } from "../src/hooks/useScreenLoad";
import { loadSettingsData } from "../src/services/screenData";
import { LoadBoundary, BusyOverlay } from "../src/components/monitor/LoadState";
import { COVERAGE_KEYS } from "../src/domain/exchangeCoverage";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";

export default function SettingsScreen() {
  const c = useMonitorTheme(),
    { t } = useTranslation(),
    router = useRouter();
  const accounts = useAccountsStore(),
    settings = useSettingsStore();
  const { reconnect } = useLocalSearchParams<{ reconnect?: string }>();
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
    [exporting, setExporting] = useState(false);
  const load = useScreenLoad(loadSettingsData);
  const plans = load.data?.plans ?? [];
  const [restore, setRestore] = useState<{
      text: string;
      counts: Awaited<ReturnType<typeof inspectBackup>>;
    }>(),
    [wiping, setWiping] = useState(false),
    [reconnecting, setReconnecting] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState<string>();
  const [storageOpen, setStorageOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const openReconnect = useCallback((account: ExchangeAccount) => {
    setFormOpen(true);
    setExpandedAccount(undefined);
    setReconnecting(account.id);
    setExchange(account.exchange);
    setLabel(account.label ?? "");
    setApiKey("");
    setSecret("");
    setPassphrase("");
    setAcknowledged(false);
    setMessage("");
    setFailure(false);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }, []);
  const handledReconnect = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      !reconnect ||
      load.isLoading ||
      !load.data ||
      handledReconnect.current === reconnect ||
      Platform.OS === "web"
    )
      return;
    const account = accounts.accounts.find((a) => a.id === reconnect);
    handledReconnect.current = reconnect;
    if (account && account.state !== "deletionPending") openReconnect(account);
  }, [reconnect, load.isLoading, load.data, accounts.accounts, openReconnect]);
  const closeForm = () => {
    setFormOpen(false);
    setReconnecting(undefined);
    setApiKey("");
    setSecret("");
    setPassphrase("");
    setLabel("");
    setAcknowledged(false);
  };
  const working = useRef(false);
  const report = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    setFailure(true);
    setMessage(
      t(`monitor.${code}`, { defaultValue: t("monitor.genericError") }),
    );
  };
  const savePreference = async (operation: () => Promise<void>) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (e) {
      report(e);
    } finally {
      working.current = false;
      setBusy(false);
    }
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
      if (reconnecting) {
        await replaceAccountKeys(reconnecting, keys);
        await loadAccounts();
      } else await accounts.addAccount(keys, exchange, label);
      setFormOpen(false);
      setReconnecting(undefined);
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
      const success = await privacySession.authenticate(() =>
        LocalAuthentication.authenticateAsync({
          promptMessage: t("monitor.unlock"),
          cancelLabel: t("monitor.cancel"),
          disableDeviceFallback: false,
        }),
      );
      if (!success) throw new Error("authFailed");
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
  const chooseBackup = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      const text = await pickBackup();
      if (text) setRestore({ text, counts: await inspectBackup(text) });
    } catch (e) {
      report(e);
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const restoreBackup = async () => {
    if (working.current || !restore) return;
    working.current = true;
    setBusy(true);
    try {
      await pauseMonitoring(async () => {
        await importBackup(restore.text);
        clearPortfolioMemory();
        await loadAccounts();
      });
      setRestore(undefined);
      setMessage(t("monitor.restored"));
      setFailure(false);
      await load.reload();
    } catch (e) {
      report(e);
      setRestore(undefined);
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const wipe = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await pauseMonitoring(async () => {
        await deleteAllData();
        clearPortfolioMemory();
        await loadAccounts();
      });
      setWiping(false);
      setRestore(undefined);
      setReconnecting(undefined);
      setApiKey("");
      setSecret("");
      setPassphrase("");
      await settings.hydrateSettings();
      router.replace("/");
    } catch (e) {
      report(e);
      setWiping(false);
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
            {
              width: "100%",
              maxWidth: 720,
              alignSelf: "center",
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 8,
            },
            c.rtl && { flexDirection: "row-reverse" },
          ]}
        >
          <Heading>{t("monitor.settings")}</Heading>
          <IconButton
            label={t("monitor.close")}
            icon="close-outline"
            disabled={busy}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
        </View>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.page, { gap: 24 }]}
        >
          <LoadBoundary
            loading={load.isLoading}
            error={load.error}
            onRetry={() => void load.reload()}
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
            <SettingsGroup title={t("monitor.exchanges")}>
              <View>
                {Platform.OS === "web" ? (
                  <SettingsRow
                    title={t("monitor.mobileConnection")}
                    subtitle={t("monitor.mobileConnectionHint")}
                    icon="phone-portrait-outline"
                  />
                ) : (
                  <SettingsRow
                    title={t(
                      reconnecting ? "monitor.reconnect" : "monitor.connect",
                    )}
                    subtitle={t("monitor.connectionSummary")}
                    icon="add-circle-outline"
                    expanded={formOpen}
                    disabled={busy}
                    onPress={() => (formOpen ? closeForm() : setFormOpen(true))}
                  />
                )}
                <SettingsRow
                  title={t("monitor.connectionHelp")}
                  subtitle={
                    formOpen
                      ? EXCHANGE_CONFIG[exchange].label
                      : t("monitor.connectionHelpSummary")
                  }
                  icon="book-outline"
                  disabled={busy}
                  onPress={() =>
                    router.push({
                      pathname: "/connect-guide",
                      params: { exchange },
                    })
                  }
                />
                {Platform.OS !== "web" && formOpen && (
                  <SettingsDetail>
                    <Label>{t("monitor.instruction")}</Label>
                    {reconnecting && (
                      <Label>{t("monitor.reconnectHint")}</Label>
                    )}
                    <Picker
                      label={t("monitor.exchanges")}
                      disabled={busy}
                      value={exchange}
                      choices={(reconnecting ? [exchange] : ALL_EXCHANGES).map(
                        (e) => ({
                          value: e,
                          label: EXCHANGE_CONFIG[e].label,
                        }),
                      )}
                      onChange={(v) => {
                        setExchange(v as Exchange);
                        setApiKey("");
                        setSecret("");
                        setPassphrase("");
                        setAcknowledged(false);
                      }}
                    />
                    <Label>{t(`monitor.${COVERAGE_KEYS[exchange]}`)}</Label>
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
                      loading={busy}
                      icon="shield-checkmark-outline"
                      label={t(
                        busy ? "monitor.checking" : "monitor.checkConnection",
                      )}
                      disabled={busy || !acknowledged}
                      onPress={() => void connect()}
                    />
                    <Action
                      label={t("monitor.cancel")}
                      disabled={busy}
                      onPress={closeForm}
                    />
                  </SettingsDetail>
                )}
              </View>
              {accounts.accounts.map((account) => (
                <View key={account.id}>
                  <SettingsRow
                    title={
                      account.label || EXCHANGE_CONFIG[account.exchange].label
                    }
                    subtitle={
                      account.state === "needsKeys"
                        ? t("monitor.needsKeys")
                        : account.state === "setupPending"
                          ? t("monitor.incompleteSetup")
                          : account.state === "deletionPending"
                            ? t("monitor.deletePending")
                            : account.label
                              ? EXCHANGE_CONFIG[account.exchange].label
                              : undefined
                    }
                    icon="wallet-outline"
                    expanded={expandedAccount === account.id}
                    disabled={busy}
                    onPress={() =>
                      setExpandedAccount(
                        expandedAccount === account.id ? undefined : account.id,
                      )
                    }
                  />
                  {expandedAccount === account.id && (
                    <SettingsDetail>
                      {Platform.OS !== "web" && (
                        <Action
                          label={t("monitor.reconnect")}
                          disabled={busy || account.state === "deletionPending"}
                          onPress={() => openReconnect(account)}
                        />
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
                    </SettingsDetail>
                  )}
                </View>
              ))}
            </SettingsGroup>
            <SettingsGroup title={t("monitor.interfaceSettings")}>
              <SettingsRow
                title={t("monitor.theme")}
                icon="color-palette-outline"
              >
                <Picker
                  label={t("monitor.theme")}
                  disabled={busy}
                  value={settings.theme}
                  choices={(["system", "light", "dark"] as const).map(
                    (value) => ({ value, label: t(`monitor.${value}`) }),
                  )}
                  onChange={(v) =>
                    void savePreference(() =>
                      settings.setTheme(v as "system" | "light" | "dark"),
                    )
                  }
                />
              </SettingsRow>
              <SettingsRow
                title={t("monitor.language")}
                icon="language-outline"
              >
                <Picker
                  label={t("monitor.language")}
                  disabled={busy}
                  value={settings.language}
                  choices={[
                    { value: "ru", label: "Русский" },
                    { value: "en", label: "English" },
                    { value: "ar", label: "العربية" },
                  ]}
                  onChange={(v) =>
                    void savePreference(() => settings.setLanguage(v))
                  }
                />
              </SettingsRow>
            </SettingsGroup>
            <SettingsGroup title={t("monitor.privacyData")}>
              <SettingsRow title={t("monitor.hidden")} icon="eye-off-outline">
                <Switch
                  accessibilityLabel={t("monitor.hidden")}
                  value={settings.hideAmounts}
                  disabled={busy}
                  onValueChange={(v) =>
                    void savePreference(() => settings.setHideAmounts(v))
                  }
                />
              </SettingsRow>
              {Platform.OS !== "web" && (
                <SettingsRow
                  title={t("monitor.appLock")}
                  icon="lock-closed-outline"
                >
                  <Switch
                    accessibilityLabel={t("monitor.appLock")}
                    value={settings.lockEnabled}
                    disabled={busy}
                    onValueChange={(v) => void toggleLock(v)}
                  />
                </SettingsRow>
              )}
              {Platform.OS !== "web" && (
                <View>
                  <SettingsRow
                    title={t("monitor.backups")}
                    subtitle={t("monitor.backupsSummary")}
                    icon="cloud-outline"
                    expanded={storageOpen}
                    onPress={() => setStorageOpen(!storageOpen)}
                  />
                  {storageOpen && (
                    <SettingsDetail>
                      <Label>{t("monitor.securityNote")}</Label>
                      <Label>{t("monitor.backupExplanation")}</Label>
                      <Action
                        label={t("monitor.export")}
                        icon="download-outline"
                        disabled={busy}
                        onPress={() => setExporting(true)}
                      />
                      <Action
                        label={t("monitor.importData")}
                        icon="cloud-upload-outline"
                        disabled={busy}
                        onPress={() => void chooseBackup()}
                      />
                    </SettingsDetail>
                  )}
                </View>
              )}
              {Platform.OS !== "web" && (
                <SettingsRow
                  title={t("monitor.deleteAll")}
                  icon="trash-outline"
                  danger
                  disabled={busy}
                  onPress={() => setWiping(true)}
                />
              )}
            </SettingsGroup>
            <SettingsGroup title={t("monitor.helpSettings")}>
              <View>
                <SettingsRow
                  title={t("monitor.monitoringDetails")}
                  subtitle={t("monitor.readOnly")}
                  icon="information-circle-outline"
                  expanded={monitoringOpen}
                  onPress={() => setMonitoringOpen(!monitoringOpen)}
                />
                {monitoringOpen && (
                  <SettingsDetail>
                    <Label>{t("monitor.monitoringSummary")}</Label>
                    <Label>{t("monitor.background")}</Label>
                    <Label>{t("monitor.manualFlowsNote")}</Label>
                    <Label>{t("monitor.coverageNote")}</Label>
                    {plans.length > 0 && (
                      <>
                        <Heading>{t("monitor.archive")}</Heading>
                        <Label>{t("monitor.migration")}</Label>
                        {plans.map((plan) => (
                          <View
                            key={plan.id}
                            style={{ gap: 5, paddingVertical: 8 }}
                          >
                            <Text
                              style={{
                                color: c.text,
                                textAlign: c.rtl ? "right" : "left",
                              }}
                            >
                              {plan.exchange} · {plan.instrument}
                            </Text>
                            <Label>
                              {t("monitor.orderIds")}:{" "}
                              {plan.orderIds.join(", ") || "—"}
                            </Label>
                          </View>
                        ))}
                      </>
                    )}
                  </SettingsDetail>
                )}
              </View>
            </SettingsGroup>
          </LoadBoundary>
        </ScrollView>
        <BusyOverlay
          visible={busy && !restore && !wiping && !deleting && !exporting}
        />
        <Confirm
          visible={!!restore}
          title={t("monitor.importData")}
          body={t("monitor.importPreview", restore?.counts ?? {})}
          onConfirm={() => void restoreBackup()}
          onCancel={() => setRestore(undefined)}
          busy={busy}
        />
        <Confirm
          visible={wiping}
          title={t("monitor.deleteAll")}
          body={t("monitor.deleteAllConfirm")}
          onConfirm={() => void wipe()}
          onCancel={() => setWiping(false)}
          busy={busy}
        />
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
