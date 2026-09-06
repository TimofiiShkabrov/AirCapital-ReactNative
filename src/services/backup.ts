import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getAllAccounts } from "./secureStore";
import { loadAllSnapshots } from "./balanceHistory";
import { loadFlows } from "./cashFlows";
import { readPrivate, writePrivateBatch } from "./encryptedStorage";
import { dataQueue } from "./serial";
import { DATA_KEYS, DELETE_PENDING, ENCRYPTION_KEY } from "./storageKeys";
import { mergeBackup, parseBackup, type Backup } from "../domain/backup";
import type { ArchivedPlan } from "../types/monitor";

async function currentBackup(): Promise<Backup> {
  const [accounts, snapshots, flows, archive] = await Promise.all([
    getAllAccounts(),
    loadAllSnapshots(),
    loadFlows(),
    readPrivate<ArchivedPlan[]>(DATA_KEYS.archive, []),
  ]);
  if (
    accounts.some(
      (a) => a.state === "setupPending" || a.state === "deletionPending",
    )
  )
    throw new Error("unfinishedAccount");
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    quoteCurrency: "USDT",
    accounts,
    snapshots,
    flows,
    archive,
  };
}
export const readBackup = () => dataQueue(currentBackup);
export const inspectBackup = (text: string) =>
  dataQueue(
    async () => mergeBackup(await currentBackup(), parseBackup(text)).added,
  );
export const importBackup = (text: string) =>
  dataQueue(async () => {
    const { backup, added } = mergeBackup(
      await currentBackup(),
      parseBackup(text),
    );
    if (Object.values(added).some((n) => n > 0))
      await writePrivateBatch({
        [DATA_KEYS.accounts]: backup.accounts,
        [DATA_KEYS.snapshots]: backup.snapshots,
        [DATA_KEYS.flows]: backup.flows,
        [DATA_KEYS.archive]: backup.archive,
      });
    return added;
  });
// Only projection fields leave the device. In particular, no legacy plan payload or credentials.
export function serializeBackup(b: Backup) {
  return JSON.stringify(
    {
      ...b,
      accounts: b.accounts.map(({ id, exchange, label, createdAt }) => ({
        id,
        exchange,
        label,
        createdAt,
      })),
      archive: b.archive.map(
        ({ id, exchange, accountId, instrument, orderIds, archivedAt }) => ({
          id,
          exchange,
          accountId,
          instrument,
          orderIds,
          archivedAt,
        }),
      ),
    },
    null,
    2,
  );
}
async function finishDeletion(ids: string[]) {
  const { removePrivateFiles } = await import("./privateFiles");
  await removePrivateFiles();
  for (const id of ids)
    for (const part of ["apiKey", "secretKey", "passphrase"])
      await SecureStore.deleteItemAsync(`account_${id}_${part}`);
  // Includes legacy records, cached observations, import journal and preferences; never clears other apps.
  for (const key of await AsyncStorage.getAllKeys())
    if (key.toLowerCase().startsWith("aircapital") && key !== DELETE_PENDING)
      await AsyncStorage.removeItem(key);
  await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
  await AsyncStorage.removeItem(DELETE_PENDING);
}
export const resumeDeletion = () =>
  dataQueue(async () => {
    const pending = await AsyncStorage.getItem(DELETE_PENDING);
    if (pending) {
      const ids: unknown = JSON.parse(pending);
      if (
        !Array.isArray(ids) ||
        ids.some(
          (id) => typeof id !== "string" || !/^[a-zA-Z0-9_.:-]+$/.test(id),
        )
      )
        throw new Error("deletePending");
      await finishDeletion(ids);
    }
  });
export const deleteAllData = () =>
  dataQueue(async () => {
    const pending = await AsyncStorage.getItem(DELETE_PENDING);
    const ids: string[] = pending
      ? JSON.parse(pending)
      : (await getAllAccounts()).map((a) => a.id);
    await AsyncStorage.setItem(DELETE_PENDING, JSON.stringify(ids));
    await finishDeletion(ids);
  });
