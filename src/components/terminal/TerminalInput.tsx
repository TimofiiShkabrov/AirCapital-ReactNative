import React from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { FontSize, Radius, Spacing } from '../../constants/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  suffix?: string;
  onBlur?: () => void;
}

export default function TerminalInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  suffix,
  onBlur,
}: Props) {
  const numericInput = keyboardType === 'decimal-pad' || keyboardType === 'number-pad' || keyboardType === 'numeric';

  function handleChangeText(nextValue: string) {
    onChangeText(numericInput ? normalizeNumericInput(nextValue) : nextValue);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, !editable && styles.inputDisabled]}>
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.30)"
          keyboardType={keyboardType}
          editable={editable}
          onBlur={onBlur}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function normalizeNumericInput(value: string): string {
  const next = value.replace(/\s/g, '');
  if (!next) return '';

  const dotIndex = next.indexOf('.');
  const commaIndex = next.indexOf(',');
  const separatorIndexes = [dotIndex, commaIndex].filter((index) => index >= 0);
  const separatorIndex = separatorIndexes.length > 0 ? Math.min(...separatorIndexes) : -1;

  const integerPart = separatorIndex >= 0 ? next.slice(0, separatorIndex) : next;
  const fractionPart = separatorIndex >= 0 ? next.slice(separatorIndex) : '';
  if (!integerPart) return `0${fractionPart}`;

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '');
  return `${normalizedInteger}${fractionPart}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.48)',
    textTransform: 'uppercase',
  },
  inputWrap: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputDisabled: {
    opacity: 0.55,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suffix: {
    fontSize: FontSize.subheadline,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
});
