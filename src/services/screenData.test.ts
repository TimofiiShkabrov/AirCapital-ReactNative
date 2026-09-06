import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as History from "./balanceHistory";
import * as Flows from "./cashFlows";
import * as Secure from "./secureStore";
import { useAccountsStore } from "../store/accountsStore";
import { usePortfolioStore } from "../store/portfolioStore";
import { createLoadTask } from "./loadTask";
import { loadAccountData, loadFlowsData, loadOverviewData } from "./screenData";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
const reset = () => {
  useAccountsStore.setState(useAccountsStore.getInitialState(), true);
  usePortfolioStore.setState(usePortfolioStore.getInitialState(), true);
};
beforeEach(reset);
afterEach(reset);

describe("screen data dependencies", () => {
  it("does not read history before balance persistence, or reveal balances before flows finish", async () => {
    const balanceWrite = deferred<void>(),
      flowRead = deferred<Flows.FlowLedger>();
    const history = vi.spyOn(History, "loadAllSnapshots").mockResolvedValue([]);
    const flows = vi
      .spyOn(Flows, "loadFlows")
      .mockReturnValue(flowRead.promise);
    usePortfolioStore.setState({ loadData: () => balanceWrite.promise });
    const task = createLoadTask(loadOverviewData);
    const pending = task.getState().reload();
    await Promise.resolve();
    expect(history).not.toHaveBeenCalled();
    balanceWrite.resolve();
    await vi.waitFor(() => expect(flows).toHaveBeenCalledTimes(1));
    expect(task.getState().isLoading).toBe(true);
    expect(task.getState().data).toBeUndefined();
    flowRead.resolve({ flows: [], coverage: [] });
    await pending;
    expect(task.getState().isLoading).toBe(false);
    expect(task.getState().data?.history).toEqual([]);
  });

  it("coalesces overlapping account reads and does not treat failed storage as an empty flow screen", async () => {
    const read = deferred<Awaited<ReturnType<typeof Secure.getAllAccounts>>>();
    const get = vi
      .spyOn(Secure, "getAllAccounts")
      .mockReturnValueOnce(read.promise);
    const a = useAccountsStore.getState().loadAccounts();
    expect(useAccountsStore.getState().loadAccounts()).toBe(a);
    expect(useAccountsStore.getState().isLoading).toBe(true);
    read.resolve([]);
    await a;
    expect(get).toHaveBeenCalledTimes(1);
    expect(useAccountsStore.getState().isLoading).toBe(false);
    get.mockRejectedValueOnce(new Error("read failed"));
    vi.spyOn(Flows, "loadFlows").mockResolvedValue({ flows: [], coverage: [] });
    await expect(loadFlowsData()).rejects.toThrow("storageError");
  });

  it("reports an absent account only after refresh and history have finished", async () => {
    const read = deferred<Awaited<ReturnType<typeof History.getSnapshots>>>();
    vi.spyOn(History, "getSnapshots").mockReturnValue(read.promise);
    usePortfolioStore.setState({ loadData: async () => {} });
    const task = createLoadTask(() => loadAccountData("deleted-account"));
    const pending = task.getState().reload();
    await Promise.resolve();
    expect(task.getState().isLoading).toBe(true);
    read.resolve([]);
    await pending;
    expect(task.getState()).toMatchObject({
      isLoading: false,
      error: "accountNotFound",
    });
  });
});
