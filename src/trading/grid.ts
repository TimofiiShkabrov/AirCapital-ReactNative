import type { GridDraft, GridOrderPreview, OkxInstrument, TradingVenue } from './types';

const MAX_OKX_PENDING_PER_SYMBOL = 500;
export const MIN_SAFE_NOTIONAL = 5;

export interface GridBuildResult {
  orders: GridOrderPreview[];
  warnings: string[];
}

export interface GridPreviewMessages {
  invalidSettings: string;
  maxPending: (max: number) => string;
  belowMin: (min: string, ccy: string) => string;
  aboveMax: (max: string) => string;
  invalidCount: (count: number) => string;
  feeReserved: (percent: string) => string;
}

export function makeClientOrderId(prefix: string): string {
  const clean = prefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'ac';
  return `${clean}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
}

export function parsePositiveNumber(value: string): number | undefined {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function formatDecimal(value: number | string | undefined, maxFractionDigits = 12): string {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';
  const normalized = text.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return text;
  if (parsed === 0) return '0';

  const [integerPart, fractionPart = ''] = normalized.split('.');
  if (!fractionPart) return String(parsed);

  const trimmedFraction = fractionPart
    .slice(0, maxFractionDigits)
    .replace(/0+$/, '');
  return trimmedFraction ? `${integerPart || '0'}.${trimmedFraction}` : integerPart || '0';
}

export function formatCurrencyAmount(value: number | string | undefined, maxFractionDigits = 8): string {
  return formatDecimal(value, maxFractionDigits);
}

export function inferQuoteCurrency(instId: string): string {
  const parts = instId.split('-');
  return parts[1] || 'USDT';
}

export function buildOkxInstrumentId(
  baseAsset: string,
  quoteCcy: string,
  venue: TradingVenue,
): string {
  const base = baseAsset.trim().toUpperCase() || 'BTC';
  const quote = quoteCcy.trim().toUpperCase() || 'USDT';
  return venue === 'swap' ? `${base}-${quote}-SWAP` : `${base}-${quote}`;
}

export function roundDownToStep(value: number, step: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (!Number.isFinite(step) || step <= 0) return value;
  const precision = decimalPlaces(step);
  const rounded = Math.floor((value + Number.EPSILON) / step) * step;
  return Number(rounded.toFixed(Math.min(precision, 12)));
}

export function roundPrice(value: number, instrument?: OkxInstrument): number {
  const tick = Number(instrument?.tickSz ?? 0);
  return tick > 0 ? roundDownToStep(value, tick) : value;
}

export function estimateQuantityFromQuote(
  venue: TradingVenue,
  quoteAmount: number,
  price: number,
  instrument?: OkxInstrument,
): number {
  if (quoteAmount <= 0 || price <= 0) return 0;
  const lot = Number(instrument?.lotSz ?? 0);
  const ctVal = venue === 'swap' ? Number(instrument?.ctVal ?? 1) || 1 : 1;
  const raw = venue === 'swap' ? quoteAmount / (price * ctVal) : quoteAmount / price;
  return lot > 0 ? roundDownToStep(raw, lot) : raw;
}

export function estimateNotional(
  venue: TradingVenue,
  quantity: number,
  price: number,
  instrument?: OkxInstrument,
): number {
  const ctVal = venue === 'swap' ? Number(instrument?.ctVal ?? 1) || 1 : 1;
  return quantity * price * ctVal;
}

export function buildGridPreview(
  draft: GridDraft,
  instrument?: OkxInstrument,
  messages: GridPreviewMessages = defaultGridMessages,
): GridBuildResult {
  const warnings: string[] = [];
  const prices = buildGridPrices(draft, instrument);
  if (prices.length === 0) {
    return { orders: [], warnings: [messages.invalidSettings] };
  }

  if (prices.length > MAX_OKX_PENDING_PER_SYMBOL) {
    warnings.push(messages.maxPending(MAX_OKX_PENDING_PER_SYMBOL));
  }

  const usablePrices = prices.slice(0, MAX_OKX_PENDING_PER_SYMBOL);
  const factor = 1 + draft.martingalePercent / 100;
  const weights = usablePrices.map((_, index) => Math.pow(factor, index));
  const weightSum = weights.reduce((sum, item) => sum + item, 0);
  const reservedFeeRate = Number.isFinite(draft.reservedFeeRate ?? 0)
    ? Math.max(0, Math.min(draft.reservedFeeRate ?? 0, 0.05))
    : 0;
  const budgetQuote = draft.totalQuote * (1 - reservedFeeRate);
  const firstQuote = budgetQuote / weightSum;

  const minSz = Number(instrument?.minSz ?? 0);
  const maxLmtSz = Number(instrument?.maxLmtSz ?? 0);
  const orders = usablePrices.map((price, index) => {
    const quoteAmount = firstQuote * weights[index];
    const quantity = estimateQuantityFromQuote(draft.venue, quoteAmount, price, instrument);
    const notional = estimateNotional(draft.venue, quantity, price, instrument);
    const exchangeMinNotional = Number(instrument?.minNotional ?? 0);
    const minNotional = Math.max(
      MIN_SAFE_NOTIONAL,
      Number.isFinite(exchangeMinNotional) ? exchangeMinNotional : 0,
      minSz > 0 ? estimateNotional(draft.venue, minSz, price, instrument) : 0,
    );
    let warning: string | undefined;
    if (quantity <= 0 || quantity < minSz || notional < minNotional) {
      warning = messages.belowMin(formatCurrencyAmount(minNotional), draft.quoteCcy);
    } else if (maxLmtSz > 0 && quantity > maxLmtSz) {
      warning = messages.aboveMax(formatDecimal(maxLmtSz));
    }

    const tpPrice =
      draft.tpPercent && draft.tpPercent > 0
        ? roundPrice(price * (1 + draft.tpPercent / 100), instrument)
        : undefined;
    const slPrice =
      draft.slPercent && draft.slPercent > 0 && draft.venue === 'swap'
        ? roundPrice(price * (1 - draft.slPercent / 100), instrument)
        : undefined;

    return {
      index: index + 1,
      price,
      quoteAmount,
      quantity,
      notional,
      clOrdId: makeClientOrderId(`acg${index + 1}`),
      warning,
      tpPrice,
      slPrice,
    };
  });

  const invalidCount = orders.filter((order) => order.warning).length;
  if (invalidCount > 0) {
    warnings.push(messages.invalidCount(invalidCount));
  }
  if (reservedFeeRate > 0) {
    warnings.push(messages.feeReserved(formatDecimal((reservedFeeRate * 100).toFixed(3))));
  }

  return { orders, warnings };
}

const defaultGridMessages: GridPreviewMessages = {
  invalidSettings: 'Check the price range and grid settings.',
  maxPending: (max) => `The exchange limits active orders per symbol. Grid was trimmed to ${max} orders.`,
  belowMin: (min, ccy) => `Below safe minimum: ${min} ${ccy}`,
  aboveMax: (max) => `Above exchange limit: ${max}`,
  invalidCount: (count) => `${count} orders are below minimum size or safe notional.`,
  feeReserved: (percent) => `${percent}% reserved for exchange fees and rounding.`,
};

function buildGridPrices(draft: GridDraft, instrument?: OkxInstrument): number[] {
  const min = Math.min(draft.minPrice, draft.maxPrice);
  const max = Math.max(draft.minPrice, draft.maxPrice);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min) return [];

  if (draft.spacingMode === 'step') {
    const step = draft.priceStep ?? 0;
    if (!Number.isFinite(step) || step <= 0) return [];
    const prices: number[] = [];
    for (let price = min; price <= max + step * 0.000001; price += step) {
      prices.push(roundPrice(price, instrument));
      if (prices.length > MAX_OKX_PENDING_PER_SYMBOL) break;
    }
    return uniquePrices(prices);
  }

  const count = Math.floor(draft.gridCount ?? 0);
  if (!Number.isFinite(count) || count < 2) return [];
  const step = (max - min) / (count - 1);
  return uniquePrices(Array.from({ length: count }, (_, index) => roundPrice(min + step * index, instrument)));
}

function uniquePrices(prices: number[]): number[] {
  return [...new Set(prices.filter((price) => Number.isFinite(price) && price > 0))]
    .sort((a, b) => b - a);
}

function decimalPlaces(value: number): number {
  const text = value.toString().toLowerCase();
  if (text.includes('e-')) return Number(text.split('e-')[1]) || 0;
  return text.includes('.') ? text.split('.')[1].length : 0;
}
