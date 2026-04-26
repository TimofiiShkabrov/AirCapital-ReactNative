import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import LiquidBackground from '../src/components/ui/LiquidBackground';
import LiquidSurface from '../src/components/ui/LiquidSurface';
import LiquidCard from '../src/components/ui/LiquidCard';
import SectionHeader from '../src/components/ui/SectionHeader';
import LoadingView from '../src/components/ui/LoadingView';
import AccountRow from '../src/components/exchange/AccountRow';
import BalanceChart from '../src/components/charts/BalanceChart';
import StructureChart from '../src/components/charts/StructureChart';

import { useAccountsStore } from '../src/store/accountsStore';
import { usePortfolioStore } from '../src/store/portfolioStore';
import { getSnapshots } from '../src/services/balanceHistory';
import { EXCHANGE_CONFIG } from '../src/constants/exchanges';
import type { BalanceSnapshot, ChartRange } from '../src/types/common';
import { chartRangeLabel } from '../src/types/common';
import { FontSize, Radius, Spacing } from '../src/constants/theme';
import { accountLabel } from '../src/utils/accounts';

const CHART_RANGES: ChartRange[] = ['day', 'week', 'month'];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const accounts = useAccountsStore((s) => s.accounts);
  const portfolio = usePortfolioStore();
  const loadPortfolioData = usePortfolioStore((s) => s.loadData);
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>('day');
  const [initialLoading, setInitialLoading] = useState(true);
  const hasAccounts = accounts.length > 0;

  const loadData = useCallback(async () => {
    await loadPortfolioData();
    const snaps = await getSnapshots({ type: 'total' });
    setSnapshots(snaps);
  }, [loadPortfolioData]);

  useEffect(() => {
    (async () => {
      await loadData();
      setInitialLoading(false);
    })();
  }, [loadData]);

  const openSettings = () => router.push('/settings');

  const totalBalance = portfolio.getTotalBalance();

  const exchangeSlices = useMemo(() => {
    if (!hasAccounts || totalBalance <= 0) return [];
    const grouped: Record<string, number> = {};
    for (const acc of accounts) {
      const bal = portfolio.getAccountBalance(acc);
      if (bal > 0) grouped[acc.exchange] = (grouped[acc.exchange] ?? 0) + bal;
    }
    return Object.entries(grouped)
      .map(([exchange, balance]) => ({
        exchange: exchange as any,
        balance,
        share: balance / totalBalance,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [accounts, hasAccounts, portfolio, totalBalance]);

  const accountSlices = useMemo(() => {
    if (!hasAccounts || totalBalance <= 0) return [];
    return accounts
      .map((acc) => ({ account: acc, balance: portfolio.getAccountBalance(acc), share: portfolio.getAccountBalance(acc) / totalBalance }))
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [accounts, hasAccounts, portfolio, totalBalance]);

  if (initialLoading || (portfolio.isLoading && accounts.length > 0 && snapshots.length === 0)) {
    return <LoadingView />;
  }

  if (!hasAccounts) {
    return (
      <View style={styles.root}>
        <LiquidBackground />
        <SafeAreaView style={styles.fill}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>{t('app.title')}</Text>
            <TouchableOpacity onPress={openSettings} hitSlop={8}>
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={52} color="rgba(255,255,255,0.20)" />
            <Text style={styles.emptyTitle}>{t('home.no_exchanges.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('home.no_exchanges.description')}</Text>
            <TouchableOpacity onPress={openSettings} activeOpacity={0.8}>
              <LinearGradient
                colors={['rgba(0,212,255,0.65)', 'rgba(0,180,160,0.70)', 'rgba(30,80,200,0.60)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyBtn}
              >
                <Ionicons name="settings-outline" size={16} color="#FFF" />
                <Text style={styles.emptyBtnText}>{t('home.open_settings')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LiquidBackground />
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t('app.title')}</Text>
          <TouchableOpacity onPress={openSettings} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={portfolio.isLoading}
              onRefresh={loadData}
              tintColor="rgba(0,212,255,0.8)"
            />
          }
        >
          {/* Total Balance Card */}
          <SectionHeader title={t('exchange.section.total_balance')} />
          <LiquidSurface radius={Radius.xxl}>
            <View style={styles.card}>
              {/* Range Picker */}
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
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>{t('exchange.all_accounts')}</Text>
                <Text style={styles.balanceValue}>{totalBalance.toFixed(2)} USDT</Text>
              </View>
              <BalanceChart snapshots={snapshots} range={chartRange} height={160} />
            </View>
          </LiquidSurface>

          {/* Structure Card */}
          <SectionHeader title={t('exchange.section.structure')} />
          <LiquidCard>
            {exchangeSlices.length === 0 ? (
              <Text style={styles.emptyCard}>{t('exchange.structure.empty')}</Text>
            ) : (
              <>
                <StructureChart slices={exchangeSlices} size={160} />
                <View style={styles.divider} />
                <Text style={styles.sectionMeta}>{t('exchange.structure.by_account')}</Text>
                {accountSlices.slice(0, 5).map(({ account, balance, share }) => (
                  <View key={account.id}>
                    <View style={styles.acctSliceRow}>
                      <Text style={styles.acctSliceName}>
                        {EXCHANGE_CONFIG[account.exchange].label}
                        {account.label ? ` · ${account.label}` : ''}
                      </Text>
                      <Text style={styles.acctSliceBalance}>{balance.toFixed(2)} USDT</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${share * 100}%` as any,
                            backgroundColor: EXCHANGE_CONFIG[account.exchange].color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </LiquidCard>

          {/* Accounts */}
          <SectionHeader title={t('exchange.section.accounts')} />
          <View style={styles.accountsList}>
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                label={accountLabel(account, accounts, t)}
                balance={portfolio.getAccountBalance(account)}
                onPress={() => router.push(`/details/${account.id}`)}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
      {portfolio.isLoading && <LoadingView />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  appTitle: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
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
  rangeBtnActive: {
    backgroundColor: 'rgba(0,212,255,0.18)',
  },
  rangeBtnText: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  rangeBtnTextActive: {
    color: 'rgba(0,212,255,0.95)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.55)',
  },
  balanceValue: {
    fontSize: FontSize.title3,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  sectionMeta: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  emptyCard: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.40)' },
  acctSliceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  acctSliceName: { fontSize: FontSize.caption, fontWeight: '600', color: '#FFFFFF' },
  acctSliceBalance: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.50)', fontVariant: ['tabular-nums'] },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: { height: 4, borderRadius: 2 },
  accountsList: { gap: Spacing.sm },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.title3,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  emptyBtnText: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
