// Isolated fixture: uses the real native screen and demo model without changing production routes.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const target = path.join(root, 'tmp/store-capture');
fs.mkdirSync(path.join(target, 'app'), { recursive: true });
for (const name of ['src', 'assets', 'vendor']) fs.cpSync(path.join(root, name), path.join(target, name), { recursive: true });
if (!fs.existsSync(path.join(target, 'node_modules'))) fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'dir');
fs.copyFileSync(path.join(root, 'tsconfig.json'), path.join(target, 'tsconfig.json'));
fs.writeFileSync(path.join(target, 'metro.config.js'), `const { getDefaultConfig } = require('expo/metro-config'); const config = getDefaultConfig(__dirname); config.watchFolders = [${JSON.stringify(root)}]; module.exports = config;`);
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'aircapital-store-capture', private: true, main: 'expo-router/entry' }));
fs.writeFileSync(path.join(target, 'app.json'), JSON.stringify({ expo: { name: 'AirCapital capture', slug: 'aircapital-capture', platforms: ['web'], web: { bundler: 'metro', output: 'single' }, plugins: ['expo-router'] } }));
const source = fs.readFileSync(path.join(root, 'app/index.tsx'), 'utf8');
const fixture = source
  .replace('useState<MonitorPage>("overview")', 'useState<MonitorPage>((new URLSearchParams(window.location.search).get("screen") || "overview") as MonitorPage)')
  .replace('[demoMode, setDemoMode] = useState(false)', '[demoMode, setDemoMode] = useState(true)')
  .replace('createDemo(Date.now())', 'createDemo(Date.UTC(2026, 8, 6, 12))');
for (const check of ['new URLSearchParams', 'setDemoMode] = useState(true)', 'Date.UTC(2026']) if (!fixture.includes(check)) throw new Error('Capture patch no longer matches: ' + check);
fs.writeFileSync(path.join(target, 'app/index.tsx'), fixture);
fs.writeFileSync(path.join(target, 'app/_layout.tsx'), `import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import i18n from '../src/i18n';
import { useSettingsStore } from '../src/store/settingsStore';
export default function Layout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
    i18n.changeLanguage(lang).then(() => {
      useSettingsStore.setState({ language: lang, theme: 'dark', hydrated: true });
      setReady(true);
    });
  }, []);
  return ready ? <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#10151f' }, animation: 'none' }} /> : null;
}`);
// The capture fixture never sends analytics, and has no production website entrypoint.
fs.writeFileSync(path.join(target, 'src/analytics/store.ts'), 'export const analyticsAvailable = false; export const revokeAnalyticsForDeletion = async () => {}; export const appAnalytics = { screen: async () => {}, event: async () => {} };');
console.log(target);
