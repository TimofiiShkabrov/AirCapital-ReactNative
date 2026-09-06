import { mapHttpError, type ApiError } from "./errorHelper";

export type ApiResult<T> =
  { data: T; error?: never } | { data?: never; error: ApiError };
const HOSTS = new Set([
  "api.binance.com",
  "fapi.binance.com",
  "api.bybit.com",
  "open-api.bingx.com",
  "api.gateio.ws",
  "www.okx.com",
  "api.coinbase.com",
]);

/** This transport has no method/body parameter: credentials are only sent to known HTTPS hosts. */
export async function readJson<T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<ApiResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !HOSTS.has(parsed.hostname) ||
      parsed.username ||
      parsed.password
    ) {
      return { error: { code: "incorrectURL" } };
    }
    const request = (async (): Promise<ApiResult<T>> => {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "error",
      });
      if (!response.ok) return { error: mapHttpError(response.status) };
      return { data: (await response.json()) as T };
    })();
    const timeout = new Promise<ApiResult<T>>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve({ error: { code: "timeout" } });
      }, 12000);
    });
    return await Promise.race([request, timeout]);
  } catch {
    // Network exceptions may contain signed URLs or API keys. Never return their raw text.
    return { error: { code: "unknownError" } };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await fn(items[current]);
      }
    }),
  );
  return results;
}
