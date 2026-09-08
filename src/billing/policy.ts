import type { CustomerInfo } from "react-native-purchases";
import type { ExchangeAccount, ChartRange } from "../types/common";
import { BILLING } from "./config";

export type Access = {
  tier: "free" | "pro" | "unknown";
  checkedAt: number;
  validUntil: number;
  expiresAt?: number;
  renewal?: "renewing" | "ending" | "billingIssue";
};
export const UNKNOWN_ACCESS: Access = { tier: "unknown", checkedAt: 0, validUntil: 0 };
export const MAX_OFFLINE_MS = 3 * 86400000;
const verified = (value: string) => value === "VERIFIED" || value === "VERIFIED_ON_DEVICE";

/** Only call with CustomerInfo returned by the native SDK; never hydrate from app storage. */
export function accessFromCustomer(info: CustomerInfo, now = Date.now()): Access {
  const checkedAt = Date.parse(info.requestDate);
  if (!verified(info.entitlements.verification) || !Number.isFinite(checkedAt) ||
      checkedAt > now + 300000 || now - checkedAt >= MAX_OFFLINE_MS) return UNKNOWN_ACCESS;
  const entitlement = info.entitlements.active[BILLING.entitlement];
  const validUntil = checkedAt + MAX_OFFLINE_MS;
  if (!entitlement?.isActive) return { tier: "free", checkedAt, validUntil };
  if (!verified(entitlement.verification) ||
      !["APP_STORE", "PLAY_STORE"].includes(entitlement.store)) return UNKNOWN_ACCESS;
  const sku = entitlement.productIdentifier;
  if (![...Object.values(BILLING.ios), ...Object.values(BILLING.android), "aircapital_pro"].includes(sku))
    return UNKNOWN_ACCESS;
  const subscription = info.subscriptionsByProductIdentifier?.[sku];
  const expiration = Date.parse(entitlement.expirationDate ?? "");
  const grace = Date.parse(subscription?.gracePeriodExpiresDate ?? "");
  // Grace is decided by the store. Never turn a billing error into a free subscription ourselves.
  const expiresAt = Math.max(Number.isFinite(expiration) ? expiration : 0, Number.isFinite(grace) ? grace : 0);
  if (!expiresAt) return UNKNOWN_ACCESS; // This catalog contains renewable subscriptions only.
  return {
    tier: expiresAt > now ? "pro" : "unknown",
    checkedAt,
    validUntil: Math.min(validUntil, expiresAt),
    expiresAt,
    renewal: entitlement.billingIssueDetectedAt ? "billingIssue" : entitlement.willRenew ? "renewing" : "ending",
  };
}
export function hasPro(access: Access, now = Date.now()) {
  return access.tier === "pro" && now >= access.checkedAt - 300000 && now < access.validUntil;
}
export const effectiveRange = (range: ChartRange, pro: boolean): ChartRange =>
  !pro && range === "all" ? "month" : range;

/** Selection is a preference, never an entitlement. Missing/invalid IDs cannot expand the limit. */
export function monitoredAccountIds(accounts: ExchangeAccount[], pro: boolean, preferred: string[]) {
  const eligible = accounts.filter((a) => a.state !== "deletionPending");
  if (pro) return new Set(eligible.map((a) => a.id));
  const ids = new Set(eligible.map((a) => a.id));
  const chosen = [...new Set(preferred)].filter((id) => ids.has(id)).slice(0, BILLING.freeConnections);
  const oldest = [...eligible].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
  for (const account of oldest) {
    if (chosen.length >= BILLING.freeConnections) break;
    if (!chosen.includes(account.id)) chosen.push(account.id);
  }
  return new Set(chosen);
}
