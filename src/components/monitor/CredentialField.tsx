import React, { useState } from "react";
import { Platform } from "react-native";
import { Field } from "./primitives";

/** API credentials are pasted/edited as text, never offered as a new password. */
export function CredentialField({ label, value, onChangeText, editable = true }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return <Field
    label={label}
    value={focused ? value : value ? "••••••••••••" : ""}
    onChangeText={onChangeText}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    editable={editable}
    selectTextOnFocus
    autoCapitalize="none"
    autoCorrect={false}
    spellCheck={false}
    autoComplete="off"
    textContentType="none"
    importantForAutofill="no"
    keyboardType={Platform.OS === "ios" ? "ascii-capable" : "default"}
    secureTextEntry={false}
  />;
}
