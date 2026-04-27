import { StyleSheet } from 'react-native';

import { FontSize, Radius, Spacing } from '../../constants/theme';

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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
  },
  accountName: {
    marginTop: 2,
    fontSize: FontSize.title3,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
    color: '#34C759',
    backgroundColor: 'rgba(52,199,89,0.16)',
    fontSize: FontSize.caption,
    fontWeight: '900',
  },
  accountList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  accountChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  accountChipActive: {
    backgroundColor: 'rgba(0,212,255,0.20)',
  },
  accountChipText: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  accountChipTextActive: {
    color: '#FFFFFF',
  },
  double: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlBlock: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  controlLabel: {
    fontSize: FontSize.caption,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.48)',
    textTransform: 'uppercase',
  },
  settingsBlock: {
    gap: Spacing.md,
  },
  primaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  primaryText: {
    fontSize: FontSize.subheadline,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryText: {
    fontSize: FontSize.subheadline,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  muted: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.48)',
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: FontSize.title3,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: FontSize.subheadline,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: FontSize.subheadline,
    fontWeight: '800',
  },
  warningText: {
    color: '#FF9500',
    fontSize: FontSize.caption,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  previewIndex: {
    width: 36,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '800',
  },
  previewText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: FontSize.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  planCard: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  planHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  planTitle: {
    fontSize: FontSize.subheadline,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  planDate: {
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.42)',
  },
  planActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  orderTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.caption,
    fontWeight: '900',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  footerMessage: {
    paddingHorizontal: Spacing.md,
    color: 'rgba(52,199,89,0.95)',
    fontSize: FontSize.caption,
    fontWeight: '800',
  },
  tpslSection: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  tpslTitle: {
    fontSize: FontSize.subheadline,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tpslHint: {
    fontSize: FontSize.caption2,
    color: 'rgba(255,255,255,0.40)',
    lineHeight: 16,
  },
  previewOrderBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  previewTpslRow: {
    flexDirection: 'row',
    paddingLeft: 52,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  previewTp: {
    fontSize: FontSize.caption2,
    color: '#34C759',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  previewSl: {
    fontSize: FontSize.caption2,
    color: '#FF3B30',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default styles;
