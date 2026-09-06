import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createAnalyticsPolicy, type Consent } from './policy';
import { analyticsAvailable, driver } from './driver';
export { analyticsAvailable };
export const appAnalytics = createAnalyticsPolicy(driver, AsyncStorage);
let hydration: Promise<void> | undefined;
export const useAnalyticsConsent = create<{
  consent: Consent; ready: boolean; busy: boolean; error: boolean;
  hydrate(): Promise<void>; choose(enabled: boolean): Promise<void>;
}>((set, get) => ({
  consent: 'unknown', ready: false, busy: false, error: false,
  hydrate() {
    if (!hydration) hydration = appAnalytics.hydrate().then(
      consent => { set({ consent, ready: true }); },
      () => { set({ ready: true, error: true }); },
    );
    return hydration;
  },
  async choose(enabled) {
    if (get().busy) return;
    set({ busy: true, error: false });
    try { set({ consent: await appAnalytics.choose(enabled) }); }
    catch { set({ consent: 'declined', error: true }); }
    finally { set({ busy: false }); }
  },
}));

/** Delete-all must supersede an in-flight enable, not skip a busy toggle. */
export async function revokeAnalyticsForDeletion() {
  await appAnalytics.choose(false);
  useAnalyticsConsent.setState({ consent: 'declined', error: false });
}
