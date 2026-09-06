import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Bybit from "../api/bybit";
import * as OKX from "../api/okx";
import * as Gate from "../api/gateio";
import * as BingX from "../api/bingx";
import * as Observations from "./observations";
import { saveAccount } from "./secureStore";
import { getSnapshots } from "./balanceHistory";
import { usePortfolioStore } from "../store/portfolioStore";
import { connectionStatus } from "../domain/connectionStatus";
const keys = {
  apiKey: "test-key",
  secretKey: "test-secret",
  passphrase: "test-pass",
};
beforeEach(() => {
  usePortfolioStore.setState(usePortfolioStore.getInitialState(), true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T10:00:00Z"));
});
function healthyBybit() {
  vi.spyOn(Observations, "usdToUSDT").mockResolvedValue(1);
  vi.spyOn(Bybit, "fetchBybitApiKeyInfo").mockResolvedValue({
    data: { retCode: 0, retMsg: "OK", result: { readOnly: 1, uta: 1 } },
  });
  const wallet = vi.spyOn(Bybit, "fetchWallet").mockResolvedValue({
    data: {
      retCode: 0,
      result: {
        list: [{ accountType: "UNIFIED", totalEquity: "100", coin: [] }],
      },
    },
  });
  vi.spyOn(Bybit, "fetchAllCoinsBalance").mockResolvedValue({
    data: { retCode: 0, result: { balance: [] } },
  });
  const earn = vi
    .spyOn(Bybit, "fetchEarnPositions")
    .mockImplementation(async (_keys, category) => ({
      data: {
        retCode: 0,
        result: {
          list:
            category === "FlexibleSaving"
              ? [{ coin: "USDT", amount: "10" }]
              : [],
        },
      },
    }));
  return { wallet, earn };
}
describe("deposit monitoring regression coverage", () => {
  it("preserves readable wallets when only optional Earn permissions are missing", async () => {
    const api = healthyBybit();
    api.earn.mockResolvedValue({
      data: { retCode: 10005, result: {} },
    } as never);
    const result = await Observations.observeAccount(
      { id: "bybit", exchange: "bybit", createdAt: "2026-09-06" },
      keys,
      1,
    );
    expect(result).toMatchObject({ balanceUSDT: 100, complete: false });
    expect(result.issues).toContain("apiPermissionDenied");
  });
  it("shows expired keys as an actionable connection issue and preserves saved history", async () => {
    const account = await saveAccount(keys, "bybit");
    const api = healthyBybit();
    await usePortfolioStore.getState().loadData();
    api.wallet.mockClear();
    vi.mocked(Bybit.fetchBybitApiKeyInfo).mockResolvedValue({
      data: { retCode: 33004, result: {} },
    } as never);
    vi.setSystemTime(new Date("2026-09-06T11:00:00Z"));
    await usePortfolioStore.getState().loadData();
    const state = usePortfolioStore.getState();
    expect(state.sync[account.id]).toMatchObject({
      status: "stale",
      error: "credentialsExpired",
      lastSuccessAt: "2026-09-06T10:00:00.000Z",
    });
    expect(connectionStatus(account, state.sync[account.id])).toBe(
      "connectionRequired",
    );
    expect(state.observations[account.id].balanceUSDT).toBe(110);
    expect(await getSnapshots({ type: "total" })).toHaveLength(1);
    expect(api.wallet).not.toHaveBeenCalled();
    healthyBybit();
    await usePortfolioStore.getState().loadData();
    expect(
      connectionStatus(account, usePortfolioStore.getState().sync[account.id]),
    ).toBe("fresh");
  });
  it("does not blame permissions when key metadata is missing", async () => {
    healthyBybit();
    vi.mocked(Bybit.fetchBybitApiKeyInfo).mockResolvedValue({
      data: { retCode: 0, result: {} },
    } as never);
    await expect(Observations.verifyReadOnly("bybit", keys)).rejects.toThrow(
      "invalidResponse",
    );
  });
  it("does not swallow a revoked key as an empty optional wallet", async () => {
    vi.spyOn(BingX, "fetchSpotWallet").mockResolvedValue({
      data: { code: 100401 },
    } as never);
    await expect(
      Observations.observeAccount(
        { id: "bingx", exchange: "bingx", createdAt: "2026-09-06" },
        keys,
      ),
    ).rejects.toThrow("credentialsRejected");
  });
  it("D-01: repeated Bybit Earn refresh is idempotent and closed positions disappear", async () => {
    const account = await saveAccount(keys, "bybit"),
      api = healthyBybit();
    await usePortfolioStore.getState().loadData();
    await usePortfolioStore.getState().loadData();
    expect(
      usePortfolioStore.getState().observations[account.id].issues,
    ).toContain("coverageBybit");
    expect(usePortfolioStore.getState().getAccountBalance(account)).toBe(110);
    api.earn.mockResolvedValue({ data: { retCode: 0, result: { list: [] } } });
    await usePortfolioStore.getState().loadData();
    expect(usePortfolioStore.getState().getAccountBalance(account)).toBe(100);
  });
  it("D-02: failed refresh preserves last success and cannot append a fresh snapshot", async () => {
    const account = await saveAccount(keys, "bybit"),
      api = healthyBybit();
    await usePortfolioStore.getState().loadData();
    vi.setSystemTime(new Date("2026-09-06T11:00:00Z"));
    api.wallet.mockResolvedValue({ error: { code: "tooManyRequests" } });
    await usePortfolioStore.getState().loadData();
    const state = usePortfolioStore.getState(),
      snapshots = await getSnapshots({ type: "total" });
    expect(state.getAccountBalance(account)).toBe(110);
    expect(state.sync[account.id].status).toBe("stale");
    expect(state.sync[account.id].lastSuccessAt).toBe(
      "2026-09-06T10:00:00.000Z",
    );
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].timestamp).toBe("2026-09-06T10:00:00.000Z");
  });
  it("D-03: a confirmed full withdrawal records zero in the chart history", async () => {
    await saveAccount(keys, "bybit");
    const api = healthyBybit();
    await usePortfolioStore.getState().loadData();
    vi.setSystemTime(new Date("2026-09-06T11:00:00Z"));
    api.wallet.mockResolvedValue({
      data: {
        retCode: 0,
        result: {
          list: [{ accountType: "UNIFIED", totalEquity: "0", coin: [] }],
        },
      },
    });
    api.earn.mockResolvedValue({ data: { retCode: 0, result: { list: [] } } });
    await usePortfolioStore.getState().loadData();
    expect(
      (await getSnapshots({ type: "total" })).map((s) => s.balanceUSDT),
    ).toEqual([110, 0]);
  });
  it("D-04: HTTP-200 business errors cannot leave loading stuck", async () => {
    const account = await saveAccount(keys, "bybit"),
      api = healthyBybit();
    api.wallet.mockResolvedValue({
      data: { retCode: 10003, result: {} },
    } as never);
    await expect(
      usePortfolioStore.getState().loadData(),
    ).resolves.toBeUndefined();
    expect(usePortfolioStore.getState().isLoading).toBe(false);
    expect(usePortfolioStore.getState().sync[account.id].status).toBe("error");
    expect(await getSnapshots({ type: "total" })).toEqual([]);
  });
  it("D-06: non-USDT OKX Funding is valued instead of becoming zero", async () => {
    const account = await saveAccount(keys, "okx");
    vi.spyOn(Observations, "usdToUSDT").mockResolvedValue(1);
    vi.spyOn(OKX, "fetchConfiguration").mockResolvedValue({
      data: { code: "0", data: [{ perm: "read_only" }] },
    });
    vi.spyOn(OKX, "fetchAccountBalance").mockResolvedValue({
      data: { code: "0", data: [{ totalEq: "0", details: [] }] },
    });
    vi.spyOn(OKX, "fetchFundingBalance").mockResolvedValue({
      data: {
        code: "0",
        data: [{ ccy: "BTC", bal: "1", availBal: "1", frozenBal: "0" }],
      },
    });
    vi.spyOn(OKX, "fetchTicker").mockResolvedValue({
      data: { code: "0", data: [{ last: "60000" }] },
    });
    await usePortfolioStore.getState().loadData();
    expect(usePortfolioStore.getState().getAccountBalance(account)).toBe(60000);
  });
  it("prices USDC and negative futures equity without assuming stablecoin parity", async () => {
    vi.spyOn(BingX, "fetchSpotWallet").mockResolvedValue({
      data: {
        code: 0,
        data: { balances: [{ asset: "USDC", free: "100", locked: "0" }] },
      },
    });
    vi.spyOn(BingX, "fetchSpotTicker").mockResolvedValue({
      data: { code: 0, data: [{ symbol: "USDC-USDT", price: "0.98" }] },
    });
    vi.spyOn(BingX, "fetchFuturesWallet").mockResolvedValue({
      data: { code: 0, data: [{ asset: "USDT", balance: "0", equity: "-3" }] },
    });
    const result = await Observations.observeAccount(
      { id: "bingx", exchange: "bingx", createdAt: new Date().toISOString() },
      keys,
    );
    expect(result.balanceUSDT).toBe(95);
  });
  it("does not silently convert USD equity at parity when its rate is unavailable", async () => {
    healthyBybit();
    const result = await Observations.observeAccount(
      { id: "bybit", exchange: "bybit", createdAt: new Date().toISOString() },
      keys,
      undefined,
    );
    expect(result.complete).toBe(false);
    expect(result.wallets[0].balanceUSDT).toBeUndefined();
    expect(result.issues.some((x) => x.startsWith("unpriced:"))).toBe(true);
  });
  it("deduplicates concurrent refreshes and never reads extra classic wallets on top of equity", async () => {
    await saveAccount(keys, "bybit");
    const api = healthyBybit();
    await Promise.all([
      usePortfolioStore.getState().loadData(),
      usePortfolioStore.getState().loadData(),
    ]);
    expect(api.wallet).toHaveBeenCalledTimes(1);
    expect(Bybit.fetchAllCoinsBalance).toHaveBeenCalledTimes(1);
    expect(Bybit.fetchAllCoinsBalance).toHaveBeenCalledWith(
      expect.anything(),
      "FUND",
    );
  });
  it("rejects trading-enabled keys before reading account balances", async () => {
    await saveAccount(keys, "bybit");
    const api = healthyBybit();
    vi.mocked(Bybit.fetchBybitApiKeyInfo).mockResolvedValue({
      data: { retCode: 0, retMsg: "OK", result: { readOnly: 0, uta: 1 } },
    });
    await usePortfolioStore.getState().loadData();
    expect(api.wallet).not.toHaveBeenCalled();
    expect(Object.values(usePortfolioStore.getState().accountFailures)).toEqual(
      ["readOnlyRequired"],
    );
  });
});

