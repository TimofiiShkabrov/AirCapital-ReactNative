import { readJson } from "../services/request";
import { hmacSHA256Base64 } from "../services/signing";
import type { APIKeys } from "../types/common";
import type { ApiError } from "../services/errorHelper";

const BASE = "https://www.okx.com";

function okxTimestamp(): string {
  return new Date().toISOString().replace(/(\.\d{3})Z$/, "$1Z");
}

function okxHeaders(
  keys: APIKeys,
  method: string,
  requestPath: string,
  queryAndBody: string,
): Record<string, string> {
  const timestamp = okxTimestamp();
  const signStr = `${timestamp}${method}${requestPath}${queryAndBody}`;
  const signature = hmacSHA256Base64(signStr, keys.secretKey);
  return {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": keys.apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-PASSPHRASE": keys.passphrase ?? "",
    "OK-ACCESS-TIMESTAMP": timestamp,
    "x-simulated-trading": "0",
  };
}

async function get<T>(
  path: string,
  query: string,
  keys: APIKeys,
): Promise<{ data: T; error?: never } | { data?: never; error: ApiError }> {
  const suffix = query ? `?${query}` : "";
  return readJson<T>(
    `${BASE}${path}${suffix}`,
    okxHeaders(keys, "GET", path, suffix),
  );
}

export interface OkxAccountBalance {
  code: string;
  data: {
    totalEq: string;
    details: {
      ccy: string;
      eq: string;
      eqUsd: string;
      availBal?: string;
      availEq?: string;
      cashBal?: string;
    }[];
  }[];
}

export interface OkxPositionResponse {
  code: string;
  data: {
    instId: string;
    pos: string;
    avgPx: string;
    markPx?: string;
    upl?: string;
    cTime?: string;
  }[];
}

export interface OkxFillResponse {
  code: string;
  data: {
    instId: string;
    side: string;
    fillPx?: string;
    fillSz?: string;
    fee?: string;
    feeCcy?: string;
    ts?: string;
    fillTime?: string;
  }[];
}

export interface OkxFundingBalanceResponse {
  code: string;
  data: { ccy: string; bal: string; availBal: string; frozenBal: string }[];
}

export async function fetchAccountBalance(
  keys: APIKeys,
): Promise<
  { data: OkxAccountBalance; error?: never } | { data?: never; error: ApiError }
> {
  return get<OkxAccountBalance>("/api/v5/account/balance", "", keys);
}

export async function fetchPositions(
  keys: APIKeys,
): Promise<
  | { data: OkxPositionResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  return get<OkxPositionResponse>("/api/v5/account/positions", "", keys);
}

export async function fetchFills(
  instId: string,
  keys: APIKeys,
): Promise<
  { data: OkxFillResponse; error?: never } | { data?: never; error: ApiError }
> {
  return get<OkxFillResponse>(
    "/api/v5/trade/fills",
    new URLSearchParams({ instType: "SPOT", instId }).toString(),
    keys,
  );
}

export async function fetchFundingBalance(
  keys: APIKeys,
): Promise<
  | { data: OkxFundingBalanceResponse; error?: never }
  | { data?: never; error: ApiError }
> {
  return get<OkxFundingBalanceResponse>("/api/v5/asset/balances", "", keys);
}

export function fetchTicker(instId: string) {
  return readJson<{ code: string; data: { last: string }[] }>(
    `${BASE}/api/v5/market/ticker?${new URLSearchParams({ instId })}`,
  );
}
export function fetchConfiguration(keys: APIKeys) {
  return get<{ code: string; data: { perm: string }[] }>(
    "/api/v5/account/config",
    "",
    keys,
  );
}
