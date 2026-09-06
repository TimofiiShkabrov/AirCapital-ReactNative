// Public launch details. Leave unavailable channels empty; never link to guessed listings.
export const SITE = {
  analyticsId: "G-BLV9ZEBKW9",
  origin: process.env.EXPO_PUBLIC_SITE_URL || "",
  appStore: process.env.EXPO_PUBLIC_APP_STORE_URL || "",
  googlePlay: process.env.EXPO_PUBLIC_GOOGLE_PLAY_URL || "",
  email: process.env.EXPO_PUBLIC_CONTACT_EMAIL || "",
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
export const contactEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(SITE.email)
  ? SITE.email
  : undefined;
export const telegramLink = publicLink(SITE.telegram, ["t.me"]);
export const siteOrigin = publicLink(SITE.origin)
  ? new URL(SITE.origin).origin
  : undefined;
