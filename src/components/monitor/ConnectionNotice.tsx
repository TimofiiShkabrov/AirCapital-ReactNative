import React from "react";
import { View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Action, Label } from "./primitives";
import { useMonitorTheme } from "./theme";
import { needsReconnect } from "../../domain/connectionStatus";

export default function ConnectionNotice({
  accountId,
  error,
  showTitle = true,
}: {
  accountId: string;
  error?: string;
  showTitle?: boolean;
}) {
  const { t } = useTranslation(),
    router = useRouter(),
    c = useMonitorTheme();
  if (!error) return null;
  const reconnect = needsReconnect(error);
  return (
    <View style={{ gap: 10, paddingVertical: 12 }}>
      {showTitle && (
        <Text
          style={{
            color: reconnect ? c.accent : c.muted,
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          {t(
            reconnect
              ? "monitor.connectionRequired"
              : "monitor.updateUnavailable",
          )}
        </Text>
      )}
      <Label>
        {t(`monitor.${error}`, { defaultValue: t("monitor.genericError") })}
      </Label>
      {reconnect && (
        <>
          <Label>{t("monitor.reconnectHistory")}</Label>
          <Action
            label={t("monitor.reconnectExchange")}
            icon="key-outline"
            onPress={() =>
              router.push({
                pathname: "/settings",
                params: { reconnect: accountId },
              })
            }
            disabled={Platform.OS === "web"}
          />
          {Platform.OS === "web" && (
            <Label>{t("monitor.unsupportedWeb")}</Label>
          )}
        </>
      )}
    </View>
  );
}
