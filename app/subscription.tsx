import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBillingStore } from "../src/billing/store";
import { hasPro, monitoredAccountIds } from "../src/billing/policy";
import { preferredConnections, saveFreeConnections } from "../src/billing/connections";
import { BILLING, type Plan } from "../src/billing/config";
import { useAccountsStore } from "../src/store/accountsStore";
import { pauseMonitoring, usePortfolioStore } from "../src/store/portfolioStore";
import { useMonitorTheme } from "../src/components/monitor/theme";
import { Action, Card, Heading, IconButton, Label, s } from "../src/components/monitor/primitives";
import { BusyOverlay } from "../src/components/monitor/LoadState";
import { PRIVACY_URL, TERMS_URL } from "../src/privacy/publicDocuments";
import legalLabels from "../src/i18n/legalLabels.json";
import { supportedLanguage } from "../src/i18n/languages";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation(), c = useMonitorTheme(), router = useRouter();
  const billing = useBillingStore(), accounts = useAccountsStore((state) => state.accounts);
  const [plan, setPlan] = useState<Plan>("annual");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (error || billing.error || billing.message) scroll.current?.scrollTo({ y: 0, animated: true });
  }, [error, billing.error, billing.message]);
  const pro = hasPro(billing.access);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await Promise.all([useBillingStore.getState().loadOffers(), useAccountsStore.getState().loadAccounts()]);
        const preference = await preferredConnections();
        if (mounted) setSelected([...monitoredAccountIds(useAccountsStore.getState().accounts, false, preference)]);
      } catch { if (mounted) setError("billingError"); }
      finally { if (mounted) setLoading(false); }
    };
    void load();
    return () => { mounted = false; };
  }, []);
  const offer = billing.offers.find((item) => item.plan === plan);
  const busy = billing.busy || saving || loading;
  const close = () => router.canGoBack() ? router.back() : router.replace("/");
  const link = async (url: string) => { try { await Linking.openURL(url); } catch { setError("billingError"); } };
  const saveSelection = async () => {
    if (busy) return;
    setSaving(true); setError(undefined);
    try {
      await pauseMonitoring(() => saveFreeConnections(selected));
      await usePortfolioStore.getState().loadData();
      close();
    } catch { setError("billingError"); }
    finally { setSaving(false); }
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
    <View style={[s.row, { paddingHorizontal: 20 }, c.rtl && { flexDirection: "row-reverse" }]}>
      <Heading>AirCapital Pro</Heading>
      <IconButton label={t("monitor.close")} icon="close-outline" onPress={close} disabled={busy} />
    </View>
    <ScrollView ref={scroll} contentContainerStyle={[s.page, { gap: 20 }]}>
      <Card>
        <Heading>{pro ? "AirCapital Pro" : t("monitor.billingPlans")}</Heading>
        <Label>{t("monitor.billingIncluded")}</Label>
        {["proHistory", "proAnalytics", "proReports", "proAlerts"].map((key) =>
          <Text key={key} style={{ color: c.text, fontSize: 15, lineHeight: 23, textAlign: c.rtl ? "right" : "left" }}>✓ {t(`monitor.${key}`)}</Text>)}
        <Label>{t("monitor.manualFlows")}</Label>
      </Card>
      {!!(error || billing.error || billing.message) && <Card>
        <Text accessibilityRole={error || billing.error ? "alert" : undefined} accessibilityLiveRegion="polite"
          style={{ color: error || billing.error ? c.negative : c.text }}>
          {t(`monitor.${error || billing.error || billing.message}`)}
        </Text>
        <Action label={t("monitor.billingRetry")} disabled={busy} onPress={() => { setError(undefined); void billing.loadOffers(); }} />
      </Card>}
      {pro ? <Card>
        <Heading>{t("monitor.billingActivated")}</Heading>
        {billing.access.expiresAt && <Label>{t(`monitor.${billing.access.renewal === "renewing" ? "billingRenewing" : "billingEnding"}`, {
          date: new Date(billing.access.expiresAt).toLocaleDateString(i18n.language),
        })}</Label>}
        {billing.access.renewal === "billingIssue" && <Label>{t("monitor.billingIssue")}</Label>}
      </Card> : <>
        {billing.offers.map((item) => <Pressable key={item.plan} accessibilityRole="radio"
          accessibilityState={{ selected: plan === item.plan, disabled: busy }} disabled={busy}
          onPress={() => setPlan(item.plan)} style={{ borderColor: plan === item.plan ? c.accent : c.line,
            borderWidth: 2, borderRadius: 18, padding: 18, backgroundColor: c.panel, gap: 8 }}>
          <Heading>{t(`monitor.${item.plan === "annual" ? "billingAnnual" : "billingMonthly"}`)}</Heading>
          <Text style={{ color: c.text, fontSize: 25, fontWeight: "600" }}>
            {t(`monitor.${item.plan === "annual" ? "billingAnnualPrice" : "billingMonthlyPrice"}`, { price: item.priceString })}
          </Text>
          {item.monthlyEquivalent && <Label>{t("monitor.billingEquivalent", { price: item.monthlyEquivalent })}</Label>}
        </Pressable>)}
        <Label>{t("monitor.billingTerms")}</Label>
        <Action label={offer ? t("monitor.billingSubscribe", { price: offer.priceString }) : t("monitor.billingUnavailable")}
          primary loading={billing.busy} disabled={busy || !billing.enabled || billing.offers.length !== 2 || billing.access.tier === "unknown"}
          onPress={() => void billing.purchase(plan)} />
        <Action label={t("monitor.billingContinueFree")} onPress={close} disabled={busy} />
      </>}
      <Action label={t("monitor.billingRestore")} onPress={() => void billing.restore()} disabled={busy || !billing.enabled} />
      <Action label={t("monitor.billingManage")} onPress={() => void billing.manage()} disabled={busy || !billing.enabled} />
      {!pro && accounts.length > BILLING.freeConnections && <Card>
        <Heading>{t("monitor.freeSelection")}</Heading>
        <Label>{t("monitor.freeSelectionHint")}</Label>
        {accounts.filter((a) => a.state !== "deletionPending").map((account) => {
          const checked = selected.includes(account.id);
          return <Pressable key={account.id} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: busy }}
            disabled={busy} onPress={() => setSelected((ids) => checked ? ids.filter((id) => id !== account.id) :
              ids.length < BILLING.freeConnections ? [...ids, account.id] : ids)}
            style={{ paddingVertical: 12, flexDirection: c.rtl ? "row-reverse" : "row", gap: 12 }}>
            <Text style={{ color: c.accent }}>{checked ? "☑" : "☐"}</Text>
            <Text style={{ color: c.text, flexShrink: 1 }}>{EXCHANGE_CONFIG[account.exchange].label}{account.label ? ` · ${account.label}` : ""}</Text>
          </Pressable>;
        })}
        <Action label={t("monitor.save")} onPress={() => void saveSelection()} disabled={busy || selected.length !== 2} />
      </Card>}
      <View style={{ gap: 12 }}>
        <Action label={t("monitor.privacy")} onPress={() => void link(PRIVACY_URL)} disabled={busy} />
        <Action label={legalLabels[supportedLanguage(i18n.language) ?? "en"][1]} onPress={() => void link(TERMS_URL)} disabled={busy} />
      </View>
    </ScrollView>
    <BusyOverlay visible={busy} />
  </SafeAreaView>;
}
