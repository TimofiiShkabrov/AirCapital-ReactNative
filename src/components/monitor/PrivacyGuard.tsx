import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { useStore } from "zustand";
import { privacySession } from "../../services/privacySession";
import { useSettingsStore } from "../../store/settingsStore";
import { Action, Heading, Label } from "./primitives";
import { useMonitorTheme } from "./theme";
import BrandIcon from "./BrandIcon";
export default function PrivacyGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = useSettingsStore(),
    c = useMonitorTheme(),
    { t } = useTranslation();
  const session = useStore(privacySession.store);
  const { unlocked, busy } = session;
  const background = session.appState !== "active";
  const [error, setError] = useState("");
  // Preserve an in-progress native file picker behind the opaque lock screen.
  // On a cold locked start, the application content is still never mounted.
  const contentMounted = useRef(false);
  if (settings.hydrated && (!settings.lockEnabled || unlocked))
    contentMounted.current = true;
  useEffect(() => {
    if (Platform.OS === "ios")
      void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() =>
        setError(t("monitor.privacyUnavailable")),
      );
    if (Platform.OS === "android")
      void ScreenCapture.preventScreenCaptureAsync("aircapital").catch(() =>
        setError(t("monitor.privacyUnavailable")),
      );
    privacySession.setAppState(AppState.currentState ?? "unknown");
    const subscription = AppState.addEventListener(
      "change",
      privacySession.setAppState,
    );
    return () => {
      subscription.remove();
    };
  }, [t]);
  useEffect(() => {
    privacySession.configure(settings.hydrated, settings.lockEnabled);
    void privacySession.autoUnlock(() =>
      LocalAuthentication.authenticateAsync({
        promptMessage: t("monitor.unlock"),
        cancelLabel: t("monitor.cancel"),
        disableDeviceFallback: false,
      }),
    );
  }, [settings.hydrated, settings.lockEnabled, session, t]);
  const unlock = () =>
    privacySession.authenticate(() =>
      LocalAuthentication.authenticateAsync({
        promptMessage: t("monitor.unlock"),
        cancelLabel: t("monitor.cancel"),
        disableDeviceFallback: false,
      }),
    );
  const covered =
    !settings.hydrated || background || (settings.lockEnabled && !unlocked);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {settings.hydrated && contentMounted.current && (
        <View
          style={{ flex: 1 }}
          pointerEvents={covered ? "none" : "auto"}
          importantForAccessibility={covered ? "no-hide-descendants" : "auto"}
          accessibilityElementsHidden={covered}
        >
          {children}
        </View>
      )}
      {covered && (
        <View
          accessibilityViewIsModal
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            backgroundColor: c.bg,
            justifyContent: "center",
            alignItems: "center",
            padding: 30,
            gap: 20,
          }}
        >
          <BrandIcon size={72} />
          <Heading>AirCapital</Heading>
          {!settings.hydrated ? (
            <>
              {settings.error ? (
                <>
                  <Label>{t("monitor.storageError")}</Label>
                  <Action
                    label={t("monitor.refresh")}
                    onPress={() => void settings.hydrateSettings()}
                  />
                </>
              ) : (
                <ActivityIndicator
                  accessibilityLabel={t("monitor.loadingData")}
                  color={c.accent}
                />
              )}
            </>
          ) : (
            <>
              <Label>{t("monitor.locked")}</Label>
              {!background && (
                <Action
                  label={t("monitor.unlock")}
                  icon="lock-open-outline"
                  primary
                  disabled={busy}
                  loading={busy}
                  onPress={() => void unlock()}
                />
              )}
            </>
          )}
          {!!error && <Label>{error}</Label>}
          {session.failed && <Label>{t("monitor.authFailed")}</Label>}
        </View>
      )}
    </View>
  );
}
