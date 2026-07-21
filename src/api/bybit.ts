import { hmacSHA256Hex } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapCatchError, mapHttpError } from '../services/errorHelper';

const BASE = 'https://api.bybit.com';
const RECV_WINDOW = 5000;

type ApiResult<T> = { data: T; error?: never } | { data?: never; error: ApiError };
export type BybitCategory = 'spot' | 'linear';

async function get<T>(
  url: string,
  headers: Record<string, string>,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return { error: mapHttpError(res.status) };
    const json = await res.json();
    return { data: json as T };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

function bybitHeaders(
  keys: APIKeys,
  payload: string,
  contentType = false,
): Record<string, string> {
  const ts = Date.now();
  const sig = hmacSHA256Hex(`${ts}${keys.apiKey}${RECV_WINDOW}${payload}`, keys.secretKey);
  return {
    'X-BAPI-SIGN': sig,
    'X-BAPI-API-KEY': keys.apiKey,
    'X-BAPI-TIMESTAMP': `${ts}`,
    'X-BAPI-RECV-WINDOW': `${RECV_WINDOW}`,
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function publicGet<T>(pathWithQuery: string): Promise<ApiResult<T>> {
  return get<T>(`${BASE}${pathWithQuery}`, {});
}

async function authedGet<T>(pathWithQuery: string, keys: APIKeys): Promise<ApiResult<T>> {
  const [, query = ''] = pathWithQuery.split('?');
  return get<T>(`${BASE}${pathWithQuery}`, bybitHeaders(keys, query));
}

async function authedPost<T>(path: string, body: unknown, keys: APIKeys): Promise<ApiResult<T>> {
  const bodyText = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: bybitHeaders(keys, bodyText, true),
      body: bodyText,
    });
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() as T };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

export interface BybitEnvelope<T> {
  retCode: number;
  retMsg: string;
  result: T;
  retExtInfo?: unknown;
  time?: number;
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
        walletBalance?: string;
        availableToWithdraw?: string;
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
      updatedTime?: string;
      positionIdx?: number;
      leverage?: string;
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

export interface BybitInstrumentResponse {
  category: BybitCategory;
  nextPageCursor?: string;
  list: BybitInstrumentInfo[];
}

export interface BybitInstrumentInfo {
  symbol: string;
  status: string;
  baseCoin: string;
  quoteCoin: string;
  settleCoin?: string;
  leverageFilter?: {
    minLeverage: string;
    maxLeverage: string;
    leverageStep: string;
  };
  priceFilter: {
    minPrice?: string;
    maxPrice?: string;
    tickSize: string;
  };
  lotSizeFilter: {
    basePrecision?: string;
    quotePrecision?: string;
    minOrderQty?: string;
    minOrderAmt?: string;
    minNotionalValue?: string;
    maxOrderQty?: string;
    maxLimitOrderQty?: string;
    maxMarketOrderQty?: string;
    maxMktOrderQty?: string;
    qtyStep?: string;
  };
}

export interface BybitTickerResponse {
  category: BybitCategory;
  list: BybitTicker[];
}

export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  bid1Price?: string;
  ask1Price?: string;
}

export interface BybitFeeRateResponse {
  list: {
    symbol: string;
    makerFeeRate: string;
    takerFeeRate: string;
  }[];
}

export interface BybitOrderRequest {
  category: BybitCategory;
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Limit' | 'Market';
  qty: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC';
  marketUnit?: 'baseCoin' | 'quoteCoin';
  orderLinkId?: string;
  positionIdx?: 0 | 1 | 2;
  takeProfit?: string;
  stopLoss?: string;
  tpTriggerBy?: 'LastPrice' | 'IndexPrice' | 'MarkPrice';
  slTriggerBy?: 'LastPrice' | 'IndexPrice' | 'MarkPrice';
  tpslMode?: 'Full' | 'Partial';
  tpOrderType?: 'Market' | 'Limit';
  slOrderType?: 'Market' | 'Limit';
  reduceOnly?: boolean;
  closeOnTrigger?: boolean;
}

export interface BybitOrderAck {
  category?: BybitCategory;
  symbol?: string;
  orderId?: string;
  orderLinkId?: string;
  createAt?: string;
}

export interface BybitBatchOrderResponse {
  retCode: number;
  retMsg: string;
  result: {
    list: BybitOrderAck[];
  };
  retExtInfo?: {
    list?: { code: number; msg: string }[];
  };
}

export interface BybitOpenOrder {
  orderId: string;
  orderLinkId: string;
  symbol: string;
  price: string;
  qty: string;
  leavesQty?: string;
  side: 'Buy' | 'Sell';
  orderType: string;
  orderStatus: string;
  stopOrderType?: string;
  triggerPrice?: string;
}

export interface BybitOpenOrdersResponse {
  category: BybitCategory;
  nextPageCursor?: string;
  list: BybitOpenOrder[];
}

export interface BybitSetLeverageRequest {
  category: 'linear';
  symbol: string;
  buyLeverage: string;
  sellLeverage: string;
}

export interface BybitSwitchPositionModeRequest {
  category: 'linear';
  symbol: string;
  mode: 0 | 3;
}

export interface BybitSwitchMarginModeRequest {
  category: 'linear';
  symbol: string;
  tradeMode: 0 | 1;
  buyLeverage: string;
  sellLeverage: string;
}

export async function fetchWallet(
  keys: APIKeys,
): Promise<ApiResult<BybitWalletResponse>> {
  const qs = 'accountType=UNIFIED';
  return authedGet<BybitWalletResponse>(`/v5/account/wallet-balance?${qs}`, keys);
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
  return authedGet<BybitPositionResponse>(`/v5/position/list?${qs}`, keys);
}

export async function fetchExecutions(
  keys: APIKeys,
  category: string,
  symbol: string,
): Promise<
  { data: BybitExecutionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `category=${category}&symbol=${symbol}`;
  return authedGet<BybitExecutionResponse>(`/v5/execution/list?${qs}`, keys);
}

export async function fetchEarnPositions(
  keys: APIKeys,
  category: string,
): Promise<
  { data: BybitEarnPositionResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `category=${category}`;
  return authedGet<BybitEarnPositionResponse>(`/v5/earn/position?${qs}`, keys);
}

export async function fetchAllCoinsBalance(
  keys: APIKeys,
  accountType: string,
): Promise<
  { data: BybitAllCoinsBalanceResponse; error?: never } | { data?: never; error: ApiError }
> {
  const qs = `accountType=${accountType}`;
  return authedGet<BybitAllCoinsBalanceResponse>(`/v5/asset/transfer/query-account-coins-balance?${qs}`, keys);
}

export async function fetchBybitInstruments(
  category: BybitCategory,
  symbol?: string,
  cursor?: string,
): Promise<ApiResult<BybitEnvelope<BybitInstrumentResponse>>> {
  const params = new URLSearchParams({ category });
  if (category === 'linear') params.set('limit', '1000');
  if (symbol) params.set('symbol', symbol);
  if (cursor) params.set('cursor', cursor);
  return publicGet<BybitEnvelope<BybitInstrumentResponse>>(`/v5/market/instruments-info?${params.toString()}`);
}

export async function fetchBybitTicker(
  category: BybitCategory,
  symbol: string,
): Promise<ApiResult<BybitEnvelope<BybitTickerResponse>>> {
  const params = new URLSearchParams({ category, symbol });
  return publicGet<BybitEnvelope<BybitTickerResponse>>(`/v5/market/tickers?${params.toString()}`);
}

export async function fetchBybitFeeRate(
  keys: APIKeys,
  category: BybitCategory,
  symbol: string,
): Promise<ApiResult<BybitEnvelope<BybitFeeRateResponse>>> {
  const params = new URLSearchParams({ category, symbol });
  return authedGet<BybitEnvelope<BybitFeeRateResponse>>(`/v5/account/fee-rate?${params.toString()}`, keys);
}

export async function fetchBybitOpenOrders(
  keys: APIKeys,
  category: BybitCategory,
  symbol: string,
): Promise<ApiResult<BybitEnvelope<BybitOpenOrdersResponse>>> {
  const params = new URLSearchParams({ category, symbol, openOnly: '0', limit: '50' });
  return authedGet<BybitEnvelope<BybitOpenOrdersResponse>>(`/v5/order/realtime?${params.toString()}`, keys);
}

export async function placeBybitOrder(
  keys: APIKeys,
  order: BybitOrderRequest,
): Promise<ApiResult<BybitEnvelope<BybitOrderAck>>> {
  return authedPost<BybitEnvelope<BybitOrderAck>>('/v5/order/create', order, keys);
}

export async function placeBybitBatchOrders(
  keys: APIKeys,
  category: BybitCategory,
  orders: BybitOrderRequest[],
): Promise<ApiResult<BybitBatchOrderResponse>> {
  const allAcks: BybitOrderAck[] = [];
  const allRet: { code: number; msg: string }[] = [];
  let retCode = 0;
  let retMsg = 'OK';
  const size = category === 'spot' ? 10 : 20;
  for (let index = 0; index < orders.length; index += size) {
    const chunk = orders.slice(index, index + size);
    const result = await authedPost<BybitEnvelope<{ list: BybitOrderAck[] }>>('/v5/order/create-batch', {
      category,
      request: chunk.map((order) => {
        const request: Partial<BybitOrderRequest> = { ...order };
        delete request.category;
        return request;
      }),
    }, keys);
    if (result.error) return result;
    if (result.data.retCode !== 0 && retCode === 0) {
      retCode = result.data.retCode;
      retMsg = result.data.retMsg;
    }
    allAcks.push(...(result.data.result.list ?? []));
    const retList = (result.data.retExtInfo as { list?: { code: number; msg: string }[] } | undefined)?.list ?? [];
    allRet.push(...retList);
    if (index + size < orders.length) await delay(350);
  }
  return { data: { retCode, retMsg, result: { list: allAcks }, retExtInfo: { list: allRet } } };
}

export async function cancelBybitBatchOrders(
  keys: APIKeys,
  category: BybitCategory,
  symbol: string,
  orders: { orderId?: string; orderLinkId?: string }[],
): Promise<ApiResult<BybitBatchOrderResponse>> {
  const allAcks: BybitOrderAck[] = [];
  const allRet: { code: number; msg: string }[] = [];
  let retCode = 0;
  let retMsg = 'OK';
  const size = category === 'spot' ? 10 : 20;
  for (let index = 0; index < orders.length; index += size) {
    const chunk = orders.slice(index, index + size);
    const result = await authedPost<BybitEnvelope<{ list: BybitOrderAck[] }>>('/v5/order/cancel-batch', {
      category,
      request: chunk.map((order) => ({
        symbol,
        orderId: order.orderId,
        orderLinkId: order.orderId ? undefined : order.orderLinkId,
      })),
    }, keys);
    if (result.error) return result;
    if (result.data.retCode !== 0 && retCode === 0) {
      retCode = result.data.retCode;
      retMsg = result.data.retMsg;
    }
    allAcks.push(...(result.data.result.list ?? []));
    const retList = (result.data.retExtInfo as { list?: { code: number; msg: string }[] } | undefined)?.list ?? [];
    allRet.push(...retList);
    if (index + size < orders.length) await delay(250);
  }
  return { data: { retCode, retMsg, result: { list: allAcks }, retExtInfo: { list: allRet } } };
}

export async function setBybitLeverage(
  keys: APIKeys,
  payload: BybitSetLeverageRequest,
): Promise<ApiResult<BybitEnvelope<Record<string, never>>>> {
  return authedPost<BybitEnvelope<Record<string, never>>>('/v5/position/set-leverage', payload, keys);
}

export async function switchBybitPositionMode(
  keys: APIKeys,
  payload: BybitSwitchPositionModeRequest,
): Promise<ApiResult<BybitEnvelope<Record<string, never>>>> {
  return authedPost<BybitEnvelope<Record<string, never>>>('/v5/position/switch-mode', payload, keys);
}

export async function switchBybitMarginMode(
  keys: APIKeys,
  payload: BybitSwitchMarginModeRequest,
): Promise<ApiResult<BybitEnvelope<Record<string, never>>>> {
  return authedPost<BybitEnvelope<Record<string, never>>>('/v5/position/switch-isolated', payload, keys);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
