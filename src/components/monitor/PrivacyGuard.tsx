import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { useSettingsStore } from "../../store/settingsStore";
import { Action, Heading, Label } from "./primitives";
import { useMonitorTheme } from "./theme";
export default function PrivacyGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = useSettingsStore(),
    c = useMonitorTheme(),
    { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(false),
    [background, setBackground] = useState(AppState.currentState !== "active"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const authenticating = useRef(false);
  useEffect(() => {
    if (Platform.OS === "ios")
      void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() =>
        setError(t("monitor.privacyUnavailable")),
      );
    if (Platform.OS === "android")
      void ScreenCapture.preventScreenCaptureAsync("aircapital").catch(() =>
        setError(t("monitor.privacyUnavailable")),
      );
    const subscription = AppState.addEventListener("change", (state) => {
      setBackground(state !== "active");
      if (state !== "active" && !authenticating.current) setUnlocked(false);
    });
    return () => {
      subscription.remove();
    };
  }, [t]);
  const unlock = async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("monitor.unlock"),
        cancelLabel: t("monitor.cancel"),
        disableDeviceFallback: false,
      });
      if (result.success) setUnlocked(true);
      else setError(t("monitor.authFailed"));
    } catch {
      setError(t("monitor.authFailed"));
    } finally {
      authenticating.current = false;
      setBusy(false);
    }
  };
  const covered =
    !settings.hydrated || background || (settings.lockEnabled && !unlocked);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {settings.hydrated && (!settings.lockEnabled || unlocked) && (
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
                <ActivityIndicator color={c.accent} />
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
                  onPress={() => void unlock()}
                />
              )}
            </>
          )}
          {!!error && <Label>{error}</Label>}
        </View>
      )}
    </View>
  );
}
