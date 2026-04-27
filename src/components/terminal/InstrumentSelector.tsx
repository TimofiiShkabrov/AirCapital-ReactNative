import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { OkxInstrument } from '../../trading/types';
import { formatDecimal } from '../../trading/grid';
import { FontSize, Radius, Spacing } from '../../constants/theme';
import LiquidBackground from '../ui/LiquidBackground';

interface Props {
  instruments: OkxInstrument[];
  selectedInstId: string;
  quoteCcy: string;
  lastPrice?: number;
  loading?: boolean;
  exchangeLabel?: string;
  onSelect: (instrument: OkxInstrument) => void;
}

export default function InstrumentSelector({
  instruments,
  selectedInstId,
  quoteCcy,
  lastPrice,
  loading = false,
  exchangeLabel = 'OKX',
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toUpperCase();
    const list = instruments.filter((item) => item.state === 'live');
    if (!needle) return list.slice(0, 120);
    return list.filter((item) => item.instId.includes(needle)).slice(0, 120);
  }, [instruments, query]);

  const handleSelect = (instrument: OkxInstrument) => {
    onSelect(instrument);
    setVisible(false);
    setQuery('');
  };

  return (
    <>
      <View style={styles.root}>
        <Text style={styles.label}>{t('terminal.instrument')}</Text>
        <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)} activeOpacity={0.82}>
          <View>
            <Text style={styles.instId}>{selectedInstId}</Text>
            <Text style={styles.subtle}>{t('terminal.live_tickers', { exchange: exchangeLabel })}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.price}>
              {loading ? t('terminal.updating') : lastPrice ? `${formatDecimal(lastPrice)} ${quoteCcy}` : t('terminal.ticker_unavailable')}
            </Text>
            <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.46)" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <LiquidBackground />
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{t('terminal.choose_ticker')}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.72)" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.42)" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="BTC, ETH, SOL..."
                placeholderTextColor="rgba(255,255,255,0.32)"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.instId}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const active = item.instId === selectedInstId;
                return (
                  <TouchableOpacity
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.78}
                  >
                    <Text style={[styles.itemTitle, active && styles.itemTitleActive]}>{item.instId}</Text>
                    <Text style={styles.itemMeta}>tick {item.tickSz} · lot {item.lotSz}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>{t('terminal.no_tickers')}</Text>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.48)',
    textTransform: 'uppercase',
  },
  trigger: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  instId: {
    fontSize: FontSize.title3,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtle: {
    marginTop: 2,
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.42)',
  },
  right: {
    flexShrink: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: FontSize.subheadline,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.58)',
    textAlign: 'right',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.title3,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  searchWrap: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: FontSize.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 34,
    gap: Spacing.sm,
  },
  item: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  itemActive: {
    backgroundColor: 'rgba(0,212,255,0.18)',
  },
  itemTitle: {
    fontSize: FontSize.subheadline,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  itemTitleActive: {
    color: 'rgba(0,212,255,0.95)',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.42)',
  },
  empty: {
    paddingVertical: Spacing.xl,
    color: 'rgba(255,255,255,0.50)',
    fontSize: FontSize.subheadline,
    textAlign: 'center',
  },
});
