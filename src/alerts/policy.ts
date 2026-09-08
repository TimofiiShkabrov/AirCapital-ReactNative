export type AlertRule = {
  enabled: boolean; threshold: number;
  baseline?: { value: number; members: string; at: string };
};
export function validThreshold(value: number) { return Number.isFinite(value) && value >= 0.1 && value <= 1000; }
export function evaluateAlert(rule: AlertRule, value: number, ids: string[], at: string) {
  if (!rule.enabled || !validThreshold(rule.threshold) || !Number.isFinite(value) || !ids.length ||
      !Number.isFinite(Date.parse(at))) return { rule, notify: false };
  const members = [...new Set(ids)].sort().join("|");
  const baseline = { value, members, at };
  if (!rule.baseline || rule.baseline.members !== members || rule.baseline.value === 0)
    return { rule: { ...rule, baseline }, notify: false };
  if (Date.parse(at) <= Date.parse(rule.baseline.at)) return { rule, notify: false };
  const change = Math.abs(value - rule.baseline.value) / Math.abs(rule.baseline.value) * 100;
  return change >= rule.threshold ? { rule: { ...rule, baseline }, notify: true } : { rule, notify: false };
}
