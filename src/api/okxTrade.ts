import { hmacSHA256Base64 } from '../services/signing';
import type { APIKeys } from '../types/common';
import type { ApiError } from '../services/errorHelper';
import { mapCatchError, mapHttpError } from '../services/errorHelper';
import type { MarginMode, OkxInstrument, PositionMode, TradeOrderType, TradeSide, TradingVenue } from '../trading/types';

const BASE = 'https://www.okx.com';
const BATCH_SIZE = 4;
const BATCH_RETRY_ATTEMPTS = 3;
const BATCH_RETRY_DELAY_MS = 1200;
const BATCH_DELAY_MS = 900;

type ApiResult<T> = { data: T; error?: never } | { data?: never; error: ApiError };

export interface OkxEnvelope<T> {
  code: string;
  msg: string;
  data: T;
}

export interface OkxTicker {
  instId: string;
  last: string;
  askPx: string;
  bidPx: string;
  ts: string;
}

export interface OkxOrderAck {
  ordId: string;
  clOrdId: string;
  tag: string;
  sCode: string;
  sMsg: string;
}

export interface OkxPendingOrder {
  instId: string;
  ordId: string;
  clOrdId: string;
  side: TradeSide;
  ordType: string;
  px: string;
  sz: string;
  accFillSz: string;
  state: string;
  cTime: string;
}

export interface OkxAlgoAttachment {
  attachAlgoClOrdId?: string;
  tpTriggerPx?: string;
  tpOrdPx?: string;
  tpTriggerPxType?: 'last' | 'index' | 'mark';
  slTriggerPx?: string;
  slOrdPx?: string;
  slTriggerPxType?: 'last' | 'index' | 'mark';
}

export interface OkxOrderRequest {
  instId: string;
  tdMode: 'cash' | MarginMode;
  side: TradeSide;
  ordType: TradeOrderType;
  sz: string;
  clOrdId?: string;
  tag?: string;
  px?: string;
  posSide?: 'net' | 'long' | 'short';
  tgtCcy?: 'base_ccy' | 'quote_ccy';
  reduceOnly?: 'true' | 'false';
  attachAlgoOrds?: OkxAlgoAttachment[];
}

export interface OkxClosePositionRequest {
  instId: string;
  mgnMode: MarginMode;
  posSide?: 'net' | 'long' | 'short';
  autoCxl?: boolean;
  clOrdId?: string;
}

export interface OkxSetLeverageRequest {
  instId: string;
  lever: string;
  mgnMode: MarginMode;
  posSide?: 'long' | 'short';
}

export async function fetchOkxPublicInstruments(
  venue: TradingVenue,
  instId?: string,
): Promise<ApiResult<OkxEnvelope<OkxInstrument[]>>> {
  const query = new URLSearchParams({ instType: venue === 'spot' ? 'SPOT' : 'SWAP' });
  if (instId) query.set('instId', instId);
  return publicGet<OkxEnvelope<OkxInstrument[]>>(`/api/v5/public/instruments?${query.toString()}`);
}

export async function fetchOkxTicker(
  instId: string,
): Promise<ApiResult<OkxEnvelope<OkxTicker[]>>> {
  return publicGet<OkxEnvelope<OkxTicker[]>>(`/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`);
}

export interface OkxLeverageInfo {
  instId: string;
  mgnMode: string;
  lever: string;
  posSide?: string;
}

export interface OkxTradeFee {
  instType: string;
  instId?: string;
  maker: string;
  taker: string;
  makerU?: string;
  takerU?: string;
  delivery?: string;
  exercise?: string;
}

export async function fetchOkxLeverageInfo(
  keys: APIKeys,
  instId: string,
  mgnMode: string,
): Promise<ApiResult<OkxEnvelope<OkxLeverageInfo[]>>> {
  return authedGet(
    `/api/v5/account/leverage-info?instId=${encodeURIComponent(instId)}&mgnMode=${mgnMode}`,
    keys,
  );
}

export async function fetchOkxTradeFee(
  keys: APIKeys,
  venue: TradingVenue,
  instId: string,
): Promise<ApiResult<OkxEnvelope<OkxTradeFee[]>>> {
  const query = new URLSearchParams({
    instType: venue === 'spot' ? 'SPOT' : 'SWAP',
    instId,
  });
  return authedGet(`/api/v5/account/trade-fee?${query.toString()}`, keys);
}

export async function setOkxPositionMode(
  keys: APIKeys,
  posMode: PositionMode,
): Promise<ApiResult<OkxEnvelope<{ posMode: PositionMode }[]>>> {
  return authedPost('/api/v5/account/set-position-mode', { posMode }, keys);
}

export async function setOkxLeverage(
  keys: APIKeys,
  payload: OkxSetLeverageRequest,
): Promise<ApiResult<OkxEnvelope<OkxSetLeverageRequest[]>>> {
  return authedPost('/api/v5/account/set-leverage', payload, keys);
}

export async function placeOkxOrder(
  keys: APIKeys,
  payload: OkxOrderRequest,
): Promise<ApiResult<OkxEnvelope<OkxOrderAck[]>>> {
  return authedPost('/api/v5/trade/order', payload, keys);
}

