import React, { useMemo, useState } from "react";
import { createDemo } from "../domain/demo";
import { periodHistory, periodMetrics } from "../domain/analytics";
import { walletNameKey } from "../i18n/walletNames";
import type { ChartRange } from "../types/common";
import { useSite } from "./context";
import { browserAnalytics } from "./analyticsBrowser";
import { FeatureIcon } from "./icons";

// The website never hydrates native stores or instantiates exchange adapters.
// A fixed date also keeps server and client renders identical.
const demo = createDemo(Date.UTC(2026, 8, 6, 12));
const labels: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  bingx: "BingX",
  gateio: "Gate.io",
};
const colors = ["#78e2c1", "#91adff", "#c5aff5", "#ffcb7a", "#e6a8c8"];
export function DemoBoard() {
  const { m, language } = useSite();
  const [tab, setTab] = useState<"overview" | "exchanges" | "statistics">(
    "overview",
  );
  const [range, setRange] = useState<ChartRange>("month");
  const [account, setAccount] = useState("all");
  const selected = useMemo(
    () => demo.accounts.filter((a) => account === "all" || a.id === account),
    [account],
  );
  const snapshots = useMemo(
    () =>
      periodHistory(
        demo.history.filter((s) =>
          account === "all"
            ? s.scope.type === "total"
            : s.scope.type === "account" && s.scope.accountId === account,
        ),
        range,
        demo.now,
        selected.map((a) => a.id),
      ),
    [account, range, selected],
  );
  const metrics = periodMetrics(
    snapshots,
    selected.map((a) => a.id),
    demo.flows,
    demo.coverage,
  );
  const number = (v: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(v);
  const money = (v: number) => `${number(v)} USDT`;
  const signed = (v: number) => `${v > 0 ? "+" : ""}${number(v)}`;
  const min = Math.min(...snapshots.map((s) => s.balanceUSDT)),
    max = Math.max(...snapshots.map((s) => s.balanceUSDT));
  const points = snapshots
    .map(
      (s, i) =>
        `${(i / (snapshots.length - 1)) * 800},${155 - ((s.balanceUSDT - min) / (max - min || 1)) * 125}`,
    )
    .join(" ");
  const total = selected.reduce(
    (s, a) => s + demo.observations[a.id].balanceUSDT!,
    0,
  );
  const date = (v: string) =>
    new Intl.DateTimeFormat(language, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(v));
  const resultRows = metrics
    ? [
        { label: m.opening, value: metrics.first.balanceUSDT },
        { label: m.closing, value: metrics.last.balanceUSDT },
        { label: m.deposits, value: metrics.deposits },
        { label: m.withdrawals, value: metrics.withdrawals },
        { label: m.change, value: metrics.delta },
        { label: m.result, value: metrics.result! },
      ]
    : [];
  return (
    <section className="demo-board" aria-label={m.demo}>
      <div className="demo-toolbar">
        <div className="demo-tabs" role="tablist" aria-label={m.demo}>
          {(["overview", "exchanges", "statistics"] as const).map((t) => (
            <button
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              aria-controls="demo-panel"
              key={t}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const tabs = ["overview", "exchanges", "statistics"] as const;
                const step =
                  (event.key === "ArrowRight" ? 1 : -1) *
                  (language === "ar" ? -1 : 1);
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (tabs.indexOf(t) + step + 3) % 3;
                document.getElementById(`tab-${tabs[next]}`)?.focus();
                setTab(tabs[next]);
                browserAnalytics()?.track("demo_tab_change", tabs[next]);
              }}
              onClick={() => {
                setTab(t);
                browserAnalytics()?.track("demo_tab_change", t);
              }}
            >
              {m[t]}
            </button>
          ))}
        </div>
        <label className="demo-filter">
          <span>{m.filterExchange}</span>
          <select
            aria-label={m.filterExchange}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            <option value="all">{m.all}</option>
            {demo.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {labels[a.exchange]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="demo-panel"
        id="demo-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`tab-${tab}`}
      >
        <div className="balance-heading">
          <div>
            <p className="eyebrow">{account === "all" ? m.total : m.balance}</p>
            <div className="demo-total">
              {number(total)}
              <span>USDT</span>
            </div>
            {metrics && (
              <p className={metrics.delta >= 0 ? "positive" : "negative"}>
                {signed(metrics.delta)} USDT{" "}
                <span>({signed(metrics.percent ?? 0)}%)</span>
              </p>
            )}
          </div>
          <div className="period-buttons" aria-label={m.period}>
            {(["day", "week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                aria-pressed={range === r}
                onClick={() => {
                  setRange(r);
                  browserAnalytics()?.track("demo_period_change", r);
                }}
              >
                {m[r === "all" ? "allTime" : r]}
              </button>
            ))}
          </div>
        </div>
        {tab !== "exchanges" && (
          <div className="demo-chart">
            <div className="chart-labels">
              <span>{money(max)}</span>
              <span>{money(min)}</span>
            </div>
            <svg
              viewBox="0 0 800 180"
              preserveAspectRatio="none"
              role="img"
              aria-label={`${m.change}: ${signed(metrics?.delta ?? 0)} USDT`}
            >
              <defs>
                <linearGradient id="demo-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#78e2c1" stopOpacity=".22" />
                  <stop offset="100%" stopColor="#78e2c1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 30H800 M0 92H800 M0 155H800"
                stroke="#2d3746"
                strokeDasharray="4 7"
              />
              <polygon
                points={`0,180 ${points} 800,180`}
                fill="url(#demo-gradient)"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#78e2c1"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            </svg>
            <div className="chart-dates">
              <span>{snapshots[0] && date(snapshots[0].timestamp)}</span>
              <span>
                {snapshots.at(-1) && date(snapshots.at(-1)!.timestamp)}
              </span>
            </div>
          </div>
        )}
        {tab === "statistics" ? (
          <>
            <div className="stats-grid">
              {resultRows.map((r) => (
                <div className="stat-card" key={r.label}>
                  <span>{r.label}</span>
                  <strong>{money(r.value)}</strong>
                </div>
              ))}
            </div>
            <p className="demo-data-note">
              {m.flowComplete}. {m.manualFlowsNote}
            </p>
          </>
        ) : (
          <>
            <div className="demo-section-title">
              <h2>{tab === "overview" ? m.sources : m.wallets}</h2>
              <span>{m.allValues}</span>
            </div>
            <div className="demo-exchanges">
              {selected.map((a) => {
                const i = demo.accounts.findIndex((x) => x.id === a.id);
                const observation = demo.observations[a.id];
                const hist = periodHistory(
                  demo.history.filter(
                    (s) =>
                      s.scope.type === "account" && s.scope.accountId === a.id,
                  ),
                  range,
                  demo.now,
                  [a.id],
                );
                const change = periodMetrics(hist, [a.id]);
                return (
                  <details
                    className="demo-exchange"
                    key={a.id}
                    open={tab === "exchanges" ? true : undefined}
                  >
                    <summary>
                      <span
                        className="exchange-monogram"
                        style={{
                          color: colors[i],
                          background: `${colors[i]}12`,
                        }}
                      >
                        {labels[a.exchange][0]}
                      </span>
                      <div className="exchange-summary">
                        <strong>{labels[a.exchange]}</strong>
                        <div className="allocation-bar">
                          <span
                            style={{
                              width: `${(observation.balanceUSDT! / total) * 100}%`,
                              background: colors[i],
                            }}
                          />
                        </div>
                      </div>
                      <div className="exchange-amount">
                        <strong>{money(observation.balanceUSDT!)}</strong>
                        <span
                          className={
                            (change?.delta ?? 0) >= 0 ? "positive" : "negative"
                          }
                        >
                          {signed(change?.delta ?? 0)} USDT
                        </span>
                      </div>
                      <span className="exchange-expand" aria-hidden="true">
                        ⌄
                      </span>
                    </summary>
                    <div className="demo-wallets">
                      {observation.wallets.map((wallet) => {
                        const key = walletNameKey(wallet.name)?.replace(
                          "monitor.",
                          "",
                        ) as keyof typeof m | undefined;
                        return (
                          <div key={wallet.id}>
                            <span>{key ? m[key] : wallet.name}</span>
                            <strong>{money(wallet.balanceUSDT!)}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="demo-status">
        <FeatureIcon kind="shield" />
        <span>{m.demo}</span>
        <span>{m.allValues}</span>
      </div>
    </section>
  );
}
