import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GridPlan } from '../trading/types';
import type { ExchangeAccount } from '../types/common';
import { deleteAccount, getAllAccounts, loadKeys, saveAccount } from './secureStore';
import { loadGridPlans, saveGridPlan, updateGridPlan } from './gridPlansStore';

const mockState = vi.hoisted(() => ({
  asyncStorage: new Map<string, string>(),
  secureStorage: new Map<string, string>(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockState.asyncStorage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockState.asyncStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockState.asyncStorage.delete(key);
      return Promise.resolve();
    }),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn((key: string) => Promise.resolve(mockState.secureStorage.get(key) ?? null)),
  setItemAsync: vi.fn((key: string, value: string) => {
    mockState.secureStorage.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: vi.fn((key: string) => {
    mockState.secureStorage.delete(key);
    return Promise.resolve();
  }),
}));

const gridPlan = (id: string, updatedAt: string): GridPlan => ({
  id,
  accountId: 'account-1',
  exchange: 'okx',
  status: 'active',
  createdAt: updatedAt,
  updatedAt,
  draft: {
    venue: 'spot',
    instId: 'BTC-USDT',
    quoteCcy: 'USDT',
    totalQuote: 100,
    minPrice: 90,
    maxPrice: 110,
    spacingMode: 'count',
    gridCount: 3,
    martingalePercent: 0,
    marginMode: 'cross',
    positionMode: 'net_mode',
    leverage: 1,
  },
  orders: [],
  exchangeOrderIds: [],
});

describe('secure account storage', () => {
  beforeEach(() => {
    mockState.asyncStorage.clear();
    mockState.secureStorage.clear();
  });

  it('stores account metadata separately from API keys', async () => {
    const account = await saveAccount(
      { apiKey: 'api-key', secretKey: 'secret-key', passphrase: 'passphrase' },
      'okx',
      ' Main ',
    );

    expect(account.label).toBe('Main');
    expect(await getAllAccounts()).toEqual([account]);
    expect(await loadKeys(account)).toEqual({
      apiKey: 'api-key',
      secretKey: 'secret-key',
      passphrase: 'passphrase',
    });
  });

  it('sorts accounts by exchange order and created date', async () => {
    const accounts: ExchangeAccount[] = [
      { id: 'late-okx', exchange: 'okx', createdAt: '2024-01-02T00:00:00.000Z' },
      { id: 'binance', exchange: 'binance', createdAt: '2024-01-03T00:00:00.000Z' },
      { id: 'early-okx', exchange: 'okx', createdAt: '2024-01-01T00:00:00.000Z' },
    ];
    mockState.asyncStorage.set('aircapital.exchangeAccounts.v1', JSON.stringify(accounts));

    expect((await getAllAccounts()).map((account) => account.id)).toEqual(['binance', 'early-okx', 'late-okx']);
  });

  it('deletes account metadata and all secure key entries', async () => {
    const account = await saveAccount({ apiKey: 'api', secretKey: 'secret', passphrase: 'pass' }, 'okx');

    await deleteAccount(account);

    expect(await getAllAccounts()).toEqual([]);
    expect(await loadKeys(account)).toBeNull();
  });
});

describe('grid plan storage', () => {
  beforeEach(() => {
    mockState.asyncStorage.clear();
    mockState.secureStorage.clear();
  });

  it('saves newest plan first and updates plans in place', async () => {
    await saveGridPlan(gridPlan('old', '2024-01-01T00:00:00.000Z'));
    await saveGridPlan(gridPlan('new', '2024-01-02T00:00:00.000Z'));

    const updated = await updateGridPlan('old', (plan) => ({
      ...plan,
      status: 'paused',
      updatedAt: '2024-01-03T00:00:00.000Z',
    }));

    expect(updated.find((plan) => plan.id === 'old')?.status).toBe('paused');
    expect((await loadGridPlans()).map((plan) => plan.id)).toEqual(['old', 'new']);
  });

  it('migrates legacy OKX grid plans to the current storage key', async () => {
    const legacy = gridPlan('legacy', '2024-01-01T00:00:00.000Z');
    mockState.asyncStorage.set('aircapital.okx.gridPlans.v1', JSON.stringify([legacy]));

    expect(await loadGridPlans()).toEqual([legacy]);
    expect(mockState.asyncStorage.has('aircapital.trading.gridPlans.v2')).toBe(true);
  });
});
