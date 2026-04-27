import React, { useCallback, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FontSize, Radius, Spacing } from '../../constants/theme';
import { formatCurrencyAmount, parsePositiveNumber } from '../../trading/grid';
import TerminalInput from './TerminalInput';

const AMOUNT_PRESETS = [10, 25, 50, 100];

interface Props {
  amountText: string;
  setAmountText: (value: string) => void;
  quoteCcy: string;
  depositQuote?: number;
  depositLoading?: boolean;
}

export default function AmountSelector({
  amountText,
  setAmountText,
  quoteCcy,
  depositQuote,
  depositLoading = false,
}: Props) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(1);
  const deposit = depositQuote ?? 0;
  const amount = parsePositiveNumber(amountText) ?? 0;
  const percent = deposit > 0 ? clamp((amount / deposit) * 100, 0, 100) : 0;

  const setPercent = useCallback((nextPercent: number) => {
    if (deposit <= 0) return;
    setAmountText(formatAmount(deposit * clamp(nextPercent, 0, 100) / 100));
  }, [deposit, setAmountText]);

  const setPercentFromX = useCallback((x: number) => {
    if (trackWidth <= 0) return;
    setPercent((clamp(x, 0, trackWidth) / trackWidth) * 100);
  }, [setPercent, trackWidth]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => deposit > 0,
    onMoveShouldSetPanResponder: () => deposit > 0,
    onPanResponderGrant: (event) => setPercentFromX(event.nativeEvent.locationX),
    onPanResponderMove: (event) => setPercentFromX(event.nativeEvent.locationX),
  }), [deposit, setPercentFromX]);

  return (
    <View style={styles.root}>
      <TerminalInput label={t('terminal.trade_amount')} value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" suffix={quoteCcy} />
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>{t('terminal.available_deposit')}</Text>
        <Text style={styles.metaValue}>
          {depositLoading ? t('terminal.updating') : `${formatCurrencyAmount(deposit)} ${quoteCcy}`}
        </Text>
      </View>
      <View
        style={[styles.sliderTrack, deposit <= 0 && styles.disabled]}
        onLayout={(event) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${percent}%` as `${number}%` }]} />
        <View style={[styles.sliderThumb, { left: `${percent}%` as `${number}%` }]} />
      </View>
      <View style={styles.presets}>
        {AMOUNT_PRESETS.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.preset,
              Math.abs(percent - value) < 0.6 && styles.presetActive,
              deposit <= 0 && styles.disabled,
            ]}
            disabled={deposit <= 0}
            onPress={() => setPercent(value)}
          >
            <Text style={styles.presetText}>{value}%</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return formatCurrencyAmount(value);
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  metaLabel: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.42)',
  },
  metaValue: {
    fontSize: FontSize.caption,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
  },
  sliderTrack: {
    height: 34,
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 17,
    backgroundColor: 'rgba(0,212,255,0.28)',
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: '#67D9FF',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.88)',
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  presetActive: {
    backgroundColor: 'rgba(0,212,255,0.22)',
  },
  presetText: {
    fontSize: FontSize.caption,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.68)',
  },
  disabled: {
    opacity: 0.45,
  },
});
