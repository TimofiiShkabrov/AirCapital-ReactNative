import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBillingStore } from "../src/billing/store";
import { hasPro, monitoredAccountIds } from "../src/billing/policy";
import { preferredConnections, saveFreeConnections } from "../src/billing/connections";
import { BILLING, type Plan } from "../src/billing/config";
import type { Offer } from "../src/billing/driver";
import { useAccountsStore } from "../src/store/accountsStore";
import { pauseMonitoring, usePortfolioStore } from "../src/store/portfolioStore";
import { useMonitorTheme, type MonitorColors } from "../src/components/monitor/theme";
import { Action, Card, Heading, IconButton, Label, s } from "../src/components/monitor/primitives";
import { BusyOverlay } from "../src/components/monitor/LoadState";
import { PRIVACY_URL, TERMS_URL } from "../src/privacy/publicDocuments";
import legalLabels from "../src/i18n/legalLabels.json";
import { supportedLanguage } from "../src/i18n/languages";
import { EXCHANGE_CONFIG } from "../src/constants/exchanges";

const row = (c: MonitorColors) => ({ flexDirection: c.rtl ? "row-reverse" as const : "row" as const });

/** Low-emphasis action: a tappable text line, not a button pill. */
function TextButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const c = useMonitorTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} hitSlop={6}
    style={({ pressed }) => ({ minHeight: 40, justifyContent: "center", paddingHorizontal: 8, opacity: disabled ? 0.45 : pressed ? 0.6 : 1 })}>
    <Text style={{ color: c.accent, fontSize: 14, fontWeight: "500", textAlign: "center" }}>{label}</Text>
  </Pressable>;
}

/** Small muted section title, matching the settings groups. */
function SectionTitle({ children }: { children: string }) {
  const c = useMonitorTheme();
  return <Text accessibilityRole="header" style={{ color: c.muted, fontSize: 12, fontWeight: "600", paddingHorizontal: 4, textAlign: c.rtl ? "right" : "left" }}>
    {children}
  </Text>;
}