export async function placeOkxBatchOrders(
  keys: APIKeys,
  orders: OkxOrderRequest[],
): Promise<ApiResult<OkxEnvelope<OkxOrderAck[]>>> {
  const allAcks: OkxOrderAck[] = [];
  let batchCode = '0';
  let batchMsg = '';
  for (let index = 0; index < orders.length; index += BATCH_SIZE) {
    const chunk = orders.slice(index, index + BATCH_SIZE);
    const result = await authedPostWithRateLimitRetry<OkxEnvelope<OkxOrderAck[]>>(
      '/api/v5/trade/batch-orders',
      chunk,
      keys,
    );
    if (result.error) return result;
    allAcks.push(...(result.data.data ?? []));
    if (result.data.code !== '0') {
      batchCode = result.data.code;
      batchMsg = result.data.msg;
      if (result.data.code !== '2') break;
      if (result.data.data.some(isRateLimitAck)) {
        await delay(BATCH_RETRY_DELAY_MS);
      }
    }
    if (index + BATCH_SIZE < orders.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
  return { data: { code: batchCode, msg: batchMsg, data: allAcks } };
}

export async function fetchOkxPendingOrders(
  keys: APIKeys,
  instId?: string,
  venue?: TradingVenue,
): Promise<ApiResult<OkxEnvelope<OkxPendingOrder[]>>> {
  const params = new URLSearchParams();
  if (venue) params.set('instType', venue === 'spot' ? 'SPOT' : 'SWAP');
  if (instId) params.set('instId', instId);
  const suffix = params.toString();
  return authedGet(`/api/v5/trade/orders-pending${suffix ? `?${suffix}` : ''}`, keys);
}

export async function cancelOkxBatchOrders(
  keys: APIKeys,
  orders: { instId: string; ordId?: string; clOrdId?: string }[],
): Promise<ApiResult<OkxEnvelope<OkxOrderAck[]>>> {
  const allAcks: OkxOrderAck[] = [];
  for (let index = 0; index < orders.length; index += BATCH_SIZE) {
    const chunk = orders.slice(index, index + BATCH_SIZE);
    const result = await authedPost<OkxEnvelope<OkxOrderAck[]>>('/api/v5/trade/cancel-batch-orders', chunk, keys);
    if (result.error) return result;
    if (result.data.code !== '0') return { data: result.data };
    allAcks.push(...result.data.data);
    if (index + BATCH_SIZE < orders.length) {
      await delay(250);
    }
  }
  return { data: { code: '0', msg: '', data: allAcks } };
}

export async function closeOkxPosition(
  keys: APIKeys,
  payload: OkxClosePositionRequest,
): Promise<ApiResult<OkxEnvelope<{ instId: string; posSide: string }[]>>> {
  return authedPost('/api/v5/trade/close-position', payload, keys);
}

export function okxEnvelopeFailed(envelope: OkxEnvelope<unknown>): string | undefined {
  if (envelope.code !== '0') return envelope.msg || `OKX error ${envelope.code}`;
  return undefined;
}

function okxTimestamp(): string {
  return new Date().toISOString().replace(/(\.\d{3})Z$/, '$1Z');
}

function okxHeaders(
  keys: APIKeys,
  method: 'GET' | 'POST',
  requestPath: string,
  queryAndBody: string,
): Record<string, string> {
  const timestamp = okxTimestamp();
  const signStr = `${timestamp}${method}${requestPath}${queryAndBody}`;
  const signature = hmacSHA256Base64(signStr, keys.secretKey);
  return {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': keys.apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-PASSPHRASE': keys.passphrase ?? '',
    'OK-ACCESS-TIMESTAMP': timestamp,
    'x-simulated-trading': '0',
  };
}

async function publicGet<T>(pathWithQuery: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${pathWithQuery}`);
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

async function authedGet<T>(pathWithQuery: string, keys: APIKeys): Promise<ApiResult<T>> {
  const [path, query = ''] = pathWithQuery.split('?');
  const signSuffix = query ? `?${query}` : '';
  try {
    const res = await fetch(`${BASE}${pathWithQuery}`, {
      headers: okxHeaders(keys, 'GET', path, signSuffix),
    });
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

async function authedPost<T>(
  path: string,
  body: unknown,
  keys: APIKeys,
): Promise<ApiResult<T>> {
  const bodyText = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: okxHeaders(keys, 'POST', path, bodyText),
      body: bodyText,
    });
    if (!res.ok) return { error: mapHttpError(res.status) };
    return { data: await res.json() };
  } catch (e) {
    return { error: mapCatchError(e) };
  }
}

async function authedPostWithRateLimitRetry<T extends OkxEnvelope<OkxOrderAck[]>>(
  path: string,
  body: unknown,
  keys: APIKeys,
): Promise<ApiResult<T>> {
  for (let attempt = 0; attempt <= BATCH_RETRY_ATTEMPTS; attempt += 1) {
    const result = await authedPost<T>(path, body, keys);
    if (result.error) return result;
    const shouldRetry = result.data.code !== '0'
      && (result.data.data ?? []).length > 0
      && result.data.data.every(isRateLimitAck);
    if (!shouldRetry || attempt === BATCH_RETRY_ATTEMPTS) return result;
    await delay(BATCH_RETRY_DELAY_MS * (attempt + 1));
  }
  return authedPost<T>(path, body, keys);
}

function isRateLimitAck(ack: OkxOrderAck): boolean {
  return /rate limit|satsgrensen|too many|requests/i.test(`${ack.sCode} ${ack.sMsg}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
