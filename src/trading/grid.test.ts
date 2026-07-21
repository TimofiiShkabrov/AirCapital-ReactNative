import { describe, expect, it } from 'vitest';
import {
  buildGridPreview,
  buildOkxInstrumentId,
  estimateNotional,
  estimateQuantityFromQuote,
  parsePositiveNumber,
  roundDownToStep,
  roundPrice,
} from './grid';
import type { GridDraft, OkxInstrument } from './types';

const spotInstrument: OkxInstrument = {
  instType: 'SPOT',
  instId: 'BTC-USDT',
  baseCcy: 'BTC',
  quoteCcy: 'USDT',
  tickSz: '0.5',
  lotSz: '0.001',
  minSz: '0.001',
  minNotional: '5',
  maxLmtSz: '20',
  state: 'live',
};

const baseDraft: GridDraft = {
  venue: 'spot',
  instId: 'BTC-USDT',
  quoteCcy: 'USDT',
  totalQuote: 120,
  minPrice: 90,
  maxPrice: 110,
  spacingMode: 'count',
  gridCount: 3,
  martingalePercent: 0,
  marginMode: 'cross',
  positionMode: 'net_mode',
  leverage: 1,
  reservedFeeRate: 0,
};

describe('grid helpers', () => {
  it('parses positive decimal inputs and rejects zero/invalid values', () => {
    expect(parsePositiveNumber('12,5')).toBe(12.5);
    expect(parsePositiveNumber(' 0 ')).toBeUndefined();
    expect(parsePositiveNumber('nope')).toBeUndefined();
  });

  it('rounds quantities and prices down to exchange steps', () => {
    expect(roundDownToStep(1.239, 0.01)).toBe(1.23);
    expect(roundPrice(101.74, spotInstrument)).toBe(101.5);
  });

  it('builds OKX spot and swap instrument ids', () => {
    expect(buildOkxInstrumentId('eth', 'usdt', 'spot')).toBe('ETH-USDT');
    expect(buildOkxInstrumentId('eth', 'usdt', 'swap')).toBe('ETH-USDT-SWAP');
  });

  it('estimates spot and swap quantity from quote amount', () => {
    expect(estimateQuantityFromQuote('spot', 50, 100, spotInstrument)).toBe(0.5);
    expect(estimateNotional('spot', 0.5, 100, spotInstrument)).toBe(50);
    expect(estimateQuantityFromQuote('swap', 50, 100, { ...spotInstrument, ctVal: '0.01' })).toBe(50);
  });

  it('builds a count-based grid from high price to low price', () => {
    const result = buildGridPreview(baseDraft, spotInstrument);

    expect(result.warnings).toEqual([]);
    expect(result.orders.map((order) => order.price)).toEqual([110, 100, 90]);
    expect(result.orders).toHaveLength(3);
    expect(result.orders.every((order) => order.quantity > 0 && !order.warning)).toBe(true);
  });

  it('reserves fees and attaches TP/SL prices for swap drafts', () => {
    const result = buildGridPreview(
      {
        ...baseDraft,
        venue: 'swap',
        reservedFeeRate: 0.002,
        tpPercent: 3,
        slPercent: 2,
      },
      { ...spotInstrument, instType: 'SWAP', instId: 'BTC-USDT-SWAP', ctVal: '0.01' },
    );

    expect(result.warnings.some((warning) => warning.includes('reserved'))).toBe(true);
    expect(result.orders[0].tpPrice).toBe(113);
    expect(result.orders[0].slPrice).toBe(107.5);
  });

  it('marks orders below safe notional', () => {
    const result = buildGridPreview({ ...baseDraft, totalQuote: 1 }, spotInstrument);

    expect(result.warnings.some((warning) => warning.includes('below minimum'))).toBe(true);
    expect(result.orders.some((order) => order.warning)).toBe(true);
  });
});
