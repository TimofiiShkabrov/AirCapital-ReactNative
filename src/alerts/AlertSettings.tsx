import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Action, Card, Field, Heading, Label } from "../components/monitor/primitives";
import { useMonitorTheme } from "../components/monitor/theme";
import { configureAlert, loadAlertRule } from "./service";
import { useBillingStore } from "../billing/store";
import { hasPro } from "../billing/policy";
import { ProCard } from "../billing/ProCard";
import { validThreshold } from "./policy";
import { parseAmount } from "../domain/input";

export function AlertSettings() {
  const { t } = useTranslation(), c = useMonitorTheme(), billing = useBillingStore();
  const [threshold, setThreshold] = useState("5"), [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState<string>();
  useEffect(() => {
    let mounted = true;
    void loadAlertRule().then((rule) => {
      if (mounted) { setThreshold(String(rule.threshold)); setEnabled(rule.enabled); }
    }).catch(() => { if (mounted) setError("genericError"); })
      .finally(() => { if (mounted) setBusy(false); });
    return () => { mounted = false; };
  }, []);
  const pro = !billing.enabled || hasPro(billing.access);
  const save = async (next: boolean) => {
    if (busy) return;
    setBusy(true); setError(undefined);
    try {
      await useBillingStore.getState().refresh();
      await configureAlert(next, parseAmount(threshold) ?? NaN);
      setEnabled(next);
    } catch (e) { setError(e instanceof Error ? e.message : "genericError"); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 12 }}><Card>
    <Heading>{t("monitor.alertsTitle")}</Heading>
    <Label>{t("monitor.alertsHint")}</Label>
    <Field label={t("monitor.alertsThreshold")} value={threshold} onChangeText={setThreshold} keyboardType="decimal-pad" editable={!busy && pro} />
    {error && <Text accessibilityRole="alert" style={{ color: c.negative }}>{t(`monitor.${error}`, { defaultValue: t("monitor.genericError") })}</Text>}
    {pro && <Action label={t("monitor.save")} onPress={() => void save(true)} loading={busy}
      disabled={busy || !validThreshold(parseAmount(threshold) ?? NaN)} />}
    {enabled && <Action label={t("monitor.alertsDisable")} onPress={() => void save(false)} disabled={busy} />}
  </Card>{!pro && <ProCard />}</View>;
}
