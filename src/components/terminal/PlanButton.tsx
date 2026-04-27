import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { FontSize, Spacing } from '../../constants/theme';

interface Props {
  label: string;
  danger?: boolean;
  onPress: () => void;
}

export default function PlanButton({ label, danger, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.root, danger && styles.danger]} onPress={onPress}>
      <Text style={[styles.text, danger && styles.dangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  danger: {
    backgroundColor: 'rgba(255,59,48,0.14)',
  },
  text: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FontSize.caption,
    fontWeight: '800',
  },
  dangerText: {
    color: '#FF6961',
  },
});
