import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontSize, Spacing } from '../../constants/theme';

interface Option<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.root}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.item, active && styles.itemActive, option.disabled && styles.itemDisabled]}
            onPress={() => !option.disabled && onChange(option.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active && styles.labelActive, option.disabled && styles.labelDisabled]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  item: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: Spacing.sm,
  },
  itemActive: {
    backgroundColor: 'rgba(0,212,255,0.22)',
  },
  itemDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
  },
  labelActive: {
    color: 'rgba(0,212,255,0.95)',
  },
  labelDisabled: {
    color: 'rgba(255,255,255,0.30)',
  },
});
