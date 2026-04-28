import { hmacSHA256Hex } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapHttpError } from '../services/errorHelper';

const BASE = 'https://open-api.bingx.com';
const RECV_WINDOW = 5000;

async function get<T>(
  url: string,
  apiKey: string,
): Promise<{ data: T; error?: never } | { data?: never; error: ApiError }> {
  try {
    const res = await fetch(url, { headers: { 'X-BX-APIKEY': apiKey } });
    if (!res.ok) return { error: mapHttpError(res.status) };
    const json = await res.json();
    return { data: json as T };
  } catch {
    return { error: { code: 'unknownError' } };
  }
}

export interface BingXSpotWallet {
  code: number;
  data?: { balances: { asset: string; free: string; locked: string }[] };
}

export interface BingXFuturesWallet {
  code: number;
  data: { asset: string; balance: string; equity: string }[];
}

export interface BingXSpotTradeResponse {
  code: number;
  data?: { price: string; qty: string; time: number; isBuyer: boolean; commission?: string; commissionAsset?: string }[];
}

export interface BingXFuturesPositionResponse {
  code: number;
  data?: {
    symbol: string;
    positionAmt: string;
    avgPrice?: string;
    markPrice?: string;
    unrealizedProfit?: string;
    updateTime?: number;
  }[];
}

export interface BingXTickerResponse {
  code: number;
  data?: { symbol: string; price: string }[];
}

export async function fetchSpotWallet(
  keys: APIKeys,
): Promise<{ data: BingXSpotWallet; error?: never } | { data?: never; error: ApiError }> {
  const ts = Date.now();
  const query = `timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = hmacSHA256Hex(query, keys.secretKey);
  const url = `${BASE}/openApi/spot/v1/account/balance?${query}&signature=${sig}`;
  return get<BingXSpotWallet>(url, keys.apiKey);
}

export async function fetchFuturesWallet(
  keys: APIKeys,
): Promise<{ data: BingXFuturesWallet; error?: never } | { data?: never; error: ApiError }> {
  const ts = Date.now();
  const query = `timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = hmacSHA256Hex(query, keys.secretKey);
  const url = `${BASE}/openApi/swap/v3/user/balance?${query}&signature=${sig}`;
  return get<BingXFuturesWallet>(url, keys.apiKey);
}

export async function fetchSpotTrades(
  symbol: string,
  keys: APIKeys,
): Promise<
  { data: BingXSpotTradeResponse; error?: never } | { data?: never; error: ApiError }
> {
  const ts = Date.now();
  const query = `symbol=${symbol}&timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = hmacSHA256Hex(query, keys.secretKey);
  const url = `${BASE}/openApi/spot/v1/trade/myTrades?${query}&signature=${sig}`;
  return get<BingXSpotTradeResponse>(url, keys.apiKey);
}

export async function fetchFuturesPositions(
  keys: APIKeys,
): Promise<
  { data: BingXFuturesPositionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const ts = Date.now();
  const query = `timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = hmacSHA256Hex(query, keys.secretKey);
  const url = `${BASE}/openApi/swap/v2/user/positions?${query}&signature=${sig}`;
  return get<BingXFuturesPositionResponse>(url, keys.apiKey);
}

export async function fetchSpotTicker(
  symbol: string,
): Promise<{ data: BingXTickerResponse; error?: never } | { data?: never; error: ApiError }> {
  const url = `${BASE}/openApi/spot/v1/ticker/price?symbol=${symbol}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch {
    return { error: { code: 'unknownError' } };
  }
}
