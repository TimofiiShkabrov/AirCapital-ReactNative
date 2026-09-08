import { readPrivate, writePrivate } from "../services/encryptedStorage";
import { dataQueue } from "../services/serial";
import { useBillingStore, proAccess } from "./store";
import { BILLING } from "./config";
import { monitoredAccountIds } from "./policy";
import type { ExchangeAccount } from "../types/common";

const KEY = "aircapital.freeConnections.v1";
export async function preferredConnections(): Promise<string[]> {
  const value: unknown = await readPrivate(KEY, []);
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(0, BILLING.freeConnections) : [];
}
export async function monitoringSelection(accounts: ExchangeAccount[]) {
  await useBillingStore.getState().refresh();
  return monitoredAccountIds(accounts, proAccess(), await preferredConnections());
}
export function saveFreeConnections(ids: string[]) {
  return dataQueue(async () => {
    if (ids.length > BILLING.freeConnections || new Set(ids).size !== ids.length)
      throw new Error("freeLimit");
    await writePrivate(KEY, ids);
  });
}
/** Called inside the existing account write queue, so concurrent saves cannot exceed the limit. */
export function checkNewConnection(accounts: ExchangeAccount[]) {
  if (!proAccess() && accounts.filter((a) => a.state !== "deletionPending").length >= BILLING.freeConnections)
    throw new Error("freeLimit");
}
