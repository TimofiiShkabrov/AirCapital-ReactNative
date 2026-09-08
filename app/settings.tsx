import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
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
  Toggle,
  s,
} from "../src/components/monitor/primitives";
import { CredentialField } from "../src/components/monitor/CredentialField";
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
import { LANGUAGES, supportedLanguage } from "../src/i18n/languages";
import legalLabels from "../src/i18n/legalLabels.json";
import { publicLegalReady, PRIVACY_URL, TERMS_URL, DELETION_URL } from "../src/privacy/publicDocuments";

import { AnalyticsConsentSetting } from "../src/analytics/AnalyticsControls";
import { analyticsAvailable, revokeAnalyticsForDeletion } from "../src/analytics/store";
import { useBillingStore, proAccess } from "../src/billing/store";
import { hasPro } from "../src/billing/policy";
import { checkNewConnection } from "../src/billing/connections";
import { AlertSettings } from "../src/alerts/AlertSettings";
import { exportReport } from "../src/reports/exportReport";

export default function SettingsScreen() {
  const c = useMonitorTheme(),
    { t } = useTranslation(),
    router = useRouter();
  const accounts = useAccountsStore(),
    settings = useSettingsStore();
  const billing = useBillingStore();
  const [alertsOpen, setAlertsOpen] = useState(false);
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
  const [connectionError, setConnectionError] = useState<{
    message: string;
    attempt: number;
  }>();
  const connectionAttempt = useRef(0);
  const connectionErrorView = useRef<View>(null);
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
  const revealConnectionError = useCallback(() => {
    const content = scroll.current?.getInnerViewNode();
    if (!content) return;
    connectionErrorView.current?.measureLayout(
      content,
      (_x, y) => {
        scroll.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      },
      () => {},
    );
  }, []);
  useEffect(() => {
    if (!connectionError) return;
    // Validation may finish before the keyboard's dismissal animation.
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      revealConnectionError,
    );
    return () => subscription.remove();
  }, [connectionError, revealConnectionError]);
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
    setConnectionError(undefined);
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
    setConnectionError(undefined);
    setFormOpen(false);
    setReconnecting(undefined);
    setApiKey("");
    setSecret("");
    setPassphrase("");
    setLabel("");
    setAcknowledged(false);
  };
  const working = useRef(false);
  const errorMessage = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    return t(`monitor.${code}`, { defaultValue: t("monitor.genericError") });
  };
  const reportConnectionError = (e: unknown) => {
    setConnectionError({
      message: errorMessage(e),
      attempt: ++connectionAttempt.current,
    });
  };
  const report = (e: unknown) => {
    setFailure(true);
    setMessage(errorMessage(e));
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
    Keyboard.dismiss();
    setConnectionError(undefined);
    setMessage("");
    setFailure(false);
    if (Platform.OS === "web") {
      reportConnectionError(new Error("unsupportedWeb"));
      return;
    }
    if (
      !apiKey.trim() ||
      !secret.trim() ||
      (exchange === "okx" && !passphrase.trim()) ||
      !acknowledged
    ) {
      reportConnectionError(new Error("required"));
      return;
    }
    working.current = true;
    setBusy(true);
    const keys = {
      apiKey: apiKey.trim(),
      secretKey: secret.trim(),
      passphrase: exchange === "okx" ? passphrase.trim() : undefined,
    };
    try {
      await billing.refresh();
      if (!reconnecting) checkNewConnection(accounts.accounts);
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
      scroll.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      reportConnectionError(e);
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
        if (analyticsAvailable) {
          await revokeAnalyticsForDeletion();
        }
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
                        setConnectionError(undefined);
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
                    <CredentialField
                      label={t("monitor.apiKey")}
                      value={apiKey}
                      onChangeText={(value) => {
                        setApiKey(value);
                        setConnectionError(undefined);
                      }}
                      editable={!busy}
                    />
                    <CredentialField
                      label={t("monitor.secret")}
                      value={secret}
                      onChangeText={(value) => {
                        setSecret(value);
                        setConnectionError(undefined);
                      }}
                      editable={!busy}
                    />
                    {exchange === "okx" && (
                      <CredentialField
                        label={t("monitor.passphrase")}
                        value={passphrase}
                        onChangeText={(value) => {
                          setPassphrase(value);
                          setConnectionError(undefined);
                        }}
                        editable={!busy}
                      />
                    )}
                    <View
                      style={[s.row, c.rtl && { flexDirection: "row-reverse" }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Label>{t("monitor.acknowledge")}</Label>
                      </View>
                      <Toggle
                        accessibilityLabel={t("monitor.acknowledge")}
                        value={acknowledged}
                        disabled={busy}
                        onValueChange={setAcknowledged}
                      />
                    </View>
                    {connectionError && (
                      <View
                        key={connectionError.attempt}
                        ref={connectionErrorView}
                        collapsable={false}
                        onLayout={revealConnectionError}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: c.negative,
                          gap: 6,
                        }}
                      >
                        <Text style={{ color: c.negative, fontWeight: "600" }}>
                          {t("monitor.connectionFailed")}
                        </Text>
                        <Text
                          accessibilityRole="alert"
                          accessibilityLiveRegion="assertive"
                          style={{ color: c.negative, lineHeight: 21 }}
                        >
                          {connectionError.message}
                        </Text>
                        {billing.enabled && !proAccess() && !reconnecting && accounts.accounts.length >= 2 && (
                          <Action label={t("monitor.billingPlans")} disabled={busy}
                            onPress={() => router.push("/subscription")} />
                        )}
                      </View>
                    )}
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
            {billing.enabled && <SettingsGroup title="AirCapital">
              <SettingsRow title={hasPro(billing.access) ? "AirCapital Pro" : t("monitor.billingFree")}
                subtitle={t("monitor.billingPlans")} icon="diamond-outline" disabled={busy}
                onPress={() => router.push("/subscription")} />
              <SettingsRow title={t("monitor.proReports")} icon="document-text-outline" disabled={busy}
                onPress={() => {
                  if (!proAccess()) { router.push("/subscription"); return; }
                  void savePreference(exportReport);
                }} />
              <SettingsRow title={t("monitor.alertsTitle")} icon="notifications-outline" expanded={alertsOpen}
                disabled={busy} onPress={() => setAlertsOpen(!alertsOpen)} />
              {alertsOpen && <SettingsDetail><AlertSettings /></SettingsDetail>}
            </SettingsGroup>}
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
                  choices={LANGUAGES.map(({ code, name }) => ({
                    value: code,
                    label: name,
                  }))}
                  searchLabel={t("monitor.searchLanguages")}
                  onChange={(v) =>
                    void savePreference(() => settings.setLanguage(v))
                  }
                />
              </SettingsRow>
            </SettingsGroup>
            <SettingsGroup title={t("monitor.privacyData")}>
              <AnalyticsConsentSetting />
              <SettingsRow title={t("monitor.hidden")} icon="eye-off-outline">
                <Toggle
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
                  <Toggle
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
              {publicLegalReady && [
                { url: PRIVACY_URL, label: legalLabels[supportedLanguage(settings.language) ?? "en"][0] },
                { url: TERMS_URL, label: legalLabels[supportedLanguage(settings.language) ?? "en"][1] },
                { url: DELETION_URL, label: legalLabels[supportedLanguage(settings.language) ?? "en"][3] },
              ].map(({ url, label }) => (
                <SettingsRow key={url} title={label} subtitle="English · aircapital.app" icon="document-text-outline" onPress={() => {
                  void Linking.openURL(url).catch(() => {
                    setFailure(true);
                    setMessage(t("monitor.genericError"));
                  });
                }} />
              ))}
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
