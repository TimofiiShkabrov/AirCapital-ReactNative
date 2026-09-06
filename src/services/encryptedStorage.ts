import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getRandomBytesAsync } from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";
import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
  bytesToUtf8,
} from "@noble/ciphers/utils.js";
import { serialQueue } from "./serial";

import {
  DELETE_PENDING,
  IMPORT_PENDING,
  ENCRYPTION_KEY,
  DATA_KEYS,
} from "./storageKeys";
const KEY = ENCRYPTION_KEY;
const storageQueue = serialQueue();
const keyQueue = serialQueue();
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function encryptionKey(): Promise<Uint8Array> {
  return keyQueue(async () => {
    if (!(await SecureStore.isAvailableAsync()))
      throw new Error("secureStorageUnavailable");
    const existing = await SecureStore.getItemAsync(KEY);
    if (existing) return hexToBytes(existing);
    const key = await getRandomBytesAsync(32);
    await SecureStore.setItemAsync(KEY, bytesToHex(key), options);
    return key;
  });
}

async function encodePrivate(key: string, value: unknown): Promise<string> {
  const encryption = await encryptionKey();
  const nonce = await getRandomBytesAsync(12);
  const ciphertext = gcm(encryption, nonce, utf8ToBytes(key)).encrypt(
    utf8ToBytes(JSON.stringify(value)),
  );
  return JSON.stringify({
    encrypted: 1,
    nonce: bytesToHex(nonce),
    ciphertext: bytesToHex(ciphertext),
  });
}

async function readRaw<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return fallback;
  const stored = JSON.parse(raw);
  if (stored?.encrypted === 1) {
    // A missing encryption key must not be silently replaced when ciphertext exists.
    const secret = await SecureStore.getItemAsync(KEY);
    if (!secret) throw new Error("encryptionKeyMissing");
    return JSON.parse(
      bytesToUtf8(
        gcm(
          hexToBytes(secret),
          hexToBytes(stored.nonce),
          utf8ToBytes(key),
        ).decrypt(hexToBytes(stored.ciphertext)),
      ),
    ) as T;
  }
  // Overwrite only after encryption succeeds. A failed migration preserves the original.
  await AsyncStorage.setItem(key, await encodePrivate(key, stored));
  return stored as T;
}

// A durable encrypted write-ahead record makes an interrupted import replayable.
async function recoverImport() {
  if (await AsyncStorage.getItem(DELETE_PENDING))
    throw new Error("deletePending");
  const raw = await AsyncStorage.getItem(IMPORT_PENDING);
  if (!raw) return;
  if (JSON.parse(raw)?.encrypted !== 1) throw new Error("invalidBackup");
  const entries = await readRaw<[string, string][]>(IMPORT_PENDING, []);
  if (
    !Array.isArray(entries) ||
    entries.some(
      ([key, value]) =>
        !Object.values(DATA_KEYS).includes(key as never) ||
        typeof value !== "string",
    )
  )
    throw new Error("invalidBackup");
  for (const [key, value] of entries) await AsyncStorage.setItem(key, value);
  await AsyncStorage.removeItem(IMPORT_PENDING);
}
export function readPrivate<T>(key: string, fallback: T): Promise<T> {
  return storageQueue(async () => {
    await recoverImport();
    return readRaw(key, fallback);
  });
}
export function writePrivate(key: string, value: unknown): Promise<void> {
  return storageQueue(async () => {
    await recoverImport();
    await AsyncStorage.setItem(key, await encodePrivate(key, value));
  });
}
export function writePrivateBatch(
  values: Record<string, unknown>,
): Promise<void> {
  return storageQueue(async () => {
    await recoverImport();
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(values)) {
      if (!Object.values(DATA_KEYS).includes(key as never))
        throw new Error("invalidBackup");
      entries.push([key, await encodePrivate(key, value)]);
    }
    await AsyncStorage.setItem(
      IMPORT_PENDING,
      await encodePrivate(IMPORT_PENDING, entries),
    );
    await recoverImport();
  });
}
