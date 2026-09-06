import { describe, expect, it, vi } from "vitest";
import { fetchWallet } from "./bybit";
const keys = { apiKey: "test-key", secretKey: "test-secret" };
const response = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });
describe("Bybit read-only compatibility", () => {
  it("combines classic contract and spot without requesting trade endpoints", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ retCode: 0, result: { uta: 0, readOnly: 1 } }),
      )
      .mockResolvedValueOnce(
        response({
          retCode: 0,
          result: {
            list: [{ accountType: "CONTRACT", totalEquity: "10", coin: [] }],
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          retCode: 0,
          result: {
            list: [{ accountType: "SPOT", totalEquity: "20", coin: [] }],
          },
        }),
      );
    const result = await fetchWallet(keys);
    expect(result.data?.result.list.map((x) => x.accountType)).toEqual([
      "CONTRACT",
      "SPOT",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.every(([, init]) => init?.method === "GET"),
    ).toBe(true);
  });
  it("does not report a partial classic wallet as a complete balance", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ retCode: 0, result: { uta: 0, readOnly: 1 } }),
      )
      .mockResolvedValueOnce(
        response({
          retCode: 0,
          result: {
            list: [{ accountType: "CONTRACT", totalEquity: "10", coin: [] }],
          },
        }),
      )
      .mockResolvedValueOnce(response({ retCode: 10003, result: {} }));
    expect((await fetchWallet(keys)).error).toBeDefined();
  });
});
