import { create } from 'zustand';
import { getAllAccounts, loadKeys } from '../services/secureStore';
import { addSnapshots } from '../services/balanceHistory';
import { errorKey, formatApiError } from '../services/errorHelper';
import i18n from '../i18n';
import type {
  ExchangeAccount,
  Exchange,
  PositionItem,
  WalletTypeSection,
  ExchangeDetailRow,
} from '../types/common';

import * as BinanceAPI from '../api/binance';
import * as BybitAPI from '../api/bybit';
import * as BingXAPI from '../api/bingx';
import * as GateAPI from '../api/gateio';
import * as OkxAPI from '../api/okx';

// ─── Internal types ───────────────────────────────────────────────────────────

interface TradeFill {
  time: Date;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

interface BinanceAccountData {
  wallets: BinanceAPI.BinanceWalletItem[];
}

interface BybitAccountData {
  walletList: BybitAPI.BybitWalletResponse['result']['list'];
  earnPositions: { category: string; coin: string; amount: string; status?: string }[];
  coinBalances: Record<string, { coin: string; walletBalance: string }[]>;
}

interface BingXAccountData {
  spotWallet?: BingXAPI.BingXSpotWallet;
  futuresWallet?: BingXAPI.BingXFuturesWallet;
}

interface GateAccountData {
  totalBalance?: GateAPI.GateTotalBalance;
}

interface OkxAccountData {
  balance?: OkxAPI.OkxAccountBalance;
  fundingBalances?: OkxAPI.OkxFundingBalanceResponse['data'];
}

// ─── Store state ─────────────────────────────────────────────────────────────

interface PortfolioState {
  isLoading: boolean;
  errorMessage: string;
  accounts: ExchangeAccount[];
  binanceData: Record<string, BinanceAccountData>;
  bybitData: Record<string, BybitAccountData>;
  bingxData: Record<string, BingXAccountData>;
  gateData: Record<string, GateAccountData>;
  okxData: Record<string, OkxAccountData>;
  spotPositions: Record<string, PositionItem[]>;
  futuresPositions: Record<string, PositionItem[]>;
  selectedWalletSection?: WalletTypeSection;
  accountFailures: Record<string, string>;

