import type { Exchange, ExchangeAccount } from "../types/common";
import type { AccountSync } from "../types/monitor";

export type ConnectionError =
  | "credentialsExpired"
  | "credentialsRejected"
  | "apiPermissionDenied"
  | "apiIpRestricted";

/** Only documented codes; never infer key expiry from free-form server messages. */
export function exchangeConnectionError(
  exchange: Exchange | undefined,
  body: unknown,
): ConnectionError | undefined {
  if (!body || typeof body !== "object") return;
  const value = body as { code?: unknown; retCode?: unknown; label?: unknown };
  const code = String(exchange === "bybit" ? value.retCode : value.code);
  // https://bybit-exchange.github.io/docs/v5/error
  if (exchange === "bybit") {
    if (["-2015", "33004"].includes(code)) return "credentialsExpired";
    if (["10003", "10004", "10007"].includes(code))
      return "credentialsRejected";
    if (code === "10005") return "apiPermissionDenied";
    if (code === "10010") return "apiIpRestricted";
  }
  // https://developers.binance.com/docs/binance-spot-api-docs/errors
  if (exchange === "binance" && ["-2014", "-2015", "-1022"].includes(code))
    return "credentialsRejected";
  // https://www.okx.com/help/api-faq
  if (exchange === "okx") {
    if (["50111", "50119"].includes(code)) return "credentialsRejected";
    if (code === "50110") return "apiIpRestricted";
  }
  // https://www.gate.com/docs/developers/apiv4/en/#error-handling
  if (exchange === "gateio") {
    if (
      ["INVALID_CREDENTIALS", "INVALID_KEY", "INVALID_SIGNATURE"].includes(
        String(value.label),
      )
    )
      return "credentialsRejected";
    if (value.label === "IP_FORBIDDEN") return "apiIpRestricted";
    if (value.label === "FORBIDDEN") return "apiPermissionDenied";
  }
  // https://github.com/BingX-API/BingX-Standard-Contract-doc
  if (exchange === "bingx" && code === "100401") return "credentialsRejected";
}

export function needsReconnect(error?: string): boolean {
  return [
    "credentialsExpired",
    "credentialsRejected",
    "apiPermissionDenied",
    "apiIpRestricted",
    "readOnlyRequired",
    "missingKeys",
  ].includes(error ?? "");
}

export function connectionError(
  account: ExchangeAccount,
  sync?: AccountSync,
): string | undefined {
  return sync?.status === "paused" ? "connectionPaused" : account.state === "needsKeys" ? "missingKeys" : sync?.error;
}

export function connectionStatus(
  account: ExchangeAccount,
  sync?: AccountSync,
): string {
  return needsReconnect(connectionError(account, sync))
    ? "connectionRequired"
    : (sync?.status ?? "error");
}
