import { describe, it, expect, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "../test/setup";
import { parseBackup, type Backup } from "../domain/backup";
import {
  importBackup,
  readBackup,
  serializeBackup,
  deleteAllData,
  resumeDeletion,
} from "./backup";
import {
  saveAccount,
  getAllAccounts,
  loadKeys,
  replaceAccountKeys,
} from "./secureStore";
import { writePrivate } from "./encryptedStorage";
import { DATA_KEYS, DELETE_PENDING, IMPORT_PENDING } from "./storageKeys";
import { loadAllSnapshots, addSnapshot } from "./balanceHistory";
import { loadFlows, saveFlow } from "./cashFlows";
import {
  clearPortfolioMemory,
  pauseMonitoring,
  usePortfolioStore,
} from "../store/portfolioStore";
vi.mock("./privateFiles", () => ({
  removePrivateFiles: vi.fn(async () => {}),
}));
const time = "2026-01-01T00:00:00.000Z";
const fixture = (): Backup => ({
  version: 2,
  exportedAt: time,
  quoteCurrency: "USDT",
  accounts: [{ id: "restored", exchange: "binance", createdAt: time }],
  snapshots: [
    {
      id: "s",
      scope: { type: "account", accountId: "restored" },
      timestamp: time,
      balanceUSDT: 0,
      calculationVersion: 2,
      members: ["restored"],
    },
  ],
  flows: {
    flows: [
      {
        id: "f",
        accountId: "restored",
        occurredAt: time,
        amountUSDT: 12,
        type: "deposit",
        source: "manual",
      },
    ],
    coverage: [],
  },
  archive: [],
});
describe("portable backups", () => {
  it("imports old v1 and new backups without keys; repeat import is idempotent", async () => {
    const b = fixture();
    b.version = 1;
    await importBackup(JSON.stringify(b));
    await importBackup(JSON.stringify(b));
    expect((await getAllAccounts())[0].state).toBe("needsKeys");
    expect(await loadKeys((await getAllAccounts())[0])).toBeNull();
    expect(await loadAllSnapshots()).toHaveLength(1);
    expect((await loadFlows()).flows).toHaveLength(1);
    expect(storage.data.get(DATA_KEYS.snapshots)).not.toContain("balanceUSDT");
  });
  it("rejects conflicting history before modifying any collection", async () => {
    await importBackup(JSON.stringify(fixture()));
    const before = new Map(storage.data),
      b = fixture();
    b.snapshots[0].balanceUSDT = 99;
    await expect(importBackup(JSON.stringify(b))).rejects.toThrow(
      "backupConflict",
    );
    expect(storage.data).toEqual(before);
  });
  it("rejects foreign account references, secrets, invalid units, huge amounts and unknown versions", () => {
    const changes = [
      (b: any) => (b.snapshots[0].scope.accountId = "foreign"),
      (b: any) => (b.accounts[0].secretKey = "secret"),
      (b: any) => (b.quoteCurrency = "USD"),
      (b: any) => (b.flows.flows[0].amountUSDT = 1e21),
      (b: any) => (b.version = 900),
      (b: any) => (b.accounts[0].id = "__proto__"),
      (b: any) => (b.snapshots[0].members = ["restored", "restored"]),
    ];
    for (const change of changes) {
      const b = fixture();
      change(b);
      expect(() => parseBackup(JSON.stringify(b))).toThrow();
    }
  });
  it("preserves current account keys and requires renewed flow coverage when adding data", async () => {
    const account = await saveAccount(
      { apiKey: "key", secretKey: "secret" },
      "binance",
    );
    const b = fixture();
    b.accounts = [account];
    b.snapshots[0].scope = { type: "account", accountId: account.id };
    b.snapshots[0].members = [account.id];
    b.flows.flows[0].accountId = account.id;
    await writePrivate(DATA_KEYS.flows, {
      flows: [],
      coverage: [
        { accountId: account.id, from: time, to: "2026-02-01T00:00:00.000Z" },
      ],
    });
    await importBackup(serializeBackup(b));
    expect(await loadKeys(account)).toMatchObject({
      apiKey: "key",
      secretKey: "secret",
    });
    expect((await loadFlows()).coverage).toEqual([]);
  });
  it("reconnects restored accounts without changing their history identity", async () => {
    await importBackup(JSON.stringify(fixture()));
    await replaceAccountKeys("restored", {
      apiKey: "new-key",
      secretKey: "new-secret",
    });
    expect((await getAllAccounts())[0].state).toBe("active");
    expect(await loadKeys((await getAllAccounts())[0])).toMatchObject({
      apiKey: "new-key",
    });
    expect((await loadAllSnapshots())[0].members).toEqual(["restored"]);
  });
  it("replays an interrupted multi-record import before returning any data", async () => {
    const original = vi.mocked(AsyncStorage.setItem).getMockImplementation()!;
    let failed = false;
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (k, v) => {
      if (k === DATA_KEYS.snapshots && !failed) {
        failed = true;
        throw Error("disk");
      }
      storage.data.set(k, v);
    });
    await expect(importBackup(JSON.stringify(fixture()))).rejects.toThrow(
      "disk",
    );
    expect(storage.data.has(IMPORT_PENDING)).toBe(true);
    vi.mocked(AsyncStorage.setItem).mockImplementation(original);
    expect(await loadAllSnapshots()).toHaveLength(1);
    expect((await loadFlows()).flows).toHaveLength(1);
    expect(storage.data.has(IMPORT_PENDING)).toBe(false);
  });
  it("serializes imports with concurrent history and cash-flow writes", async () => {
    await Promise.all([
      importBackup(JSON.stringify(fixture())),
      addSnapshot({ type: "total" }, -1),
      saveFlow({
        accountId: "restored",
        occurredAt: time,
        amountUSDT: 1,
        type: "withdrawal",
      }),
    ]);
    expect(await loadAllSnapshots()).toHaveLength(2);
    expect((await loadFlows()).flows).toHaveLength(2);
  });
  it("never exports account state, API keys or raw legacy plan payloads", async () => {
    const account = await saveAccount(
      { apiKey: "private-key", secretKey: "private-secret" },
      "binance",
    );
    await writePrivate(DATA_KEYS.archive, [
      {
        id: "plan",
        archivedAt: time,
        orderIds: ["order"],
        legacy: { secret: "never-export" },
      },
    ]);
    const serialized = serializeBackup(await readBackup());
    expect(serialized).not.toMatch(
      /private-key|private-secret|never-export|"state"/,
    );
    expect(parseBackup(serialized).accounts[0].id).toBe(account.id);
  });
});
describe("complete local deletion", () => {
  it("removes secrets, encrypted and legacy records and preferences while preserving unrelated storage", async () => {
    await saveAccount({ apiKey: "key", secretKey: "secret" }, "binance");
    storage.data.set("aircapital.language.code", "ru");
    storage.data.set("aircapital.trading.gridPlans.v2", "[]");
    storage.data.set("unrelated", "keep");
    await deleteAllData();
    expect(storage.secrets.size).toBe(0);
    expect([...storage.data]).toEqual([["unrelated", "keep"]]);
  });
  it("keeps a recovery record when key deletion fails and completes on restart", async () => {
    await saveAccount({ apiKey: "key", secretKey: "secret" }, "binance");
    storage.rejectDelete = true;
    await expect(deleteAllData()).rejects.toThrow();
    expect(storage.data.has(DELETE_PENDING)).toBe(true);
    await expect(getAllAccounts()).rejects.toThrow("deletePending");
    storage.rejectDelete = false;
    await resumeDeletion();
    expect(storage.secrets.size).toBe(0);
    expect(storage.data.size).toBe(0);
  });
  it("suspends refresh during maintenance so deleted accounts cannot be repopulated", async () => {
    clearPortfolioMemory();
    await pauseMonitoring(async () => {
      await usePortfolioStore.getState().loadData();
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
