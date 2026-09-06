import type { AnalyticsDriver } from './policy';
export const analyticsAvailable = false;
export const driver: AnalyticsDriver = {
  consent: async () => {}, reset: async () => {}, screen: async () => {},
};
