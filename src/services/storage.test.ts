import { describe, expect, it } from "vitest";
import { storage } from "../test/setup";
import {
  deleteAccount,
  getAllAccounts,
  loadKeys,
  saveAccount,
} from "./secureStore";
import { readPrivate, writePrivate } from "./encryptedStorage";
import {
  addSnapshot,
  getSnapshots,
  removeAccountHistory,
} from "./balanceHistory";
import { loadArchivedPlans } from "./legacyPlans";

const keys = {
  apiKey: "test-key",
  secretKey: "test-secret",
  passphrase: "test-passphrase",
};
describe("protected storage and migration", () => {
  it("separates credentials and encrypts account metadata and financial history", async () => {
    const account = await saveAccount(keys, "okx", " Private account ");
    await addSnapshot({ type: "account", accountId: account.id }, 123.456);
    expect((await getAllAccounts())[0].label).toBe("Private account");
    expect(await loadKeys(account)).toEqual(keys);
    const raw = Array.from(storage.data.values()).join(" ");
    expect(raw).not.toContain("Private account");
    expect(raw).not.toContain("123.456");
    expect(raw).not.toContain("test-secret");
  });
  it("D-05: serializes concurrent saves without losing either account", async () => {
    await Promise.all([saveAccount(keys, "binance"), saveAccount(keys, "okx")]);
    expect(await getAllAccounts()).toHaveLength(2);
  });
  it("S-02: failed key deletion remains visible and can be retried", async () => {
    const account = await saveAccount(keys, "okx");
    storage.rejectDelete = true;
    await expect(deleteAccount(account)).rejects.toThrow("deletionPending");
    expect((await getAllAccounts())[0].state).toBe("deletionPending");
    expect(storage.secrets.has(`account_${account.id}_apiKey`)).toBe(true);
    storage.rejectDelete = false;
    await deleteAccount(account);
    expect(await getAllAccounts()).toEqual([]);
    expect(await loadKeys(account)).toBeNull();
  });
  it("preserves a recoverable record when secret setup fails", async () => {
    storage.rejectSecretWrite = true;
    await expect(saveAccount(keys, "binance")).rejects.toThrow();
    const account = (await getAllAccounts())[0];
    expect(account.state).toBe("setupPending");
    storage.rejectSecretWrite = false;
    await deleteAccount(account);
    expect(await getAllAccounts()).toEqual([]);
  });
  it("does not fall back to plaintext when secure storage is unavailable", async () => {
    storage.available = false;
    await expect(saveAccount(keys, "binance")).rejects.toThrow(
      "secureStorageUnavailable",
    );
    expect(storage.data.size).toBe(0);
  });
  it("migrates plaintext history, including true zeros and negative equity", async () => {
    storage.data.set(
      "aircapital.balanceSnapshots.v1",
      JSON.stringify([
        {
          id: "old",
          scope: { type: "total" },
          timestamp: "2026-01-01T00:00:00Z",
          balanceUSDT: 100,
        },
      ]),
    );
    await addSnapshot({ type: "total" }, 0);
    const history = await getSnapshots({ type: "total" });
    expect(history.map((s) => s.balanceUSDT)).toEqual([100, 0]);
    expect(history[0].calculationVersion).toBeUndefined();
    await addSnapshot({ type: "account", accountId: "negative" }, -10);
    expect(
      (await getSnapshots({ type: "account", accountId: "negative" }))[0]
        .balanceUSDT,
    ).toBe(-10);
    expect(storage.data.get("aircapital.balanceSnapshots.v1")).not.toContain(
      "balanceUSDT",
    );
  });
  it("rejects ciphertext tampering without resetting or overwriting the data", async () => {
    await writePrivate("private", { balance: 100 });
    const box = JSON.parse(storage.data.get("private")!);
    box.ciphertext =
      (box.ciphertext[0] === "0" ? "1" : "0") + box.ciphertext.slice(1);
    const corrupted = JSON.stringify(box);
    storage.data.set("private", corrupted);
    await expect(readPrivate("private", {})).rejects.toThrow();
    expect(storage.data.get("private")).toBe(corrupted);
  });
  it("does not generate a replacement key when encrypted data loses its key", async () => {
    await writePrivate("private", { balance: 100 });
    storage.secrets.clear();
    await expect(readPrivate("private", {})).rejects.toThrow(
      "encryptionKeyMissing",
    );
    expect(storage.secrets.size).toBe(0);
  });
  it("archives existing orders and plan data without making an exchange request", async () => {
    const original = {
      id: "plan",
      exchange: "okx",
      draft: { instId: "BTC-USDT", totalQuote: 123 },
      exchangeOrderIds: ["existing-order"],
    };
    storage.data.set(
      "aircapital.trading.gridPlans.v2",
      JSON.stringify([original]),
    );
    const plans = await loadArchivedPlans();
    expect(plans[0].orderIds).toEqual(["existing-order"]);
    expect(plans[0].legacy).toEqual(original);
    expect(await loadArchivedPlans()).toEqual(plans);
    expect(storage.data.has("aircapital.trading.gridPlans.v2")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("removes related aggregate history while retaining unrelated account snapshots", async () => {
    await addSnapshot({ type: "total" }, 100);
    await addSnapshot({ type: "account", accountId: "a" }, 40);
    await addSnapshot({ type: "account", accountId: "b" }, 60);
    await removeAccountHistory("a");
    expect(await getSnapshots({ type: "total" })).toEqual([]);
    expect(await getSnapshots({ type: "account", accountId: "a" })).toEqual([]);
    expect(
      await getSnapshots({ type: "account", accountId: "b" }),
    ).toHaveLength(1);
  });
});
