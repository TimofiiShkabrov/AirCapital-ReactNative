import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import LiquidBackground from '../src/components/ui/LiquidBackground';
import LiquidCard from '../src/components/ui/LiquidCard';
import GlassInput from '../src/components/ui/GlassInput';

import { useAccountsStore } from '../src/store/accountsStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { EXCHANGE_CONFIG } from '../src/constants/exchanges';
import type { Exchange, ExchangeAccount } from '../src/types/common';
import { ALL_EXCHANGES } from '../src/types/common';
import { FontSize, Radius, Spacing } from '../src/constants/theme';
import { accountLabel } from '../src/utils/accounts';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { accounts, loadAccounts, addAccount, removeAccount } = useAccountsStore();
  const { language, setLanguage } = useSettingsStore();

  const [selectedExchange, setSelectedExchange] = useState<Exchange>('binance');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [savedAlert, setSavedAlert] = useState(false);
  const [exchangePickerVisible, setExchangePickerVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSave = useCallback(async () => {
    const trimmedKey = apiKey.trim();
    const trimmedSecret = secretKey.trim();
    if (!trimmedKey || !trimmedSecret) {
      Alert.alert(t('common.error'), t('settings.api_keys.required'));
      return;
    }
    await addAccount(
      {
        apiKey: trimmedKey,
        secretKey: trimmedSecret,
        passphrase: selectedExchange === 'okx' ? passphrase.trim() || undefined : undefined,
      },
      selectedExchange,
      label.trim() || undefined,
    );
    setApiKey('');
    setSecretKey('');
    setPassphrase('');
    setLabel('');
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  }, [addAccount, apiKey, label, passphrase, secretKey, selectedExchange, t]);

  const handleDelete = useCallback(
    (account: ExchangeAccount) => {
      Alert.alert(
        t('common.delete'),
        t('common.confirm_delete'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => removeAccount(account) },
        ],
      );
    },
    [removeAccount, t],
  );

  return (
    <View style={styles.root}>
      <LiquidBackground />
      <SafeAreaView style={styles.fill}>
        {/* Header */}
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>{t('settings.title')}</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header text */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{t('settings.header.title')}</Text>
            <Text style={styles.pageSubtitle}>{t('settings.header.subtitle')}</Text>
          </View>

          {/* Language */}
          <LiquidCard title={t('settings.language.title')}>
            <View style={styles.segmented}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.segmentBtn, language === lang.code && styles.segmentBtnActive]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={[styles.segmentText, language === lang.code && styles.segmentTextActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LiquidCard>

          {/* Exchange picker */}
          <LiquidCard title={t('settings.exchange.title')}>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => setExchangePickerVisible(true)}
              activeOpacity={0.75}
            >
              <Image
                source={EXCHANGE_CONFIG[selectedExchange].logo}
                style={styles.pickerLogo}
                resizeMode="contain"
              />
              <View style={styles.pickerMeta}>
                <Text style={styles.pickerLabel}>{t('settings.exchange.choose')}</Text>
                <Text style={styles.pickerValue}>{EXCHANGE_CONFIG[selectedExchange].label}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.40)" />
            </TouchableOpacity>
          </LiquidCard>

          {selectedExchange === 'okx' && (
            <LiquidCard title={t('settings.api_instruction.okx_title')}>
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>{t('settings.api_instruction.okx_1')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.okx_2')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.okx_3')}</Text>
                <Text style={styles.instructionWarning}>{t('settings.api_instruction.okx_4')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.okx_5')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.okx_6')}</Text>
              </View>
            </LiquidCard>
          )}

          {selectedExchange === 'binance' && (
            <LiquidCard title={t('settings.api_instruction.binance_title')}>
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_1')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_2')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_3')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_4')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_5')}</Text>
                <Text style={styles.instructionWarning}>{t('settings.api_instruction.binance_6')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_7')}</Text>
                <Text style={styles.instructionText}>{t('settings.api_instruction.binance_8')}</Text>
              </View>
            </LiquidCard>
          )}

          {/* Account label */}
          <LiquidCard title={t('settings.account.title')}>
            <GlassInput
              label={t('settings.account.name')}
              placeholder={t('settings.account.optional_label')}
              value={label}
              onChangeText={setLabel}
            />
          </LiquidCard>

          {/* API Keys */}
          <LiquidCard title={t('settings.api_keys.title')}>
            <GlassInput
              label={t('settings.api_keys.api_key')}
              placeholder={t('settings.api_keys.api_key_placeholder')}
              value={apiKey}
              onChangeText={setApiKey}
            />
            <GlassInput
              label={t('settings.api_keys.secret_key')}
              placeholder={t('settings.api_keys.secret_key_placeholder')}
              value={secretKey}
              onChangeText={setSecretKey}
              secureTextEntry
            />
            {selectedExchange === 'okx' && (
              <GlassInput
                label={t('settings.api_keys.passphrase')}
                placeholder={t('settings.api_keys.passphrase_placeholder')}
                value={passphrase}
                onChangeText={setPassphrase}
                secureTextEntry
              />
            )}
          </LiquidCard>

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={['rgba(0,212,255,0.65)', 'rgba(0,180,160,0.70)', 'rgba(30,80,200,0.60)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {savedAlert ? t('settings.saved_alert.title') : t('settings.save_keys')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Saved accounts */}
          <LiquidCard title={t('settings.saved_accounts.title')}>
            {accounts.length === 0 ? (
              <View style={styles.emptyAccounts}>
                <Ionicons name="archive-outline" size={20} color="rgba(255,255,255,0.30)" />
                <Text style={styles.emptyAccountsText}>{t('settings.saved_accounts.empty')}</Text>
              </View>
            ) : (
              accounts.map((account) => (
                <SavedAccountRow
                  key={account.id}
                  account={account}
                  label={accountLabel(account, accounts, t)}
                  onDelete={() => handleDelete(account)}
                />
              ))
            )}
          </LiquidCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Exchange picker modal */}
      <Modal
        visible={exchangePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExchangePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExchangePickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <LiquidBackground />
            <View style={styles.modalHandle} />
            {ALL_EXCHANGES.map((ex) => (
              <TouchableOpacity
                key={ex}
                style={styles.exchangeOption}
                onPress={() => { setSelectedExchange(ex); setExchangePickerVisible(false); }}
              >
                <Image source={EXCHANGE_CONFIG[ex].logo} style={styles.optionLogo} resizeMode="contain" />
                <Text style={[styles.optionName, selectedExchange === ex && styles.optionNameActive]}>
                  {EXCHANGE_CONFIG[ex].label}
                </Text>
                {selectedExchange === ex && (
                  <Ionicons name="checkmark" size={18} color="rgba(0,212,255,0.9)" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SavedAccountRow({
  account,
  label,
  onDelete,
}: {
  account: ExchangeAccount;
  label: string;
  onDelete: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <Image
        source={EXCHANGE_CONFIG[account.exchange].logo}
        style={rowStyles.logo}
        resizeMode="contain"
      />
      <View style={rowStyles.meta}>
        <Text style={rowStyles.name}>{EXCHANGE_CONFIG[account.exchange].label}</Text>
        {label ? <Text style={rowStyles.label}>{label}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
  },
  logo: { width: 32, height: 32, borderRadius: 8 },
  meta: { flex: 1 },
  name: { fontSize: FontSize.subheadline, fontWeight: '600', color: '#FFFFFF' },
  label: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.50)' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  navTitle: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 40,
  },
  pageHeader: { paddingBottom: Spacing.xs },
  pageTitle: {
    fontSize: FontSize.largeTitle,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.50)',
    marginTop: Spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0,212,255,0.20)',
  },
  segmentText: {
    fontSize: FontSize.subheadline,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
  },
  segmentTextActive: { color: 'rgba(0,212,255,0.95)' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
  },
  pickerLogo: { width: 32, height: 32, borderRadius: 8 },
  pickerMeta: { flex: 1 },
  pickerLabel: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerValue: { fontSize: FontSize.subheadline, fontWeight: '600', color: '#FFFFFF' },
  instructions: {
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.58)',
  },
  instructionWarning: {
    fontSize: FontSize.caption,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FF9500',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: 26,
  },
  saveBtnText: {
    fontSize: FontSize.headline,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyAccounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
  },
  emptyAccountsText: {
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.40)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  exchangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  optionLogo: { width: 32, height: 32, borderRadius: 8 },
  optionName: {
    flex: 1,
    fontSize: FontSize.body,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  optionNameActive: { color: '#FFFFFF' },
});
