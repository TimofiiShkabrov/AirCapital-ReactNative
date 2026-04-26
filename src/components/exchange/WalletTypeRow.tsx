import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WalletTypeSection } from '../../types/common';
import { FontSize, Radius, Spacing } from '../../constants/theme';
import LiquidSurface from '../ui/LiquidSurface';

interface Props {
  section: WalletTypeSection;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function WalletTypeRow({ section, onPress, isFirst, isLast }: Props) {
  const topR = isFirst ? Radius.xxl : 0;
  const bottomR = isLast ? Radius.xxl : 0;
  const totalText =
    section.totalUSDT != null ? `${section.totalUSDT.toFixed(2)} USDT` : '—';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <LiquidSurface
        radius={0}
        shadow={false}
        style={{
          borderTopLeftRadius: topR,
          borderTopRightRadius: topR,
          borderBottomLeftRadius: bottomR,
          borderBottomRightRadius: bottomR,
        }}
      >
        <View style={styles.inner}>
          <View style={styles.left}>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.currency}>USDT</Text>
          </View>
          <Text style={styles.total}>{totalText}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
        </View>
        {!isLast && <View style={styles.divider} />}
      </LiquidSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currency: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
  },
  total: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: Spacing.lg,
  },
});
