import { hmacSHA256Hex } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapHttpError } from '../services/errorHelper';

const BASE = 'https://api.bybit.com';
const RECV_WINDOW = 5000;

async function get<T>(
  url: string,
  headers: Record<string, string>,
): Promise<{ data: T; error?: never } | { data?: never; error: ApiError }> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return { error: mapHttpError(res.status) };
    const json = await res.json();
    return { data: json as T };
  } catch {
    return { error: { code: 'unknownError' } };
  }
}

function bybitHeaders(
  keys: APIKeys,
  queryString: string,
): Record<string, string> {
  const ts = Date.now();
  const payload = `${ts}${keys.apiKey}${RECV_WINDOW}${queryString}`;
  const sig = hmacSHA256Hex(payload, keys.secretKey);
  return {
    'X-BAPI-SIGN': sig,
    'X-BAPI-API-KEY': keys.apiKey,
    'X-BAPI-TIMESTAMP': `${ts}`,
    'X-BAPI-RECV-WINDOW': `${RECV_WINDOW}`,
  };
}

export interface BybitWalletResponse {
  retCode: number;
  result: {
    list: {
      accountType: string;
      totalEquity: string;
      coin: {
        coin: string;
        equity: string;
        usdValue: string;
      }[];
    }[];
  };
}

export interface BybitPositionResponse {
  retCode: number;
  result?: {
    list: {
      symbol: string;
      size: string;
      side: string;
      avgPrice: string;
      markPrice?: string;
      positionValue?: string;
      unrealisedPnl?: string;
      createdTime?: string;
    }[];
  };
}

export interface BybitExecutionResponse {
  retCode: number;
  result?: {
    list: {
      symbol: string;
      execPrice: string;
      execQty: string;
      execTime: string;
      side: string;
      execFee?: string;
      feeCurrency?: string;
    }[];
  };
}

export interface BybitEarnPositionResponse {
  retCode: number;
  result?: {
    list: {
      coin: string;
      amount: string;
      status?: string;
    }[];
  };
}

export interface BybitAllCoinsBalanceResponse {
  retCode: number;
  result?: {
    balance: {
      coin: string;
      walletBalance: string;
    }[];
  };
}

export async function fetchWallet(
  keys: APIKeys,
): Promise<{ data: BybitWalletResponse; error?: never } | { data?: never; error: ApiError }> {
  const qs = 'accountType=UNIFIED';
  const url = `${BASE}/v5/account/wallet-balance?${qs}`;
  return get<BybitWalletResponse>(url, bybitHeaders(keys, qs));
}

export async function fetchPositions(
  keys: APIKeys,
  category: string,
  settleCoin?: string,
): Promise<
  { data: BybitPositionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const parts = [`category=${category}`];
  if (settleCoin) parts.push(`settleCoin=${settleCoin}`);
  const qs = parts.join('&');
  const url = `${BASE}/v5/position/list?${qs}`;
  return get<BybitPositionResponse>(url, bybitHeaders(keys, qs));
}

export async function fetchExecutions(
  keys: APIKeys,
  category: string,
  symbol: string,
): Promise<
  { data: BybitExecutionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `category=${category}&symbol=${symbol}`;
  const url = `${BASE}/v5/execution/list?${qs}`;
  return get<BybitExecutionResponse>(url, bybitHeaders(keys, qs));
}

export async function fetchEarnPositions(
  keys: APIKeys,
  category: string,
): Promise<
  { data: BybitEarnPositionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `category=${category}`;
  const url = `${BASE}/v5/earn/position?${qs}`;
  return get<BybitEarnPositionResponse>(url, bybitHeaders(keys, qs));
}

export async function fetchAllCoinsBalance(
  keys: APIKeys,
  accountType: string,
): Promise<
  { data: BybitAllCoinsBalanceResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `accountType=${accountType}`;
  const url = `${BASE}/v5/asset/transfer/query-account-coins-balance?${qs}`;
  return get<BybitAllCoinsBalanceResponse>(url, bybitHeaders(keys, qs));
}
