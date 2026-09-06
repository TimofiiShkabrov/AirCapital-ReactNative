import { beforeEach, afterEach, vi } from "vitest";
vi.mock("expo-localization", () => ({
  getLocales: vi.fn(() => [{ languageTag: "en-US" }]),
}));
const memory = vi.hoisted(() => ({
  data: new Map<string, string>(),
  secrets: new Map<string, string>(),
  rejectDelete: false,
  rejectSecretWrite: false,
  available: true,
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getAllKeys: vi.fn(async () => [...memory.data.keys()]),
    getItem: vi.fn(async (key: string) => memory.data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memory.data.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memory.data.delete(key);
    }),
  },
}));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  isAvailableAsync: vi.fn(async () => memory.available),
  getItemAsync: vi.fn(async (key: string) => memory.secrets.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    if (memory.rejectSecretWrite && key.startsWith("account_"))
      throw new Error("failure");
    memory.secrets.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    if (memory.rejectDelete) throw new Error("failure");
    memory.secrets.delete(key);
  }),
}));
vi.mock("expo-crypto", async () => {
  const crypto = await import("node:crypto");
  return {
    getRandomBytesAsync: async (size: number) =>
      new Uint8Array(crypto.randomBytes(size)),
  };
});
beforeEach(() => {
  memory.data.clear();
  memory.secrets.clear();
  memory.rejectDelete = false;
  memory.rejectSecretWrite = false;
  memory.available = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Unexpected network request in test");
    }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

export const storage = memory;
