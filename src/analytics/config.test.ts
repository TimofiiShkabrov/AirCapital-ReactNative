import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('ships matching native Firebase configurations and denies collection by default', () => {
  const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  const plist = readFileSync(app.ios.googleServicesFile, 'utf8');
  expect(plist).toContain('<string>tim.AirCapital</string>');
  expect(plist).toContain('<string>1:718518593608:ios:bd0f33afb95853c085107d</string>');
  expect(app.android.package).toBe('tim.AirCapital');
  const android = JSON.parse(readFileSync(app.android.googleServicesFile, 'utf8'));
  expect(android.project_info.project_id).toBe('aircapital-web');
  expect(android.project_info.project_number).toBe('718518593608');
  expect(android.client.some((client: {client_info: {android_client_info: {package_name: string}}}) => client.client_info.android_client_info.package_name === app.android.package)).toBe(true);
  const flags = JSON.parse(readFileSync('firebase.json', 'utf8'))['react-native'];
  for (const key of ['analytics_auto_collection_enabled', 'analytics_idfv_collection_enabled', 'google_analytics_adid_collection_enabled', 'google_analytics_ssaid_collection_enabled', 'analytics_default_allow_analytics_storage', 'analytics_default_allow_ad_storage', 'analytics_default_allow_ad_user_data', 'analytics_default_allow_ad_personalization_signals', 'google_analytics_automatic_screen_reporting_enabled', 'google_analytics_registration_with_ad_network_enabled']) expect(flags[key], key).toBe(false);
  expect(app.plugins).toContainEqual(['@react-native-firebase/app', { ios: { disableSPM: true } }]);
  expect(app.plugins).toContainEqual(['@react-native-firebase/analytics', { ios: { withoutAdIdSupport: true } }]);
  expect(app.android.blockedPermissions).toContain('com.google.android.gms.permission.AD_ID');
});
