import { hmacSHA256Hex } from '../services/signing';
import type { ApiError } from '../services/errorHelper';
import { mapCatchError, mapHttpError } from '../services/errorHelper';
import type { APIKeys } from '../types/common';
import type { MarginMode, PositionMode, TradingVenue } from '../trading/types';

const SPOT_BASE = 'https://api.binance.com';
const FUTURES_BASE = 'https://fapi.binance.com';
const RECV_WINDOW = 5000;
const SPOT_ORDER_DELAY_MS = 220;
const FUTURES_BATCH_SIZE = 4;
const FUTURES_BATCH_DELAY_MS = 900;

type ApiResult<T> = { data: T; error?: never } | { data?: never; error: ApiError };

export interface BinanceFilter {
  filterType: string;
  tickSize?: string;
  stepSize?: string;
  minQty?: string;
  maxQty?: string;
  minNotional?: string;
  notional?: string;
  limit?: number;
}

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  contractType?: string;
  marginAsset?: string;
  filters: BinanceFilter[];
}

export interface BinanceExchangeInfo {
  symbols: BinanceSymbolInfo[];
}

export interface BinanceTicker {
  symbol: string;
  price: string;
}

export interface BinanceCommission {
  symbol: string;
  standardCommission?: {
    maker: string;
    taker: string;
    buyer: string;
    seller: string;
  };
}

export interface BinanceFuturesBalance {
  asset: string;
  availableBalance: string;
  balance: string;
}

export interface BinanceLeverageBracket {
  symbol: string;
  brackets: { initialLeverage: number; notionalCap: number; notionalFloor: number }[];
}

export interface BinanceOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  timeInForce?: 'GTC';
  newClientOrderId?: string;
  positionSide?: 'BOTH' | 'LONG' | 'SHORT';
}

export interface BinanceOrderAck {
  symbol: string;
  orderId?: number;
  clientOrderId?: string;
  status?: string;
  code?: number;
  msg?: string;
}

export interface BinanceOpenOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  type: string;
  side: string;
}

export async function fetchBinanceExchangeInfo(
  venue: TradingVenue,
  symbol?: string,
): Promise<ApiResult<BinanceExchangeInfo>> {
  const params = new URLSearchParams();
  if (symbol) params.set('symbol', symbol);
  return publicGet(venue, `${venue === 'spot' ? '/api/v3/exchangeInfo' : '/fapi/v1/exchangeInfo'}${params.toString() ? `?${params.toString()}` : ''}`);
}

