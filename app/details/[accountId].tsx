import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import LiquidBackground from '../../src/components/ui/LiquidBackground';
import LiquidSurface from '../../src/components/ui/LiquidSurface';
import SectionHeader from '../../src/components/ui/SectionHeader';
import BalanceChart from '../../src/components/charts/BalanceChart';
import WalletTypeRow from '../../src/components/exchange/WalletTypeRow';

import { useAccountsStore } from '../../src/store/accountsStore';
import { usePortfolioStore } from '../../src/store/portfolioStore';
import { getSnapshots } from '../../src/services/balanceHistory';
import { EXCHANGE_CONFIG } from '../../src/constants/exchanges';
import type { BalanceSnapshot, ChartRange, WalletTypeSection } from '../../src/types/common';
import { chartRangeLabel } from '../../src/types/common';
import { FontSize, Radius, Spacing } from '../../src/constants/theme';
import { accountLabel } from '../../src/utils/accounts';

const CHART_RANGES: ChartRange[] = ['day', 'week', 'month'];

export default function AccountDetailsScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const accounts = useAccountsStore((s) => s.accounts);
  const portfolio = usePortfolioStore();

  const account = accounts.find((a) => a.id === accountId);
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>('day');

  useEffect(() => {
    if (!accountId) return;
    getSnapshots({ type: 'account', accountId }).then(setSnapshots);
  }, [accountId]);

  const handleWalletPress = useCallback(
    (section: WalletTypeSection) => {
      portfolio.setSelectedWalletSection(section);
      router.push({
        pathname: '/wallet',
        params: { accountId: accountId!, sectionId: section.id },
      });
    },
    [accountId, portfolio, router],
  );

  if (!account) {
    return (
      <View style={styles.root}>
        <LiquidBackground />
        <SafeAreaView style={styles.fill}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const config = EXCHANGE_CONFIG[account.exchange];
  const balance = portfolio.getAccountBalance(account);
  const walletSections = portfolio.getWalletTypeSections(account);
  const label = accountLabel(account, accounts, t);

  return (
    <View style={styles.root}>
      <LiquidBackground />
      <SafeAreaView style={styles.fill}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{config.label}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview card */}
          <SectionHeader title={t('details.section.overview')} />
          <LiquidSurface radius={Radius.xxl}>
            <View style={styles.overviewInner}>
              <Image source={config.logo} style={styles.logo} resizeMode="contain" />
              <View style={styles.overviewMeta}>
                <Text style={styles.overviewName}>{config.label}</Text>
                {label ? <Text style={styles.overviewLabel}>{label}</Text> : null}
              </View>
              <Text style={styles.overviewBalance}>{balance.toFixed(2)} USDT</Text>
            </View>
          </LiquidSurface>

          {/* Balance chart */}
          <SectionHeader title={t('details.section.balance')} />
          <LiquidSurface radius={Radius.xxl} style={styles.chartCard}>
            <View style={styles.rangeRow}>
              {CHART_RANGES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rangeBtn, chartRange === r && styles.rangeBtnActive]}
                  onPress={() => setChartRange(r)}
                >
                  <Text style={[styles.rangeBtnText, chartRange === r && styles.rangeBtnTextActive]}>
                    {chartRangeLabel(r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <BalanceChart snapshots={snapshots} range={chartRange} height={120} />
          </LiquidSurface>

          {/* Wallet sections */}
          <SectionHeader title={t('details.section.wallets')} />
          <View style={styles.walletList}>
            {walletSections.map((section, index) => (
              <WalletTypeRow
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === walletSections.length - 1}
                onPress={() => handleWalletPress(section)}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  navTitle: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backBtn: {
    padding: Spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  overviewInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  logo: { width: 36, height: 36, borderRadius: 10 },
  overviewMeta: { flex: 1 },
  overviewName: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewLabel: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.50)',
  },
  overviewBalance: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  chartCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rangeBtnActive: { backgroundColor: 'rgba(0,212,255,0.18)' },
  rangeBtnText: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  rangeBtnTextActive: { color: 'rgba(0,212,255,0.95)' },
  walletList: {},
});
