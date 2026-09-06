import { readJson } from "../services/request";
import { hmacSHA256Hex } from "../services/signing";

import type { APIKeys } from "../types/common";

import type { ApiError } from "../services/errorHelper";

const BASE = "https://api.bybit.com";

const RECV_WINDOW = 5000;

type ApiResult<T> =
  { data: T; error?: never } | { data?: never; error: ApiError };

export type BybitCategory = "spot" | "linear";

export type BybitAccountType = "UNIFIED" | "CONTRACT" | "SPOT";

async function get<T>(
  url: string,
  headers: Record<string, string>,
): Promise<ApiResult<T>> {
  return readJson<T>(url, headers);
}

function bybitHeaders(
  keys: APIKeys,
  payload: string,
  contentType = false,
): Record<string, string> {
  const ts = Date.now();
  const sig = hmacSHA256Hex(
    `${ts}${keys.apiKey}${RECV_WINDOW}${payload}`,
    keys.secretKey,
  );
  return {
    "X-BAPI-SIGN": sig,
    "X-BAPI-API-KEY": keys.apiKey,
    "X-BAPI-TIMESTAMP": `${ts}`,
    "X-BAPI-RECV-WINDOW": `${RECV_WINDOW}`,
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  };
}

async function publicGet<T>(pathWithQuery: string): Promise<ApiResult<T>> {
  return get<T>(`${BASE}${pathWithQuery}`, {});
}

async function authedGet<T>(
  pathWithQuery: string,
  keys: APIKeys,
): Promise<ApiResult<T>> {
  const [, query = ""] = pathWithQuery.split("?");
  return get<T>(`${BASE}${pathWithQuery}`, bybitHeaders(keys, query));
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
  retMsg?: string;
  result: {
    list: {
      accountType: string;
      totalEquity: string;
      totalAvailableBalance?: string;
      totalWalletBalance?: string;
      coin: {
        coin: string;
        equity: string;
        usdValue: string;
        walletBalance?: string;
        availableToWithdraw?: string;
        availableToBorrow?: string;
        locked?: string;
        borrowAmount?: string;
        spotBorrow?: string;
        totalOrderIM?: string;
        totalPositionIM?: string;
        bonus?: string;
      }[];
    }[];
  };
}

export interface BybitApiKeyInfoResponse {
  retCode: number;
  retMsg: string;
  result: {
    uta: number;
    readOnly: number;
  };
}

export interface BybitAccountInfoResponse {
  marginMode: "ISOLATED_MARGIN" | "REGULAR_MARGIN" | "PORTFOLIO_MARGIN";
  unifiedMarginStatus: number;
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
      totalPnl?: string;
      claimableYield?: string;
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

export async function fetchWallet(
  keys: APIKeys,
  accountType?: BybitAccountType,
): Promise<ApiResult<BybitWalletResponse>> {
  if (accountType) return fetchWalletByAccountType(keys, accountType);

  const info = await fetchBybitApiKeyInfo(keys);
  if (info.data?.retCode === 0 && info.data.result.uta === 0) {
    const [contract, spot] = await Promise.all([
      fetchWalletByAccountType(keys, "CONTRACT"),
      fetchWalletByAccountType(keys, "SPOT"),
    ]);
    const successful = [contract, spot].filter(
      (result): result is { data: BybitWalletResponse; error?: never } =>
        Boolean(result.data?.retCode === 0),
    );
    if (successful.length === 2) {
      return {
        data: {
          retCode: 0,
          retMsg: "OK",
          result: {
            list: successful.flatMap((result) => result.data.result.list ?? []),
          },
        },
      };
    }
    if (contract.error) return { error: contract.error };
    if (spot.error) return { error: spot.error };
    return { error: { code: "decodingError" } };
  }

  return fetchWalletByAccountType(keys, "UNIFIED");
}

export async function fetchBybitApiKeyInfo(
  keys: APIKeys,
): Promise<ApiResult<BybitApiKeyInfoResponse>> {
  return authedGet<BybitApiKeyInfoResponse>("/v5/user/query-api", keys);
}

export async function fetchBybitAccountInfo(
  keys: APIKeys,
): Promise<ApiResult<BybitEnvelope<BybitAccountInfoResponse>>> {
  return authedGet<BybitEnvelope<BybitAccountInfoResponse>>(
    "/v5/account/info",
    keys,
  );
}

export async function fetchPositions(
  keys: APIKeys,
  category: string,
  settleCoin?: string,
): Promise<
  | { data: BybitPositionResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  const parts = [`category=${category}`];
  if (settleCoin) parts.push(`settleCoin=${settleCoin}`);
  const qs = parts.join("&");
  return authedGet<BybitPositionResponse>(`/v5/position/list?${qs}`, keys);
}

export async function fetchExecutions(
  keys: APIKeys,
  category: string,
  symbol: string,
): Promise<
  | { data: BybitExecutionResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  const qs = `category=${category}&symbol=${symbol}`;
  return authedGet<BybitExecutionResponse>(`/v5/execution/list?${qs}`, keys);
}

export async function fetchEarnPositions(
  keys: APIKeys,
  category: string,
): Promise<
  | { data: BybitEarnPositionResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  const qs = `category=${category}`;
  return authedGet<BybitEarnPositionResponse>(`/v5/earn/position?${qs}`, keys);
}

export async function fetchAllCoinsBalance(
  keys: APIKeys,
  accountType: string,
): Promise<
  | { data: BybitAllCoinsBalanceResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  const qs = `accountType=${accountType}`;
  return authedGet<BybitAllCoinsBalanceResponse>(
    `/v5/asset/transfer/query-account-coins-balance?${qs}`,
    keys,
  );
}

export async function fetchBybitTicker(
  category: BybitCategory,
  symbol: string,
): Promise<ApiResult<BybitEnvelope<BybitTickerResponse>>> {
  const params = new URLSearchParams({ category, symbol });
  return publicGet<BybitEnvelope<BybitTickerResponse>>(
    `/v5/market/tickers?${params.toString()}`,
  );
}

function fetchWalletByAccountType(
  keys: APIKeys,
  accountType: BybitAccountType,
): Promise<ApiResult<BybitWalletResponse>> {
  const params = new URLSearchParams({ accountType });
  return authedGet<BybitWalletResponse>(
    `/v5/account/wallet-balance?${params.toString()}`,
    keys,
  );
}
