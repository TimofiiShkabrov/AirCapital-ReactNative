import { create } from "zustand";
import {
  getAllAccounts,
  saveAccount,
  deleteAccount,
  markAccountForDeletion,
  loadKeys,
} from "../services/secureStore";
import { removeAccountHistory } from "../services/balanceHistory";
import { removeAccountFlows } from "../services/cashFlows";
import { usePortfolioStore } from "./portfolioStore";
import type { ExchangeAccount, Exchange, APIKeys } from "../types/common";
interface AccountsState {
  accounts: ExchangeAccount[];
  isLoading: boolean;
  error?: string;
  loadAccounts: () => Promise<void>;
  addAccount: (
    keys: APIKeys,
    exchange: Exchange,
    label?: string,
  ) => Promise<ExchangeAccount>;
  removeAccount: (account: ExchangeAccount) => Promise<void>;
  getKeys: (account: ExchangeAccount) => Promise<APIKeys | null>;
}
export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  loadAccounts: async () => {
    set({ isLoading: true, error: undefined });
    try {
      set({ accounts: await getAllAccounts() });
    } catch {
      set({ error: "storageError" });
    } finally {
      set({ isLoading: false });
    }
  },
  addAccount: async (keys, exchange, label) => {
    try {
      return await saveAccount(keys, exchange, label);
    } finally {
      await get().loadAccounts();
    }
  },
  removeAccount: async (account) => {
    try {
      await markAccountForDeletion(account);
      // Keep a metadata recovery handle until every private-data cleanup succeeds.
      await usePortfolioStore.getState().forgetAccount(account.id);
      await removeAccountHistory(account.id);
      await removeAccountFlows(account.id);
      await deleteAccount(account);
    } finally {
      await get().loadAccounts();
    }
  },
  getKeys: loadKeys,
}));
