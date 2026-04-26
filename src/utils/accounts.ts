import type { TFunction } from 'i18next';
import type { ExchangeAccount } from '../types/common';

export function accountLabel(
  account: ExchangeAccount,
  allAccounts: ExchangeAccount[],
  t: TFunction,
): string {
  if (account.label) return account.label;
  const sameExchange = allAccounts.filter((a) => a.exchange === account.exchange);
  const index = sameExchange.findIndex((a) => a.id === account.id);
  return t('common.account_format', { index: index >= 0 ? index + 1 : 1 });
}
