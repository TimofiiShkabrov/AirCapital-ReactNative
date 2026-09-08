import { NativeModules, Platform, Linking } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import type { BillingDriver, Offer } from "./driver";
import { BILLING, billingEnabled, publicSdkKey } from "./config";
import { accessFromCustomer, UNKNOWN_ACCESS } from "./policy";

const key = publicSdkKey(Platform.OS);
let sdk: typeof import("react-native-purchases") | undefined;
let configured = false;
async function purchases() {
  if (!key || !NativeModules.RNPurchases) throw new Error("billingUnavailable");
  sdk ??= await import("react-native-purchases");
  if (!configured) {
    sdk.default.configure({
      apiKey: key,
      entitlementVerificationMode: sdk.default.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
      automaticDeviceIdentifierCollectionEnabled: false,
      diagnosticsEnabled: false,
    });
    configured = true;
  }
  return sdk;
}
async function packages() {
  const { default: rc } = await purchases();
  const offering = (await rc.getOfferings()).all[BILLING.offering];
  if (!offering) throw new Error("billingUnavailable");
  const catalog = Platform.OS === "ios" ? BILLING.ios : BILLING.android;
  return (["monthly", "annual"] as const).flatMap((plan) => {
    const item = plan === "monthly" ? offering.monthly : offering.annual;
    if (!item || item.product.identifier !== catalog[plan] ||
        item.product.subscriptionPeriod !== (plan === "monthly" ? "P1M" : "P1Y") ||
        !Number.isFinite(item.product.price) || item.product.price <= 0) return [];
    // No trial/introductory offer is advertised by this paywall. Use the regular base plan on Android.
    if (Platform.OS === "ios" && item.product.introPrice) return [];
    if (Platform.OS === "android" && !item.product.defaultOption?.isBasePlan) return [];
    return [{ plan, item }];
  });
}
async function buy(item: PurchasesPackage) {
  const { default: rc } = await purchases();
  if (Platform.OS === "android") {
    const base = item.product.subscriptionOptions?.find((option) => option.isBasePlan);
    if (!base) throw new Error("billingUnavailable");
    return rc.purchaseSubscriptionOption(base);
  }
  return rc.purchasePackage(item);
}
export const billingDriver: BillingDriver = {
  available: billingEnabled && !!key && !!NativeModules.RNPurchases,
  initialize: async (onUpdate) => {
    const { default: rc } = await purchases();
    rc.addCustomerInfoUpdateListener((info) => onUpdate(accessFromCustomer(info)));
  },
  customer: async () => accessFromCustomer(await (await purchases()).default.getCustomerInfo()),
  offers: async () => (await packages()).map(({ plan, item }): Offer => ({
    plan, price: item.product.price, priceString: item.product.priceString,
    currency: item.product.currencyCode,
    monthlyEquivalent: plan === "annual" ? item.product.pricePerMonthString ?? undefined : undefined,
  })),
  purchase: async (plan) => {
    try {
      // Fetch the store product again just before checkout; don't persist native product objects.
      const entry = (await packages()).find((p) => p.plan === plan);
      if (!entry) throw new Error("billingUnavailable");
      return { access: accessFromCustomer((await buy(entry.item)).customerInfo) };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (sdk && code === sdk.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
        return { access: UNKNOWN_ACCESS, status: "cancelled" };
      if (sdk && code === sdk.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR)
        return { access: UNKNOWN_ACCESS, status: "pending" };
      throw new Error("billingError");
    }
  },
  restore: async () => ({ access: accessFromCustomer(await (await purchases()).default.restorePurchases()) }),
  manage: async () => {
    if (Platform.OS === "ios") await (await purchases()).default.showManageSubscriptions();
    else await Linking.openURL("https://play.google.com/store/account/subscriptions?package=tim.AirCapital&sku=aircapital_pro");
  },
};
