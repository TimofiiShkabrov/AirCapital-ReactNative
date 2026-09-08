import type { Backup } from "../domain/backup";
import { periodMetrics } from "../domain/analytics";
import { scopeEquals, type BalanceScope } from "../types/common";

// Protect spreadsheet consumers from formula injection in account labels and imported records.
export function csvCell(value: string | number | undefined): string {
  if (value === undefined) return '""';
  const raw = String(value);
  const safe = typeof value === "string" && /^[\s]*[=+@\-\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function portfolioReport(backup: Backup, labels: Record<string, string>) {
  const rows: (string | number | undefined)[][] = [[
    labels.accounts, labels.from, labels.to, labels.opening, labels.closing,
    labels.change, labels.deposits, labels.withdrawals, labels.result, labels.sources,
  ]];
  const scopes: { title: string; scope: BalanceScope; ids: string[] }[] = [
    { title: labels.total, scope: { type: "total" }, ids: backup.accounts.map((a) => a.id) },
    ...backup.accounts.map((a) => ({ title: `${a.exchange}${a.label ? ` · ${a.label}` : ""}`,
      scope: { type: "account" as const, accountId: a.id }, ids: [a.id] })),
  ];
  for (const { title, scope, ids } of scopes) {
    const members = [...ids].sort().join("|");
    const history = backup.snapshots.filter((s) => scopeEquals(s.scope, scope) &&
      s.calculationVersion === 2 && s.members?.slice().sort().join("|") === members)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const m = periodMetrics(history, ids, backup.flows.flows, backup.flows.coverage);
    rows.push([title, m?.first.timestamp, m?.last.timestamp, m?.first.balanceUSDT,
      m?.last.balanceUSDT, m?.delta, m?.complete ? m.deposits : undefined,
      m?.complete ? m.withdrawals : undefined, m?.result, labels.manualFlows]);
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
