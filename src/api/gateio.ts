import { buildGateSignString, hmacSHA512Hex } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapHttpError } from '../services/errorHelper';

const BASE = 'https://api.gateio.ws';

function gateHeaders(
  keys: APIKeys,
  method: string,
  path: string,
  queryString: string,
): Record<string, string> {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signStr = buildGateSignString(method, path, queryString, '', timestamp);
  const signature = hmacSHA512Hex(signStr, keys.secretKey);
  return {
    KEY: keys.apiKey,
    SIGN: signature,
    Timestamp: timestamp,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function get<T>(
  path: string,
  queryString: string,
  headers: Record<string, string>,
): Promise<{ data: T; error?: never } | { data?: never; error: ApiError }> {
  const suffix = queryString ? `?${queryString}` : '';
  try {
    const res = await fetch(`${BASE}${path}${suffix}`, { headers });
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch {
    return { error: { code: 'unknownError' } };
  }
}

export interface GateTotalBalance {
  details: Record<string, { currency: string; amount: string }>;
  total: { amount: string; currency: string };
}

export interface GateSpotAccount {
  currency: string;
  available: string;
  locked: string;
}

export interface GateSpotTrade {
  side: string;
  amount: string;
  price: string;
  create_time?: string;
}

export interface GateFuturesPosition {
  contract: string;
  size: string;
  entry_price?: string;
  mark_price?: string;
  update_time?: number;
}

export interface GateSpotTicker {
  currency_pair: string;
  last?: string;
}

export async function fetchTotalBalance(
  keys: APIKeys,
): Promise<{ data: GateTotalBalance; error?: never } | { data?: never; error: ApiError }> {
  const path = '/api/v4/wallet/total_balance';
  const qs = 'currency=USDT';
  return get<GateTotalBalance>(path, qs, gateHeaders(keys, 'GET', path, qs));
}

export async function fetchSpotAccounts(
  keys: APIKeys,
): Promise<{ data: GateSpotAccount[]; error?: never } | { data?: never; error: ApiError }> {
  const path = '/api/v4/spot/accounts';
  return get<GateSpotAccount[]>(path, '', gateHeaders(keys, 'GET', path, ''));
}

export async function fetchSpotTrades(
  currencyPair: string,
  keys: APIKeys,
): Promise<{ data: GateSpotTrade[]; error?: never } | { data?: never; error: ApiError }> {
  const path = '/api/v4/spot/my_trades';
  const qs = `currency_pair=${currencyPair}`;
  return get<GateSpotTrade[]>(path, qs, gateHeaders(keys, 'GET', path, qs));
}

export async function fetchFuturesPositions(
  settle: string,
  keys: APIKeys,
): Promise<
  { data: GateFuturesPosition[]; error?: never } | { data?: never; error: ApiError }
> {
  const path = `/api/v4/futures/${settle}/positions`;
  return get<GateFuturesPosition[]>(path, '', gateHeaders(keys, 'GET', path, ''));
}

export async function fetchSpotTicker(
  currencyPair: string,
): Promise<{ data: GateSpotTicker[]; error?: never } | { data?: never; error: ApiError }> {
  const path = '/api/v4/spot/tickers';
  const qs = `currency_pair=${currencyPair}`;
  try {
    const res = await fetch(`${BASE}${path}?${qs}`);
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch {
    return { error: { code: 'unknownError' } };
  }
}
