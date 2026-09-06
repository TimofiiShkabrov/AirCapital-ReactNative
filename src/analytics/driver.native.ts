import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { AnalyticsDriver } from './policy';
// Expo Go has no Firebase native module. Development builds never pollute production reports.
export const analyticsAvailable = !__DEV__ && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
const sdk = () => import('@react-native-firebase/analytics');
export const driver: AnalyticsDriver = {
  async consent(enabled) {
    if (!analyticsAvailable) return;
    const api = await sdk(), analytics = api.getAnalytics();
    if (!enabled) await api.setAnalyticsCollectionEnabled(analytics, false);
    await api.setConsent(analytics, {
      analytics_storage: enabled, ad_storage: false,
      ad_user_data: false, ad_personalization: false,
    });
    if (enabled) await api.setAnalyticsCollectionEnabled(analytics, true);
  },
  async reset() {
    if (!analyticsAvailable) return;
    const api = await sdk();
    await api.resetAnalyticsData(api.getAnalytics());
  },
  async screen(name) {
    if (!analyticsAvailable) return;
    const api = await sdk();
    await api.logScreenView(api.getAnalytics(), { screen_name: name, screen_class: 'AirCapital' });
  },
};
