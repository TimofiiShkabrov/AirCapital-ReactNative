import { getRandomBytesAsync } from "expo-crypto";
import { bytesToHex } from "@noble/ciphers/utils.js";
import type { CashFlow, FlowCoverage } from "../types/monitor";
import { readPrivate, writePrivate } from "./encryptedStorage";
import { dataQueue as serial } from "./serial";
const KEY = "aircapital.cashFlows.v1";
export interface FlowLedger {
  flows: CashFlow[];
  coverage: FlowCoverage[];
}
export const loadFlows = () =>
  readPrivate<FlowLedger>(KEY, { flows: [], coverage: [] });
export const saveFlow = (flow: Omit<CashFlow, "id" | "source">) =>
  serial(async () => {
    if (
      !Number.isFinite(flow.amountUSDT) ||
      flow.amountUSDT <= 0 ||
      !Number.isFinite(Date.parse(flow.occurredAt)) ||
      Date.parse(flow.occurredAt) > Date.now()
    )
      throw new Error("invalidFlow");
    const ledger = await loadFlows();
    const id = bytesToHex(await getRandomBytesAsync(16));
    await writePrivate(KEY, {
      flows: [...ledger.flows, { ...flow, id, source: "manual" }],
      coverage: [],
    });
  });
export const confirmCoverage = (
  accountIds: string[],
  from: string,
  to: string,
) =>
  serial(async () => {
    if (
      Date.parse(from) >= Date.parse(to) ||
      !Number.isFinite(Date.parse(from)) ||
      Date.parse(to) > Date.now()
    )
      throw new Error("invalidPeriod");
    const ledger = await loadFlows();
    await writePrivate(KEY, {
      ...ledger,
      coverage: [
        ...ledger.coverage,
        ...accountIds.map((accountId) => ({ accountId, from, to })),
      ],
    });
  });
export const deleteFlow = (id: string) =>
  serial(async () => {
    const ledger = await loadFlows();
    await writePrivate(KEY, {
      flows: ledger.flows.filter((f) => f.id !== id),
      coverage: [],
    });
  });
export const removeAccountFlows = (id: string) =>
  serial(async () => {
    const ledger = await loadFlows();
    await writePrivate(KEY, {
      flows: ledger.flows.filter((f) => f.accountId !== id),
      coverage: ledger.coverage.filter((c) => c.accountId !== id),
    });
  });
