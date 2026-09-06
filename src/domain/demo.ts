import type {
  BalanceSnapshot,
  ExchangeAccount,
  Exchange,
} from "../types/common";
import type {
  AccountObservation,
  AccountSync,
  CashFlow,
  FlowCoverage,
} from "../types/monitor";
import { sum } from "./money";
export function createDemo(now: number) {
  const exchanges: Exchange[] = ["binance", "bybit", "okx", "bingx", "gateio"];
  const ends = [18420, 16280, 6500, 4320, 3100];
  const starts = [17500, 15000, 6000, 4000, 2500];
  const week = [18200, 16480, 6310, 4210, 2900];
  const day = [18300, 16350, 6480, 4300, 3090];
  const breakdown: [string, number][][] = [
    [
      ["Spot", 10420],
      ["Futures · equity", 6000],
      ["Earn", 2000],
    ],
    [
      ["Unified · equity", 14280],
      ["Earn", 2000],
    ],
    [
      ["Trading · equity", 5000],
      ["Funding", 1000],
      ["Earn", 500],
    ],
    [
      ["Spot", 1320],
      ["Futures · equity", 3000],
    ],
    [
      ["Spot", 2100],
      ["Earn", 1000],
    ],
  ];
  const accounts: ExchangeAccount[] = exchanges.map((exchange) => ({
    id: `demo-${exchange}`,
    exchange,
    createdAt: new Date(now - 30 * 86400000).toISOString(),
    state: "active",
  }));
  const observations: Record<string, AccountObservation> = {},
    sync: Record<string, AccountSync> = {},
    history: BalanceSnapshot[] = [];
  accounts.forEach((a, i) => {
    observations[a.id] = {
      accountId: a.id,
      observedAt: new Date(now).toISOString(),
      balanceUSDT: ends[i],
      complete: true,
      issues: [],
      wallets: breakdown[i].map(([name, balanceUSDT]) => ({
        id: name,
        name,
        balanceUSDT,
        assets: [],
        status: "complete",
      })),
    };
    sync[a.id] = {
      status: "fresh",
      lastAttemptAt: new Date(now).toISOString(),
      lastSuccessAt: new Date(now).toISOString(),
    };
  });
  for (let hour = -720; hour <= 0; hour += 6) {
    const timestamp = new Date(now + hour * 3600000).toISOString();
    const balances = accounts.map((a, i) => {
      const [lo, hi, left, right] =
        hour < -168
          ? [-720, -168, starts[i], week[i]]
          : hour < -24
            ? [-168, -24, week[i], day[i]]
            : [-24, 0, day[i], ends[i]];
      const v = left + (right - left) * ((hour - lo) / (hi - lo));
      history.push({
        id: `${a.id}-${hour}`,
        scope: { type: "account", accountId: a.id },
        timestamp,
        balanceUSDT: v,
        calculationVersion: 2,
        members: [a.id],
      });
      history.push({
        id: `${a.exchange}-${hour}`,
        scope: { type: "exchange", exchange: a.exchange },
        timestamp,
        balanceUSDT: v,
        calculationVersion: 2,
        members: [a.id],
      });
      return v;
    });
    history.push({
      id: `total-${hour}`,
      scope: { type: "total" },
      timestamp,
      balanceUSDT: sum(balances),
      calculationVersion: 2,
      members: accounts.map((a) => a.id).sort(),
    });
  }
  const flows: CashFlow[] = [];
  accounts.forEach((a, i) => {
    const incoming = [1000, 700, 300, 200, 100][i],
      outgoing = [400, 100, 0, 0, 0][i];
    flows.push({
      id: `in-${i}`,
      accountId: a.id,
      occurredAt: new Date(now - 15 * 86400000).toISOString(),
      type: "deposit",
      amountUSDT: incoming,
      source: "manual",
    });
    if (outgoing)
      flows.push({
        id: `out-${i}`,
        accountId: a.id,
        occurredAt: new Date(now - 14 * 86400000).toISOString(),
        type: "withdrawal",
        amountUSDT: outgoing,
        source: "manual",
      });
  });
  flows.push({
    id: "in-bybit-recent",
    accountId: accounts[1].id,
    occurredAt: new Date(now - 4 * 86400000).toISOString(),
    type: "deposit",
    amountUSDT: 200,
    source: "manual",
  });
  const coverage: FlowCoverage[] = accounts.map((a) => ({
    accountId: a.id,
    from: new Date(now - 30 * 86400000).toISOString(),
    to: new Date(now).toISOString(),
  }));
  return { accounts, observations, sync, history, flows, coverage, now };
}
