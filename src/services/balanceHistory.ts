import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BalanceSnapshot, BalanceScope, ExchangeAccount, Exchange } from '../types/common';
import { scopeEquals } from '../types/common';

const STORAGE_KEY = 'aircapital.balanceSnapshots.v1';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function loadAll(): Promise<BalanceSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveAll(snapshots: BalanceSnapshot[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {}
}

export async function getSnapshots(scope: BalanceScope): Promise<BalanceSnapshot[]> {
  const all = await loadAll();
  const scoped = all
    .filter((s) => scopeEquals(s.scope, scope))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return filterNonZero(scoped);
}

export async function addSnapshot(scope: BalanceScope, balanceUSDT: number): Promise<void> {
  const all = await loadAll();
  const now = new Date();
  const nowMs = now.getTime();

  const lastIdx = [...all]
    .reverse()
    .findIndex((s) => scopeEquals(s.scope, scope));
  const actualLastIdx = lastIdx === -1 ? -1 : all.length - 1 - lastIdx;

  if (actualLastIdx !== -1) {
    const last = all[actualLastIdx];
    const lastMs = new Date(last.timestamp).getTime();

    if (balanceUSDT === 0 && last.balanceUSDT > 0 && nowMs - lastMs < 10 * 60 * 1000) {
      return;
    }

    if (nowMs - lastMs < 30 * 60 * 1000) {
      all[actualLastIdx] = { ...last, timestamp: now.toISOString(), balanceUSDT };
    } else {
      all.push({ id: generateId(), scope, timestamp: now.toISOString(), balanceUSDT });
    }
  } else {
    if (balanceUSDT === 0) return;
    all.push({ id: generateId(), scope, timestamp: now.toISOString(), balanceUSDT });
  }

  await saveAll(all);
}

export async function addSnapshots(
  total: number,
  accounts: ExchangeAccount[],
  balances: Record<string, number>,
  exchangeTotals: Partial<Record<Exchange, number>>,
): Promise<void> {
  await addSnapshot({ type: 'total' }, total);
  for (const account of accounts) {
    await addSnapshot({ type: 'account', accountId: account.id }, balances[account.id] ?? 0);
  }
  for (const [exchange, bal] of Object.entries(exchangeTotals)) {
    await addSnapshot({ type: 'exchange', exchange: exchange as Exchange }, bal ?? 0);
  }
}

function filterNonZero(snapshots: BalanceSnapshot[]): BalanceSnapshot[] {
  const hasNonZero = snapshots.some((s) => s.balanceUSDT > 0.000001);
  return hasNonZero ? snapshots.filter((s) => s.balanceUSDT > 0.000001) : snapshots;
}
