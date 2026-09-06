import type { BalanceSnapshot, ChartRange } from "../types/common";
import type { CashFlow, FlowCoverage } from "../types/monitor";
import { divide, subtract, sum } from "./money";

export function periodHistory(
  history: BalanceSnapshot[],
  range: ChartRange,
  now: number,
  memberIds?: string[],
) {
  const requestedStart =
    range === "all"
      ? 0
      : now - { day: 1, week: 7, month: 30 }[range] * 86400000;
  const members = memberIds?.slice().sort().join("|");
  return history
    .filter(
      (s) =>
        Date.parse(s.timestamp) >= requestedStart &&
        Date.parse(s.timestamp) <= now &&
        (!members ||
          (s.calculationVersion === 2 &&
            s.members?.slice().sort().join("|") === members)),
    )
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
export function periodMetrics(
  history: BalanceSnapshot[],
  accountIds: string[],
  flows: CashFlow[] = [],
  coverage: FlowCoverage[] = [],
) {
  if (history.length < 2) return undefined;
  const first = history[0],
    last = history[history.length - 1];
  const from = Date.parse(first.timestamp),
    to = Date.parse(last.timestamp);
  if (from >= to) return undefined;
  const delta = subtract(last.balanceUSDT, first.balanceUSDT);
  const relevant = flows.filter(
    (f) =>
      accountIds.includes(f.accountId) &&
      Date.parse(f.occurredAt) > from &&
      Date.parse(f.occurredAt) <= to,
  );
  // A paired internal transfer cancels naturally when both accounts are selected; either leg remains for a single-account view.
  const deposits = sum(
    relevant.filter((f) => f.type === "deposit").map((f) => f.amountUSDT),
  );
  const withdrawals = sum(
    relevant.filter((f) => f.type === "withdrawal").map((f) => f.amountUSDT),
  );
  const complete =
    accountIds.length > 0 &&
    accountIds.every((id) =>
      coverage.some(
        (c) =>
          c.accountId === id &&
          Date.parse(c.from) <= from &&
          Date.parse(c.to) >= to,
      ),
    );
  return {
    first,
    last,
    delta,
    percent:
      first.balanceUSDT > 0
        ? divide(delta, first.balanceUSDT) * 100
        : undefined,
    deposits,
    withdrawals,
    complete,
    result: complete ? sum([delta, -deposits, withdrawals]) : undefined,
  };
}
