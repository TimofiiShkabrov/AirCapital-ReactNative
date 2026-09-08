import React, { useEffect, useReducer, useRef } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, View } from 'react-native';
import { publicLegalReady, PRIVACY_URL } from '../privacy/publicDocuments';
import { usePathname } from 'expo-router';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { privacySession } from '../services/privacySession';
import { useMonitorTheme } from '../components/monitor/theme';
import { Label, Toggle } from '../components/monitor/primitives';
import { SettingsRow } from '../components/monitor/SettingsGroup';
import { analyticsAvailable, appAnalytics, useAnalyticsConsent } from './store';
import { screenForPath } from './policy';

export function AnalyticsConsentSetting() {
  const state = useAnalyticsConsent(), { t } = useTranslation();
  if (!analyticsAvailable) return null;
  return <View>
    <SettingsRow title={t('monitor.analyticsTitle')} subtitle={t('monitor.analyticsBody')} icon="stats-chart-outline">
      <Toggle accessibilityLabel={t('monitor.analyticsTitle')} value={state.consent === 'accepted'} disabled={!state.ready || state.busy} onValueChange={v => void state.choose(v)} />
    </SettingsRow>
    {state.error && <Label>{t('monitor.storageError')}</Label>}
  </View>;
}

export function AnalyticsBoundary({ children }: { children: React.ReactNode }) {
  const state = useAnalyticsConsent(), session = useStore(privacySession.store);
  const chooseConsent = state.choose;
  const hydrate = state.hydrate;
  const path = usePathname(), c = useMonitorTheme(), { t } = useTranslation();
  const dialog = useRef<'idle' | 'shown' | 'openingPrivacy' | 'readingPrivacy' | 'answered'>('idle');
  const [retry, retryPrompt] = useReducer((value: number) => value + 1, 0);
  const visible = session.ready && session.appState === 'active' && (!session.enabled || session.unlocked);
  useEffect(() => { if (analyticsAvailable) void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!analyticsAvailable) return;
    const subscription = AppState.addEventListener('change', next => {
      // Reading the policy is not a consent decision. Reopen only on return
      // from the browser, not on the native alert's own inactive/active events.
      if (next === 'background' && dialog.current === 'openingPrivacy') dialog.current = 'readingPrivacy';
      if (next === 'active' && dialog.current === 'readingPrivacy') {
        dialog.current = 'idle';
        retryPrompt();
      }
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!analyticsAvailable) return;
    void appAnalytics.visibility(visible && state.ready).catch(() => {});
  }, [visible, state.ready, state.consent]);
  useEffect(() => {
    const screen = path === "/" ? undefined : screenForPath(path);
    if (analyticsAvailable && screen) void appAnalytics.screen(screen).catch(() => {});
  }, [path, state.consent]);
  useEffect(() => {
    if (!analyticsAvailable || !visible || session.busy || !state.ready || state.busy || state.consent !== 'unknown') return;
    const frame = requestAnimationFrame(() => {
      if (dialog.current !== 'idle') return;
      dialog.current = 'shown';
      const choose = async (enabled: boolean) => {
        dialog.current = 'answered';
        await chooseConsent(enabled);
        if (useAnalyticsConsent.getState().error) {
          Alert.alert(t('monitor.genericError'), t('monitor.storageError'));
        }
      };
      Alert.alert(t('monitor.analyticsTitle'), t('monitor.analyticsBody'), [
        ...(publicLegalReady ? [{
          text: t('monitor.privacy'),
          onPress: () => {
            dialog.current = 'openingPrivacy';
            void Linking.openURL(PRIVACY_URL).catch(() => {
              // Keep consent unknown if the browser cannot open. The user can
              // retry the link or make a choice after dismissing this error.
              Alert.alert(t('monitor.genericError'), t('monitor.linkOpenError'), [{
                text: t('monitor.close'),
                onPress: () => { dialog.current = 'idle'; retryPrompt(); },
              }], { cancelable: false });
            });
          },
        }] : []),
        { text: t('monitor.analyticsDecline'), onPress: () => void choose(false) },
        { text: t('monitor.analyticsAllow'), onPress: () => void choose(true) },
      ], { cancelable: false, userInterfaceStyle: c.mode });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, session.busy, state.ready, state.busy, state.consent, chooseConsent, retry, c.mode, t]);
  return <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }} pointerEvents={state.busy ? 'none' : 'auto'} accessibilityElementsHidden={state.busy} importantForAccessibility={state.busy ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {state.busy && <View accessibilityViewIsModal style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator accessibilityLabel={t('monitor.processing')} size="large" color={c.accent} />
    </View>}
  </View>;
}
