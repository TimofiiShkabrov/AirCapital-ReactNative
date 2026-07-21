import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXCHANGE_CONFIG } from '../../constants/exchanges';
import type { ExchangeAccount } from '../../types/common';
import { FontSize, Spacing } from '../../constants/theme';
import LiquidSurface from '../ui/LiquidSurface';

interface Props {
  account: ExchangeAccount;
  label: string;
  balance: number;
  errorMessage?: string;
  onPress: () => void;
}

export default function AccountRow({ account, label, balance, errorMessage, onPress }: Props) {
  const config = EXCHANGE_CONFIG[account.exchange];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <LiquidSurface radius={18} shadow={false}>
        <View>
          <View style={styles.inner}>
            <Image source={config.logo} style={styles.logo} resizeMode="contain" />
            <View style={styles.meta}>
              <Text style={styles.name}>{config.label}</Text>
              {label ? <Text style={styles.label}>{label}</Text> : null}
            </View>
            <Text style={[styles.balance, errorMessage ? styles.balanceWarning : null]}>{balance.toFixed(2)} USDT</Text>
          </View>
          {errorMessage ? (
            <View style={styles.errorRow}>
              <Ionicons name="warning" size={14} color="#FF9500" />
              <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>
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
    gap: Spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  label: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.50)',
  },
  balance: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
  balanceWarning: {
    color: '#FF9500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 14,
    marginTop: -2,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: 'rgba(255,149,0,0.82)',
  },
});
