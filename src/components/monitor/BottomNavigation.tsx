import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMonitorTheme } from "./theme";

export type MonitorPage = "overview" | "exchanges" | "statistics";

const items = [
  { page: "overview", icon: "grid-outline" },
  { page: "exchanges", icon: "layers-outline" },
  { page: "statistics", icon: "stats-chart-outline" },
] as const;

export default function BottomNavigation({
  selected,
  onChange,
}: {
  selected: MonitorPage;
  onChange: (page: MonitorPage) => void;
}) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  const inline = (compact && width >= 480) || width >= 768;
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{
        backgroundColor: c.panel,
        borderTopColor: c.line,
        borderTopWidth: 1,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          flexDirection: c.rtl ? "row-reverse" : "row",
          width: "100%",
          maxWidth: 1440,
          alignSelf: "center",
          paddingHorizontal: width >= 768 ? 28 : 8,
          paddingVertical: 6,
          gap: 4,
        }}
      >
        {items.map(({ page, icon }) => (
          <Pressable
            key={page}
            accessibilityRole="button"
            accessibilityLabel={t(`monitor.${page}`)}
            accessibilityState={{ selected: selected === page }}
            onPress={() => onChange(page)}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: compact ? 44 : 52,
              paddingHorizontal: 4,
              paddingVertical: 6,
              flexDirection: inline
                ? c.rtl
                  ? "row-reverse"
                  : "row"
                : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: inline ? 7 : 4,
              borderRadius: 12,
              backgroundColor: selected === page ? c.tint : c.panel,
            }}
          >
            <Ionicons
              name={icon}
              size={compact ? 20 : 21}
              color={selected === page ? c.accent : c.muted}
            />
            <Text
              style={{
                fontSize: width < 360 ? 11 : 12,
                flexShrink: 1,
                textAlign: "center",
                color: selected === page ? c.accent : c.muted,
              }}
            >
              {t(`monitor.${page}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
