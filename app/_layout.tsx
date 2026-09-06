import "../src/i18n";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSettingsStore } from "../src/store/settingsStore";
import { useMonitorTheme } from "../src/components/monitor/theme";
import PrivacyGuard from "../src/components/monitor/PrivacyGuard";
import { AnalyticsBoundary } from "../src/analytics/AnalyticsControls";
export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrateSettings),
    c = useMonitorTheme();
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={c.mode === "dark" ? "light" : "dark"} />
      <PrivacyGuard>
        <AnalyticsBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.bg },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="settings"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="details/[accountId]" />
            <Stack.Screen name="flows" />
            <Stack.Screen name="connect-guide" />
          </Stack>
        </AnalyticsBoundary>
      </PrivacyGuard>
    </GestureHandlerRootView>
  );
}
