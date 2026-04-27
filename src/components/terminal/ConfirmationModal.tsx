import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import LiquidBackground from '../ui/LiquidBackground';
import { FontSize, Radius, Spacing } from '../../constants/theme';

interface SummaryRow {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  title: string;
  rows: SummaryRow[];
  warning?: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  rows,
  warning,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LiquidBackground />
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={8}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.70)" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
            {warning ? (
              <View style={styles.warning}>
                <Ionicons name="warning-outline" size={16} color="#FF9500" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} disabled={busy} activeOpacity={0.82} style={styles.confirmTouch}>
              <LinearGradient
                colors={['rgba(0,212,255,0.72)', 'rgba(0,180,160,0.78)', 'rgba(30,80,200,0.68)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.confirmBtn, busy && styles.busy]}
              >
                <Text style={styles.confirmText}>{busy ? t('terminal.sending') : confirmLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: {
    maxHeight: 360,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowLabel: {
    flex: 1,
    fontSize: FontSize.subheadline,
    color: 'rgba(255,255,255,0.52)',
  },
  rowValue: {
    flex: 1,
    fontSize: FontSize.subheadline,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,149,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.25)',
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.72)',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    paddingBottom: 34,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: {
    fontSize: FontSize.subheadline,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
  },
  confirmTouch: {
    flex: 1.4,
  },
  confirmBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  busy: {
    opacity: 0.65,
  },
  confirmText: {
    fontSize: FontSize.subheadline,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
