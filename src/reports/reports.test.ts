import { describe, expect, it } from "vitest";
import { csvCell, portfolioReport } from "./csv";
import { evaluateAlert } from "../alerts/policy";
import type { Backup } from "../domain/backup";
import { comparePeriods } from "../domain/periodComparison";
it("escapes CSV labels without corrupting legitimate negative amounts", () => {
  expect(csvCell("=WEBSERVICE(\"secret\")")).toBe('"\'=WEBSERVICE(""secret"")"');
  expect(csvCell(" \t+SUM(A1:A2)")).toContain("'");
  expect(csvCell(-5)).toBe('"-5"');
  expect(csvCell("a,b\nc")).toBe('"a,b\nc"');
});
it("keeps unconfirmed cash flow results empty in a report", () => {
  const backup = { accounts: [{ id: "a", exchange: "binance", label: "=1+1" }], snapshots: [0, 1].map((n) => ({
    scope: { type: "account", accountId: "a" }, calculationVersion: 2, members: ["a"],
    timestamp: new Date(1000 + n * 1000).toISOString(), balanceUSDT: 100 + n * 100,
  })), flows: { flows: [], coverage: [] } } as unknown as Backup;
  const csv = portfolioReport(backup, { manualFlows: "Manual", total: "Total" });
  expect(csv).toContain('"100","200","100","","","","Manual"');
});
describe("capital change notifications", () => {
  const at = "2026-09-08T12:00:00Z";
  const rule = { enabled: true, threshold: 5, baseline: { value: 100, members: "a|b", at: "2026-09-08T11:00:00Z" } };
  it("notifies only after threshold crossing and resets its baseline", () => {
    expect(evaluateAlert(rule, 104, ["a", "b"], at).notify).toBe(false);
    const next = evaluateAlert(rule, 95, ["b", "a"], at);
    expect(next.notify).toBe(true);
    expect(evaluateAlert(next.rule, 95, ["a", "b"], at).notify).toBe(false);
  });
  it("never treats changing membership, zero baseline or stale data as market movement", () => {
    expect(evaluateAlert(rule, 200, ["c"], at).notify).toBe(false);
    expect(evaluateAlert({ ...rule, baseline: { ...rule.baseline, value: 0 } }, 200, ["a", "b"], at).notify).toBe(false);
    expect(evaluateAlert(rule, 200, ["a", "b"], rule.baseline.at).notify).toBe(false);
    expect(evaluateAlert(rule, NaN, ["a", "b"], at).notify).toBe(false);
  });
});
it("does not manufacture a period comparison from sparse or differently scoped history", () => {
  expect(comparePeriods([], "month", Date.now(), ["a"], [], [])).toBeUndefined();
  expect(comparePeriods([], "all", Date.now(), ["a"], [], [])).toBeUndefined();
});