export async function fetchBinanceTicker(
  venue: TradingVenue,
  symbol: string,
): Promise<ApiResult<BinanceTicker>> {
  return publicGet(venue, `${venue === 'spot' ? '/api/v3/ticker/price' : '/fapi/v2/ticker/price'}?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchBinanceCommission(
  keys: APIKeys,
  symbol: string,
): Promise<ApiResult<BinanceCommission>> {
  return signedRequest('spot', 'GET', '/api/v3/account/commission', { symbol }, keys);
}

export async function fetchBinanceFuturesBalance(
  keys: APIKeys,
): Promise<ApiResult<BinanceFuturesBalance[]>> {
  return signedRequest('swap', 'GET', '/fapi/v2/balance', {}, keys);
}

export async function fetchBinanceLeverageBracket(
  keys: APIKeys,
  symbol: string,
): Promise<ApiResult<BinanceLeverageBracket | BinanceLeverageBracket[]>> {
  return signedRequest('swap', 'GET', '/fapi/v1/leverageBracket', { symbol }, keys);
}

export async function setBinancePositionMode(
  keys: APIKeys,
  positionMode: PositionMode,
): Promise<ApiResult<{ code: number; msg: string }>> {
  return signedRequest('swap', 'POST', '/fapi/v1/positionSide/dual', {
    dualSidePosition: positionMode === 'long_short_mode' ? 'true' : 'false',
  }, keys);
}

export async function setBinanceMarginType(
  keys: APIKeys,
  symbol: string,
  marginMode: MarginMode,
): Promise<ApiResult<{ code: number; msg: string }>> {
  return signedRequest('swap', 'POST', '/fapi/v1/marginType', {
    symbol,
    marginType: marginMode === 'isolated' ? 'ISOLATED' : 'CROSSED',
  }, keys);
}

export async function setBinanceLeverage(
  keys: APIKeys,
  symbol: string,
  leverage: number,
): Promise<ApiResult<{ symbol: string; leverage: number; maxNotionalValue: string }>> {
  return signedRequest('swap', 'POST', '/fapi/v1/leverage', {
    symbol,
    leverage: String(Math.max(1, Math.round(leverage))),
  }, keys);
}

export async function placeBinanceOrder(
  keys: APIKeys,
  venue: TradingVenue,
  order: BinanceOrderRequest,
): Promise<ApiResult<BinanceOrderAck>> {
  const path = venue === 'spot' ? '/api/v3/order' : '/fapi/v1/order';
  return signedRequest(venue, 'POST', path, { ...order, newOrderRespType: 'ACK' }, keys);
}

export async function placeBinanceGridOrders(
  keys: APIKeys,
  venue: TradingVenue,
  orders: BinanceOrderRequest[],
): Promise<ApiResult<BinanceOrderAck[]>> {
  return venue === 'swap'
    ? placeBinanceFuturesBatchOrders(keys, orders)
    : placeBinanceSpotOrdersSequentially(keys, orders);
}

export async function fetchBinanceOpenOrders(
  keys: APIKeys,
  venue: TradingVenue,
  symbol: string,
): Promise<ApiResult<BinanceOpenOrder[]>> {
  const path = venue === 'spot' ? '/api/v3/openOrders' : '/fapi/v1/openOrders';
  return signedRequest(venue, 'GET', path, { symbol }, keys);
}

export async function cancelBinanceOrders(
  keys: APIKeys,
  venue: TradingVenue,
  symbol: string,
  orders: { orderId?: string; clientOrderId?: string }[],
): Promise<ApiResult<BinanceOrderAck[]>> {
  if (venue === 'swap') {
    const all: BinanceOrderAck[] = [];
    for (let index = 0; index < orders.length; index += 10) {
      const chunk = orders.slice(index, index + 10);
      const orderIds = chunk.filter((item) => item.orderId).map((item) => Number(item.orderId));
      const clientIds = chunk.filter((item) => !item.orderId && item.clientOrderId).map((item) => item.clientOrderId);
      const result = await signedRequest<BinanceOrderAck[]>('swap', 'DELETE', '/fapi/v1/batchOrders', {
        symbol,
        ...(orderIds.length > 0 ? { orderIdList: JSON.stringify(orderIds) } : {}),
        ...(orderIds.length === 0 && clientIds.length > 0 ? { origClientOrderIdList: JSON.stringify(clientIds) } : {}),
      }, keys);
      if (result.error) return result;
      all.push(...result.data);
      if (index + 10 < orders.length) await delay(300);
    }
    return { data: all };
  }

  const all: BinanceOrderAck[] = [];
  for (const order of orders) {
    const result = await signedRequest<BinanceOrderAck>('spot', 'DELETE', '/api/v3/order', {
      symbol,
      ...(order.orderId ? { orderId: order.orderId } : { origClientOrderId: order.clientOrderId }),
    }, keys);
    if (result.data) all.push(result.data);
    await delay(SPOT_ORDER_DELAY_MS);
  }
  return { data: all };
}

function placeBinanceSpotOrdersSequentially(
  keys: APIKeys,
  orders: BinanceOrderRequest[],
): Promise<ApiResult<BinanceOrderAck[]>> {
  return placeSequentially(keys, orders);
}

async function placeSequentially(
  keys: APIKeys,
  orders: BinanceOrderRequest[],
): Promise<ApiResult<BinanceOrderAck[]>> {
  const all: BinanceOrderAck[] = [];
  for (const order of orders) {
    const result = await placeBinanceOrder(keys, 'spot', order);
    if (result.data) all.push(result.data);
    if (result.error) {
      all.push({ symbol: order.symbol, clientOrderId: order.newClientOrderId, code: -1, msg: 'Network error' });
      break;
    }
    if (indexHasMore(all.length, orders.length)) await delay(SPOT_ORDER_DELAY_MS);
  }
  return { data: all };
}

async function placeBinanceFuturesBatchOrders(
  keys: APIKeys,
  orders: BinanceOrderRequest[],
): Promise<ApiResult<BinanceOrderAck[]>> {
  const all: BinanceOrderAck[] = [];
  for (let index = 0; index < orders.length; index += FUTURES_BATCH_SIZE) {
    const chunk = orders.slice(index, index + FUTURES_BATCH_SIZE);
    const result = await signedRequest<BinanceOrderAck[]>('swap', 'POST', '/fapi/v1/batchOrders', {
      batchOrders: JSON.stringify(chunk),
    }, keys);
    if (result.error) return result;
    all.push(...result.data);
    if (index + FUTURES_BATCH_SIZE < orders.length) await delay(FUTURES_BATCH_DELAY_MS);
  }
  return { data: all };
}

function indexHasMore(done: number, total: number): boolean {
  return done < total;
}

async function publicGet<T>(venue: TradingVenue, pathWithQuery: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${baseUrl(venue)}${pathWithQuery}`);
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

async function signedRequest<T>(
  venue: TradingVenue,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  params: Record<string, string | number | undefined>,
  keys: APIKeys,
): Promise<ApiResult<T>> {
  const query = signedQuery(params, keys.secretKey);
  try {
    const res = await fetch(`${baseUrl(venue)}${path}?${query}`, {
      method,
      headers: { 'X-MBX-APIKEY': keys.apiKey },
    });
    const json = await res.json();
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: json as T };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

function signedQuery(params: Record<string, string | number | undefined>, secret: string): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') query.set(key, String(value));
  });
  query.set('timestamp', String(Date.now()));
  query.set('recvWindow', String(RECV_WINDOW));
  const queryText = query.toString();
  return `${queryText}&signature=${hmacSHA256Hex(queryText, secret)}`;
}

function baseUrl(venue: TradingVenue): string {
  return venue === 'spot' ? SPOT_BASE : FUTURES_BASE;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
