import type { BalanceSnapshot } from "../types/common";

const GAP_MS = 30 * 60_000;
/** Stroke width of the balance line. */
export const STROKE = 2.5;
type Sample = { snapshot: BalanceSnapshot; time: number; segment: number };
type Point = Sample & { x: number; y: number };

function samplesForChart(snapshots: BalanceSnapshot[], demo: boolean): Sample[] {
  const sorted = snapshots
    .map((snapshot) => ({ snapshot, time: Date.parse(snapshot.timestamp), segment: 0 }))
    .filter(({ snapshot, time }) => Number.isFinite(time) && Number.isFinite(snapshot.balanceUSDT))
    .sort((a, b) => a.time - b.time);
  const unique: Sample[] = [];
  for (const sample of sorted) {
    if (unique.at(-1)?.time === sample.time) unique[unique.length - 1] = sample;
    else unique.push(sample);
  }
  let segment = 0;
  unique.forEach((sample, i) => {
    if (i && !demo && sample.time - unique[i - 1].time > GAP_MS) segment++;
    sample.segment = segment;
  });
  if (unique.length <= 300) return unique;

  // Classify gaps before downsampling; reduced point spacing is not a data gap.
  const reduced = new Set<Sample>();
  const step = Math.ceil(unique.length / 70);
  for (let i = 0; i < unique.length; i += step) {
    const bucket = unique.slice(i, i + step);
    reduced.add(bucket[0]);
    reduced.add(bucket.reduce((a, b) => a.snapshot.balanceUSDT < b.snapshot.balanceUSDT ? a : b));
    reduced.add(bucket.reduce((a, b) => a.snapshot.balanceUSDT > b.snapshot.balanceUSDT ? a : b));
    reduced.add(bucket[bucket.length - 1]);
  }
  return [...reduced].sort((a, b) => a.time - b.time);
}

function tickLabels(values: number[], locale: string): string[] {
  const largest = Math.max(...values.map(Math.abs));
  const notation = largest >= 1_000_000 ? "compact" : largest > 0 && largest < 0.01 ? "scientific" : "standard";
  const step = Math.abs(values[1] - values[0]);
  const precision = notation === "standard" ? Math.max(0, Math.ceil(-Math.log10(step)) + 1) : 1;
  for (let digits = Math.min(8, precision); digits <= 8; digits++) {
    const formatter = new Intl.NumberFormat(locale, { notation, maximumFractionDigits: digits });
    const labels = values.map((v) => formatter.format(v));
    if (new Set(labels).size === values.length) return labels;
  }
  return values.map((v) => new Intl.NumberFormat(locale, {
    notation: "scientific", maximumSignificantDigits: 15,
  }).format(v));
}

const fmt = (v: number) => String(Math.round(v * 100) / 100);
const at = (p: { x: number; y: number }) => `${fmt(p.x)},${fmt(p.y)}`;

/**
 * Monotone cubic tangents (Fritsch–Carlson, as in d3 curveMonotoneX).
 * The curve never overshoots the value of either neighbouring observation,
 * so a smooth line does not suggest balances the account never had.
 */
function tangents(points: Point[]): number[] {
  const n = points.length;
  const slope3 = (a: Point, b: Point, c: Point) => {
    const h0 = b.x - a.x, h1 = c.x - b.x;
    const s0 = (b.y - a.y) / (h0 || (h1 < 0 ? -0 : 0)), s1 = (c.y - b.y) / (h1 || (h0 < 0 ? -0 : 0));
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  };
  const slope2 = (a: Point, b: Point, t: number) => {
    const h = b.x - a.x;
    return h ? (3 * (b.y - a.y) / h - t) / 2 : t;
  };
  const t = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) t[i] = slope3(points[i - 1], points[i], points[i + 1]);
  t[0] = slope2(points[0], points[1], t[1]);
  t[n - 1] = slope2(points[n - 2], points[n - 1], t[n - 2]);
  return t;
}

/** One smooth path through every observation: a straight stretch for two points, cubic pieces otherwise. */
function curve(points: Point[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) return `L${at(points[1])}`;
  const t = tangents(points);
  return points.slice(1).map((to, k) => {
    const from = points[k], dx = (to.x - from.x) / 3;
    return `C${at({ x: from.x + dx, y: from.y + dx * t[k] })} ${at({ x: to.x - dx, y: to.y - dx * t[k + 1] })} ${at(to)}`;
  }).join(" ");
}

export function historyChartModel(snapshots: BalanceSnapshot[], width: number, height: number, locale: string, demo = false) {
  const samples = samplesForChart(snapshots, demo);
  if (!samples.length) return undefined;
  const w = Math.max(160, Number.isFinite(width) ? width : 300);
  const h = Math.max(150, Number.isFinite(height) ? height : 188);
  const low = Math.min(...samples.map((v) => v.snapshot.balanceUSDT));
  const high = Math.max(...samples.map((v) => v.snapshot.balanceUSDT));
  const span = high - low;
  const padding = span > 0 ? Math.max(span * 0.18, Math.abs(high) * Number.EPSILON * 8) : Math.max(Math.abs(high) * 0.002, 0.01);
  const min = low - padding, max = high + padding;
  const tickValues = [max, min + (max - min) / 2, min];
  const labels = tickLabels(tickValues, locale);
  const left = Math.min(w * 0.42, Math.max(56, ...labels.map((label) => label.length * 6.5 + 12)));
  const right = w - 12, top = 24, bottom = h - 46;
  const start = samples[0].time, end = samples[samples.length - 1].time;
  const points: Point[] = samples.map((sample) => ({
    ...sample,
    x: left + (end === start ? 0.5 : (sample.time - start) / (end - start)) * (right - left),
    y: top + (max - sample.snapshot.balanceUSDT) / (max - min) * (bottom - top),
  }));
  const pieces = curve(points);
  const first = points[0], last = points[points.length - 1];
  const linePath = `M${at(first)}${pieces ? ` ${pieces}` : ""}`;
  const areaPath = pieces ? `${linePath} L${fmt(last.x)},${fmt(bottom)} L${fmt(first.x)},${fmt(bottom)} Z` : "";
  const firstDate = new Date(start), lastDate = new Date(end);
  const sameDay = firstDate.toDateString() === lastDate.toDateString();
  const dateFormatter = new Intl.DateTimeFormat(locale, sameDay ? {
    hour: "2-digit", minute: "2-digit", ...(end - start < 60_000 ? { second: "2-digit" } : {}),
  } : { day: "numeric", month: "short", ...(firstDate.getFullYear() !== lastDate.getFullYear() ? { year: "numeric" } : {}) });
  return {
    width: w, height: h, left, right, top, bottom, points,
    ticks: tickValues.map((value, i) => ({ value, label: labels[i], y: top + i * (bottom - top) / 2 })),
    linePath, areaPath,
    /** Recording pauses longer than 30 minutes exist between observations; the line is still drawn through them. */
    hasGaps: points.some((point, i) => i > 0 && point.segment !== points[i - 1].segment),
    startLabel: dateFormatter.format(start), endLabel: dateFormatter.format(end),
    sameDay,
  };
}
