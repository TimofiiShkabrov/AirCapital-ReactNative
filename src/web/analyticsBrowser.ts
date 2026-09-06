import { createAnalytics, CONSENT_KEY } from "./analytics";
import { SITE } from "./config";

type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
let client: ReturnType<typeof createAnalytics> | undefined;
export function browserAnalytics() {
  if (typeof window === "undefined") return;
  if (client) return client;
  const win = window as TagWindow;
  // Stable report titles do not depend on the timing of language hydration.
  const titles: Record<string, string> = {
    "/": "AirCapital · Crypto portfolio overview",
    "/demo": "Demo · AirCapital",
    "/faq": "FAQ · AirCapital",
    "/contact": "Contact · AirCapital",
  };
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const send = (...args: unknown[]) => {
    win.dataLayer ||= [];
    win.gtag ||= function () {
      win.dataLayer!.push(arguments);
    };
    win.gtag(...args);
  };
  client = createAnalytics(
    {
      hostname: window.location.hostname,
      production: !__DEV__ && !!titles[path],
      location: window.location.href,
      referrer: document.referrer,
      title: titles[path] || document.title,
      now: Date.now,
      read: () => localStorage.getItem(CONSENT_KEY),
      write: (value) => localStorage.setItem(CONSENT_KEY, value),
      command: send,
      load: (id) => {
        if (document.getElementById("aircapital-google-tag")) return;
        const script = document.createElement("script");
        script.id = "aircapital-google-tag";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        document.head.appendChild(script);
      },
      disable: (value) => {
        (win as unknown as Record<string, unknown>)[
          `ga-disable-${SITE.analyticsId}`
        ] = value;
      },
      clearCookies: () => {
        const domains = location.hostname
          .split(".")
          .map((_, i, parts) => parts.slice(i).join("."));
        for (const item of document.cookie.split(";")) {
          const name = item.split("=")[0].trim();
          if (!/^_ga(?:_|$)/.test(name)) continue;
          document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
          for (const domain of domains)
            document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
        }
      },
    },
    SITE.analyticsId,
  );
  return client;
}
