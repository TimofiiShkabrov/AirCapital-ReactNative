import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PositionItem } from '../../types/common';
import { FontSize, Spacing } from '../../constants/theme';
import LiquidSurface from '../ui/LiquidSurface';
import { formatCurrencyAmount } from '../../trading/grid';

interface Props {
  position: PositionItem;
}

function formatQty(v: number): string {
  if (Math.abs(v) >= 1000) return v.toFixed(2);
  if (Math.abs(v) >= 1) return v.toFixed(4);
  return v.toFixed(6);
}

export default function PositionRow({ position }: Props) {
  const { t } = useTranslation();

  const displayPct = position.netPercentChange ?? position.percentChange;
  const pctText =
    displayPct != null
      ? `${displayPct > 0 ? '+' : ''}${displayPct.toFixed(2)}%`
      : '—';

  const pctColor =
    displayPct == null
      ? 'rgba(255,255,255,0.45)'
      : displayPct > 0
        ? '#34C759'
        : displayPct < 0
          ? '#FF3B30'
          : 'rgba(255,255,255,0.45)';

  const openedText =
    position.openedAt != null
      ? new Date(position.openedAt).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  const valueText =
    position.valueUSDT != null ? `${position.valueUSDT.toFixed(2)} USDT` : '—';
  const netText =
    position.netProfitUSDT != null
      ? `${position.netProfitUSDT > 0 ? '+' : ''}${formatCurrencyAmount(position.netProfitUSDT)} USDT`
      : '—';
  const netColor =
    position.netProfitUSDT == null
      ? 'rgba(255,255,255,0.55)'
      : position.netProfitUSDT > 0
        ? '#34C759'
        : position.netProfitUSDT < 0
          ? '#FF3B30'
          : 'rgba(255,255,255,0.55)';

  return (
    <LiquidSurface radius={22}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.symbol}>{position.symbol}</Text>
          <Text style={[styles.pct, { color: pctColor }]}>{pctText}</Text>
        </View>
        <Text style={styles.opened}>
          {t('positions.field.opened')} {openedText}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.qty}>
            {t('positions.field.quantity')} {formatQty(position.quantity)}
          </Text>
          <Text style={styles.value}>
            {t('positions.field.value')} {valueText}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.netLabel}>{t('positions.field.net')}</Text>
          <Text style={[styles.netValue, { color: netColor }]}>{netText}</Text>
        </View>
      </View>
    </LiquidSurface>
  );
}

const styles = StyleSheet.create({
  inner: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  symbol: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  pct: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  opened: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qty: {
    fontSize: FontSize.subheadline,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  value: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
  netLabel: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.55)',
  },
  netValue: {
    fontSize: FontSize.subheadline,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
