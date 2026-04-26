import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExchangeAccount, Exchange, APIKeys } from '../types/common';

const ACCOUNTS_KEY = 'aircapital.exchangeAccounts.v1';

function secureKey(accountId: string, suffix: string): string {
  return `account_${accountId}_${suffix}`;
}

export async function getAllAccounts(): Promise<ExchangeAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const accounts: ExchangeAccount[] = JSON.parse(raw);
    return sortAccounts(accounts);
  } catch {
    return [];
  }
}

export async function getAccountsForExchange(exchange: Exchange): Promise<ExchangeAccount[]> {
  const all = await getAllAccounts();
  return all.filter((a) => a.exchange === exchange);
}

export async function saveAccount(
  keys: APIKeys,
  exchange: Exchange,
  label?: string,
): Promise<ExchangeAccount> {
  const accounts = await loadRaw();
  const cleanLabel = label?.trim() || undefined;
  const account: ExchangeAccount = {
    id: generateUUID(),
    exchange,
    label: cleanLabel || undefined,
    createdAt: new Date().toISOString(),
  };

  await SecureStore.setItemAsync(secureKey(account.id, 'apiKey'), keys.apiKey);
  await SecureStore.setItemAsync(secureKey(account.id, 'secretKey'), keys.secretKey);
  if (keys.passphrase) {
    await SecureStore.setItemAsync(secureKey(account.id, 'passphrase'), keys.passphrase);
  }

  accounts.push(account);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return account;
}

export async function loadKeys(account: ExchangeAccount): Promise<APIKeys | null> {
  try {
    const apiKey = await SecureStore.getItemAsync(secureKey(account.id, 'apiKey'));
    const secretKey = await SecureStore.getItemAsync(secureKey(account.id, 'secretKey'));
    if (!apiKey || !secretKey) return null;
    const passphrase = await SecureStore.getItemAsync(secureKey(account.id, 'passphrase'));
    return { apiKey, secretKey, passphrase: passphrase ?? undefined };
  } catch {
    return null;
  }
}

export async function deleteAccount(account: ExchangeAccount): Promise<void> {
  const accounts = await loadRaw();
  const updated = accounts.filter((a) => a.id !== account.id);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));

  await SecureStore.deleteItemAsync(secureKey(account.id, 'apiKey')).catch(() => {});
  await SecureStore.deleteItemAsync(secureKey(account.id, 'secretKey')).catch(() => {});
  await SecureStore.deleteItemAsync(secureKey(account.id, 'passphrase')).catch(() => {});
}

async function loadRaw(): Promise<ExchangeAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function sortAccounts(accounts: ExchangeAccount[]): ExchangeAccount[] {
  const order: Exchange[] = ['binance', 'bybit', 'bingx', 'okx', 'gateio'];
  return [...accounts].sort((a, b) => {
    const ia = order.indexOf(a.exchange);
    const ib = order.indexOf(b.exchange);
    if (ia !== ib) return ia - ib;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function generateUUID(): string {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto?.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
