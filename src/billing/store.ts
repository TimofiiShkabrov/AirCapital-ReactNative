import { create } from "zustand";
import { billingDriver, type Offer, type BillingDriver } from "./driver";
import { billingEnabled, type Plan } from "./config";
import { hasPro, UNKNOWN_ACCESS, type Access } from "./policy";

/** Memory-only state. Receipts and the durable subscription cache belong to the native SDK. */
export function createBillingStore(driver: BillingDriver, enabled: boolean) {
  let initialized: Promise<void> | undefined;
  let refreshing: Promise<void> | undefined;
  let operation = false;
  let revision = 0;
  return create<{
    enabled: boolean; ready: boolean; busy: boolean; access: Access; offers: Offer[];
    message?: string; error?: string;
    refresh: () => Promise<void>; loadOffers: () => Promise<void>;
    purchase: (plan: Plan) => Promise<void>; restore: () => Promise<void>; manage: () => Promise<void>;
    tick: () => void;
  }>((set, get) => {
    const apply = (access: Access) => { revision++; set({ access, ready: true }); };
    const initialize = () => initialized ??= driver.initialize(apply).catch((e) => { initialized = undefined; throw e; });
    const run = async (work: () => Promise<void>) => {
      if (operation) return;
      if (!enabled || !driver.available) { set({ ready: true, error: "billingUnavailable" }); return; }
      operation = true;
      set({ busy: true, message: undefined, error: undefined });
      try { await initialize(); await work(); }
      catch { set({ error: "billingError" }); }
      finally { operation = false; set({ busy: false }); }
    };
    return {
      enabled, ready: !enabled, busy: false, access: UNKNOWN_ACCESS, offers: [],
      tick: () => {
        const access = get().access;
        if (access.tier !== "unknown" && (Date.now() >= access.validUntil || Date.now() < access.checkedAt - 300000))
          set({ access: UNKNOWN_ACCESS });
      },
      refresh: () => {
        if (!enabled) return Promise.resolve();
        if (refreshing) return refreshing;
        refreshing = (async () => {
          try {
            if (!driver.available) throw new Error("billingUnavailable");
            await initialize();
            const started = revision;
            const access = await driver.customer();
            // A purchase/restore/listener update has priority over an earlier refresh result.
            if (started === revision) apply(access);
            set({ error: get().access.tier === "unknown" ? "billingUnavailable" : undefined });
          } catch {
            get().tick();
            set({ ready: true, error: "billingUnavailable" });
          }
        })().finally(() => { refreshing = undefined; });
        return refreshing;
      },
      loadOffers: () => run(async () => {
        await get().refresh();
        const offers = await driver.offers();
        set({ offers, error: offers.length === 2 && get().access.tier !== "unknown" ? undefined : "billingUnavailable" });
      }),
      purchase: (plan) => run(async () => {
        // Prevent a second subscription checkout when a subscription already exists.
        await get().refresh();
        if (!get().ready || get().access.tier === "unknown") throw new Error("billingUnavailable");
        if (hasPro(get().access)) { await driver.manage(); return; }
        revision++;
        const result = await driver.purchase(plan);
        if (result.status) {
          set({ message: result.status === "pending" ? "billingPending" : undefined });
          return;
        }
        apply(result.access);
        set({ message: hasPro(result.access) ? "billingActivated" : "billingPending" });
      }),
      restore: () => run(async () => {
        revision++;
        const result = await driver.restore();
        apply(result.access);
        set({ message: hasPro(result.access) ? "billingActivated" : result.access.tier === "unknown" ? "billingPending" : "billingNothingToRestore" });
      }),
      manage: () => run(async () => { await driver.manage(); await get().refresh(); }),
    };
  });
}
export const useBillingStore = createBillingStore(billingDriver, billingEnabled);
export const proAccess = () => !useBillingStore.getState().enabled || hasPro(useBillingStore.getState().access);
export const requirePro = () => {
  if (!proAccess()) throw new Error("proRequired");
};
