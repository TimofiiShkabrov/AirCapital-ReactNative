import React, { useEffect } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { privacySession } from '../services/privacySession';
import { useMonitorTheme } from '../components/monitor/theme';
import { Action, Heading, Label } from '../components/monitor/primitives';
import { SettingsRow } from '../components/monitor/SettingsGroup';
import { analyticsAvailable, appAnalytics, useAnalyticsConsent } from './store';
import { screenForPath } from './policy';

export function AnalyticsConsentSetting() {
  const state = useAnalyticsConsent(), { t } = useTranslation();
  if (!analyticsAvailable) return null;
  return <View>
    <SettingsRow title={t('monitor.analyticsTitle')} subtitle={t('monitor.analyticsBody')} icon="stats-chart-outline">
      <Switch accessibilityLabel={t('monitor.analyticsTitle')} value={state.consent === 'accepted'} disabled={!state.ready || state.busy} onValueChange={v => void state.choose(v)} />
    </SettingsRow>
    {state.error && <Label>{t('monitor.storageError')}</Label>}
  </View>;
}

export function AnalyticsBoundary({ children }: { children: React.ReactNode }) {
  const state = useAnalyticsConsent(), session = useStore(privacySession.store);
  const hydrate = state.hydrate;
  const path = usePathname(), c = useMonitorTheme(), { t } = useTranslation();
  const visible = session.ready && session.appState === 'active' && (!session.enabled || session.unlocked);
  useEffect(() => { if (analyticsAvailable) void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!analyticsAvailable) return;
    void appAnalytics.visibility(visible && state.ready).catch(() => {});
  }, [visible, state.ready, state.consent]);
  useEffect(() => {
    const screen = path === "/" ? undefined : screenForPath(path);
    if (analyticsAvailable && screen) void appAnalytics.screen(screen).catch(() => {});
  }, [path, state.consent]);
  const prompt = analyticsAvailable && state.ready && state.consent === 'unknown';
  return <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }} pointerEvents={prompt ? 'none' : 'auto'} accessibilityElementsHidden={prompt} importantForAccessibility={prompt ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {prompt && <View accessibilityViewIsModal style={{ position: 'absolute', inset: 0, backgroundColor: c.bg, justifyContent: 'center', padding: 24 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 480, padding: 24, borderRadius: 24, backgroundColor: c.panel, gap: 18 }}>
          <Heading>{t('monitor.analyticsTitle')}</Heading>
          <Label>{t('monitor.analyticsBody')}</Label>
          <Action label={t('monitor.analyticsAllow')} disabled={state.busy} onPress={() => void state.choose(true)} />
          <Action label={t('monitor.analyticsDecline')} disabled={state.busy} onPress={() => void state.choose(false)} />
          {state.busy && <Label>{t('monitor.processing')}</Label>}
          {state.error && <Label>{t('monitor.storageError')}</Label>}
        </View>
      </ScrollView>
    </View>}
  </View>;
}
