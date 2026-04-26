import { create } from 'zustand';
import {
  getAllAccounts,
  saveAccount,
  deleteAccount as deleteAccountService,
  loadKeys,
} from '../services/secureStore';
import type { ExchangeAccount, Exchange, APIKeys } from '../types/common';

interface AccountsState {
  accounts: ExchangeAccount[];
  isLoading: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (keys: APIKeys, exchange: Exchange, label?: string) => Promise<ExchangeAccount>;
  removeAccount: (account: ExchangeAccount) => Promise<void>;
  getKeys: (account: ExchangeAccount) => Promise<APIKeys | null>;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  isLoading: false,

  loadAccounts: async () => {
    set({ isLoading: true });
    const accounts = await getAllAccounts();
    set({ accounts, isLoading: false });
  },

  addAccount: async (keys, exchange, label) => {
    const account = await saveAccount(keys, exchange, label);
    const accounts = await getAllAccounts();
    set({ accounts });
    return account;
  },

  removeAccount: async (account) => {
    await deleteAccountService(account);
    const accounts = await getAllAccounts();
    set({ accounts });
  },

  getKeys: loadKeys,
}));
