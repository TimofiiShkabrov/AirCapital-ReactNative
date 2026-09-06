import { createStore } from "zustand/vanilla";

/** Wait for every dependency, even when one fails before the others finish. */
export async function waitForAll<T extends readonly unknown[]>(tasks: T) {
  const results = await Promise.allSettled(tasks);
  const failed = results.find((r) => r.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
  return results.map((r) => (r as PromiseFulfilledResult<unknown>).value) as {
    [K in keyof T]: Awaited<T[K]>;
  };
}

export function createLoadTask<T>(loader: () => Promise<T>) {
  let flight: Promise<void> | undefined;
  return createStore<{
    data?: T;
    isLoading: boolean;
    error?: string;
    reload: () => Promise<void>;
  }>((set) => ({
    isLoading: true,
    reload: () => {
      if (flight) return flight;
      set({ isLoading: true, error: undefined });
      flight = Promise.resolve()
        .then(loader)
        .then(
          (data) => set({ data }),
          (e: unknown) =>
            set({
              error:
                e instanceof Error && /^[a-zA-Z]+$/.test(e.message)
                  ? e.message
                  : "genericError",
            }),
        )
        .finally(() => {
          flight = undefined;
          set({ isLoading: false });
        });
      return flight;
    },
  }));
}
