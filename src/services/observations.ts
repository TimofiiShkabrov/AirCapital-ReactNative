import * as Binance from "../api/binance";
import * as Bybit from "../api/bybit";
import * as BingX from "../api/bingx";
import * as Gate from "../api/gateio";
import * as OKX from "../api/okx";
import type { APIKeys, ExchangeAccount, Exchange } from "../types/common";
import type { AccountObservation, WalletBalance } from "../types/monitor";
import { numeric, sum, multiply } from "../domain/money";
import { readJson, mapLimit, type ApiResult } from "./request";

function unwrap<T>(result: ApiResult<T>): T {
  if (result.error) throw new Error(result.error.code);
  const value = result.data as T & { retCode?: number; code?: number | string };
  if (
    !value ||
    (value.retCode !== undefined && value.retCode !== 0) ||
    (value.code !== undefined && String(value.code) !== "0")
  )
    throw new Error("exchangeResponse");
  return value;
}
function array<T>(value: T[] | undefined): T[] {
  if (!Array.isArray(value)) throw new Error("invalidResponse");
  return value;
}
const validAsset = (asset: string) => /^[A-Z0-9]{1,24}$/.test(asset);

export async function usdToUSDT(): Promise<number | undefined> {
  try {
    const result = unwrap(
      await readJson<{
        data: { currency: string; rates: Record<string, string> };
      }>("https://api.coinbase.com/v2/exchange-rates?currency=USD"),
    );
    if (result.data.currency !== "USD") return undefined;
    const rate = numeric(result.data.rates.USDT);
    return rate > 0 ? rate : undefined;
  } catch {
    return undefined;
  }
}

export async function verifyReadOnly(
  exchange: Exchange,
  keys: APIKeys,
): Promise<"verified" | "declared"> {
  if (exchange === "bybit") {
    const info = unwrap(await Bybit.fetchBybitApiKeyInfo(keys));
    if (info.result?.readOnly !== 1) throw new Error("readOnlyRequired");
    return "verified";
  }
  if (exchange === "binance") {
    const info = unwrap(await Binance.fetchApiRestrictions(keys));
    if (
      info.enableReading !== true ||
      info.enableWithdrawals !== false ||
      info.enableSpotAndMarginTrading !== false ||
      info.enableFutures === true ||
      info.enableInternalTransfer === true ||
      info.permitsUniversalTransfer === true
    )
      throw new Error("readOnlyRequired");
    return "verified";
  }
  if (exchange === "okx") {
    const info = unwrap(await OKX.fetchConfiguration(keys));
    const permission = array(info.data)[0]?.perm;
    if (permission !== "read_only") throw new Error("readOnlyRequired");
    return "verified";
  }
  // These adapters do not yet expose permission introspection; the UI requires explicit declaration.
  return "declared";
}

