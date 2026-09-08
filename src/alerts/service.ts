import { readPrivate, writePrivate } from "../services/encryptedStorage";
import { dataQueue } from "../services/serial";
import { proAccess, requirePro } from "../billing/store";
import { evaluateAlert, validThreshold, type AlertRule } from "./policy";
import { requestAlerts, sendAlert } from "./driver";
import i18n from "../i18n";
const KEY = "aircapital.capitalAlerts.v1";
export const loadAlertRule = () => readPrivate<AlertRule>(KEY, { enabled: false, threshold: 5 });
export async function configureAlert(enabled: boolean, threshold: number) {
  if (!validThreshold(threshold)) throw new Error("invalidAmount");
  if (enabled) {
    requirePro();
    if (!await requestAlerts()) throw new Error("alertsPermission");
  }
  await dataQueue(() => writePrivate(KEY, { enabled, threshold }));
}
export function checkCapitalAlert(value: number | undefined, ids: string[], at: string) {
  return dataQueue(async () => {
    const rule = await loadAlertRule();
    if (!rule.enabled) return;
    if (!proAccess()) {
      // Expiry must not produce a misleading accumulated change after resubscribing.
      await writePrivate(KEY, { enabled: rule.enabled, threshold: rule.threshold });
      return;
    }
    if (value === undefined) return;
    const next = evaluateAlert(rule, value, ids, at);
    if (next.notify && !await sendAlert("AirCapital", i18n.t("monitor.alertsTriggered"))) return;
    if (next.rule !== rule) await writePrivate(KEY, next.rule);
  });
}
