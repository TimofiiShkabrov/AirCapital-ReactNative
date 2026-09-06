export type Consent = "accepted" | "declined";
export type SiteEvent =
  | "demo_open"
  | "demo_tab_change"
  | "demo_period_change"
  | "download_click"
  | "contact_click";
export const CONSENT_KEY = "aircapital.web.analytics.v1";
const TTL = 180 * 24 * 60 * 60 * 1000;
export const denial = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};
export interface AnalyticsEnvironment {
  hostname: string;
  production: boolean;
  location: string;
  referrer: string;
  title: string;
  now(): number;
  read(): string | null;
  write(value: string): void;
  command(...args: unknown[]): void;
  load(id: string): void;
  disable(value: boolean): void;
  clearCookies(): void;
}
export function analyticsAllowed(host: string, production: boolean) {
  return (
    production &&
    !!host &&
    !/^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[?::1\]?)$/.test(host) &&
    !/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  );
}
export function safePageUrl(value: string, campaign = false) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    const clean = new URL(url.origin + url.pathname);
    if (campaign)
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ]) {
        const v = url.searchParams.get(key);
        if (v && v.length <= 150 && !v.includes("@"))
          clean.searchParams.set(key, v);
      }
    return clean.href;
  } catch {
    return "";
  }
}
export function savedConsent(
  value: string | null,
  now: number,
): Consent | undefined {
  try {
    const item = JSON.parse(value || "null");
    if (
      item &&
      (item.choice === "accepted" || item.choice === "declined") &&
      typeof item.at === "number" &&
      item.at <= now &&
      now - item.at < TTL
    )
      return item.choice;
  } catch {
    /* Private browsing or an invalid stored preference must not grant consent. */
  }
}
export function createAnalytics(env: AnalyticsEnvironment, id: string) {
  let consent: Consent | undefined;
  let configured = false;
  let defaults = false;
  const allowed = analyticsAllowed(env.hostname, env.production);
  const activate = () => {
    if (!allowed || consent !== "accepted") return;
    env.disable(false);
    if (!defaults) {
      env.command("consent", "default", denial);
      defaults = true;
    }
    env.command("consent", "update", {
      ...denial,
      analytics_storage: "granted",
    });
    if (configured) return;
    configured = true;
    env.command("js", new Date(env.now()));
    // Links use full document navigation. The config command owns the only page_view.
    // Never add a manual route page_view alongside this automatic measurement.
    env.command("config", id, {
      send_page_view: true,
      page_location: safePageUrl(env.location, true),
      page_referrer: safePageUrl(env.referrer),
      page_title: env.title,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_flags: "SameSite=Lax;Secure",
    });
    env.load(id);
  };
  return {
    initialize() {
      try {
        consent = savedConsent(env.read(), env.now());
      } catch {
        consent = undefined;
      }
      env.disable(!allowed || consent !== "accepted");
      activate();
      return consent;
    },
    choose(choice: Consent) {
      consent = choice;
      try {
        env.write(JSON.stringify({ choice, at: env.now() }));
      } catch {
        /* Keep the choice in memory if storage is unavailable. */
      }
      if (choice === "accepted") activate();
      else {
        env.disable(true);
        if (configured) env.command("consent", "update", denial);
        env.clearCookies();
      }
    },
    track(event: SiteEvent, value?: string) {
      if (!allowed || consent !== "accepted" || !configured) return;
      const permitted: Record<SiteEvent, string[]> = {
        demo_open: ["header", "hero", "footer", "download"],
        demo_tab_change: ["overview", "exchanges", "statistics"],
        demo_period_change: ["day", "week", "month", "all"],
        download_click: ["ios", "android"],
        contact_click: ["email", "telegram"],
      };
      if (!permitted[event] || (value && !permitted[event].includes(value)))
        return;
      env.command("event", event, {
        ...(value ? { action: value } : {}),
        transport_type: "beacon",
        send_to: id,
      });
    },
  };
}
