import type { Exchange, ExchangeAccount } from '../types/common';

export type TradingVenue = 'spot' | 'swap';
export type TerminalMode = 'single' | 'grid';
export type TradeSide = 'buy' | 'sell';
export type TradeOrderType = 'market' | 'limit';
export type MarginMode = 'cross' | 'isolated';
export type PositionMode = 'net_mode' | 'long_short_mode';
export type GridSpacingMode = 'step' | 'count';

export interface OkxInstrument {
  instType: string;
  instId: string;
  baseCcy?: string;
  quoteCcy?: string;
  settleCcy?: string;
  ctVal?: string;
  ctValCcy?: string;
  tickSz: string;
  lotSz: string;
  minSz: string;
  minNotional?: string;
  maxLmtSz?: string;
  maxMktSz?: string;
  /** Max leverage for this instrument (swap only) */
  lever?: string;
  state: string;
}

export interface GridDraft {
  venue: TradingVenue;
  instId: string;
  quoteCcy: string;
  totalQuote: number;
  minPrice: number;
  maxPrice: number;
  spacingMode: GridSpacingMode;
  priceStep?: number;
  gridCount?: number;
  martingalePercent: number;
  marginMode: MarginMode;
  positionMode: PositionMode;
  leverage: number;
  reservedFeeRate?: number;
  /** Take-profit % above each buy price (undefined = disabled) */
  tpPercent?: number;
  /** Stop-loss % below each buy price — futures only (undefined = disabled) */
  slPercent?: number;
}

export interface GridOrderPreview {
  index: number;
  price: number;
  quoteAmount: number;
  quantity: number;
  notional: number;
  clOrdId: string;
  warning?: string;
  tpPrice?: number;
  slPrice?: number;
}

export interface GridPlan {
  id: string;
  accountId: string;
  exchange: Extract<Exchange, 'okx' | 'binance'>;
  status: 'draft' | 'active' | 'paused' | 'canceled' | 'completed';
  createdAt: string;
  updatedAt: string;
  draft: GridDraft;
  orders: GridOrderPreview[];
  exchangeOrderIds: { clOrdId: string; ordId?: string; state?: string; message?: string }[];
}

export interface SingleOrderDraft {
  venue: TradingVenue;
  instId: string;
  quoteCcy: string;
  side: TradeSide;
  orderType: TradeOrderType;
  price?: number;
  quoteAmount: number;
  marginMode: MarginMode;
  positionMode: PositionMode;
  leverage: number;
}

export interface TerminalAccountOption {
  account: ExchangeAccount;
  label: string;
}
