import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MarginMode, PositionMode, TradingVenue } from '../../trading/types';
import styles from '../../screens/terminal/styles';
import SegmentedControl from './SegmentedControl';
import TerminalInput from './TerminalInput';
import { FontSize } from '../../constants/theme';

interface Props {
  venue: TradingVenue;
  marginMode: MarginMode;
  setMarginMode: (value: MarginMode) => void;
  positionMode: PositionMode;
  setPositionMode: (value: PositionMode) => void;
  leverageText: string;
  setLeverageText: (value: string) => void;
  maxLeverage?: number;
  currentLeverage?: number;
}

export default function TradeSettings({
  venue,
  marginMode,
  setMarginMode,
  positionMode,
  setPositionMode,
  leverageText,
  setLeverageText,
  maxLeverage,
  currentLeverage,
}: Props) {
  const { t } = useTranslation();
  if (venue === 'spot') return null;

  const parsed = parseFloat(leverageText) || 1;
  const clamped = maxLeverage && maxLeverage > 0 ? Math.min(parsed, maxLeverage) : parsed;

  function handleLeverageBlur() {
    if (!leverageText) return;
    const n = Math.max(1, Math.round(clamped));
    setLeverageText(String(n));
  }

  return (
    <View style={styles.settingsBlock}>
      <SegmentedControl
        value={marginMode}
        onChange={setMarginMode}
        options={[
          { value: 'cross', label: 'Cross' },
          { value: 'isolated', label: 'Isolated' },
        ]}
      />
      <SegmentedControl
        value={positionMode}
        onChange={setPositionMode}
        options={[
          { value: 'net_mode', label: 'Net' },
          { value: 'long_short_mode', label: 'Hedge' },
        ]}
      />
      <View>
        <TerminalInput
          label={t('terminal.settings.leverage')}
          value={leverageText}
          onChangeText={setLeverageText}
          onBlur={handleLeverageBlur}
          keyboardType="decimal-pad"
          suffix="x"
        />
        {(maxLeverage != null && maxLeverage > 0) || currentLeverage != null ? (
          <Text style={leverageHintStyle.hint}>
            {currentLeverage != null ? t('terminal.settings.current', { value: currentLeverage }) : ''}
            {currentLeverage != null && maxLeverage != null && maxLeverage > 0 ? ' · ' : ''}
            {maxLeverage != null && maxLeverage > 0 ? t('terminal.settings.max', { value: maxLeverage }) : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const leverageHintStyle = StyleSheet.create({
  hint: {
    marginTop: 4,
    fontSize: FontSize.caption2,
    color: 'rgba(255,255,255,0.42)',
  },
});
