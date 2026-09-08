import type { BalanceSnapshot } from "../types/common";

const GAP_MS = 30 * 60_000;
type Sample = { snapshot: BalanceSnapshot; time: number; segment: number };

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
  const points = samples.map((sample) => ({
    ...sample,
    x: left + (end === start ? 0.5 : (sample.time - start) / (end - start)) * (right - left),
    y: top + (max - sample.snapshot.balanceUSDT) / (max - min) * (bottom - top),
  }));
  const solid: string[] = [], gaps: string[] = [];
  points.forEach((point, i) => {
    const previous = points[i - 1];
    const gap = previous && previous.segment !== point.segment;
    solid.push(`${!previous || gap ? "M" : "L"}${point.x},${point.y}`);
    if (gap) gaps.push(`M${previous.x},${previous.y} L${point.x},${point.y}`);
  });
  const firstDate = new Date(start), lastDate = new Date(end);
  const sameDay = firstDate.toDateString() === lastDate.toDateString();
  const dateFormatter = new Intl.DateTimeFormat(locale, sameDay ? {
    hour: "2-digit", minute: "2-digit", ...(end - start < 60_000 ? { second: "2-digit" } : {}),
  } : { day: "numeric", month: "short", ...(firstDate.getFullYear() !== lastDate.getFullYear() ? { year: "numeric" } : {}) });
  return {
    width: w, height: h, left, right, points,
    ticks: tickValues.map((value, i) => ({ value, label: labels[i], y: top + i * (bottom - top) / 2 })),
    solidPath: solid.join(" "), gapPath: gaps.join(" "),
    startLabel: dateFormatter.format(start), endLabel: dateFormatter.format(end),
    sameDay,
  };
}