export async function observeAccount(
  account: ExchangeAccount,
  keys: APIKeys,
  usdRate?: number,
): Promise<AccountObservation> {
  const wallets: WalletBalance[] = [];
  const issues: string[] = [];
  const priceCache = new Map<string, Promise<number | undefined>>();
  const price = (asset: string): Promise<number | undefined> => {
    if (asset === "USDT") return Promise.resolve(1);
    if (!validAsset(asset)) return Promise.resolve(undefined);
    if (!priceCache.has(asset))
      priceCache.set(
        asset,
        (async () => {
          try {
            let value: unknown;
            switch (account.exchange) {
              case "binance":
                value = unwrap(
                  await Binance.fetchPriceTicker(`${asset}USDT`),
                ).price;
                break;
              case "bybit":
                value = unwrap(
                  await Bybit.fetchBybitTicker("spot", `${asset}USDT`),
                ).result?.list?.[0]?.lastPrice;
                break;
              case "bingx":
                value = unwrap(await BingX.fetchSpotTicker(`${asset}-USDT`))
                  .data?.[0]?.price;
                break;
              case "okx":
                value = unwrap(await OKX.fetchTicker(`${asset}-USDT`)).data?.[0]
                  ?.last;
                break;
              case "gateio":
                value = unwrap(await Gate.fetchSpotTicker(`${asset}_USDT`))[0]
                  ?.last;
                break;
            }
            const parsed = numeric(value);
            return parsed > 0 ? parsed : undefined;
          } catch {
            return undefined;
          }
        })(),
      );
    return priceCache.get(asset)!;
  };
  const fromAssets = async (
    id: string,
    name: string,
    items: { asset: string; quantity: number }[],
  ): Promise<WalletBalance> => {
    const assets = await mapLimit(
      items.filter((a) => a.quantity !== 0),
      4,
      async (a) => {
        const rate = await price(a.asset);
        return {
          ...a,
          valueUSDT:
            rate === undefined ? undefined : multiply(a.quantity, rate),
        };
      },
    );
    const unpriced = assets.some((a) => a.valueUSDT === undefined);
    return {
      id,
      name,
      assets,
      balanceUSDT:
        assets.length === 0
          ? 0
          : assets.some((a) => a.valueUSDT !== undefined)
            ? sum(
                assets.flatMap((a) =>
                  a.valueUSDT === undefined ? [] : [a.valueUSDT],
                ),
              )
            : undefined,
      status: unpriced ? "unpriced" : "complete",
    };
  };
  const amountWallet = (
    id: string,
    name: string,
    amount: number,
    unit: "USD" | "USDT",
    assets: WalletBalance["assets"] = [],
  ): WalletBalance => ({
    id,
    name,
    assets,
    balanceUSDT:
      unit === "USD"
        ? usdRate === undefined
          ? undefined
          : multiply(amount, usdRate)
        : amount,
    status: unit === "USD" && usdRate === undefined ? "unpriced" : "complete",
  });
  const optional = async (
    id: string,
    name: string,
    fn: () => Promise<WalletBalance>,
  ) => {
    try {
      wallets.push(await fn());
    } catch {
      wallets.push({ id, name, assets: [], status: "unavailable" });
    }
  };

  switch (account.exchange) {
    case "binance": {
      const list = array(unwrap(await Binance.fetchWallets(keys)));
      const names = new Set<string>();
      for (const item of list) {
        if (typeof item.walletName !== "string" || names.has(item.walletName))
          throw new Error("invalidResponse");
        names.add(item.walletName);
        wallets.push(
          amountWallet(
            item.walletName,
            item.walletName,
            numeric(item.balance),
            "USDT",
          ),
        );
      }
      break;
    }
    case "bybit": {
      issues.push("coverageBybit");
      const response = unwrap(await Bybit.fetchWallet(keys));
      const list = array(response.result?.list);
      if (!list.length) throw new Error("invalidResponse");
      const seen = new Set<string>();
      for (const item of list) {
        if (seen.has(item.accountType)) throw new Error("invalidResponse");
        seen.add(item.accountType);
        const coins = array(item.coin);
        const totalUSD = item.totalEquity?.trim()
          ? numeric(item.totalEquity)
          : sum(coins.map((c) => numeric(c.usdValue)));
        const assets = coins.map((c) => ({
          asset: c.coin,
          quantity: numeric(c.equity),
          valueUSDT:
            usdRate === undefined
              ? undefined
              : multiply(numeric(c.usdValue), usdRate),
        }));
        wallets.push(
          amountWallet(
            item.accountType,
            item.accountType,
            totalUSD,
            "USD",
            assets,
          ),
        );
      }
      // Funding is separate. Never add SPOT/CONTRACT/OPTION via the transfer endpoint on top of equity.
      await optional("FUND", "Funding", async () => {
        const response = unwrap(await Bybit.fetchAllCoinsBalance(keys, "FUND"));
        return fromAssets(
          "FUND",
          "Funding",
          array(response.result?.balance).map((b) => ({
            asset: b.coin,
            quantity: numeric(b.walletBalance),
          })),
        );
      });
      for (const category of ["FlexibleSaving", "OnChain"]) {
        await optional(category, `Earn · ${category}`, async () => {
          const response = unwrap(
            await Bybit.fetchEarnPositions(keys, category),
          );
          if (
            array(response.result?.list).some((p) => p.status === "Processing")
          )
            throw new Error("pendingEarn");
          return fromAssets(
            category,
            `Earn · ${category}`,
            array(response.result?.list).map((p) => ({
              asset: p.coin,
              quantity: sum([
                numeric(p.amount),
                p.totalPnl?.trim() ? numeric(p.totalPnl) : 0,
                p.claimableYield?.trim() ? numeric(p.claimableYield) : 0,
              ]),
            })),
          );
        });
      }
      break;
    }
    case "bingx": {
      await optional("spot", "Spot", async () => {
        const response = unwrap(await BingX.fetchSpotWallet(keys));
        return fromAssets(
          "spot",
          "Spot",
          array(response.data?.balances).map((b) => ({
            asset: b.asset,
            quantity: sum([numeric(b.free), numeric(b.locked)]),
          })),
        );
      });
      await optional("futures", "Futures · equity", async () => {
        const response = unwrap(await BingX.fetchFuturesWallet(keys));
        return fromAssets(
          "futures",
          "Futures · equity",
          array(response.data).map((b) => ({
            asset: b.asset,
            quantity: numeric(b.equity),
          })),
        );
      });
      issues.push("coverageBingX");
      break;
    }
    case "gateio": {
      const response = unwrap(await Gate.fetchTotalBalance(keys));
      const currency = response.total?.currency;
      if (currency !== "USD" && currency !== "USDT")
        throw new Error("unsupportedQuote");
      if (!response.details || typeof response.details !== "object")
        throw new Error("invalidResponse");
      for (const [name, data] of Object.entries(response.details)) {
        if (data.currency !== "USDT" && data.currency !== "USD")
          throw new Error("unsupportedQuote");
        wallets.push(
          amountWallet(name, name, numeric(data.amount), data.currency),
        );
      }
      // API total is authoritative. Do not silently replace it with a partial details subtotal.
      const providerTotal = numeric(response.total.amount);
      if (Object.keys(response.details).length === 0 && providerTotal === 0)
        wallets.push(amountWallet("total", "Total", 0, currency));
      const detailsTotal = sum(
        Object.values(response.details).map((d) =>
          d.currency === currency ? numeric(d.amount) : NaN,
        ),
      );
      if (
        Math.abs(providerTotal - detailsTotal) >
        Math.max(0.01, Math.abs(providerTotal) * 0.000001)
      )
        throw new Error("inconsistentTotal");
      break;
    }
    case "okx": {
      await optional("trading", "Trading · equity", async () => {
        const response = unwrap(await OKX.fetchAccountBalance(keys));
        const data = array(response.data);
        if (!data.length) throw new Error("invalidResponse");
        return amountWallet(
          "trading",
          "Trading · equity",
          sum(data.map((d) => numeric(d.totalEq))),
          "USD",
          data.flatMap((d) =>
            array(d.details).map((a) => ({
              asset: a.ccy,
              quantity: numeric(a.eq),
              valueUSDT:
                usdRate === undefined
                  ? undefined
                  : multiply(numeric(a.eqUsd), usdRate),
            })),
          ),
        );
      });
      await optional("funding", "Funding", async () => {
        const response = unwrap(await OKX.fetchFundingBalance(keys));
        return fromAssets(
          "funding",
          "Funding",
          array(response.data).map((a) => ({
            asset: a.ccy,
            quantity: numeric(a.bal),
          })),
        );
      });
      issues.push("coverageOKX");
      break;
    }
  }
  if (!wallets.length) throw new Error("invalidResponse");
  for (const wallet of wallets)
    if (wallet.status !== "complete")
      issues.push(`${wallet.status}:${wallet.name}`);
  const values = wallets.flatMap((w) =>
    w.balanceUSDT === undefined ? [] : [w.balanceUSDT],
  );
  const complete = wallets.every((w) => w.status === "complete");
  return {
    accountId: account.id,
    observedAt: new Date().toISOString(),
    wallets,
    balanceUSDT: values.length ? sum(values) : undefined,
    complete,
    issues,
    valuationSource: ["okx", "bybit"].includes(account.exchange)
      ? "Exchange USD equity × Coinbase USD/USDT"
      : "Exchange USDT valuation",
  };
}
