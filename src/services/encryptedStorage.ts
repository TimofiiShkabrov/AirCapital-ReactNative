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

const KEY = "aircapital.localEncryption.v1";
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

export async function writePrivate(key: string, value: unknown): Promise<void> {
  const encryption = await encryptionKey();
  const nonce = await getRandomBytesAsync(12);
  const ciphertext = gcm(encryption, nonce, utf8ToBytes(key)).encrypt(
    utf8ToBytes(JSON.stringify(value)),
  );
  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      encrypted: 1,
      nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(ciphertext),
    }),
  );
}

export async function readPrivate<T>(key: string, fallback: T): Promise<T> {
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
  await writePrivate(key, stored);
  return stored as T;
}
