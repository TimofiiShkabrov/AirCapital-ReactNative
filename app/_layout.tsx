import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useSettingsStore } from '../src/store/settingsStore';
import { useAccountsStore } from '../src/store/accountsStore';

export default function RootLayout() {
  const hydrateSettings = useSettingsStore((s) => s.hydrateSettings);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);

  useEffect(() => {
    void (async () => {
      await hydrateSettings();
      await loadAccounts();
    })();
  }, [hydrateSettings, loadAccounts]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D1219' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="details/[accountId]" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="terminal" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
