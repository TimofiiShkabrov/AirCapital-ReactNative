import {
  ALL_EXCHANGES,
  type ExchangeAccount,
  type BalanceSnapshot,
} from "../types/common";
import type { ArchivedPlan, CashFlow, FlowCoverage } from "../types/monitor";
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export interface Backup {
  version: 1 | 2;
  exportedAt: string;
  quoteCurrency: "USDT";
  accounts: ExchangeAccount[];
  snapshots: BalanceSnapshot[];
  flows: { flows: CashFlow[]; coverage: FlowCoverage[] };
  archive: ArchivedPlan[];
}
const fail = (): never => {
  throw new Error("invalidBackup");
};
const record = (v: unknown, allowed: string[]): Record<string, unknown> => {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !allowed.includes(k))
  )
    return fail();
  return v as Record<string, unknown>;
};
const list = (v: unknown, max = 100000): unknown[] =>
  Array.isArray(v) && v.length <= max ? v : fail();
const str = (v: unknown, max = 200): string =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : fail();
const id = (v: unknown) => {
  const s = str(v);
  return /^[a-zA-Z0-9_.:-]+$/.test(s) &&
    !["__proto__", "constructor", "prototype"].includes(s)
    ? s
    : fail();
};
const date = (v: unknown) => {
  const s = str(v, 40),
    n = Date.parse(s);
  return /^\d{4}-\d\d-\d\dT/.test(s) &&
    Number.isFinite(n) &&
    n >= 0 &&
    n <= Date.now() + 300000
    ? new Date(n).toISOString()
    : fail();
};
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e20
    ? v
    : fail();
const exchange = (v: unknown) =>
  ALL_EXCHANGES.includes(v as never)
    ? (v as ExchangeAccount["exchange"])
    : fail();
