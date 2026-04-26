import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FontSize, Spacing } from '../../constants/theme';

interface Props {
  title: string;
}

export default function SectionHeader({ title }: Props) {
  return <Text style={styles.text}>{title}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    paddingLeft: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
});
