import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerInfo } from "react-native-purchases";
import { BILLING } from "./config";
import { accessFromCustomer, hasPro, MAX_OFFLINE_MS, monitoredAccountIds, UNKNOWN_ACCESS } from "./policy";
import { createBillingStore, useBillingStore } from "./store";
import type { BillingDriver } from "./driver";
import { getAllAccounts, saveAccount } from "../services/secureStore";
import { usePortfolioStore } from "../store/portfolioStore";
import * as observations from "../services/observations";
import { importBackup, readBackup, serializeBackup } from "../services/backup";
import { writePrivate } from "../services/encryptedStorage";
import { DATA_KEYS } from "../services/storageKeys";
const now = Date.parse("2026-09-08T10:00:00Z");
function customer(active = true): CustomerInfo {
  const entitlement = { identifier: BILLING.entitlement, isActive: true, verification: "VERIFIED",
    store: "APP_STORE", productIdentifier: BILLING.ios.monthly, expirationDate: new Date(now + 86400000).toISOString(), willRenew: true };
  return { requestDate: new Date(now).toISOString(), entitlements: {
    verification: "VERIFIED", all: { [BILLING.entitlement]: entitlement },
    active: active ? { [BILLING.entitlement]: entitlement } : {},
  }, subscriptionsByProductIdentifier: {} } as unknown as CustomerInfo;
}
function driver(): BillingDriver {
  return { available: true, initialize: vi.fn(async () => {}),
    customer: vi.fn(async () => accessFromCustomer(customer(false))), offers: vi.fn(async () => []),
    purchase: vi.fn(async () => ({ access: accessFromCustomer(customer()) })),
    restore: vi.fn(async () => ({ access: accessFromCustomer(customer()) })), manage: vi.fn(async () => {}),
  };
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(now);
  useBillingStore.setState({ enabled: false, ready: true, access: UNKNOWN_ACCESS });
  usePortfolioStore.setState(usePortfolioStore.getInitialState(), true);
});
describe("verified subscription policy", () => {
  it.each(["FAILED", "NOT_REQUESTED"])("rejects %s verification even if active is true", (verification) => {
    const info = customer();
    (info.entitlements as { verification: string }).verification = verification;
    expect(accessFromCustomer(info)).toEqual(UNKNOWN_ACCESS);
  });
  it("keeps cancellation access through the paid period; rejects a revoked entitlement", () => {
    const info = customer();
    (info.entitlements.active[BILLING.entitlement] as { willRenew: boolean }).willRenew = false;
    const access = accessFromCustomer(info);
    expect(access.renewal).toBe("ending"); expect(hasPro(access)).toBe(true);
    expect(hasPro(access, now + 86400000)).toBe(false);
    expect(accessFromCustomer(customer(false)).tier).toBe("free");
  });
  it("honours a store-confirmed grace period but never invents one", () => {
    const info = customer();
    const entitlement = info.entitlements.active[BILLING.entitlement];
    Object.assign(entitlement, { expirationDate: new Date(now - 1000).toISOString(), billingIssueDetectedAt: new Date(now - 2000).toISOString() });
    expect(accessFromCustomer(info).tier).toBe("unknown");
    (info.subscriptionsByProductIdentifier as Record<string, unknown>)[BILLING.ios.monthly] = { gracePeriodExpiresDate: new Date(now + 3600000).toISOString() };
    expect(accessFromCustomer(info)).toMatchObject({ tier: "pro", renewal: "billingIssue" });
  });
  it("expires stale cache and rejects clock rollback or unrelated products", () => {
    expect(accessFromCustomer(customer(), now + MAX_OFFLINE_MS).tier).toBe("unknown");
    expect(accessFromCustomer(customer(), now - 600000).tier).toBe("unknown");
    const info = customer(); Object.assign(info.entitlements.active[BILLING.entitlement], { productIdentifier: "unrelated" });
    expect(accessFromCustomer(info).tier).toBe("unknown");
  });
  it("never accepts test-store or promotional grants as production subscriptions", () => {
    for (const store of ["TEST_STORE", "PROMOTIONAL", "UNKNOWN_STORE"]) {
      const info = customer(); Object.assign(info.entitlements.active[BILLING.entitlement], { store });
      expect(accessFromCustomer(info).tier).toBe("unknown");
    }
  });
});
describe("purchase coordination", () => {
  it("never initializes billing or purchases when the launch switch is off", async () => {
    const d = driver(), store = createBillingStore(d, false);
    await store.getState().loadOffers();
    await store.getState().purchase("annual");
    await store.getState().restore();
    expect(d.initialize).not.toHaveBeenCalled();
    expect(d.purchase).not.toHaveBeenCalled();
    expect(d.restore).not.toHaveBeenCalled();
  });
  it("shows a recoverable error when verification fails", async () => {
    const d = driver(); vi.mocked(d.customer).mockResolvedValue(UNKNOWN_ACCESS);
    const store = createBillingStore(d, true);
    await store.getState().refresh();
    expect(store.getState().error).toBe("billingUnavailable");
    await store.getState().purchase("annual");
    expect(d.purchase).not.toHaveBeenCalled();
  });
  it.each(["cancelled", "pending"] as const)("does not unlock a %s purchase", async (status) => {
    const d = driver(); vi.mocked(d.purchase).mockResolvedValue({ access: UNKNOWN_ACCESS, status });
    const store = createBillingStore(d, true);
    await store.getState().purchase("monthly");
    expect(hasPro(store.getState().access)).toBe(false);
    expect(store.getState().busy).toBe(false);
  });
  it("deduplicates repeated taps and restores purchases without local flags", async () => {
    const d = driver(), store = createBillingStore(d, true);
    await Promise.all([store.getState().purchase("monthly"), store.getState().purchase("monthly")]);
    expect(d.purchase).toHaveBeenCalledTimes(1); expect(hasPro(store.getState().access)).toBe(true);
    await store.getState().restore(); expect(d.restore).toHaveBeenCalledOnce();
  });
  it("does not send a subscriber through a second purchase flow", async () => {
    const d = driver(); vi.mocked(d.customer).mockResolvedValue(accessFromCustomer(customer()));
    const store = createBillingStore(d, true); await store.getState().purchase("annual");
    expect(d.purchase).not.toHaveBeenCalled(); expect(d.manage).toHaveBeenCalledOnce();
  });
  it("does not convert network failure into permission to buy again", async () => {
    const d = driver(); vi.mocked(d.customer).mockRejectedValue(new Error("offline"));
    const store = createBillingStore(d, true); await store.getState().purchase("annual");
    expect(d.purchase).not.toHaveBeenCalled(); expect(store.getState().busy).toBe(false);
  });
  it("keeps verified offline access bounded, and revocation overrides it immediately", async () => {
    const d = driver(); let update: Parameters<BillingDriver["initialize"]>[0] = () => {};
    vi.mocked(d.initialize).mockImplementation(async (listener) => { update = listener; });
    vi.mocked(d.customer).mockResolvedValue(accessFromCustomer(customer()));
    const store = createBillingStore(d, true); await store.getState().refresh();
    vi.mocked(d.customer).mockRejectedValue(new Error("offline")); await store.getState().refresh();
    expect(hasPro(store.getState().access)).toBe(true);
    update(accessFromCustomer(customer(false))); expect(hasPro(store.getState().access)).toBe(false);
  });
  it("does not let an old refresh overwrite a newer listener update", async () => {
    const d = driver(); let update: Parameters<BillingDriver["initialize"]>[0] = () => {};
    vi.mocked(d.initialize).mockImplementation(async (listener) => { update = listener; });
    const store = createBillingStore(d, true); await store.getState().refresh();
    let resolve!: (value: ReturnType<typeof accessFromCustomer>) => void;
    vi.mocked(d.customer).mockReturnValue(new Promise((done) => { resolve = done; }));
    const work = store.getState().refresh(); await Promise.resolve();
    update(accessFromCustomer(customer())); resolve(accessFromCustomer(customer(false))); await work;
    expect(hasPro(store.getState().access)).toBe(true);
  });
});
describe("connection limits and preservation", () => {
  const keys = { apiKey: "test", secretKey: "test", passphrase: "test" };
  it("cannot exceed two connections through concurrent saves", async () => {
    useBillingStore.setState({ enabled: true, access: accessFromCustomer(customer(false)) });
    const results = await Promise.allSettled([saveAccount(keys, "binance"), saveAccount(keys, "binance"), saveAccount(keys, "binance")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(await getAllAccounts()).toHaveLength(2);
  });
  it("sanitizes selection and counts exchange accounts, not their wallets", async () => {
    const accounts = await Promise.all([saveAccount(keys, "binance"), saveAccount(keys, "binance"), saveAccount(keys, "bybit")]);
    expect([...monitoredAccountIds(accounts, false, ["missing", accounts[2].id, accounts[2].id])]).toHaveLength(2);
    expect([...monitoredAccountIds(accounts, true, [])]).toHaveLength(3);
  });
  it("keeps imported accounts and history but never restores Pro from a backup", async () => {
    const accounts = await Promise.all([saveAccount(keys, "binance"), saveAccount(keys, "bybit"), saveAccount(keys, "okx")]);
    const backup = await readBackup();
    await writePrivate(DATA_KEYS.accounts, []);
    useBillingStore.setState({ enabled: true, access: accessFromCustomer(customer(false)) });
    await importBackup(serializeBackup(backup));
    expect(await getAllAccounts()).toHaveLength(3);
    expect(hasPro(useBillingStore.getState().access)).toBe(false);
    expect(monitoredAccountIds(accounts, false, []).size).toBe(2);
  });
  it("preserves paused balances and does not query their exchange or write a false total", async () => {
    const accounts = await Promise.all([saveAccount(keys, "binance"), saveAccount(keys, "binance"), saveAccount(keys, "binance")]);
    const cached = Object.fromEntries(accounts.map((a) => [a.id, { accountId: a.id, observedAt: new Date(now - 1000).toISOString(), balanceUSDT: 100, wallets: [], issues: [], complete: true }]));
    await writePrivate(DATA_KEYS.cache, cached);
    useBillingStore.setState({ enabled: true, ready: true, access: accessFromCustomer(customer(false)) });
    vi.spyOn(observations, "verifyReadOnly").mockResolvedValue("verified");
    const observe = vi.spyOn(observations, "observeAccount").mockImplementation(async (account) => cached[account.id]);
    await usePortfolioStore.getState().loadData();
    expect(observe).toHaveBeenCalledTimes(2);
    expect(Object.values(usePortfolioStore.getState().sync).filter((s) => s.status === "paused")).toHaveLength(1);
    expect(usePortfolioStore.getState().getTotalBalance()).toBe(300);
    expect((await readBackup()).snapshots.filter((s) => s.scope.type === "total")).toHaveLength(0);
  });
});
