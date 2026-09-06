import AsyncStorage from "@react-native-async-storage/async-storage";
import { readPrivate, writePrivate } from "./encryptedStorage";
import type { ArchivedPlan } from "../types/monitor";
import { dataQueue } from "./serial";
const ARCHIVE = "aircapital.archivedPlans.v1";
const LEGACY_KEYS = [
  "aircapital.trading.gridPlans.v2",
  "aircapital.okx.gridPlans.v1",
];
export function loadArchivedPlans(): Promise<ArchivedPlan[]> {
  return dataQueue(async () => {
    const archive = await readPrivate<ArchivedPlan[]>(ARCHIVE, []);
    const ids = new Set(archive.map((p) => p.id));
    let found = false;
    for (const key of LEGACY_KEYS) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      found = true;
      const plans = JSON.parse(raw);
      if (!Array.isArray(plans)) throw new Error("invalidArchive");
      for (const p of plans)
        if (typeof p.id === "string" && !ids.has(p.id)) {
          ids.add(p.id);
          archive.push({
            legacy: p,
            id: p.id,
            exchange: p.exchange,
            accountId: p.accountId,
            instrument: p.draft?.instId,
            orderIds: Array.isArray(p.exchangeOrderIds)
              ? p.exchangeOrderIds
              : [],
            archivedAt: new Date().toISOString(),
          });
        }
    }
    if (found) {
      await writePrivate(ARCHIVE, archive);
      // Verify before deleting the old executable-plan format. No exchange action occurs during migration.
      const verified = await readPrivate<ArchivedPlan[]>(ARCHIVE, []);
      if (verified.length !== archive.length) throw new Error("archiveFailed");
      for (const key of LEGACY_KEYS) await AsyncStorage.removeItem(key);
    }
    return archive;
  });
}