describe("additional source consistency", () => {
  it("does not call a partial observation a last successful update after restart", async () => {
    const account = await saveAccount(keys, "bybit"),
      api = healthyBybit();
    await usePortfolioStore.getState().loadData();
    vi.setSystemTime(new Date("2026-09-06T11:00:00Z"));
    api.earn.mockResolvedValue({ error: { code: "tooManyRequests" } });
    await usePortfolioStore.getState().loadData();
    expect(usePortfolioStore.getState().sync[account.id].lastSuccessAt).toBe(
      "2026-09-06T10:00:00.000Z",
    );
    usePortfolioStore.setState(usePortfolioStore.getInitialState(), true);
    vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
    api.wallet.mockResolvedValue({ error: { code: "tooManyRequests" } });
    await usePortfolioStore.getState().loadData();
    expect(usePortfolioStore.getState().sync[account.id].lastSuccessAt).toBe(
      "2026-09-06T10:00:00.000Z",
    );
    expect(await getSnapshots({ type: "total" })).toHaveLength(1);
  });
  it("accepts an explicitly reported empty Gate balance", async () => {
    vi.spyOn(Gate, "fetchTotalBalance").mockResolvedValue({
      data: { total: { currency: "USDT", amount: "0" }, details: {} },
    });
    const result = await Observations.observeAccount(
      { id: "gate", exchange: "gateio", createdAt: new Date().toISOString() },
      keys,
    );
    expect(result.balanceUSDT).toBe(0);
    expect(result.complete).toBe(true);
  });
  it("includes accrued Earn yield without retaining previous positions", async () => {
    const api = healthyBybit();
    api.earn.mockImplementation(async (_keys, category) => ({
      data: {
        retCode: 0,
        result: {
          list:
            category === "FlexibleSaving"
              ? [{ coin: "USDT", amount: "10", claimableYield: "0.25" }]
              : [],
        },
      },
    }));
    const result = await Observations.observeAccount(
      { id: "bybit", exchange: "bybit", createdAt: new Date().toISOString() },
      keys,
      1,
    );
    expect(result.balanceUSDT).toBe(110.25);
  });
  it("keeps pending Earn operations out of confirmed total history", async () => {
    const api = healthyBybit();
    api.earn.mockResolvedValue({
      data: {
        retCode: 0,
        result: {
          list: [{ coin: "USDT", amount: "10", status: "Processing" }],
        },
      },
    });
    const result = await Observations.observeAccount(
      { id: "bybit", exchange: "bybit", createdAt: new Date().toISOString() },
      keys,
      1,
    );
    expect(result.complete).toBe(false);
  });
});
