import { describe, expect, it, vi } from "vitest";
import { createLoadTask, waitForAll } from "./loadTask";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("complete screen loading", () => {
  it("starts pending and publishes data only after the slowest dependency", async () => {
    const balances = deferred<number>(),
      history = deferred<string[]>();
    const loader = vi.fn(() =>
      waitForAll([balances.promise, history.promise] as const),
    );
    const task = createLoadTask(loader);
    expect(task.getState()).toMatchObject({ isLoading: true });
    const first = task.getState().reload();
    expect(task.getState().reload()).toBe(first);
    balances.resolve(100);
    await Promise.resolve();
    expect(task.getState().data).toBeUndefined();
    expect(task.getState().isLoading).toBe(true);
    history.resolve(["saved snapshot"]);
    await first;
    expect(loader).toHaveBeenCalledTimes(1);
    expect(task.getState()).toMatchObject({
      isLoading: false,
      data: [100, ["saved snapshot"]],
    });
  });

  it("waits for remaining work after an early failure, then enables retry", async () => {
    const slow = deferred<string>();
    const loader = vi.fn(() =>
      waitForAll([
        Promise.reject(new Error("storageError")),
        slow.promise,
      ] as const),
    );
    const task = createLoadTask(loader);
    const pending = task.getState().reload();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(task.getState().isLoading).toBe(true);
    slow.resolve("finished");
    await pending;
    expect(task.getState()).toMatchObject({
      isLoading: false,
      error: "storageError",
    });
    loader.mockResolvedValueOnce([undefined as never, "recovered"]);
    const retry = task.getState().reload();
    expect(task.getState().error).toBeUndefined();
    expect(task.getState().isLoading).toBe(true);
    await retry;
    expect(task.getState().data?.[1]).toBe("recovered");
    expect(task.getState().isLoading).toBe(false);
  });

  it("keeps the previous complete result pending a refresh and releases on synchronous failure", async () => {
    const slow = deferred<number>();
    const loader = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(10)
      .mockImplementationOnce(() => slow.promise)
      .mockImplementationOnce(() => {
        throw new Error("storageError");
      });
    const task = createLoadTask(loader);
    await task.getState().reload();
    const next = task.getState().reload();
    expect(task.getState()).toMatchObject({ data: 10, isLoading: true });
    slow.resolve(20);
    await next;
    expect(task.getState()).toMatchObject({ data: 20, isLoading: false });
    await task.getState().reload();
    expect(task.getState()).toMatchObject({
      data: 20,
      isLoading: false,
      error: "storageError",
    });
  });
});
