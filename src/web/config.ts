// Store URLs come from the registered app IDs. A URL does not imply a public release.
export const SITE = {
  analyticsId: "G-BLV9ZEBKW9",
  origin: process.env.EXPO_PUBLIC_SITE_URL || "https://aircapital.app",
  appStore:
    process.env.EXPO_PUBLIC_APP_STORE_URL ||
    "https://apps.apple.com/app/id6792837154",
  googlePlay:
    process.env.EXPO_PUBLIC_GOOGLE_PLAY_URL ||
    "https://play.google.com/store/apps/details?id=tim.AirCapital",
  email: process.env.EXPO_PUBLIC_CONTACT_EMAIL || "timofii.shkabrov@gmail.com",
  telegram: process.env.EXPO_PUBLIC_TELEGRAM_URL || "",
};
export function publicLink(
  value: string,
  hosts?: string[],
): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return;
    if (hosts && !hosts.includes(url.hostname)) return;
    return url.href;
  } catch {
    return;
  }
}
export const storeLinks = {
  ios: publicLink(SITE.appStore, ["apps.apple.com"]),
  android: publicLink(SITE.googlePlay, ["play.google.com"]),
};
export const storeAvailability = {
  // Public storefront buttons: App Store is open; Google Play is coming soon.
  // Keep this consistent even on deployments with older release env values.
  ios: true,
  android: false,
};
export const contactEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(SITE.email)
  ? SITE.email
  : undefined;
export const telegramLink = publicLink(SITE.telegram, ["t.me"]);
export const siteOrigin = publicLink(SITE.origin)
  ? new URL(SITE.origin).origin
  : undefined;
