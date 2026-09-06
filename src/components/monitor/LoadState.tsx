import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Action, Label } from "./primitives";
import { useMonitorTheme } from "./theme";

export function LoadingState({ label }: { label?: string }) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  const title = label || t("monitor.loadingData");
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityState={{ busy: true }}
      style={{
        minHeight: 180,
        padding: 24,
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={c.accent} />
      <Label style={{ textAlign: "center" }}>{title}</Label>
    </View>
  );
}

export function LoadBoundary({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  if (loading) return <LoadingState />;
  if (error)
    return (
      <View style={{ padding: 24, gap: 16 }}>
        <Text
          accessibilityRole="alert"
          style={{ color: c.negative, textAlign: c.rtl ? "right" : "left" }}
        >
          {t(`monitor.${error}`, { defaultValue: t("monitor.genericError") })}
        </Text>
        <Action
          label={t("monitor.refresh")}
          icon="refresh-outline"
          onPress={onRetry}
        />
      </View>
    );
  return <>{children}</>;
}

export function BusyOverlay({
  visible,
  label,
}: {
  visible: boolean;
  label?: string;
}) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  if (!visible) return null;
  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 100,
          backgroundColor: c.bg + "F5",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <LoadingState label={label || t("monitor.processing")} />
    </View>
  );
}