function PlanCard({ offer, selected, disabled, onPress }: { offer: Offer; selected: boolean; disabled: boolean; onPress: () => void }) {
  const c = useMonitorTheme(), { t } = useTranslation();
  const annual = offer.plan === "annual";
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({
      flex: 1, minWidth: 140, gap: 6, padding: 14, borderRadius: 16, borderWidth: 2,
      borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.tint : c.panel,
      opacity: pressed ? 0.8 : 1,
    })}>
    <Text style={{ color: selected ? c.accent : c.muted, fontSize: 12, fontWeight: "600", textAlign: c.rtl ? "right" : "left" }}>
      {t(`monitor.${annual ? "billingAnnual" : "billingMonthly"}`)}
    </Text>
    <Text style={{ color: c.text, fontSize: 22, fontWeight: "600", textAlign: c.rtl ? "right" : "left" }}>{offer.priceString}</Text>
    <Label>{annual && offer.monthlyEquivalent
      ? t("monitor.billingEquivalent", { price: offer.monthlyEquivalent })
      : t(`monitor.${annual ? "billingAnnualPrice" : "billingMonthlyPrice"}`, { price: offer.priceString })}</Label>
  </Pressable>;
}

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
  const purchasable = billing.enabled && billing.offers.length === 2 && billing.access.tier !== "unknown";
  // The plans block already explains unavailability; do not repeat it in the status card.
  const notice = error || (billing.error === "billingUnavailable" && !purchasable ? undefined : billing.error);
  const retry = () => { setError(undefined); void billing.loadOffers(); };
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
  const activeAccounts = accounts.filter((a) => a.state !== "deletionPending");
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
    <View style={[s.row, row(c), { paddingHorizontal: 20 }]}>
      <Heading>AirCapital Pro</Heading>
      <IconButton label={t("monitor.close")} icon="close-outline" onPress={close} disabled={busy} />
    </View>
    <ScrollView ref={scroll} contentContainerStyle={[s.page, { gap: 22 }]}>

      {/* Status: errors and confirmations. One place, only when there is something to say. */}
      {!!(notice || billing.message) && <Card style={{ borderColor: notice ? c.negative : c.line }}>
        <Text accessibilityRole={notice ? "alert" : undefined} accessibilityLiveRegion="polite"
          style={{ color: notice ? c.negative : c.text, fontSize: 14, lineHeight: 20, textAlign: c.rtl ? "right" : "left" }}>
          {t(`monitor.${notice || billing.message}`)}
        </Text>
        {!!notice && billing.enabled && <Action label={t("monitor.billingRetry")} disabled={busy} onPress={retry} />}
      </Card>}

      {/* Hero: what Pro gives. */}
      <Card style={{ gap: 14 }}>
        {pro ? <>
          <View style={[row(c), { alignItems: "center", gap: 10 }]}>
            <Ionicons name="checkmark-circle" size={22} color={c.positive} />
            <Heading>{t("monitor.billingActivated")}</Heading>
          </View>
          {!!billing.access.expiresAt && <Label>{t(`monitor.${billing.access.renewal === "renewing" ? "billingRenewing" : "billingEnding"}`, {
            date: new Date(billing.access.expiresAt).toLocaleDateString(i18n.language),
          })}</Label>}
          {billing.access.renewal === "billingIssue" && <Label style={{ color: c.warning }}>{t("monitor.billingIssue")}</Label>}
        </> : <Label style={{ fontSize: 13, lineHeight: 20 }}>{t("monitor.billingIncluded")}</Label>}
        <View style={{ gap: 10 }}>
          {(["proHistory", "proAnalytics", "proReports", "proAlerts"] as const).map((key) =>
            <View key={key} style={[row(c), { alignItems: "flex-start", gap: 10 }]}>
              <Ionicons name="checkmark" size={18} color={c.accent} style={{ marginTop: 1 }} />
              <Text style={{ color: c.text, fontSize: 15, lineHeight: 21, flex: 1, textAlign: c.rtl ? "right" : "left" }}>{t(`monitor.${key}`)}</Text>
            </View>)}
        </View>
      </Card>

      {/* Plans and the single primary action. */}
      {!pro && <View style={{ gap: 10 }}>
        <SectionTitle>{t("monitor.billingPlans")}</SectionTitle>
        {purchasable ? <>
          <View style={[row(c), { gap: 10, flexWrap: "wrap" }]}>
            {billing.offers.map((item) => <PlanCard key={item.plan} offer={item} selected={plan === item.plan} disabled={busy}
              onPress={() => setPlan(item.plan)} />)}
          </View>
          <View style={{ gap: 8, marginTop: 4 }}>
            <Action label={t("monitor.billingSubscribe", { price: offer?.priceString ?? "" })} primary
              loading={billing.busy} disabled={busy || !offer} onPress={() => void billing.purchase(plan)} />
            <Label style={{ fontSize: 11, lineHeight: 16 }}>{t("monitor.billingTerms")}</Label>
          </View>
        </> : <Card style={{ alignItems: "center", gap: 10 }}>
          <Ionicons name="time-outline" size={22} color={c.muted} />
          <Label style={{ textAlign: "center" }}>{t("monitor.billingUnavailable")}</Label>
          {billing.enabled && !loading && <TextButton label={t("monitor.billingRetry")} onPress={retry} disabled={busy} />}
        </Card>}
        <TextButton label={t("monitor.billingContinueFree")} onPress={close} disabled={busy} />
      </View>}

      {/* Free plan: which two accounts keep refreshing. Only when the choice is actually needed. */}
      {!pro && activeAccounts.length > BILLING.freeConnections && <View style={{ gap: 10 }}>
        <SectionTitle>{t("monitor.freeSelection")}</SectionTitle>
        <Card>
          <Label>{t("monitor.freeSelectionHint")}</Label>
          {activeAccounts.map((account) => {
            const checked = selected.includes(account.id);
            return <Pressable key={account.id} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: busy }}
              disabled={busy} onPress={() => setSelected((ids) => checked ? ids.filter((id) => id !== account.id) :
                ids.length < BILLING.freeConnections ? [...ids, account.id] : ids)}
              style={[row(c), { paddingVertical: 10, alignItems: "center", gap: 12 }]}>
              <Ionicons name={checked ? "checkbox" : "square-outline"} size={22} color={checked ? c.accent : c.muted} />
              <Text style={{ color: c.text, fontSize: 15, flexShrink: 1 }}>{EXCHANGE_CONFIG[account.exchange].label}{account.label ? ` · ${account.label}` : ""}</Text>
            </Pressable>;
          })}
          <Action label={t("monitor.save")} onPress={() => void saveSelection()} disabled={busy || selected.length !== BILLING.freeConnections} />
        </Card>
      </View>}

      {/* Secondary store actions and legal links: text, not buttons. */}
      <View style={{ gap: 4, alignItems: "center" }}>
        {billing.enabled && <View style={[row(c), { justifyContent: "center", flexWrap: "wrap", gap: 4 }]}>
          <TextButton label={t("monitor.billingRestore")} onPress={() => void billing.restore()} disabled={busy} />
          {pro && <TextButton label={t("monitor.billingManage")} onPress={() => void billing.manage()} disabled={busy} />}
        </View>}
        <View style={[row(c), { justifyContent: "center", alignItems: "center", flexWrap: "wrap" }]}>
          <TextButton label={t("monitor.privacy")} onPress={() => void link(PRIVACY_URL)} disabled={busy} />
          <Text style={{ color: c.muted }}>·</Text>
          <TextButton label={legalLabels[supportedLanguage(i18n.language) ?? "en"][1]} onPress={() => void link(TERMS_URL)} disabled={busy} />
        </View>
        <Label style={{ fontSize: 11, lineHeight: 16, textAlign: "center" }}>{t("monitor.manualFlows")}</Label>
      </View>
    </ScrollView>
    <BusyOverlay visible={busy} />
  </SafeAreaView>;
}