  loadData: () => Promise<void>;
  getTotalBalance: () => number;
  getAccountBalance: (account: ExchangeAccount) => number;
  getWalletTypeSections: (account: ExchangeAccount) => WalletTypeSection[];
  getPositionsForSection: (account: ExchangeAccount, section: WalletTypeSection) => PositionItem[];
  setSelectedWalletSection: (section: WalletTypeSection) => void;
}

// ─── Cost-basis calculation (FIFO) ───────────────────────────────────────────

function costBasis(
  trades: TradeFill[],
  currentQty: number,
): { invested?: number; openedAt?: Date } {
  if (currentQty <= 0 || trades.length === 0) return {};
  const sorted = [...trades].sort((a, b) => a.time.getTime() - b.time.getTime());
  let qty = 0;
  let cost = 0;
  let openedAt: Date | undefined;

  for (const t of sorted) {
    if (t.side === 'buy') {
      if (qty === 0) openedAt = t.time;
      qty += t.quantity;
      cost += t.quantity * t.price;
    } else {
      if (qty <= 0) continue;
      const avg = cost / qty;
      const sold = Math.min(qty, t.quantity);
      cost -= avg * sold;
      qty -= sold;
      if (qty === 0) openedAt = undefined;
    }
  }
  if (qty <= 0) return {};
  return { invested: (cost / qty) * currentQty, openedAt };
}

function pctChange(current?: number, invested?: number): number | undefined {
  if (current == null || invested == null || invested <= 0) return undefined;
  return ((current - invested) / invested) * 100;
}

function msToDate(ms?: number | string | null): Date | undefined {
  if (ms == null) return undefined;
  const n = typeof ms === 'string' ? parseFloat(ms) : ms;
  return n > 0 ? new Date(n) : undefined;
}

function sToDate(s?: number | string | null): Date | undefined {
  if (s == null) return undefined;
  const n = typeof s === 'string' ? parseFloat(s) : s;
  return n > 0 ? new Date(n * 1000) : undefined;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeRow(
  title: string,
  subtitle: string | undefined,
  usdtValue: number | undefined,
  valueText?: string,
): ExchangeDetailRow {
  return { id: uid(), title, subtitle, usdtValue, valueText };
}

const STABLE = new Set(['USDT', 'USDC']);

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  isLoading: false,
  errorMessage: '',
  accounts: [],
  binanceData: {},
  bybitData: {},
  bingxData: {},
  gateData: {},
  okxData: {},
  spotPositions: {},
  futuresPositions: {},
  selectedWalletSection: undefined,
  accountFailures: {},

  setSelectedWalletSection: (section) => set({ selectedWalletSection: section }),

  getTotalBalance: () => {
    const state = get();
    return state.accounts.reduce((sum, acc) => sum + state.getAccountBalance(acc), 0);
  },

  getAccountBalance: (account) => {
    const { binanceData, bybitData, bingxData, gateData, okxData } = get();
    const id = account.id;
    switch (account.exchange) {
      case 'binance': {
        const d = binanceData[id];
        if (!d) return 0;
        return d.wallets.reduce((s, w) => s + (parseFloat(w.balance) || 0), 0);
      }
      case 'bybit': {
        const d = bybitData[id];
        if (!d) return 0;
        const walletTotal = d.walletList.reduce(
          (s, w) => s + (parseFloat(w.totalEquity) || 0),
          0,
        );
        const earnTotal = bybitEarnTotal(d);
        const extraTotal = bybitExtraUsdt(d);
        return walletTotal + earnTotal + extraTotal;
      }
      case 'bingx': {
        const d = bingxData[id];
        if (!d) return 0;
        return bingxSpotUsdt(d) + bingxFuturesUsdt(d);
      }
      case 'gateio': {
        const d = gateData[id];
        if (!d?.totalBalance) return 0;
        return parseFloat(d.totalBalance.total.amount) || 0;
      }
      case 'okx': {
        const d = okxData[id];
        if (!d) return 0;
        const tradingTotal = d.balance?.data.reduce(
          (s, x) => s + (parseFloat(x.totalEq) || 0),
          0,
        ) ?? 0;
        const fundingUsdt = (d.fundingBalances ?? []).reduce((s, b) => {
          if (b.ccy.toUpperCase() !== 'USDT') return s;
          return s + (parseFloat(b.bal) || 0);
        }, 0);
        return tradingTotal + fundingUsdt;
      }
    }
  },

  getWalletTypeSections: (account) => {
    const { binanceData, bybitData, bingxData, gateData, okxData } = get();
    const id = account.id;
    switch (account.exchange) {
      case 'binance':
        return binanceWalletSections(id, binanceData[id]);
      case 'bybit':
        return bybitWalletSections(id, bybitData[id]);
      case 'bingx':
        return bingxWalletSections(id, bingxData[id]);
      case 'gateio':
        return gateWalletSections(id, gateData[id]);
      case 'okx':
        return okxWalletSections(id, okxData[id]);
    }
  },

  getPositionsForSection: (account, section) => {
    const { spotPositions, futuresPositions } = get();
    const id = account.id;
    const title = section.title.toLowerCase();

    if (account.exchange === 'bybit' && title.includes('unified')) {
      return [
        ...(spotPositions[id] ?? []),
        ...(futuresPositions[id] ?? []),
      ].sort((a, b) => (b.valueUSDT ?? 0) - (a.valueUSDT ?? 0));
    }

    const kind = sectionKind(account.exchange, title);
    if (!kind) return [];

    let positions = kind === 'spot' ? (spotPositions[id] ?? []) : (futuresPositions[id] ?? []);
    if (kind === 'spot') {
      const allowed = allowedSymbols(section.rows);
      if (allowed.size > 0) {
        positions = positions.filter((p) => allowed.has(p.symbol.toUpperCase()));
      }
    }
    return [...positions].sort((a, b) => (b.valueUSDT ?? 0) - (a.valueUSDT ?? 0));
  },

  // ─── Main data loading ───────────────────────────────────────────────────────
  loadData: async () => {
    const allAccounts = await getAllAccounts();
    set({
      isLoading: true,
      errorMessage: '',
      accounts: allAccounts,
      accountFailures: {},
    });

    if (allAccounts.length === 0) {
      set({ isLoading: false });
      return;
    }

    const failures: Record<string, string> = {};

    // Run all exchange groups in parallel
    await Promise.all([
      loadBinanceAccounts(allAccounts, failures, set),
      loadBybitAccounts(allAccounts, failures, set),
      loadBingXAccounts(allAccounts, failures, set),
      loadGateAccounts(allAccounts, failures, set),
      loadOkxAccounts(allAccounts, failures, set),
    ]);

    set({ accountFailures: failures });

    const state = get();
    const balances: Record<string, number> = {};
    const exchangeTotals: Partial<Record<Exchange, number>> = {};

    for (const acc of allAccounts) {
      const bal = state.getAccountBalance(acc);
      balances[acc.id] = bal;
      exchangeTotals[acc.exchange] = (exchangeTotals[acc.exchange] ?? 0) + bal;
    }

    const total = Object.values(balances).reduce((s, v) => s + v, 0);

    try {
      await addSnapshots(total, allAccounts, balances, exchangeTotals);
    } catch {}

    set({ isLoading: false });
  },
}));

// ─── Exchange-specific data loaders ──────────────────────────────────────────

type SetFn = Parameters<typeof usePortfolioStore['setState']>[0];

