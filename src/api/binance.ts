import { hmacSHA256Hex } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapHttpError, mapCatchError } from '../services/errorHelper';

const BASE = 'https://api.binance.com';
const FUTURES_BASE = 'https://fapi.binance.com';
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
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

function sign(query: string, secret: string): string {
  return hmacSHA256Hex(query, secret);
}

export interface BinanceWalletItem {
  walletName: string;
  activate: boolean;
  balance: string;
}

export interface BinanceSpotAccount {
  balances: { asset: string; free: string; locked: string }[];
}

export interface BinanceSpotTrade {
  symbol: string;
  price: string;
  qty: string;
  time: number;
  isBuyer: boolean;
}

export interface BinanceFuturesPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice?: string;
  updateTime?: number;
}

export interface BinancePriceTicker {
  symbol: string;
  price: string;
}

export async function fetchWallets(
  keys: APIKeys,
): Promise<{ data: BinanceWalletItem[]; error?: never } | { data?: never; error: ApiError }> {
  const ts = Date.now();
  const query = `quoteAsset=USDT&timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = sign(query, keys.secretKey);
  const url = `${BASE}/sapi/v1/asset/wallet/balance?${query}&signature=${sig}`;
  return get<BinanceWalletItem[]>(url, { 'X-MBX-APIKEY': keys.apiKey });
}

export async function fetchSpotAccount(
  keys: APIKeys,
): Promise<{ data: BinanceSpotAccount; error?: never } | { data?: never; error: ApiError }> {
  const ts = Date.now();
  const query = `timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = sign(query, keys.secretKey);
  const url = `${BASE}/api/v3/account?${query}&signature=${sig}`;
  return get<BinanceSpotAccount>(url, { 'X-MBX-APIKEY': keys.apiKey });
}

export async function fetchSpotTrades(
  symbol: string,
  keys: APIKeys,
): Promise<{ data: BinanceSpotTrade[]; error?: never } | { data?: never; error: ApiError }> {
  const ts = Date.now();
  const query = `symbol=${symbol}&timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = sign(query, keys.secretKey);
  const url = `${BASE}/api/v3/myTrades?${query}&signature=${sig}`;
  return get<BinanceSpotTrade[]>(url, { 'X-MBX-APIKEY': keys.apiKey });
}

export async function fetchFuturesPositions(
  keys: APIKeys,
): Promise<
  { data: BinanceFuturesPosition[]; error?: never } | { data?: never; error: ApiError }
> {
  const ts = Date.now();
  const query = `timestamp=${ts}&recvWindow=${RECV_WINDOW}`;
  const sig = sign(query, keys.secretKey);
  const url = `${FUTURES_BASE}/fapi/v2/positionRisk?${query}&signature=${sig}`;
  return get<BinanceFuturesPosition[]>(url, { 'X-MBX-APIKEY': keys.apiKey });
}

export async function fetchPriceTicker(
  symbol: string,
): Promise<{ data: BinancePriceTicker; error?: never } | { data?: never; error: ApiError }> {
  const url = `${BASE}/api/v3/ticker/price?symbol=${symbol}`;
  return get<BinancePriceTicker>(url, {});
}
