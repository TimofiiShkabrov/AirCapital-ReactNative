import { create } from "zustand";
import { getAllAccounts, loadKeys } from "../services/secureStore";
import { addSnapshots } from "../services/balanceHistory";
import { readPrivate, writePrivate } from "../services/encryptedStorage";
import {
  observeAccount,
  usdToUSDT,
  verifyReadOnly,
} from "../services/observations";
import { mapLimit } from "../services/request";
import { sum } from "../domain/money";
import type { ExchangeAccount, Exchange } from "../types/common";
import type { AccountObservation, AccountSync } from "../types/monitor";

const CACHE = "aircapital.observations.v2";
interface PortfolioState {
  isLoading: boolean;
  errorMessage: string;
  accounts: ExchangeAccount[];
  observations: Record<string, AccountObservation>;
  sync: Record<string, AccountSync>;
  accountFailures: Record<string, string>;
  lastRefresh?: string;
  loadData: () => Promise<void>;
  getTotalBalance: () => number;
  getAccountBalance: (account: ExchangeAccount) => number | undefined;
  forgetAccount: (id: string) => Promise<void>;
}
let refresh: Promise<void> | undefined;
let pauses = 0;
export async function pauseMonitoring<T>(
  operation: () => Promise<T>,
): Promise<T> {
  pauses++;
  try {
    if (refresh) await refresh;
    return await operation();
  } finally {
    pauses--;
  }
}
export function clearPortfolioMemory() {
  usePortfolioStore.setState({
    accounts: [],
    observations: {},
    sync: {},
    accountFailures: {},
    lastRefresh: undefined,
    errorMessage: "",
    isLoading: false,
  });
}
const errorCode = (e: unknown) =>
  e instanceof Error && /^[a-zA-Z]+$/.test(e.message)
    ? e.message
    : "unknownError";
export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  isLoading: false,
  errorMessage: "",
  accounts: [],
  observations: {},
  sync: {},
  accountFailures: {},
  getTotalBalance: () =>
    sum(
      get().accounts.flatMap((a) =>
        get().observations[a.id]?.balanceUSDT === undefined
          ? []
          : [get().observations[a.id].balanceUSDT!],
      ),
    ),
  getAccountBalance: (account) => get().observations[account.id]?.balanceUSDT,
  forgetAccount: async (id) => {
    // A refresh already in flight must finish before deleting its cached result.
    if (refresh) await refresh;
    const observations = { ...get().observations },
      sync = { ...get().sync },
      failures = { ...get().accountFailures };
    delete observations[id];
    delete sync[id];
    delete failures[id];
    await writePrivate(CACHE, observations);
    set({
      observations,
      sync,
      accountFailures: failures,
      accounts: get().accounts.filter((a) => a.id !== id),
    });
  },
  loadData: () => {
    if (pauses) return Promise.resolve();
    if (refresh) return refresh;
    const work = async () => {
      set({ isLoading: true, errorMessage: "" });
      try {
        const accounts = await getAllAccounts();
        const cached = await readPrivate<Record<string, AccountObservation>>(
          CACHE,
          {},
        );
        const previous = { ...cached, ...get().observations };
        const observations: Record<string, AccountObservation> = {};
        const sync: Record<string, AccountSync> = {};
        const failures: Record<string, string> = {};
        for (const account of accounts)
          if (previous[account.id])
            observations[account.id] = previous[account.id];
        const attempt = new Date().toISOString();
        for (const account of accounts)
          sync[account.id] = {
            status: observations[account.id] ? "stale" : "error",
            lastAttemptAt: attempt,
            lastSuccessAt:
              observations[account.id]?.lastCompleteAt ??
              (observations[account.id]?.complete
                ? observations[account.id]?.observedAt
                : undefined),
          };
        set({ accounts, observations, sync, accountFailures: {} });
        const rate = accounts.some(
          (a) => a.exchange === "bybit" || a.exchange === "okx",
        )
          ? await usdToUSDT()
          : undefined;
        await mapLimit(accounts, 2, async (account) => {
          try {
            const keys = await loadKeys(account);
            if (!keys) throw new Error("missingKeys");
            await verifyReadOnly(account.exchange, keys);
            const observation = await observeAccount(account, keys, rate);
            observation.lastCompleteAt = observation.complete
              ? observation.observedAt
              : (previous[account.id]?.lastCompleteAt ??
                (previous[account.id]?.complete
                  ? previous[account.id]?.observedAt
                  : undefined));
            observations[account.id] = observation;
            sync[account.id] = {
              status: observation.complete ? "fresh" : "partial",
              lastAttemptAt: attempt,
              lastSuccessAt: observation.lastCompleteAt,
            };
          } catch (e) {
            failures[account.id] = errorCode(e);
            sync[account.id] = {
              ...sync[account.id],
              status: observations[account.id] ? "stale" : "error",
              error: failures[account.id],
            };
          }
        });
        // Account removal or creation while refreshing changes the aggregate's membership.
        const current = await getAllAccounts();
        const active = new Set(current.map((a) => a.id));
        for (const id of Object.keys(observations))
          if (!active.has(id)) {
            delete observations[id];
            delete sync[id];
            delete failures[id];
          }
        const balances: Record<string, number> = {};
        const exchangeTotals: Partial<Record<Exchange, number>> = {};
        for (const account of current)
          if (
            sync[account.id]?.status === "fresh" &&
            observations[account.id]?.balanceUSDT !== undefined
          )
            balances[account.id] = observations[account.id].balanceUSDT!;
        for (const exchange of new Set(current.map((a) => a.exchange))) {
          const group = current.filter((a) => a.exchange === exchange);
          if (group.every((a) => balances[a.id] !== undefined))
            exchangeTotals[exchange] = sum(group.map((a) => balances[a.id]));
        }
        set({
          accounts: current,
          observations: { ...observations },
          sync: { ...sync },
          accountFailures: failures,
        });
        if (current.length) {
          await writePrivate(CACHE, observations);
          const total = current.every((a) => balances[a.id] !== undefined)
            ? sum(Object.values(balances))
            : undefined;
          await addSnapshots(total, current, balances, exchangeTotals);
        }
        set({ lastRefresh: new Date().toISOString() });
      } catch (e) {
        set({ errorMessage: errorCode(e) });
      } finally {
        set({ isLoading: false });
      }
    };
    refresh = work().finally(() => {
      refresh = undefined;
    });
    return refresh;
  },
}));
