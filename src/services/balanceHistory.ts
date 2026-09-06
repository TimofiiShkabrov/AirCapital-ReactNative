import type {
  BalanceSnapshot,
  BalanceScope,
  ExchangeAccount,
  Exchange,
} from "../types/common";
import { scopeEquals } from "../types/common";
import { readPrivate, writePrivate } from "./encryptedStorage";
import { serialQueue } from "./serial";

const STORAGE_KEY = "aircapital.balanceSnapshots.v1";
const serial = serialQueue();
export async function loadAllSnapshots(): Promise<BalanceSnapshot[]> {
  const all = await readPrivate<BalanceSnapshot[]>(STORAGE_KEY, []);
  if (
    !Array.isArray(all) ||
    all.some(
      (s) =>
        !s?.scope ||
        !Number.isFinite(s.balanceUSDT) ||
        !Number.isFinite(Date.parse(s.timestamp)),
    )
  )
    throw new Error("invalidHistory");
  return all;
}
export async function getSnapshots(
  scope: BalanceScope,
): Promise<BalanceSnapshot[]> {
  return (await loadAllSnapshots())
    .filter((s) => scopeEquals(s.scope, scope))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
function append(
  all: BalanceSnapshot[],
  scope: BalanceScope,
  balanceUSDT: number,
  timestamp: string,
  members?: string[],
) {
  if (!Number.isFinite(balanceUSDT)) throw new Error("invalidBalance");
  const last = all.filter((s) => scopeEquals(s.scope, scope)).at(-1);
  // Preserve genuine zeros, negative equity and the initial observation. Only exact duplicate timestamps are replaced.
  const next: BalanceSnapshot = {
    id: `${timestamp}-${scope.type}-${all.length}`,
    scope,
    timestamp,
    balanceUSDT,
    calculationVersion: 2,
    members: members?.slice().sort(),
  };
  if (last?.timestamp === timestamp) all.splice(all.indexOf(last), 1, next);
  else all.push(next);
}
export function addSnapshot(
  scope: BalanceScope,
  balanceUSDT: number,
): Promise<void> {
  return serial(async () => {
    const all = await loadAllSnapshots();
    append(all, scope, balanceUSDT, new Date().toISOString());
    await writePrivate(STORAGE_KEY, all);
  });
}
export function addSnapshots(
  total: number | undefined,
  accounts: ExchangeAccount[],
  balances: Record<string, number>,
  exchangeTotals: Partial<Record<Exchange, number>>,
  timestamp = new Date().toISOString(),
): Promise<void> {
  return serial(async () => {
    const all = await loadAllSnapshots();
    if (total !== undefined)
      append(
        all,
        { type: "total" },
        total,
        timestamp,
        accounts.map((a) => a.id),
      );
    for (const account of accounts)
      if (balances[account.id] !== undefined)
        append(
          all,
          { type: "account", accountId: account.id },
          balances[account.id],
          timestamp,
          [account.id],
        );
    for (const [exchange, balance] of Object.entries(exchangeTotals))
      if (balance !== undefined)
        append(
          all,
          { type: "exchange", exchange: exchange as Exchange },
          balance,
          timestamp,
          accounts.filter((a) => a.exchange === exchange).map((a) => a.id),
        );
    await writePrivate(STORAGE_KEY, all);
  });
}
export function removeAccountHistory(accountId: string): Promise<void> {
  return serial(async () => {
    const all = await loadAllSnapshots();
    // Aggregate records contain the removed account's data too. Keep unrelated account-level records.
    await writePrivate(
      STORAGE_KEY,
      all.filter((s) =>
        s.scope.type === "account"
          ? s.scope.accountId !== accountId
          : s.members
            ? !s.members.includes(accountId)
            : false,
      ),
    );
  });
}
