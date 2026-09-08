/** Build-time launch switch. Never ship enabled until the store catalog is tested. */
export const billingEnabled = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED === "true";
export const BILLING = {
  entitlement: "aircapital_pro",
  offering: "aircapital",
  freeConnections: 2,
  freeHistoryDays: 30,
  ios: { monthly: "tim.AirCapital.pro.monthly", annual: "tim.AirCapital.pro.annual" },
  android: { monthly: "aircapital_pro:monthly", annual: "aircapital_pro:annual" },
} as const;
export type Plan = "monthly" | "annual";

export function publicSdkKey(platform: string): string | undefined {
  const key = platform === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : platform === "android" ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : undefined;
  // Reject secret keys, test-store keys and cross-platform configuration.
  const prefix = platform === "ios" ? "appl_" : "goog_";
  return key && key.startsWith(prefix) && /^[a-zA-Z0-9_]+$/.test(key) ? key : undefined;
}
