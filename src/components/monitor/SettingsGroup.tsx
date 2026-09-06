import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMonitorTheme } from "./theme";
import { Label } from "./primitives";

export function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const c = useMonitorTheme();
  return (
    <View style={{ gap: 9 }}>
      <Text
        accessibilityRole="header"
        style={{
          color: c.muted,
          fontSize: 12,
          fontWeight: "600",
          paddingHorizontal: 4,
          textAlign: c.rtl ? "right" : "left",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: c.panel,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {React.Children.toArray(children).map((child, i) => (
          <View
            key={React.isValidElement(child) ? child.key : i}
            style={
              i
                ? {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: c.line,
                  }
                : undefined
            }
          >
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

export function SettingsRow({
  title,
  subtitle,
  icon,
  children,
  onPress,
  expanded,
  disabled,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
  onPress?: () => void;
  expanded?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  const c = useMonitorTheme();
  const content = (
    <>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: c.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? c.negative : c.accent}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          style={{
            color: danger ? c.negative : c.text,
            fontSize: 14,
            fontWeight: "500",
            textAlign: c.rtl ? "right" : "left",
          }}
        >
          {title}
        </Text>
        {!!subtitle && <Label>{subtitle}</Label>}
      </View>
      {children}
      {onPress && (
        <Ionicons
          name={
            expanded === undefined
              ? c.rtl
                ? "chevron-back"
                : "chevron-forward"
              : expanded
                ? "chevron-up"
                : "chevron-down"
          }
          size={16}
          color={c.muted}
        />
      )}
    </>
  );
  const layout = {
    flexDirection: c.rtl ? ("row-reverse" as const) : ("row" as const),
    alignItems: "center" as const,
    minHeight: 66,
    padding: 15,
    gap: 12,
  };
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        layout,
        {
          backgroundColor: pressed ? c.tint : c.panel,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={layout}>{content}</View>
  );
}

export function SettingsDetail({ children }: { children: React.ReactNode }) {
  const c = useMonitorTheme();
  return (
    <View
      style={{ padding: 17, paddingTop: 5, gap: 14, backgroundColor: c.panel }}
    >
      {children}
    </View>
  );
}
