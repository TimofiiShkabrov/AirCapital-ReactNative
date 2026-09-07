import { describe, expect, it, vi } from "vitest";
import {
  analyticsAllowed,
  createAnalytics,
  denial,
  safePageUrl,
  savedConsent,
  type AnalyticsEnvironment,
} from "./analytics";
const now = Date.UTC(2026, 8, 6);
function fixture(options: Partial<AnalyticsEnvironment> = {}) {
  let storage: string | null = null;
  const env: AnalyticsEnvironment = {
    hostname: "aircapital.test",
    production: true,
    location:
      "https://aircapital.test/demo?secret=never-send&utm_source=newsletter#private",
    referrer: "https://referrer.test/page?email=private@example.org",
    title: "Demo · AirCapital",
    now: () => now,
    read: () => storage,
    write: (v) => {
      storage = v;
    },
    command: vi.fn(),
    load: vi.fn(),
    disable: vi.fn(),
    clearCookies: vi.fn(),
    ...options,
  };
  return { env, client: createAnalytics(env, "G-BLV9ZEBKW9") };
}
describe("website consent and GA4", () => {
  it("makes no Google calls before consent or after an initial refusal", () => {
    const { env, client } = fixture();
    expect(client.initialize()).toBeUndefined();
    client.track("demo_open", "hero");
    client.choose("declined");
    client.track("demo_open", "hero");
    expect(env.command).not.toHaveBeenCalled();
    expect(env.load).not.toHaveBeenCalled();
    expect(env.disable).toHaveBeenLastCalledWith(true);
    expect(JSON.parse(env.read()!).choice).toBe("declined");
  });
  it("initializes one automatic page view per document, even when mounted twice", () => {
    const { env, client } = fixture();
    client.initialize();
    client.choose("accepted");
    client.initialize();
    client.choose("accepted");
    const calls = vi.mocked(env.command).mock.calls;
    expect(calls.filter((c) => c[0] === "config")).toHaveLength(1);
    expect(
      calls.filter((c) => c[0] === "event" && c[1] === "page_view"),
    ).toHaveLength(0);
    expect(env.load).toHaveBeenCalledExactlyOnceWith("G-BLV9ZEBKW9");
    expect(calls[0]).toEqual(["consent", "default", denial]);
    expect(calls[1]).toEqual([
      "consent",
      "update",
      { ...denial, analytics_storage: "granted" },
    ]);
    expect(calls.find((c) => c[0] === "config")?.[2]).toMatchObject({
      send_page_view: true,
      page_location: "https://aircapital.test/demo?utm_source=newsletter",
      page_referrer: "https://referrer.test/page",
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  });
  it("restores accepted consent on the next document and counts that page once", () => {
    const { env, client } = fixture();
    client.initialize();
    client.choose("accepted");
    const next = fixture({ read: env.read });
    expect(next.client.initialize()).toBe("accepted");
    expect(
      vi.mocked(next.env.command).mock.calls.filter((c) => c[0] === "config"),
    ).toHaveLength(1);
  });
  it("revokes consent, removes GA cookies and stops subsequent interactions", () => {
    const { env, client } = fixture();
    client.initialize();
    client.choose("accepted");
    client.track("demo_tab_change", "statistics");
    client.choose("declined");
    const count = vi.mocked(env.command).mock.calls.length;
    client.track("demo_period_change", "week");
    expect(env.command).toHaveBeenCalledTimes(count);
    expect(env.disable).toHaveBeenLastCalledWith(true);
    expect(env.clearCookies).toHaveBeenCalledOnce();
    expect(env.command).toHaveBeenLastCalledWith("consent", "update", denial);
    client.choose("accepted");
    expect(env.load).toHaveBeenCalledOnce();
  });
  it("does not leak arbitrary event parameters or financial values", () => {
    const { env, client } = fixture();
    client.choose("accepted");
    client.track("demo_period_change", "week");
    client.track("demo_period_change", "48620");
    client.track("contact_click", "name@example.com");
    client.track("download_click", "ios");
    client.track("store_open", "android");
    client.track("store_open", "tim.AirCapital");
    const events = vi
      .mocked(env.command)
      .mock.calls.filter((c) => c[0] === "event");
    expect(events).toHaveLength(3);
    expect(events[2]).toEqual([
      "event",
      "store_open",
      { action: "android", transport_type: "beacon", send_to: "G-BLV9ZEBKW9" },
    ]);
    expect(events[0]).toEqual([
      "event",
      "demo_period_change",
      { action: "week", transport_type: "beacon", send_to: "G-BLV9ZEBKW9" },
    ]);
  });
  it.each([
    "localhost",
    "app.localhost",
    "127.0.0.1",
    "192.168.1.5",
    "10.0.0.2",
    "172.31.0.2",
    "::1",
    "[::1]",
  ])("never tracks local host %s", (hostname) => {
    const { env, client } = fixture({ hostname });
    client.choose("accepted");
    client.track("demo_open", "hero");
    expect(env.load).not.toHaveBeenCalled();
    expect(env.command).not.toHaveBeenCalled();
  });
  it("disables all analytics in development", () => {
    expect(analyticsAllowed("aircapital.test", false)).toBe(false);
    const { env, client } = fixture({ production: false });
    client.choose("accepted");
    expect(env.load).not.toHaveBeenCalled();
  });
  it("fails closed when storage is unavailable and still accepts an explicit choice", () => {
    const { env, client } = fixture({
      read: () => {
        throw Error("blocked");
      },
      write: () => {
        throw Error("blocked");
      },
    });
    expect(client.initialize()).toBeUndefined();
    expect(env.load).not.toHaveBeenCalled();
    client.choose("accepted");
    expect(env.load).toHaveBeenCalledOnce();
  });
  it("rejects expired, future and corrupt consent", () => {
    for (const raw of [
      null,
      "invalid",
      JSON.stringify({ choice: "accepted" }),
      JSON.stringify({ choice: "accepted", at: now + 1 }),
      JSON.stringify({ choice: "accepted", at: now - 180 * 86400000 }),
    ])
      expect(savedConsent(raw, now)).toBeUndefined();
    expect(
      savedConsent(JSON.stringify({ choice: "declined", at: now }), now),
    ).toBe("declined");
  });
  it("strips private URL data and keeps only bounded campaign tags", () => {
    expect(safePageUrl("https://site.test/demo?apiKey=secret#token")).toBe(
      "https://site.test/demo",
    );
    expect(
      safePageUrl(
        "https://site.test/?utm_source=mail&utm_term=person%40example.org&utm_campaign=" +
          "x".repeat(151),
        true,
      ),
    ).toBe("https://site.test/?utm_source=mail");
    expect(safePageUrl("javascript:alert(1)")).toBe("");
  });
});
