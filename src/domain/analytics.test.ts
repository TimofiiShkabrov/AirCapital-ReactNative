import { describe, expect, it } from "vitest";
import { createDemo } from "./demo";
import { periodHistory, periodMetrics } from "./analytics";
import { parseAmount, parseLocalDate } from "./input";
import { numeric, sum } from "./money";
import type { BalanceSnapshot } from "../types/common";
const now = Date.parse("2026-09-06T10:00:00Z");
describe("deposit analytics", () => {
  it("separates deposits from growth and reconciles the approved example", () => {
    const demo = createDemo(now),
      history = periodHistory(
        demo.history.filter((s) => s.scope.type === "total"),
        "month",
        now,
        demo.accounts.map((a) => a.id),
      );
    const result = periodMetrics(
      history,
      demo.accounts.map((a) => a.id),
      demo.flows,
      demo.coverage,
    )!;
    expect(result.delta).toBe(3620);
    expect(result.deposits).toBe(2500);
    expect(result.withdrawals).toBe(500);
    expect(result.result).toBe(1620);
    expect(result.percent).toBeCloseTo(8.0444444);
  });
  it("recalculates the same period within a single exchange", () => {
    const demo = createDemo(now),
      id = demo.accounts[1].id;
    const history = periodHistory(
      demo.history.filter(
        (s) => s.scope.type === "account" && s.scope.accountId === id,
      ),
      "week",
      now,
      [id],
    );
    const result = periodMetrics(history, [id], demo.flows, demo.coverage)!;
    expect(result.delta).toBe(-200);
    expect(result.result).toBe(-400);
  });
  it("does not infer performance from missing cash flow history", () => {
    const demo = createDemo(now);
    const history = demo.history.filter((s) => s.scope.type === "total");
    expect(
      periodMetrics(
        history,
        demo.accounts.map((a) => a.id),
      )?.result,
    ).toBeUndefined();
  });
  it("does not compare aggregate totals across different account memberships", () => {
    const history: BalanceSnapshot[] = [
      {
        id: "old",
        scope: { type: "total" },
        timestamp: new Date(now - 1000).toISOString(),
        balanceUSDT: 100,
        calculationVersion: 2,
        members: ["a"],
      },
      {
        id: "new",
        scope: { type: "total" },
        timestamp: new Date(now).toISOString(),
        balanceUSDT: 200,
        calculationVersion: 2,
        members: ["a", "b"],
      },
    ];
    expect(periodHistory(history, "all", now, ["a", "b"])).toHaveLength(1);
  });
  it("preserves withdrawals to zero without inventing percentage returns from zero", () => {
    const history: BalanceSnapshot[] = [
      {
        id: "a",
        scope: { type: "total" },
        timestamp: new Date(now - 1000).toISOString(),
        balanceUSDT: 0,
      },
      {
        id: "b",
        scope: { type: "total" },
        timestamp: new Date(now).toISOString(),
        balanceUSDT: 100,
      },
    ];
    expect(periodMetrics(history, ["a"])?.percent).toBeUndefined();
    expect(
      periodMetrics(
        history.slice().map((s, i) => ({ ...s, balanceUSDT: i ? 0 : 100 })),
        ["a"],
      )?.percent,
    ).toBe(-100);
  });
  it("accepts localized amounts but rejects ambiguous or overflowing input", () => {
    expect(parseAmount("٢٤٫٩٠")).toBe(24.9);
    expect(parseAmount("24,90")).toBe(24.9);
    expect(parseAmount("1e8")).toBeUndefined();
    expect(parseAmount("-1")).toBeUndefined();
    expect(parseLocalDate("2026-02-30 10:00")).toBeUndefined();
  });
  it("uses decimal arithmetic and rejects missing or invalid numbers", () => {
    expect(sum([0.1, 0.2])).toBe(0.3);
    expect(() => numeric("")).toThrow();
    expect(() => numeric("NaN")).toThrow();
  });
});

describe("own-account transfers", () => {
  it("cancels equal principal flows across accounts while leaving fees in the result", () => {
    const from = new Date(now - 1000).toISOString(),
      to = new Date(now).toISOString();
    const history: BalanceSnapshot[] = [
      { id: "a", scope: { type: "total" }, timestamp: from, balanceUSDT: 1000 },
      { id: "b", scope: { type: "total" }, timestamp: to, balanceUSDT: 999 },
    ];
    const flows = [
      {
        id: "out",
        accountId: "a",
        occurredAt: to,
        type: "withdrawal" as const,
        amountUSDT: 100,
        source: "manual" as const,
      },
      {
        id: "in",
        accountId: "b",
        occurredAt: to,
        type: "deposit" as const,
        amountUSDT: 100,
        source: "manual" as const,
      },
    ];
    const coverage = ["a", "b"].map((accountId) => ({ accountId, from, to }));
    expect(periodMetrics(history, ["a", "b"], flows, coverage)?.result).toBe(
      -1,
    );
    expect(periodMetrics(history, ["a"], flows, coverage)?.deposits).toBe(0);
    expect(periodMetrics(history, ["a"], flows, coverage)?.withdrawals).toBe(
      100,
    );
  });
});
