export type Exchange = 'binance' | 'bybit' | 'bingx' | 'okx' | 'gateio';

export const ALL_EXCHANGES: Exchange[] = ['binance', 'bybit', 'bingx', 'okx', 'gateio'];

export interface ExchangeAccount {
  id: string;
  exchange: Exchange;
  label?: string;
  createdAt: string;
}

export interface APIKeys {
  apiKey: string;
  secretKey: string;
  passphrase?: string;
}

export interface PositionItem {
  id: string;
  symbol: string;
  openedAt?: string;
  quantity: number;
  valueUSDT?: number;
  percentChange?: number;
  netProfitUSDT?: number;
  netPercentChange?: number;
  feeUSDT?: number;
  investedUSDT?: number;
  kind: 'spot' | 'futures';
}

export interface ExchangeDetailRow {
  id: string;
  title: string;
  subtitle?: string;
  usdtValue?: number;
  valueText?: string;
}

export interface WalletTypeSection {
  id: string;
  title: string;
  totalUSDT?: number;
  rows: ExchangeDetailRow[];
}

export interface BalanceSnapshot {
  id: string;
  scope: BalanceScope;
  timestamp: string;
  balanceUSDT: number;
}

export type BalanceScope =
  | { type: 'total' }
  | { type: 'account'; accountId: string }
  | { type: 'exchange'; exchange: Exchange };

export type ChartRange = 'day' | 'week' | 'month';

export function chartRangeLabel(range: ChartRange): string {
  switch (range) {
    case 'day': return '24H';
    case 'week': return '7D';
    case 'month': return '30D';
  }
}

export function chartRangeStartDate(range: ChartRange): Date {
  const now = new Date();
  switch (range) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export function scopeEquals(a: BalanceScope, b: BalanceScope): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'account' && b.type === 'account') return a.accountId === b.accountId;
  if (a.type === 'exchange' && b.type === 'exchange') return a.exchange === b.exchange;
  return true;
}
