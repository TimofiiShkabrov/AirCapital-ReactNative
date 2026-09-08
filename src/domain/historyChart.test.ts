import { describe, expect, it } from "vitest";
import { historyChartModel } from "./historyChart";
import type { BalanceSnapshot } from "../types/common";

const start = Date.parse("2026-09-08T04:51:00Z");
const snapshot = (balanceUSDT: number, minutes = 0): BalanceSnapshot => ({
  id: String(minutes), scope: { type: "total" }, balanceUSDT,
  timestamp: new Date(start + minutes * 60_000).toISOString(),
});
const model = (snapshots: BalanceSnapshot[], locale = "ru") => historyChartModel(snapshots, 288, 188, locale)!;

describe("balance history chart regressions", () => {
  it("keeps labels apart when the balance changes by just a few cents", () => {
    const chart = model([snapshot(261.70712589), snapshot(261.69, 0.2), snapshot(261.6, 1)]);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
    expect(chart.ticks[1].y - chart.ticks[0].y).toBeGreaterThanOrEqual(30);
    expect(chart.ticks[2].y - chart.ticks[1].y).toBeGreaterThanOrEqual(30);
    expect(chart.solidPath.match(/L/g)).toHaveLength(2);
    expect(chart.startLabel).not.toBe(chart.endLabel);
    expect(chart.sameDay).toBe(true);
  });

  it("draws a visible connector between morning and evening observations", () => {
    const chart = model([snapshot(261.7), snapshot(261.6, 1), snapshot(264.4, 720), snapshot(264.23, 728)]);
    expect(chart.solidPath.match(/L/g)).toHaveLength(2);
    expect(chart.gapPath.match(/L/g)).toHaveLength(1);
    expect(chart.points).toHaveLength(4);
  });

  it("still draws histories made entirely of sparse samples, even with more than 20 points", () => {
    const chart = model(Array.from({ length: 40 }, (_, i) => snapshot(250 + i, i * 60)));
    expect(chart.gapPath.match(/L/g)).toHaveLength(39);
    expect(chart.solidPath).not.toMatch(/NaN|Infinity/);
  });

  it.each([0, 261.6, -25, 0.00000002, 1_000_000_000])("handles a constant %s balance without invalid coordinates", (value) => {
    const chart = model([snapshot(value), snapshot(value, 1)]);
    expect(chart.solidPath).not.toMatch(/NaN|Infinity/);
    expect(chart.points[0].y).toBe(chart.points[1].y);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
  });

  it("sorts and deduplicates samples and ignores invalid imported data", () => {
    const chart = model([
      snapshot(264, 720), snapshot(NaN, 1), snapshot(Infinity, 2),
      { ...snapshot(99), timestamp: "invalid" }, snapshot(261), snapshot(262),
    ]);
    expect(chart.points.map((p) => p.snapshot.balanceUSDT)).toEqual([262, 264]);
    expect(chart.gapPath).not.toMatch(/NaN|Infinity/);
    expect(historyChartModel([], 288, 188, "en")).toBeUndefined();
  });

  it("shows a single observation and tolerates an initial zero layout width", () => {
    const chart = historyChartModel([snapshot(261.6)], 0, 188, "en")!;
    expect(chart.points).toHaveLength(1);
    expect(chart.points[0].x).toBeGreaterThan(chart.left);
    expect(chart.points[0].x).toBeLessThan(chart.right);
    expect(chart.solidPath).not.toMatch(/NaN|Infinity/);
  });

  it("downsamples long histories without losing extrema or inventing gaps", () => {
    const history = Array.from({ length: 10_000 }, (_, i) => snapshot(i === 5_005 ? 600 : i === 4_007 ? 10 : 250, i));
    const chart = model(history);
    expect(chart.points.length).toBeLessThanOrEqual(300);
    expect(chart.points[0].snapshot).toBe(history[0]);
    expect(chart.points.at(-1)?.snapshot).toBe(history.at(-1));
    expect(chart.points.some((p) => p.snapshot.balanceUSDT === 600)).toBe(true);
    expect(chart.points.some((p) => p.snapshot.balanceUSDT === 10)).toBe(true);
    expect(chart.gapPath).toBe("");
  });

  it.each(["en", "ru", "de", "ar"])("keeps %s labels distinct for a small change in a large balance", (locale) => {
    const chart = model([snapshot(1_000_000), snapshot(1_000_000.01, 1)], locale);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
  });
});
