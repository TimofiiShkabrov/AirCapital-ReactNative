import React, { useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMonitorTheme } from "./theme";
import { useSettingsStore } from "../../store/settingsStore";

export function useMoney() {
  const { i18n } = useTranslation();
  const hidden = useSettingsStore((s) => s.hideAmounts);
  return (value?: number, signed = false, percent = false) =>
    hidden
      ? "••••"
      : value === undefined || !Number.isFinite(value)
        ? "—"
        : new Intl.NumberFormat(i18n.language, {
            minimumFractionDigits: percent ? 2 : 0,
            maximumFractionDigits: percent ? 2 : Math.abs(value) < 1 ? 8 : 2,
            signDisplay: signed ? "exceptZero" : "auto",
          }).format(value) + (percent ? "%" : "");
}
export function useQuantity() {
  const { i18n } = useTranslation();
  const hidden = useSettingsStore((s) => s.hideAmounts);
  return (value: number) =>
    hidden
      ? "••••"
      : new Intl.NumberFormat(i18n.language, {
          maximumSignificantDigits: 8,
        }).format(value);
}
export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  const c = useMonitorTheme();
  return (
    <Text
      style={[
        {
          color: c.muted,
          fontSize: 12,
          lineHeight: 19,
          textAlign: c.rtl ? "right" : "left",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  const c = useMonitorTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: c.text,
        fontSize: 17,
        fontWeight: "600",
        flexShrink: 1,
        textAlign: c.rtl ? "right" : "left",
      }}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useMonitorTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.panel,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: 18,
          padding: 17,
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Action({
  label,
  onPress,
  icon,
  primary,
  disabled,
  danger,
  loading,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  const c = useMonitorTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: !!(disabled || loading),
        busy: !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 11,
        backgroundColor: primary ? c.accent : c.tint,
        flexDirection: c.rtl ? "row-reverse" : "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 7,
        opacity: loading ? 1 : disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={primary ? c.bg : c.accent} />
      ) : (
        icon && (
          <Ionicons
            name={icon}
            size={18}
            color={primary ? c.bg : danger ? c.negative : c.accent}
          />
        )
      )}
      <Text
        style={{
          color: primary ? c.bg : danger ? c.negative : c.accent,
          fontSize: 14,
          fontWeight: "500",
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const c = useMonitorTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      accessibilityState={{
        disabled: !!(disabled || loading),
        busy: !!loading,
      }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        opacity: loading ? 1 : disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={c.accent} />
      ) : (
        <Ionicons name={icon} size={21} color={c.muted} />
      )}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useMonitorTheme();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          {
            color: c.text,
            backgroundColor: c.bg,
            borderColor: c.line,
            borderWidth: 1,
            borderRadius: 10,
            minHeight: 48,
            fontSize: 16,
            padding: 12,
            textAlign: c.rtl ? "right" : "left",
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Picker({
  label,
  value,
  choices,
  onChange,
  disabled,
  searchLabel,
}: {
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchLabel?: string;
}) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalize = (text: string) =>
    text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = searchLabel
    ? choices.filter((choice) =>
        normalize(`${choice.label} ${choice.value}`).includes(normalize(query)),
      )
    : choices;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityValue={{
          text: choices.find((o) => o.value === value)?.label,
        }}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={{
          backgroundColor: c.panel,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 11,
          minHeight: 44,
          maxWidth: 220,
          flexShrink: 1,
          flexDirection: c.rtl ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text style={{ color: c.text, fontSize: 13, flexShrink: 1 }}>
          {choices.find((o) => o.value === value)?.label}
        </Text>
        <Ionicons name="chevron-down" size={15} color={c.muted} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.overlay}
        >
          <View
            style={[s.dialog, { backgroundColor: c.panel, maxHeight: "100%" }]}
          >
            <Heading>{label}</Heading>
            {searchLabel && (
              <Field
                label={searchLabel}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            )}
            <ScrollView
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.map((o) => (
                <Pressable
                  key={o.value}
                  accessibilityRole="button"
                  disabled={disabled}
                  accessibilityState={{
                    selected: value === o.value,
                    disabled: !!disabled,
                  }}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    minHeight: 48,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: value === o.value ? c.tint : c.panel,
                  }}
                >
                  <Text
                    style={{
                      color: value === o.value ? c.accent : c.text,
                      fontSize: 15,
                      textAlign: c.rtl ? "right" : "left",
                    }}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Action label={t("monitor.close")} onPress={() => setOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
export function Confirm({
  visible,
  title,
  body,
  onConfirm,
  onCancel,
  busy,
}: {
  visible: boolean;
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const c = useMonitorTheme(),
    { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onCancel()}
    >
      <View style={s.overlay}>
        <View style={[s.dialog, { backgroundColor: c.panel }]}>
          <Heading>{title}</Heading>
          <Label>{body}</Label>
          <Action
            label={title}
            primary
            loading={busy}
            disabled={busy}
            onPress={onConfirm}
          />
          <Action
            label={t("monitor.cancel")}
            disabled={busy}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  dialog: {
    width: "100%",
    maxWidth: 440,
    padding: 22,
    borderRadius: 22,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  section: { gap: 12, marginTop: 22 },
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 35,
    gap: 16,
  },
});
