import { describe, expect, it } from "vitest";
import { historyChartModel } from "./historyChart";
import type { BalanceSnapshot } from "../types/common";

const start = Date.parse("2026-09-08T04:51:00Z");
const snapshot = (balanceUSDT: number, minutes = 0): BalanceSnapshot => ({
  id: String(minutes), scope: { type: "total" }, balanceUSDT,
  timestamp: new Date(start + minutes * 60_000).toISOString(),
});
const model = (snapshots: BalanceSnapshot[], locale = "ru") => historyChartModel(snapshots, 288, 188, locale)!;
/** Number of drawn pieces in a path, whether straight (L) or curved (C). */
const pieces = (path: string) => (path.match(/[LC]/g) ?? []).length;
/** Samples each cubic piece of a path and returns its y range against its end points. */
function sampleCurve(path: string) {
  const re = /M(-?[\d.]+),(-?[\d.]+)|C(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)/g;
  let y0 = 0, m: RegExpExecArray | null;
  const segments: { from: number; to: number; min: number; max: number }[] = [];
  while ((m = re.exec(path))) {
    if (m[1] !== undefined) { y0 = +m[2]; continue; }
    const [c1y, c2y, y1] = [+m[4], +m[6], +m[8]];
    let lo = Infinity, hi = -Infinity;
    for (let s = 0; s <= 20; s++) {
      const u = s / 20, v = 1 - u;
      const y = v * v * v * y0 + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * y1;
      lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    segments.push({ from: y0, to: y1, min: lo, max: hi });
    y0 = y1;
  }
  return segments;
}

describe("balance history chart regressions", () => {
  it("keeps labels apart when the balance changes by just a few cents", () => {
    const chart = model([snapshot(261.70712589), snapshot(261.69, 0.2), snapshot(261.6, 1)]);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
    expect(chart.ticks[1].y - chart.ticks[0].y).toBeGreaterThanOrEqual(30);
    expect(chart.ticks[2].y - chart.ticks[1].y).toBeGreaterThanOrEqual(30);
    expect(pieces(chart.linePath)).toBe(2);
    expect(chart.startLabel).not.toBe(chart.endLabel);
    expect(chart.sameDay).toBe(true);
  });

  it("draws one continuous line across a recording pause and reports the pause", () => {
    const chart = model([snapshot(261.7), snapshot(261.6, 1), snapshot(264.4, 720), snapshot(264.23, 728)]);
    expect(pieces(chart.linePath)).toBe(3);
    expect(chart.linePath.match(/M/g)).toHaveLength(1);
    expect(chart.hasGaps).toBe(true);
    expect(chart.points).toHaveLength(4);
  });

  it("still draws histories made entirely of sparse samples, even with more than 20 points", () => {
    const chart = model(Array.from({ length: 40 }, (_, i) => snapshot(250 + i, i * 60)));
    expect(pieces(chart.linePath)).toBe(39);
    expect(chart.linePath).not.toMatch(/NaN|Infinity/);
  });

  it.each([0, 261.6, -25, 0.00000002, 1_000_000_000])("handles a constant %s balance without invalid coordinates", (value) => {
    const chart = model([snapshot(value), snapshot(value, 1)]);
    expect(chart.linePath).not.toMatch(/NaN|Infinity/);
    expect(chart.points[0].y).toBe(chart.points[1].y);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
  });

  it("sorts and deduplicates samples and ignores invalid imported data", () => {
    const chart = model([
      snapshot(264, 720), snapshot(NaN, 1), snapshot(Infinity, 2),
      { ...snapshot(99), timestamp: "invalid" }, snapshot(261), snapshot(262),
    ]);
    expect(chart.points.map((p) => p.snapshot.balanceUSDT)).toEqual([262, 264]);
    expect(chart.linePath).not.toMatch(/NaN|Infinity/);
    expect(historyChartModel([], 288, 188, "en")).toBeUndefined();
  });

  it("shows a single observation and tolerates an initial zero layout width", () => {
    const chart = historyChartModel([snapshot(261.6)], 0, 188, "en")!;
    expect(chart.points).toHaveLength(1);
    expect(chart.points[0].x).toBeGreaterThan(chart.left);
    expect(chart.points[0].x).toBeLessThan(chart.right);
    expect(chart.linePath).toMatch(/^M[\d.,]+$/);
    expect(chart.areaPath).toBe("");
    expect(chart.hasGaps).toBe(false);
  });

  it("downsamples long histories without losing extrema or inventing gaps", () => {
    const history = Array.from({ length: 10_000 }, (_, i) => snapshot(i === 5_005 ? 600 : i === 4_007 ? 10 : 250, i));
    const chart = model(history);
    expect(chart.points.length).toBeLessThanOrEqual(300);
    expect(chart.points[0].snapshot).toBe(history[0]);
    expect(chart.points.at(-1)?.snapshot).toBe(history.at(-1));
    expect(chart.points.some((p) => p.snapshot.balanceUSDT === 600)).toBe(true);
    expect(chart.points.some((p) => p.snapshot.balanceUSDT === 10)).toBe(true);
    expect(chart.hasGaps).toBe(false);
  });

  it.each(["en", "ru", "de", "ar"])("keeps %s labels distinct for a small change in a large balance", (locale) => {
    const chart = model([snapshot(1_000_000), snapshot(1_000_000.01, 1)], locale);
    expect(new Set(chart.ticks.map((tick) => tick.label)).size).toBe(3);
  });
});

describe("smooth history line", () => {
  // The two screenshots from 8–9 September: a morning pair, a pause, an evening peak, a pause, a late pair.
  const day = [snapshot(261.7), snapshot(261.6, 1), snapshot(264.4, 720), snapshot(264.23, 728),
    snapshot(262.4, 1_260), snapshot(261.34, 1_900), snapshot(261.9, 1_902)];

  it("passes through every observation in order", () => {
    const chart = model(day);
    const round = (v: number) => Math.round(v * 100) / 100;
    const ends = [...chart.linePath.matchAll(/(?:M|C[^C]*? )(-?[\d.]+),(-?[\d.]+)(?= C|$)/g)].map((m) => [+m[1], +m[2]]);
    expect(ends).toEqual(chart.points.map((p) => [round(p.x), round(p.y)]));
  });

  it("never overshoots the neighbouring observations, so smoothing invents no balances", () => {
    for (const data of [day, Array.from({ length: 60 }, (_, i) => snapshot(255 + Math.sin(i / 5) * 3 + (i % 7 === 0 ? 2 : 0), i * 5))]) {
      const segments = sampleCurve(model(data).linePath);
      expect(segments.length).toBe(data.length - 1);
      for (const segment of segments) {
        expect(segment.min).toBeGreaterThanOrEqual(Math.min(segment.from, segment.to) - 1e-6);
        expect(segment.max).toBeLessThanOrEqual(Math.max(segment.from, segment.to) + 1e-6);
      }
    }
  });

  it("closes the area fill on the chart baseline", () => {
    const chart = model(day);
    expect(chart.bottom).toBe(188 - 46);
    expect(chart.areaPath.startsWith(chart.linePath)).toBe(true);
    expect(chart.areaPath).toMatch(new RegExp(` L[\\d.]+,${chart.bottom} L[\\d.]+,${chart.bottom} Z$`));
  });

  it("keeps two observations as a straight stretch", () => {
    const chart = model([snapshot(261.7), snapshot(262.1, 5)]);
    expect(chart.linePath).toMatch(/^M[\d.,]+ L[\d.,]+$/);
  });
});
