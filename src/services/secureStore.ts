import * as SecureStore from "expo-secure-store";
import { getRandomBytesAsync } from "expo-crypto";
import { bytesToHex } from "@noble/ciphers/utils.js";
import type { ExchangeAccount, Exchange, APIKeys } from "../types/common";
import { ALL_EXCHANGES } from "../types/common";
import { readPrivate, writePrivate } from "./encryptedStorage";
import { serialQueue } from "./serial";

const ACCOUNTS_KEY = "aircapital.exchangeAccounts.v1";
const serial = serialQueue();
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const secureKey = (id: string, suffix: string) => `account_${id}_${suffix}`;

export async function getAllAccounts(): Promise<ExchangeAccount[]> {
  const accounts = await readPrivate<ExchangeAccount[]>(ACCOUNTS_KEY, []);
  if (
    !Array.isArray(accounts) ||
    accounts.some(
      (a) =>
        !a ||
        typeof a.id !== "string" ||
        !ALL_EXCHANGES.includes(a.exchange) ||
        !Number.isFinite(Date.parse(a.createdAt)),
    )
  )
    throw new Error("invalidAccounts");
  return [...accounts].sort(
    (a, b) =>
      ALL_EXCHANGES.indexOf(a.exchange) - ALL_EXCHANGES.indexOf(b.exchange) ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}
export async function getAccountsForExchange(exchange: Exchange) {
  return (await getAllAccounts()).filter((a) => a.exchange === exchange);
}

export function saveAccount(
  keys: APIKeys,
  exchange: Exchange,
  label?: string,
): Promise<ExchangeAccount> {
  return serial(async () => {
    if (!(await SecureStore.isAvailableAsync()))
      throw new Error("secureStorageUnavailable");
    if (
      !keys.apiKey.trim() ||
      !keys.secretKey.trim() ||
      (exchange === "okx" && !keys.passphrase?.trim())
    )
      throw new Error("requiredKeys");
    const accounts = await getAllAccounts();
    const account: ExchangeAccount = {
      id: bytesToHex(await getRandomBytesAsync(16)),
      exchange,
      label: label?.trim() || undefined,
      createdAt: new Date().toISOString(),
      state: "setupPending",
    };
    // Persist a recovery record before writing any secret, so failures never leave orphaned keys.
    await writePrivate(ACCOUNTS_KEY, [...accounts, account]);
    await SecureStore.setItemAsync(
      secureKey(account.id, "apiKey"),
      keys.apiKey.trim(),
      options,
    );
    await SecureStore.setItemAsync(
      secureKey(account.id, "secretKey"),
      keys.secretKey.trim(),
      options,
    );
    if (keys.passphrase)
      await SecureStore.setItemAsync(
        secureKey(account.id, "passphrase"),
        keys.passphrase.trim(),
        options,
      );
    account.state = "active";
    await writePrivate(ACCOUNTS_KEY, [...accounts, account]);
    return account;
  });
}
export async function loadKeys(
  account: ExchangeAccount,
): Promise<APIKeys | null> {
  if (account.state && account.state !== "active") return null;
  const [apiKey, secretKey, passphrase] = await Promise.all(
    ["apiKey", "secretKey", "passphrase"].map((s) =>
      SecureStore.getItemAsync(secureKey(account.id, s)),
    ),
  );
  return apiKey && secretKey
    ? { apiKey, secretKey, passphrase: passphrase ?? undefined }
    : null;
}
export function deleteAccount(account: ExchangeAccount): Promise<void> {
  return serial(async () => {
    const accounts = await getAllAccounts();
    await writePrivate(
      ACCOUNTS_KEY,
      accounts.map((a) =>
        a.id === account.id ? { ...a, state: "deletionPending" } : a,
      ),
    );
    const results = await Promise.allSettled(
      ["apiKey", "secretKey", "passphrase"].map((s) =>
        SecureStore.deleteItemAsync(secureKey(account.id, s)),
      ),
    );
    if (results.some((r) => r.status === "rejected"))
      throw new Error("deletionPending");
    await writePrivate(
      ACCOUNTS_KEY,
      accounts.filter((a) => a.id !== account.id),
    );
  });
}

export function markAccountForDeletion(
  account: ExchangeAccount,
): Promise<void> {
  return serial(async () => {
    const accounts = await getAllAccounts();
    await writePrivate(
      ACCOUNTS_KEY,
      accounts.map((a) =>
        a.id === account.id ? { ...a, state: "deletionPending" } : a,
      ),
    );
  });
}
