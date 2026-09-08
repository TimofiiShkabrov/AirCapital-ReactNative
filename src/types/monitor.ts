import type { Exchange, ExchangeAccount } from "./common";
export type SyncState = "fresh" | "partial" | "stale" | "error" | "paused";
export interface WalletBalance {
  id: string;
  name: string;
  balanceUSDT?: number;
  assets: { asset: string; quantity: number; valueUSDT?: number }[];
  status: "complete" | "unavailable" | "unpriced";
}
export interface AccountObservation {
  accountId: string;
  observedAt: string;
  lastCompleteAt?: string;
  balanceUSDT?: number;
  wallets: WalletBalance[];
  issues: string[];
  complete: boolean;
  valuationSource?: string;
}
export interface AccountSync {
  status: SyncState;
  lastAttemptAt: string;
  lastSuccessAt?: string;
  error?: string;
}
export interface MonitoringResult {
  accounts: ExchangeAccount[];
  observations: Record<string, AccountObservation>;
  sync: Record<string, AccountSync>;
}
export interface CashFlow {
  id: string;
  accountId: string;
  occurredAt: string;
  type: "deposit" | "withdrawal";
  amountUSDT: number;
  transferId?: string;
  feeUSDT?: number;
  source: "manual";
}
export interface FlowCoverage {
  accountId: string;
  from: string;
  to: string;
}
export interface ArchivedPlan {
  legacy?: unknown;
  id: string;
  exchange?: Exchange;
  accountId?: string;
  instrument?: string;
  orderIds: string[];
  archivedAt: string;
}
