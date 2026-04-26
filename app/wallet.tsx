import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import LiquidBackground from '../src/components/ui/LiquidBackground';
import LiquidSurface from '../src/components/ui/LiquidSurface';
import SectionHeader from '../src/components/ui/SectionHeader';
import PositionRow from '../src/components/exchange/PositionRow';

import { usePortfolioStore } from '../src/store/portfolioStore';
import { useAccountsStore } from '../src/store/accountsStore';
import { FontSize, Radius, Spacing } from '../src/constants/theme';

export default function WalletScreen() {
  const router = useRouter();
  const { accountId, sectionId } = useLocalSearchParams<{ accountId?: string; sectionId?: string }>();
  const { t } = useTranslation();
  const accounts = useAccountsStore((s) => s.accounts);
  const {
    selectedWalletSection,
    getPositionsForSection,
    getWalletTypeSections,
  } = usePortfolioStore();
  const account = accountId ? accounts.find((a) => a.id === accountId) : undefined;
  const routeSection = account && sectionId
    ? getWalletTypeSections(account).find((s) => s.id === sectionId)
    : undefined;
  const section = routeSection ?? selectedWalletSection;

  if (!section) {
    return (
      <View style={styles.root}>
        <LiquidBackground />
        <SafeAreaView style={styles.fill}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const owningAccount = account ?? accounts.find((a) => section.id.startsWith(`${a.id}-`));
  const positions = owningAccount ? getPositionsForSection(owningAccount, section) : [];

  return (
    <View style={styles.root}>
      <LiquidBackground />
      <SafeAreaView style={styles.fill}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{section.title}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet breakdown rows */}
          <LiquidSurface radius={Radius.xxl}>
            <View style={styles.rowsContainer}>
              {section.rows.map((row, index) => (
                <React.Fragment key={row.id}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Text style={styles.detailTitle}>{row.title}</Text>
                      {row.subtitle ? <Text style={styles.detailSubtitle}>{row.subtitle}</Text> : null}
                    </View>
                    <Text style={styles.detailValue}>
                      {row.usdtValue != null
                        ? `${row.usdtValue.toFixed(2)} USDT`
                        : row.valueText ?? '—'}
                    </Text>
                  </View>
                  {index < section.rows.length - 1 && <View style={styles.rowDivider} />}
                </React.Fragment>
              ))}
            </View>
          </LiquidSurface>

          {/* Positions */}
          <SectionHeader title={t('details.section.positions')} />
          {positions.length === 0 ? (
            <LiquidSurface radius={22}>
              <View style={styles.emptyPositions}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="notifications-off" size={18} color="#FF9500" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTitle}>{t('positions.empty.title')}</Text>
                  <Text style={styles.emptyDesc}>{t('positions.empty.description')}</Text>
                </View>
              </View>
            </LiquidSurface>
          ) : (
            <View style={styles.positionsList}>
              {positions.map((position) => (
                <PositionRow key={position.id} position={position} />
              ))}
            </View>
          )}

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
  backBtn: { padding: Spacing.md },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  rowsContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  detailLeft: { flex: 1, gap: 2 },
  detailTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailSubtitle: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
  },
  detailValue: {
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  positionsList: { gap: Spacing.sm },
  emptyPositions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  emptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,149,0,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.subheadline,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyDesc: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.50)',
    marginTop: 2,
  },
});
