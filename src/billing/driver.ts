import type { Access } from "./policy";
import type { Plan } from "./config";
export type Offer = { plan: Plan; price: number; priceString: string; currency: string; monthlyEquivalent?: string };
export type BillingResult = { access: Access; status?: "cancelled" | "pending" };
export interface BillingDriver {
  available: boolean;
  initialize: (onUpdate: (access: Access) => void) => Promise<void>;
  customer: () => Promise<Access>;
  offers: () => Promise<Offer[]>;
  purchase: (plan: Plan) => Promise<BillingResult>;
  restore: () => Promise<BillingResult>;
  manage: () => Promise<void>;
}
const unavailable = async (): Promise<never> => { throw new Error("billingUnavailable"); };
// Web/SSR and Expo Go never simulate a successful purchase.
export const billingDriver: BillingDriver = {
  available: false, initialize: unavailable, customer: unavailable, offers: unavailable,
  purchase: unavailable, restore: unavailable, manage: unavailable,
};