const unique = <T>(
  rows: T[],
  key: (r: T) => string,
  equal = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b),
): T[] => {
  const map = new Map<string, T>();
  for (const r of rows) {
    const k = key(r),
      prev = map.get(k);
    if (prev && !equal(prev, r)) throw new Error("backupConflict");
    if (!prev) map.set(k, r);
  }
  return [...map.values()];
};
export function snapshotKey(s: BalanceSnapshot) {
  return JSON.stringify([
    s.scope.type,
    s.scope.type === "account"
      ? s.scope.accountId
      : s.scope.type === "exchange"
        ? s.scope.exchange
        : "",
    s.timestamp,
    s.calculationVersion ?? 1,
    s.members?.slice().sort(),
  ]);
}
export function parseBackup(text: string): Backup {
  if (text.length > MAX_BACKUP_BYTES) return fail();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail();
  }
  const b = record(raw, [
    "version",
    "exportedAt",
    "quoteCurrency",
    "accounts",
    "snapshots",
    "flows",
    "archive",
  ]);
  if (![1, 2].includes(b.version as number) || b.quoteCurrency !== "USDT")
    return fail();
  const accounts = unique(
    list(b.accounts, 100).map((v) => {
      const a = record(v, ["id", "exchange", "label", "createdAt"]);
      return {
        id: id(a.id),
        exchange: exchange(a.exchange),
        createdAt: date(a.createdAt),
        ...(a.label !== undefined ? { label: str(a.label, 60) } : {}),
      };
    }),
    (a) => a.id,
  );
  const ids = new Map(accounts.map((a) => [a.id, a]));
  const accountId = (v: unknown) => {
    const s = id(v);
    return ids.has(s) ? s : fail();
  };
  const snapshots = unique(
    list(b.snapshots).map((v) => {
      const s = record(v, [
        "id",
        "scope",
        "timestamp",
        "balanceUSDT",
        "calculationVersion",
        "members",
      ]);
      const scope = record(s.scope, ["type", "accountId", "exchange"]);
      let normalized: BalanceSnapshot["scope"];
      if (scope.type === "total" && Object.keys(scope).length === 1)
        normalized = { type: "total" };
      else if (scope.type === "account" && Object.keys(scope).length === 2)
        normalized = { type: "account", accountId: accountId(scope.accountId) };
      else if (scope.type === "exchange" && Object.keys(scope).length === 2)
        normalized = { type: "exchange", exchange: exchange(scope.exchange) };
      else return fail();
      if (s.calculationVersion !== undefined && s.calculationVersion !== 2)
        return fail();
      const members =
        s.members === undefined
          ? undefined
          : list(s.members, 100).map(accountId).sort();
      if (
        members &&
        (new Set(members).size !== members.length ||
          !members.length ||
          members.some((m) =>
            normalized.type === "account"
              ? m !== normalized.accountId
              : normalized.type === "exchange"
                ? ids.get(m)!.exchange !== normalized.exchange
                : false,
          ))
      )
        return fail();
      return {
        id: id(s.id),
        scope: normalized,
        timestamp: date(s.timestamp),
        balanceUSDT: number(s.balanceUSDT),
        ...(s.calculationVersion === 2
          ? { calculationVersion: 2 as const }
          : {}),
        ...(members ? { members } : {}),
      };
    }),
    snapshotKey,
    (a, b) => a.balanceUSDT === b.balanceUSDT,
  );
  const ledger = record(b.flows, ["flows", "coverage"]);
  const flows = unique(
    list(ledger.flows, 50000).map((v) => {
      const f = record(v, [
        "id",
        "accountId",
        "occurredAt",
        "type",
        "amountUSDT",
        "source",
        "transferId",
        "feeUSDT",
      ]);
      if (
        !["deposit", "withdrawal"].includes(f.type as string) ||
        f.source !== "manual" ||
        number(f.amountUSDT) <= 0
      )
        return fail();
      if (f.feeUSDT !== undefined && number(f.feeUSDT) < 0) return fail();
      return {
        id: id(f.id),
        accountId: accountId(f.accountId),
        occurredAt: date(f.occurredAt),
        type: f.type as CashFlow["type"],
        amountUSDT: number(f.amountUSDT),
        source: "manual" as const,
        ...(f.transferId !== undefined ? { transferId: id(f.transferId) } : {}),
        ...(f.feeUSDT !== undefined ? { feeUSDT: number(f.feeUSDT) } : {}),
      };
    }),
    (f) => f.id,
  );
  const coverage = list(ledger.coverage).map((v) => {
    const c = record(v, ["accountId", "from", "to"]);
    const from = date(c.from),
      to = date(c.to);
    if (from >= to) return fail();
    return { accountId: accountId(c.accountId), from, to };
  });
  const archive = unique(
    list(b.archive ?? [], 10000).map((v) => {
      const p = record(v, [
        "id",
        "exchange",
        "accountId",
        "instrument",
        "orderIds",
        "archivedAt",
      ]);
      return {
        id: id(p.id),
        archivedAt: date(p.archivedAt),
        orderIds: list(p.orderIds, 10000).map((v) => str(v)),
        ...(p.exchange !== undefined ? { exchange: exchange(p.exchange) } : {}),
        ...(p.accountId !== undefined ? { accountId: id(p.accountId) } : {}),
        ...(p.instrument !== undefined
          ? { instrument: str(p.instrument) }
          : {}),
      };
    }),
    (p) => p.id,
  );
  return {
    version: b.version as 1 | 2,
    exportedAt: date(b.exportedAt),
    quoteCurrency: "USDT",
    accounts,
    snapshots,
    flows: { flows, coverage },
    archive,
  };
}
export function mergeBackup(current: Backup, incoming: Backup) {
  const accounts = unique(
    [
      ...current.accounts,
      ...incoming.accounts.map((a) => ({ ...a, state: "needsKeys" as const })),
    ],
    (a) => a.id,
    (a, b) => a.exchange === b.exchange && a.createdAt === b.createdAt,
  );
  const snapshots = unique(
    [...current.snapshots, ...incoming.snapshots],
    snapshotKey,
    (a, b) => a.balanceUSDT === b.balanceUSDT,
  ).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const flows = unique(
    [...current.flows.flows, ...incoming.flows.flows],
    (f) => f.id,
  );
  const archive = unique(
    [...current.archive, ...incoming.archive],
    (p) => p.id,
    (a, b) =>
      a.exchange === b.exchange &&
      a.accountId === b.accountId &&
      a.instrument === b.instrument &&
      JSON.stringify(a.orderIds) === JSON.stringify(b.orderIds),
  );
  if (
    accounts.length > 100 ||
    snapshots.length > 100000 ||
    flows.length > 50000 ||
    archive.length > 10000
  )
    return fail();
  const added = {
    accounts: accounts.length - current.accounts.length,
    snapshots: snapshots.length - current.snapshots.length,
    flows: flows.length - current.flows.flows.length,
    archive: archive.length - current.archive.length,
  };
  return {
    backup: {
      ...current,
      accounts,
      snapshots,
      archive,
      flows: {
        flows,
        coverage: Object.values(added).some((n) => n > 0)
          ? []
          : current.flows.coverage,
      },
    },
    added,
  };
}
