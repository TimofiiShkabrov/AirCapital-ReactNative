import type { BalanceSnapshot, ChartRange } from "../types/common";
import type { FlowCoverage, CashFlow } from "../types/monitor";
import { periodHistory, periodMetrics } from "./analytics";

/** Equal time windows, identical membership; never compare different portfolios. */
export function comparePeriods(history: BalanceSnapshot[], range: ChartRange, now: number,
  ids: string[], flows: CashFlow[], coverage: FlowCoverage[]) {
  if (range === "all") return undefined;
  const duration = { day: 1, week: 7, month: 30 }[range] * 86400000;
  const current = periodMetrics(periodHistory(history, range, now, ids), ids, flows, coverage);
  const previous = periodMetrics(periodHistory(history, range, now - duration, ids), ids, flows, coverage);
  // Sparse observations don't support a meaningful period comparison.
  const covers = (m: typeof current) => m &&
    Date.parse(m.last.timestamp) - Date.parse(m.first.timestamp) >= duration * 0.9;
  return covers(current) && covers(previous) ? { current: current!, previous: previous! } : undefined;
}