async function loadBinanceAccounts(
  all: ExchangeAccount[],
  failures: Record<string, string>,
  set: (fn: SetFn) => void,
): Promise<void> {
  const accounts = all.filter((a) => a.exchange === 'binance');
  await Promise.all(
    accounts.map(async (account) => {
      const keys = await loadKeys(account);
      if (!keys) return;

      const [walletsRes, spotRes, futuresRes] = await Promise.all([
        BinanceAPI.fetchWallets(keys),
        BinanceAPI.fetchSpotAccount(keys),
        BinanceAPI.fetchFuturesPositions(keys),
      ]);

      if (walletsRes.error) {
        failures[account.id] = formatApiError(walletsRes.error, (k) => i18n.t(k));
      } else {
        set((s) => ({
          ...s,
          binanceData: {
            ...s.binanceData,
            [account.id]: { wallets: walletsRes.data ?? [] },
          },
        }));
      }

      if (spotRes.data) {
        const balances = spotRes.data.balances.filter(
          (b) => (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0) > 0,
        );
        const priceMap: Record<string, number> = {};
        const tradeMap: Record<string, TradeFill[]> = {};

        await Promise.all(
          balances.map(async (b) => {
            const asset = b.asset.toUpperCase();
            const qty = (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0);
            if (qty <= 0) return;
            if (STABLE.has(asset)) {
              priceMap[asset] = 1;
              return;
            }
            const sym = `${asset}USDT`;
            const [ticker, trades] = await Promise.all([
              BinanceAPI.fetchPriceTicker(sym),
              BinanceAPI.fetchSpotTrades(sym, keys),
            ]);
            if (ticker.data) priceMap[asset] = parseFloat(ticker.data.price) || 0;
            if (trades.data) {
              tradeMap[asset] = trades.data.map((t) => ({
                time: new Date(t.time),
                side: t.isBuyer ? 'buy' : 'sell',
                quantity: parseFloat(t.qty) || 0,
                price: parseFloat(t.price) || 0,
              }));
            }
          }),
        );

        const positions: PositionItem[] = balances.flatMap((b) => {
          const asset = b.asset.toUpperCase();
          const qty = (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0);
          if (qty <= 0) return [];
          const isStable = STABLE.has(asset);
          const price = priceMap[asset];
          const valueUSDT = isStable ? qty : price != null ? price * qty : undefined;
          const trades = tradeMap[asset] ?? [];
          const basis = costBasis(trades, qty);
          const invested = basis.invested ?? (isStable ? valueUSDT : undefined);
          const pct = pctChange(valueUSDT, invested) ?? (isStable ? 0 : undefined);
          return [
            {
              id: uid(),
              symbol: asset,
              openedAt: basis.openedAt?.toISOString(),
              quantity: qty,
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'spot',
            } satisfies PositionItem,
          ];
        });

        set((s) => ({
          ...s,
          spotPositions: { ...s.spotPositions, [account.id]: positions },
        }));
      }

      if (futuresRes.data) {
        const positions: PositionItem[] = futuresRes.data.flatMap((p) => {
          const amt = parseFloat(p.positionAmt) || 0;
          if (amt === 0) return [];
          const entry = parseFloat(p.entryPrice) || 0;
          const mark = parseFloat(p.markPrice ?? '') || 0;
          if (entry <= 0 || mark <= 0) return [];
          const dir = amt >= 0 ? 1 : -1;
          const pct = ((mark - entry) / entry) * 100 * dir;
          return [
            {
              id: uid(),
              symbol: p.symbol,
              openedAt: msToDate(p.updateTime)?.toISOString(),
              quantity: Math.abs(amt),
              valueUSDT: Math.abs(amt) * mark,
              percentChange: pct,
              investedUSDT: entry * Math.abs(amt),
              kind: 'futures',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({
          ...s,
          futuresPositions: { ...s.futuresPositions, [account.id]: positions },
        }));
      }
    }),
  );
}

async function loadBybitAccounts(
  all: ExchangeAccount[],
  failures: Record<string, string>,
  set: (fn: SetFn) => void,
): Promise<void> {
  const accounts = all.filter((a) => a.exchange === 'bybit');
  const EARN_CATEGORIES = ['FlexibleSaving', 'OnChain'];
  const EXTRA_TYPES = ['FUND', 'SPOT', 'CONTRACT', 'OPTION'];

  await Promise.all(
    accounts.map(async (account) => {
      const keys = await loadKeys(account);
      if (!keys) return;

      const walletRes = await BybitAPI.fetchWallet(keys);
      if (walletRes.error) {
        failures[account.id] = formatApiError(walletRes.error, (k) => i18n.t(k));
        return;
      }

      const walletList = walletRes.data.result.list;
      set((s) => ({
        ...s,
        bybitData: {
          ...s.bybitData,
          [account.id]: {
            walletList,
            earnPositions: s.bybitData[account.id]?.earnPositions ?? [],
            coinBalances: s.bybitData[account.id]?.coinBalances ?? {},
          },
        },
      }));

      const priceMap: Record<string, number> = {};
      const allCoins = walletList.flatMap((w) => w.coin);
      for (const coin of allCoins) {
        const asset = coin.coin.toUpperCase();
        const equity = parseFloat(coin.equity) || 0;
        const usdVal = parseFloat(coin.usdValue) || 0;
        if (equity > 0) priceMap[asset] = usdVal / equity;
      }

      const quantityByAsset: Record<string, number> = {};
      const valueByAsset: Record<string, number> = {};
      for (const coin of allCoins) {
        const asset = coin.coin.toUpperCase();
        const qty = parseFloat(coin.equity) || 0;
        if (qty <= 0) continue;
        quantityByAsset[asset] = (quantityByAsset[asset] ?? 0) + qty;
        valueByAsset[asset] = (valueByAsset[asset] ?? 0) + (parseFloat(coin.usdValue) || 0);
      }

      const tradeMap: Record<string, TradeFill[]> = {};
      await Promise.all(
        Object.keys(quantityByAsset).map(async (asset) => {
          if (STABLE.has(asset)) return;
          const sym = `${asset}USDT`;
          const exRes = await BybitAPI.fetchExecutions(keys, 'spot', sym);
          if (exRes.data?.result?.list) {
            tradeMap[asset] = exRes.data.result.list.flatMap((e) => {
              const qty = parseFloat(e.execQty) || 0;
              const price = parseFloat(e.execPrice) || 0;
              if (!qty || !price) return [];
              return [
                {
                  time: msToDate(e.execTime) ?? new Date(),
                  side: e.side.toLowerCase() === 'buy' ? 'buy' : 'sell',
                  quantity: qty,
                  price,
                } as TradeFill,
              ];
            });
          }
        }),
      );

      const spotPositions: PositionItem[] = Object.entries(quantityByAsset).flatMap(
        ([asset, qty]) => {
          if (qty <= 0) return [];
          const isStable = STABLE.has(asset);
          const valueUSDT = valueByAsset[asset];
          const trades = tradeMap[asset] ?? [];
          const basis = costBasis(trades, qty);
          const invested = basis.invested ?? (isStable ? valueUSDT : undefined);
          const pct = pctChange(valueUSDT, invested) ?? (isStable ? 0 : undefined);
          return [
            {
              id: uid(),
              symbol: asset,
              openedAt: basis.openedAt?.toISOString(),
              quantity: qty,
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'spot',
            } satisfies PositionItem,
          ];
        },
      );

      set((s) => ({
        ...s,
        spotPositions: { ...s.spotPositions, [account.id]: spotPositions },
      }));

      const positionRequests = [
        { category: 'linear', settleCoin: undefined },
        { category: 'linear', settleCoin: 'USDT' },
        { category: 'linear', settleCoin: 'USDC' },
        { category: 'inverse', settleCoin: undefined },
        { category: 'option', settleCoin: undefined },
      ];

      const allFutures: PositionItem[] = [];
      await Promise.all(
        positionRequests.map(async ({ category, settleCoin }) => {
          const res = await BybitAPI.fetchPositions(keys, category, settleCoin);
          if (res.error || !res.data || res.data.retCode !== 0) return;
          const list = res.data.result?.list ?? [];
          for (const p of list) {
            const size = parseFloat(p.size) || 0;
            if (size === 0) continue;
            const entry = parseFloat(p.avgPrice) || 0;
            const mark = parseFloat(p.markPrice ?? '') || entry;
            const valFromPos = parseFloat(p.positionValue ?? '') || 0;
            const valueUSDT =
              valFromPos > 0 ? Math.abs(valFromPos) : mark > 0 ? Math.abs(size) * mark : Math.abs(size) * entry;
            if (valueUSDT <= 0) continue;
            const dir = p.side.toLowerCase() === 'sell' ? -1 : 1;
            const invested = entry > 0 ? Math.abs(size) * entry : valueUSDT;
            const pct =
              entry > 0 && mark > 0
                ? ((mark - entry) / entry) * 100 * dir
                : undefined;
            allFutures.push({
              id: uid(),
              symbol: p.symbol,
              openedAt: msToDate(p.createdTime)?.toISOString(),
              quantity: Math.abs(size),
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'futures',
            });
          }
        }),
      );

      const uniqueFutures = deduplicatePositions(allFutures);
      set((s) => ({
        ...s,
        futuresPositions: { ...s.futuresPositions, [account.id]: uniqueFutures },
      }));

      await Promise.all([
        ...EXTRA_TYPES.map(async (acctType) => {
          const res = await BybitAPI.fetchAllCoinsBalance(keys, acctType);
          if (res.error || !res.data || res.data.retCode !== 0) return;
          const balances = res.data.result?.balance ?? [];
          set((s) => {
            const existing = s.bybitData[account.id] ?? {
              walletList,
              earnPositions: [],
              coinBalances: {},
            };
            return {
              ...s,
              bybitData: {
                ...s.bybitData,
                [account.id]: {
                  ...existing,
                  coinBalances: { ...existing.coinBalances, [acctType]: balances },
                },
              },
            };
          });
        }),
        ...EARN_CATEGORIES.map(async (cat) => {
          const res = await BybitAPI.fetchEarnPositions(keys, cat);
          if (res.error || !res.data || res.data.retCode !== 0) return;
          const list = (res.data.result?.list ?? []).map((p) => ({
            category: cat,
            coin: p.coin,
            amount: p.amount,
            status: p.status,
          }));
          set((s) => {
            const existing = s.bybitData[account.id] ?? {
              walletList,
              earnPositions: [],
              coinBalances: {},
            };
            return {
              ...s,
              bybitData: {
                ...s.bybitData,
                [account.id]: {
                  ...existing,
                  earnPositions: [...existing.earnPositions, ...list],
                },
              },
            };
          });
        }),
      ]);
    }),
  );
}

async function loadBingXAccounts(
  all: ExchangeAccount[],
  failures: Record<string, string>,
  set: (fn: SetFn) => void,
): Promise<void> {
  const accounts = all.filter((a) => a.exchange === 'bingx');
  await Promise.all(
    accounts.map(async (account) => {
      const keys = await loadKeys(account);
      if (!keys) return;

      const [spotRes, futuresRes, futPosRes] = await Promise.all([
        BingXAPI.fetchSpotWallet(keys),
        BingXAPI.fetchFuturesWallet(keys),
        BingXAPI.fetchFuturesPositions(keys),
      ]);

      if (spotRes.error) {
        failures[account.id] = formatApiError(spotRes.error, (k) => i18n.t(k));
      }

      set((s) => ({
        ...s,
        bingxData: {
          ...s.bingxData,
          [account.id]: {
            spotWallet: spotRes.data,
            futuresWallet: futuresRes.data,
          },
        },
      }));

      if (spotRes.data && spotRes.data.code === 0) {
        const balances = spotRes.data.data?.balances ?? [];
        const qtyMap: Record<string, number> = {};
        for (const b of balances) {
          const qty = (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0);
          if (qty > 0) qtyMap[b.asset.toUpperCase()] = (qtyMap[b.asset.toUpperCase()] ?? 0) + qty;
        }

        const priceMap: Record<string, number> = {};
        const tradeMap: Record<string, TradeFill[]> = {};

        await Promise.all(
          Object.keys(qtyMap).map(async (asset) => {
            if (STABLE.has(asset)) { priceMap[asset] = 1; return; }
            const sym = `${asset}-USDT`;
            const [tick, trades] = await Promise.all([
              BingXAPI.fetchSpotTicker(sym),
              BingXAPI.fetchSpotTrades(sym, keys),
            ]);
            if (tick.data?.data?.[0]) priceMap[asset] = parseFloat(tick.data.data[0].price) || 0;
            if (trades.data?.data) {
              tradeMap[asset] = trades.data.data.map((t) => ({
                time: new Date(t.time),
                side: t.isBuyer ? 'buy' : 'sell',
                quantity: parseFloat(t.qty) || 0,
                price: parseFloat(t.price) || 0,
              }));
            }
          }),
        );

        const positions: PositionItem[] = Object.entries(qtyMap).flatMap(([asset, qty]) => {
          const isStable = STABLE.has(asset);
          const price = priceMap[asset];
          const valueUSDT = isStable ? qty : price != null ? price * qty : undefined;
          const trades = tradeMap[asset] ?? [];
          const basis = costBasis(trades, qty);
          const invested = basis.invested ?? (isStable ? valueUSDT : undefined);
          const pct = pctChange(valueUSDT, invested) ?? (isStable ? 0 : undefined);
          return [
            {
              id: uid(),
              symbol: asset,
              openedAt: basis.openedAt?.toISOString(),
              quantity: qty,
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'spot',
            } satisfies PositionItem,
          ];
        });

        set((s) => ({
          ...s,
          spotPositions: { ...s.spotPositions, [account.id]: positions },
        }));
      }

      if (futPosRes.data?.data) {
        const positions: PositionItem[] = futPosRes.data.data.flatMap((p) => {
          const amt = parseFloat(p.positionAmt) || 0;
          if (amt === 0) return [];
          const entry = parseFloat(p.avgPrice ?? '') || 0;
          const mark = parseFloat(p.markPrice ?? '') || 0;
          if (entry <= 0 || mark <= 0) return [];
          const dir = amt >= 0 ? 1 : -1;
          return [
            {
              id: uid(),
              symbol: p.symbol,
              openedAt: msToDate(p.updateTime)?.toISOString(),
              quantity: Math.abs(amt),
              valueUSDT: Math.abs(amt) * mark,
              percentChange: ((mark - entry) / entry) * 100 * dir,
              investedUSDT: entry * Math.abs(amt),
              kind: 'futures',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({
          ...s,
          futuresPositions: { ...s.futuresPositions, [account.id]: positions },
        }));
      }
    }),
  );
}

async function loadGateAccounts(
  all: ExchangeAccount[],
  failures: Record<string, string>,
  set: (fn: SetFn) => void,
): Promise<void> {
  const accounts = all.filter((a) => a.exchange === 'gateio');
  await Promise.all(
    accounts.map(async (account) => {
      const keys = await loadKeys(account);
      if (!keys) return;

      const [totalRes, spotAccRes, futPosRes] = await Promise.all([
        GateAPI.fetchTotalBalance(keys),
        GateAPI.fetchSpotAccounts(keys),
        GateAPI.fetchFuturesPositions('usdt', keys),
      ]);

      if (totalRes.error) {
        failures[account.id] = formatApiError(totalRes.error, (k) => i18n.t(k));
      } else {
        set((s) => ({
          ...s,
          gateData: { ...s.gateData, [account.id]: { totalBalance: totalRes.data } },
        }));
      }

      if (spotAccRes.data) {
        const qtyMap: Record<string, number> = {};
        for (const b of spotAccRes.data) {
          const qty = (parseFloat(b.available) || 0) + (parseFloat(b.locked) || 0);
          if (qty > 0) qtyMap[b.currency.toUpperCase()] = (qtyMap[b.currency.toUpperCase()] ?? 0) + qty;
        }

        const priceMap: Record<string, number> = {};
        const tradeMap: Record<string, TradeFill[]> = {};

        await Promise.all(
          Object.keys(qtyMap).map(async (asset) => {
            if (STABLE.has(asset)) { priceMap[asset] = 1; return; }
            const pair = `${asset}_USDT`;
            const [tick, trades] = await Promise.all([
              GateAPI.fetchSpotTicker(pair),
              GateAPI.fetchSpotTrades(pair, keys),
            ]);
            if (tick.data?.[0]?.last) priceMap[asset] = parseFloat(tick.data[0].last) || 0;
            if (trades.data) {
              tradeMap[asset] = trades.data.map((t) => ({
                time: new Date((parseFloat(t.create_time ?? '0') || 0) * 1000),
                side: t.side.toLowerCase() === 'buy' ? 'buy' : 'sell',
                quantity: parseFloat(t.amount) || 0,
                price: parseFloat(t.price) || 0,
              }));
            }
          }),
        );

        const positions: PositionItem[] = Object.entries(qtyMap).flatMap(([asset, qty]) => {
          const isStable = STABLE.has(asset);
          const price = priceMap[asset];
          const valueUSDT = isStable ? qty : price != null ? price * qty : undefined;
          const trades = tradeMap[asset] ?? [];
          const basis = costBasis(trades, qty);
          const invested = basis.invested ?? (isStable ? valueUSDT : undefined);
          const pct = pctChange(valueUSDT, invested) ?? (isStable ? 0 : undefined);
          return [
            {
              id: uid(),
              symbol: asset,
              openedAt: basis.openedAt?.toISOString(),
              quantity: qty,
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'spot',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({ ...s, spotPositions: { ...s.spotPositions, [account.id]: positions } }));
      }

      if (futPosRes.data) {
        const positions: PositionItem[] = futPosRes.data.flatMap((p) => {
          const size = parseFloat(p.size) || 0;
          if (size === 0) return [];
          const entry = parseFloat(p.entry_price ?? '') || 0;
          const mark = parseFloat(p.mark_price ?? '') || 0;
          if (entry <= 0 || mark <= 0) return [];
          const dir = size >= 0 ? 1 : -1;
          return [
            {
              id: uid(),
              symbol: p.contract,
              openedAt: sToDate(p.update_time)?.toISOString(),
              quantity: Math.abs(size),
              valueUSDT: Math.abs(size) * mark,
              percentChange: ((mark - entry) / entry) * 100 * dir,
              investedUSDT: entry * Math.abs(size),
              kind: 'futures',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({ ...s, futuresPositions: { ...s.futuresPositions, [account.id]: positions } }));
      }
    }),
  );
}

async function loadOkxAccounts(
  all: ExchangeAccount[],
  failures: Record<string, string>,
  set: (fn: SetFn) => void,
): Promise<void> {
  const accounts = all.filter((a) => a.exchange === 'okx');
  await Promise.all(
    accounts.map(async (account) => {
      const keys = await loadKeys(account);
      if (!keys) return;

      const [balRes, fundRes, posRes] = await Promise.all([
        OkxAPI.fetchAccountBalance(keys),
        OkxAPI.fetchFundingBalance(keys),
        OkxAPI.fetchPositions(keys),
      ]);

      if (balRes.error) {
        failures[account.id] = formatApiError(balRes.error, (k) => i18n.t(k));
      } else {
        set((s) => ({
          ...s,
          okxData: {
            ...s.okxData,
            [account.id]: {
              balance: balRes.data,
              fundingBalances: fundRes.data?.data ?? s.okxData[account.id]?.fundingBalances,
            },
          },
        }));
      }

      if (fundRes.data) {
        set((s) => ({
          ...s,
          okxData: {
            ...s.okxData,
            [account.id]: {
              ...s.okxData[account.id],
              fundingBalances: fundRes.data!.data,
            },
          },
        }));
      }

      if (balRes.data) {
        const details = balRes.data.data.flatMap((d) => d.details);
        const qtyMap: Record<string, number> = {};
        const valMap: Record<string, number> = {};
        for (const d of details) {
          const asset = d.ccy.toUpperCase();
          const qty = parseFloat(d.eq) || 0;
          if (qty <= 0) continue;
          qtyMap[asset] = (qtyMap[asset] ?? 0) + qty;
          valMap[asset] = (valMap[asset] ?? 0) + (parseFloat(d.eqUsd) || 0);
        }

        const tradeMap: Record<string, TradeFill[]> = {};
        await Promise.all(
          Object.keys(qtyMap).map(async (asset) => {
            if (STABLE.has(asset)) return;
            const res = await OkxAPI.fetchFills(`${asset}-USDT`, keys);
            if (res.data?.data) {
              tradeMap[asset] = res.data.data.flatMap((f) => {
                const qty = parseFloat(f.fillSz ?? '') || 0;
                const price = parseFloat(f.fillPx ?? '') || 0;
                if (!qty || !price) return [];
                const timeMs = parseFloat(f.ts ?? f.fillTime ?? '0') || 0;
                return [
                  {
                    time: timeMs > 0 ? new Date(timeMs) : new Date(),
                    side: f.side.toLowerCase() === 'buy' ? 'buy' : 'sell',
                    quantity: qty,
                    price,
                  } as TradeFill,
                ];
              });
            }
          }),
        );

        const spotPositions: PositionItem[] = Object.entries(qtyMap).flatMap(([asset, qty]) => {
          const isStable = STABLE.has(asset);
          const valueUSDT = valMap[asset];
          const trades = tradeMap[asset] ?? [];
          const basis = costBasis(trades, qty);
          const invested = basis.invested ?? (isStable ? valueUSDT : undefined);
          const pct = pctChange(valueUSDT, invested) ?? (isStable ? 0 : undefined);
          return [
            {
              id: uid(),
              symbol: asset,
              openedAt: basis.openedAt?.toISOString(),
              quantity: qty,
              valueUSDT,
              percentChange: pct,
              investedUSDT: invested,
              kind: 'spot',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({ ...s, spotPositions: { ...s.spotPositions, [account.id]: spotPositions } }));
      }

      if (posRes.data?.data) {
        const positions: PositionItem[] = posRes.data.data.flatMap((p) => {
          const amt = parseFloat(p.pos) || 0;
          if (amt === 0) return [];
          const entry = parseFloat(p.avgPx) || 0;
          const mark = parseFloat(p.markPx ?? '') || 0;
          if (entry <= 0 || mark <= 0) return [];
          const dir = amt >= 0 ? 1 : -1;
          return [
            {
              id: uid(),
              symbol: p.instId,
              openedAt: msToDate(p.cTime)?.toISOString(),
              quantity: Math.abs(amt),
              valueUSDT: Math.abs(amt) * mark,
              percentChange: ((mark - entry) / entry) * 100 * dir,
              investedUSDT: entry * Math.abs(amt),
              kind: 'futures',
            } satisfies PositionItem,
          ];
        });
        set((s) => ({ ...s, futuresPositions: { ...s.futuresPositions, [account.id]: positions } }));
      }
    }),
  );
}

// ─── Wallet type section builders ────────────────────────────────────────────

function binanceWalletSections(id: string, d?: BinanceAccountData): WalletTypeSection[] {
  if (!d?.wallets.length) return [placeholder(id, 'Wallets', 'No data')];
  return d.wallets.map((w) => {
    const total = parseFloat(w.balance) || undefined;
    const title = w.walletName || 'Wallet';
    return {
      id: `${id}-${title}`,
      title,
      totalUSDT: total,
      rows: [makeRow('Balance', w.activate ? 'Active' : 'Inactive', total, total == null ? '—' : undefined)],
    };
  });
}

function bybitWalletSections(id: string, d?: BybitAccountData): WalletTypeSection[] {
  if (!d) return [placeholder(id, 'Wallets', 'No data')];
  const sections: WalletTypeSection[] = [];

  for (const w of d.walletList) {
    const total = parseFloat(w.totalEquity) || undefined;
    const rows = w.coin.map((c) => {
      const usd = parseFloat(c.usdValue) || undefined;
      return makeRow(c.coin, `Equity ${parseFloat(c.equity).toFixed(4)}`, usd, usd == null ? '—' : undefined);
    });
    const title = bybitLabel(w.accountType);
    sections.push({ id: `${id}-${title}`, title, totalUSDT: total, rows: rows.length ? rows : [placeholderRow('No data')] });
  }

  for (const acctType of ['FUND', 'SPOT', 'CONTRACT', 'OPTION']) {
    const balances = d.coinBalances[acctType];
    if (!balances?.length) continue;
    const usdtTotal = balances
      .filter((b) => b.coin.toUpperCase() === 'USDT')
      .reduce((s, b) => s + (parseFloat(b.walletBalance) || 0), 0);
    const rows = balances.map((b) => makeRow(b.coin, 'Balance', undefined, `${parseFloat(b.walletBalance).toFixed(4)} ${b.coin}`));
    const title = bybitLabel(acctType);
    sections.push({ id: `${id}-${title}`, title, totalUSDT: usdtTotal > 0 ? usdtTotal : undefined, rows });
  }

  if (d.earnPositions.length) {
    const rows = d.earnPositions.map((p) => {
      const amount = parseFloat(p.amount) || 0;
      const usd = bybitEarnUSDTValue(d, p.coin, amount);
      return makeRow(p.coin, `Earn ${earnLabel(p.category)}`, usd, usd == null ? 'Price unavailable' : undefined);
    });
    const total = rows.reduce((s, r) => s + (r.usdtValue ?? 0), 0);
    sections.push({ id: `${id}-Earn`, title: 'Earn', totalUSDT: total, rows });
  }

  return sections.length ? sections : [placeholder(id, 'Wallets', 'No data')];
}

function bingxWalletSections(id: string, d?: BingXAccountData): WalletTypeSection[] {
  const spotRows: ExchangeDetailRow[] = [];
  if (d?.spotWallet?.code === 0) {
    for (const b of d.spotWallet.data?.balances ?? []) {
      const qty = (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0);
      const isUsdt = b.asset.toUpperCase() === 'USDT';
      spotRows.push(makeRow(b.asset, 'Spot', isUsdt ? qty : undefined, isUsdt ? undefined : `${qty.toFixed(4)} ${b.asset}`));
    }
  }
  const futRows: ExchangeDetailRow[] = [];
  if (d?.futuresWallet?.code === 0) {
    for (const b of d.futuresWallet.data ?? []) {
      const isUsdt = b.asset.toUpperCase() === 'USDT';
      const equity = parseFloat(b.equity) || parseFloat(b.balance) || 0;
      futRows.push(makeRow(b.asset, 'Futures', isUsdt ? equity : undefined, isUsdt ? undefined : `${parseFloat(b.balance).toFixed(4)} ${b.asset}`));
    }
  }
  const spotTotal = spotRows.reduce((s, r) => s + (r.usdtValue ?? 0), 0);
  const futTotal = futRows.reduce((s, r) => s + (r.usdtValue ?? 0), 0);
  return [
    { id: `${id}-Spot`, title: 'Spot', totalUSDT: spotRows.length ? spotTotal : undefined, rows: spotRows.length ? spotRows : [placeholderRow('No USDT')] },
    { id: `${id}-Futures`, title: 'Futures', totalUSDT: futRows.length ? futTotal : undefined, rows: futRows.length ? futRows : [placeholderRow('No data')] },
  ];
}

function gateWalletSections(id: string, d?: GateAccountData): WalletTypeSection[] {
  if (!d?.totalBalance) return [placeholder(id, 'Wallets', 'No USDT')];
  const sections: WalletTypeSection[] = Object.entries(d.totalBalance.details)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, detail]) => {
      if (detail.currency.toUpperCase() !== 'USDT') return [];
      const amount = parseFloat(detail.amount) || 0;
      if (amount <= 0) return [];
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      return [{
        id: `${id}-${title}`,
        title,
        totalUSDT: amount,
        rows: [makeRow('USDT', undefined, amount)],
      }];
    });
  return sections.length ? sections : [placeholder(id, 'Wallets', 'No USDT')];
}

function okxWalletSections(id: string, d?: OkxAccountData): WalletTypeSection[] {
  const tradingRows: ExchangeDetailRow[] = (d?.balance?.data ?? []).flatMap((data) =>
    data.details.map((det) => {
      const usd = parseFloat(det.eqUsd) || undefined;
      return makeRow(det.ccy, 'Equity', usd, usd == null ? '—' : undefined);
    }),
  );
  const tradingTotal = tradingRows.reduce((s, r) => s + (r.usdtValue ?? 0), 0);

  const fundingRows: ExchangeDetailRow[] = (d?.fundingBalances ?? []).map((b) => {
    const isUsdt = b.ccy.toUpperCase() === 'USDT';
    const amount = parseFloat(b.bal) || 0;
    return makeRow(b.ccy, 'Funding', isUsdt ? amount : undefined, isUsdt ? undefined : `${amount.toFixed(4)} ${b.ccy}`);
  });
  const fundingTotal = fundingRows.reduce((s, r) => s + (r.usdtValue ?? 0), 0);

  return [
    { id: `${id}-Trading`, title: 'Trading', totalUSDT: tradingRows.length ? tradingTotal : undefined, rows: tradingRows.length ? tradingRows : [placeholderRow('No data')] },
    { id: `${id}-Funding`, title: 'Funding', totalUSDT: fundingRows.length ? fundingTotal : undefined, rows: fundingRows.length ? fundingRows : [placeholderRow('No data')] },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bybitLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'UNIFIED': return 'Unified';
    case 'FUND': return 'Funding';
    case 'SPOT': return 'Spot';
    case 'CONTRACT': return 'Derivatives';
    case 'OPTION': return 'Options';
    default: return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
}

function earnLabel(cat: string): string {
  switch (cat) {
    case 'FlexibleSaving': return 'Flexible Saving';
    case 'OnChain': return 'On-chain';
    default: return cat;
  }
}

function bybitCoinPriceMap(d: BybitAccountData): Record<string, number> {
  const map: Record<string, number> = {};
  for (const wallet of d.walletList) {
    for (const coin of wallet.coin) {
      const asset = coin.coin.toUpperCase();
      const equity = parseFloat(coin.equity) || 0;
      const usdValue = parseFloat(coin.usdValue) || 0;
      if (equity > 0) map[asset] = usdValue / equity;
    }
  }
  return map;
}

function bybitEarnUSDTValue(
  d: BybitAccountData,
  coin: string,
  amount: number,
): number | undefined {
  const upper = coin.toUpperCase();
  if (STABLE.has(upper)) return amount;
  const price = bybitCoinPriceMap(d)[upper];
  return price == null ? undefined : amount * price;
}

function bybitEarnTotal(d: BybitAccountData): number {
  return d.earnPositions.reduce((s, p) => {
    const amount = parseFloat(p.amount) || 0;
    return s + (bybitEarnUSDTValue(d, p.coin, amount) ?? 0);
  }, 0);
}

function bybitExtraUsdt(d: BybitAccountData): number {
  let total = 0;
  for (const balances of Object.values(d.coinBalances)) {
    for (const b of balances) {
      if (b.coin.toUpperCase() === 'USDT') total += parseFloat(b.walletBalance) || 0;
    }
  }
  return total;
}

function bingxSpotUsdt(d: BingXAccountData): number {
  if (!d.spotWallet || d.spotWallet.code !== 0) return 0;
  const b = (d.spotWallet.data?.balances ?? []).find((b) => b.asset.toUpperCase() === 'USDT');
  if (!b) return 0;
  return (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0);
}

function bingxFuturesUsdt(d: BingXAccountData): number {
  if (!d.futuresWallet || d.futuresWallet.code !== 0) return 0;
  const b = (d.futuresWallet.data ?? []).find((b) => b.asset.toUpperCase() === 'USDT');
  return parseFloat(b?.balance ?? '0') || 0;
}

function sectionKind(exchange: Exchange, title: string): 'spot' | 'futures' | null {
  if (title.includes('future') || title.includes('фьюч') || title.includes('derivatives') || title.includes('contract') || title.includes('linear') || title.includes('inverse') || title.includes('option')) return 'futures';
  if (title.includes('spot') || title.includes('спот') || title.includes('unified') || title.includes('trading') || title.includes('wallet') || title.includes('funding')) return 'spot';
  return null;
}

function allowedSymbols(rows: ExchangeDetailRow[]): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const sym = row.title.trim().toUpperCase();
    if (!sym || sym === 'BALANCE' || sym === 'NO DATA' || sym === 'NO USDT' || sym.includes(' ')) continue;
    set.add(sym);
  }
  return set;
}

function placeholder(id: string, title: string, msg: string): WalletTypeSection {
  return { id: `${id}-${title}`, title, totalUSDT: undefined, rows: [placeholderRow(msg)] };
}

function placeholderRow(msg: string): ExchangeDetailRow {
  return { id: uid(), title: msg, subtitle: undefined, usdtValue: undefined, valueText: undefined };
}

function deduplicatePositions(positions: PositionItem[]): PositionItem[] {
  const seen = new Set<string>();
  return positions.filter((p) => {
    const key = `${p.symbol}|${p.quantity.toFixed(8)}|${p.openedAt ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
