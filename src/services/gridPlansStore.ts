import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GridPlan } from '../trading/types';

const GRID_PLANS_KEY = 'aircapital.trading.gridPlans.v2';
const LEGACY_OKX_GRID_PLANS_KEY = 'aircapital.okx.gridPlans.v1';

export async function loadGridPlans(): Promise<GridPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(GRID_PLANS_KEY);
    if (!raw) {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_OKX_GRID_PLANS_KEY);
      const legacyPlans: GridPlan[] = legacyRaw ? JSON.parse(legacyRaw) : [];
      if (legacyPlans.length > 0) {
        await AsyncStorage.setItem(GRID_PLANS_KEY, JSON.stringify(legacyPlans));
      }
      return legacyPlans.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const plans: GridPlan[] = JSON.parse(raw);
    return plans.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export async function saveGridPlan(plan: GridPlan): Promise<void> {
  const plans = await loadGridPlans();
  const next = [plan, ...plans.filter((item) => item.id !== plan.id)].slice(0, 50);
  await AsyncStorage.setItem(GRID_PLANS_KEY, JSON.stringify(next));
}

export async function updateGridPlan(
  planId: string,
  updater: (plan: GridPlan) => GridPlan,
): Promise<GridPlan[]> {
  const plans = await loadGridPlans();
  const next = plans.map((plan) => (plan.id === planId ? updater(plan) : plan));
  await AsyncStorage.setItem(GRID_PLANS_KEY, JSON.stringify(next));
  return next;
}
