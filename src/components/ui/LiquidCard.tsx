import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LiquidSurface from './LiquidSurface';
import { FontSize, Radius } from '../../constants/theme';

interface Props {
  title?: string;
  children: React.ReactNode;
  spacing?: number;
  padding?: number;
}

export default function LiquidCard({ title, children, spacing = 14, padding = 18 }: Props) {
  return (
    <LiquidSurface radius={Radius.xxl}>
      <View style={[styles.inner, { padding, gap: spacing }]}>
        {title != null && <Text style={styles.title}>{title}</Text>}
        {children}
      </View>
    </LiquidSurface>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'column',
  },
  title: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
