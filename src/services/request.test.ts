import { describe, expect, it, vi } from "vitest";
import { readJson } from "./request";
import { mapCatchError, formatApiError } from "./errorHelper";
describe("read-only transport", () => {
  it("only sends GET requests and refuses redirects and unknown hosts", async () => {
    const mock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"ok":true}'));
    expect(await readJson("https://api.bybit.com/v5/market/time")).toEqual({
      data: { ok: true },
    });
    expect(mock.mock.calls[0][1]).toMatchObject({
      method: "GET",
      redirect: "error",
    });
    expect(
      (await readJson("https://untrusted.example/?apiKey=secret")).error?.code,
    ).toBe("incorrectURL");
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("bounds even a stalled response body", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => new Promise(() => {}),
    } as Response);
    const request = readJson("https://api.bybit.com/v5/market/time");
    await vi.advanceTimersByTimeAsync(12000);
    expect((await request).error?.code).toBe("timeout");
  });
  it("never exposes signed URLs in network exceptions", async () => {
    const secret = "?signature=private-secret";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(secret));
    expect(
      JSON.stringify(await readJson("https://api.bybit.com/v5/market/time")),
    ).not.toContain("private-secret");
    expect(JSON.stringify(mapCatchError(new Error(secret)))).not.toContain(
      "private-secret",
    );
    expect(
      formatApiError({ code: "unknownError", raw: secret }, (k) => k),
    ).not.toContain("private-secret");
  });
});
