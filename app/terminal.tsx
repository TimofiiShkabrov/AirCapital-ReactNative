import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import LiquidBackground from '../src/components/ui/LiquidBackground';
import LiquidCard from '../src/components/ui/LiquidCard';
import LoadingView from '../src/components/ui/LoadingView';
import ConfirmationModal from '../src/components/terminal/ConfirmationModal';
import AmountSelector from '../src/components/terminal/AmountSelector';
import InstrumentSelector from '../src/components/terminal/InstrumentSelector';
import PlanButton from '../src/components/terminal/PlanButton';
import SegmentedControl from '../src/components/terminal/SegmentedControl';
import TerminalInput from '../src/components/terminal/TerminalInput';
import TradeSettings from '../src/components/terminal/TradeSettings';
import { useAccountsStore } from '../src/store/accountsStore';
import { usePortfolioStore } from '../src/store/portfolioStore';
import styles from '../src/screens/terminal/styles';
import { fetchSpotAccount as fetchBinanceSpotAccount } from '../src/api/binance';
import { fetchAccountBalance } from '../src/api/okx';
import {
  cancelBinanceOrders,
  fetchBinanceCommission,
  fetchBinanceExchangeInfo,
  fetchBinanceFuturesBalance,
  fetchBinanceLeverageBracket,
  fetchBinanceOpenOrders,
  fetchBinanceTicker,
  placeBinanceGridOrders,
  placeBinanceOrder,
  setBinanceLeverage,
  setBinanceMarginType,
  setBinancePositionMode,
  type BinanceCommission,
  type BinanceOpenOrder,
  type BinanceOrderRequest,
  type BinanceSymbolInfo,
  type BinanceTicker,
} from '../src/api/binanceTrade';
import {
  cancelOkxBatchOrders,
  closeOkxPosition,
  fetchOkxLeverageInfo,
  fetchOkxPendingOrders,
  fetchOkxPublicInstruments,
  fetchOkxTicker,
  fetchOkxTradeFee,
  okxEnvelopeFailed,
  placeOkxBatchOrders,
  placeOkxOrder,
  setOkxLeverage,
  setOkxPositionMode,
  type OkxOrderRequest,
  type OkxPendingOrder,
  type OkxTicker,
  type OkxTradeFee,
} from '../src/api/okxTrade';
import { loadKeys } from '../src/services/secureStore';
import { loadGridPlans, saveGridPlan, updateGridPlan } from '../src/services/gridPlansStore';
import {
  buildGridPreview,
  buildOkxInstrumentId,
  estimateNotional,
  estimateQuantityFromQuote,
  formatCurrencyAmount,
  formatDecimal,
  makeClientOrderId,
  MIN_SAFE_NOTIONAL,
  parsePositiveNumber,
  roundPrice,
} from '../src/trading/grid';
import type {
  ExchangeAccount,
  PositionItem,
} from '../src/types/common';
import type {
  GridDraft,
  GridOrderPreview,
  GridPlan,
  GridSpacingMode,
  MarginMode,
  OkxInstrument,
  PositionMode,
  TerminalMode,
  TradeOrderType,
  TradeSide,
  TradingVenue,
} from '../src/trading/types';

type ConfirmAction = 'single' | 'grid' | 'cancel-plan' | 'pause-plan' | 'close-plan';
type TradingExchange = 'okx' | 'binance';
type TerminalTicker = OkxTicker | BinanceTicker;
type TerminalOpenOrder = OkxPendingOrder | BinanceOpenOrder;

export default function TerminalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.loadAccounts);
  const loadPortfolioData = usePortfolioStore((s) => s.loadData);
  const terminalPositions = usePortfolioStore((s) => s.getPositionsForAccount);
  const tradingAccounts = useMemo(
    () => accounts.filter((account): account is ExchangeAccount & { exchange: TradingExchange } => (
      account.exchange === 'okx' || account.exchange === 'binance'
    )),
    [accounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [mode, setMode] = useState<TerminalMode>('single');
  const [venue, setVenue] = useState<TradingVenue>('spot');
  const [instId, setInstId] = useState('BTC-USDT');
  const [side, setSide] = useState<TradeSide>('buy');
  const [orderType, setOrderType] = useState<TradeOrderType>('limit');
  const [amountText, setAmountText] = useState('100');
  const [priceText, setPriceText] = useState('');
  const [marginMode, setMarginMode] = useState<MarginMode>('cross');
  const [positionMode, setPositionMode] = useState<PositionMode>('net_mode');
  const [leverageText, setLeverageText] = useState('3');
  const [gridMinText, setGridMinText] = useState('');
  const [gridMaxText, setGridMaxText] = useState('');
  const [gridSpacingMode, setGridSpacingMode] = useState<GridSpacingMode>('count');
  const [gridStepText, setGridStepText] = useState('100');
  const [gridCountText, setGridCountText] = useState('10');
  const [martingaleText, setMartingaleText] = useState('0');
  const [tpText, setTpText] = useState('');
  const [slText, setSlText] = useState('');
  const [singleTpText, setSingleTpText] = useState('');
  const [singleSlText, setSingleSlText] = useState('');
  const [instrument, setInstrument] = useState<OkxInstrument | undefined>();
  const [availableInstruments, setAvailableInstruments] = useState<OkxInstrument[]>([]);
  const [ticker, setTicker] = useState<TerminalTicker | undefined>();
  const [currentLeverage, setCurrentLeverage] = useState<number | undefined>();
  const [tradeFeeReserveRate, setTradeFeeReserveRate] = useState(0);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [depositQuote, setDepositQuote] = useState<number | undefined>();
  const [depositLoading, setDepositLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOrders, setPreviewOrders] = useState<GridOrderPreview[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [gridPlans, setGridPlans] = useState<GridPlan[]>([]);
  const [openOrders, setOpenOrders] = useState<TerminalOpenOrder[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [targetPlan, setTargetPlan] = useState<GridPlan | null>(null);
  const [lastMessage, setLastMessage] = useState('');

  const selectedAccount = tradingAccounts.find((account) => account.id === selectedAccountId);
  const selectedExchange = selectedAccount?.exchange ?? 'okx';
  const { quote: quoteCcy } = useMemo(() => parseInstrumentParts(instId, selectedExchange), [instId, selectedExchange]);
  const lastPrice = parsePositiveNumber(tickerLast(ticker) ?? '') ?? undefined;
  const maxInstrumentLeverage = venue === 'swap'
    ? selectedExchange === 'binance'
      ? currentLeverage
      : parsePositiveNumber(instrument?.lever ?? '')
    : undefined;
  const activePositions = useMemo(() => (
    selectedAccount
      ? terminalPositions(selectedAccount, venue === 'spot' ? 'spot' : 'futures')
        .filter((position) => positionMatchesInstrument(position, instId, selectedExchange))
      : []
  ), [instId, selectedAccount, selectedExchange, terminalPositions, venue]);

  useEffect(() => {
    void loadAccounts();
    void loadPortfolioData();
    void loadGridPlans().then(setGridPlans);
  }, [loadAccounts, loadPortfolioData]);

  useEffect(() => {
    if (!selectedAccountId && tradingAccounts[0]) {
      setSelectedAccountId(tradingAccounts[0].id);
    }
  }, [tradingAccounts, selectedAccountId]);

  useEffect(() => {
    if (mode === 'grid' && orderType !== 'limit') setOrderType('limit');
  }, [mode, orderType]);

  useEffect(() => {
    if (venue === 'spot' && side !== 'buy') setSide('buy');
  }, [side, venue]);

  useEffect(() => {
    setInstId((current) => {
      const { base, quote } = parseInstrumentParts(current, selectedExchange);
      const next = buildInstrumentId(base, quote, venue, selectedExchange);
      return next === current ? current : next;
    });
  }, [selectedExchange, venue]);

  useEffect(() => {
    setPriceText('');
    setSingleTpText('');
    setSingleSlText('');
    setPreviewOrders([]);
    setPreviewWarnings([]);
  }, [venue, instId]);

  useEffect(() => {
    let canceled = false;
    setInstrumentsLoading(true);
    void fetchPublicInstruments(selectedExchange, venue)
      .then((res) => {
        if (canceled) return;
        const live = res.filter((item) => (
            item.state === 'live'
            && (venue === 'spot' || parseInstrumentParts(item.instId, selectedExchange).quote === 'USDT')
          ));
        setAvailableInstruments(live);
        const current = live.find((item) => item.instId === instId);
        if (current) {
          setInstrument(current);
          return;
        }
        const { base, quote } = parseInstrumentParts(instId, selectedExchange);
        const preferredId = buildInstrumentId(base, quote, venue, selectedExchange);
        const fallback = live.find((item) => item.instId === preferredId)
          ?? live.find((item) => item.instId === buildInstrumentId('BTC', 'USDT', venue, selectedExchange))
          ?? live.find((item) => item.instId.includes('-USDT'))
          ?? live.find((item) => item.instId.includes('USDT'))
          ?? live[0];
        if (fallback) {
          setInstId(fallback.instId);
          setInstrument(fallback);
        } else {
          setInstrument(undefined);
        }
      })
      .finally(() => {
        if (!canceled) setInstrumentsLoading(false);
      });
    return () => { canceled = true; };
  }, [instId, selectedExchange, venue]);

  const selectInstrument = useCallback((nextInstrument: OkxInstrument) => {
    setInstId(nextInstrument.instId);
    setInstrument(nextInstrument);
    setTicker(undefined);
    setPriceText('');
    setPreviewOrders([]);
    setPreviewWarnings([]);
  }, []);

  const refreshMarket = useCallback(async () => {
    setMarketLoading(true);
    try {
      const [instRes, tickerRes] = await Promise.all([
        fetchInstrument(selectedExchange, venue, instId),
        fetchTicker(selectedExchange, venue, instId),
      ]);
      setInstrument(instRes);
      if (tickerRes) {
        const nextTicker = tickerRes;
        setTicker(nextTicker);
        const nextLast = tickerLast(nextTicker);
        if (!priceText && nextLast) {
          setPriceText(nextLast);
        }
      } else {
        setTicker(undefined);
      }
    } finally {
      setMarketLoading(false);
    }
  }, [instId, priceText, selectedExchange, venue]);

  useEffect(() => {
    void refreshMarket();
  }, [refreshMarket]);

  useEffect(() => {
    let canceled = false;
    async function refreshAccountMarketData() {
      if (!selectedAccount || !instrument || instrument.state !== 'live') {
        setCurrentLeverage(undefined);
        setTradeFeeReserveRate(0);
        return;
      }
      const keys = await loadKeys(selectedAccount);
      if (!keys) {
        setCurrentLeverage(undefined);
        setTradeFeeReserveRate(0);
        return;
      }

      const feeRate = await fetchTradeFeeReserveRate(selectedExchange, keys, venue, instId);
      if (!canceled) {
        setTradeFeeReserveRate(feeRate);
      }

      if (venue !== 'swap') {
        if (!canceled) setCurrentLeverage(undefined);
        return;
      }

      const leverage = await fetchCurrentLeverage(selectedExchange, keys, instId, marginMode);
      if (!canceled) setCurrentLeverage(leverage);
    }

    void refreshAccountMarketData();
    return () => { canceled = true; };
  }, [instId, instrument, marginMode, selectedAccount, selectedExchange, venue]);

  const refreshDeposit = useCallback(async () => {
    if (!selectedAccount) {
      setDepositQuote(undefined);
      return;
    }
    setDepositLoading(true);
    try {
      const keys = await loadKeys(selectedAccount);
      if (!keys) {
        setDepositQuote(undefined);
        return;
      }
      setDepositQuote(await fetchDepositQuote(selectedExchange, keys, venue, quoteCcy));
    } finally {
      setDepositLoading(false);
    }
  }, [quoteCcy, selectedAccount, selectedExchange, venue]);

  useEffect(() => {
    void refreshDeposit();
  }, [refreshDeposit]);

  const refreshOpenOrders = useCallback(async () => {
    if (!selectedAccount) return;
    const keys = await loadKeys(selectedAccount);
    if (!keys) return;
    setOpenOrders(await fetchOpenOrders(selectedExchange, keys, instId, venue));
  }, [instId, selectedAccount, selectedExchange, venue]);

  useEffect(() => {
    void refreshOpenOrders();
  }, [refreshOpenOrders]);

  const makeGridDraft = useCallback((): GridDraft | null => {
    const totalQuote = parsePositiveNumber(amountText);
    const minPrice = parsePositiveNumber(gridMinText);
    const maxPrice = parsePositiveNumber(gridMaxText);
    const priceStep = parsePositiveNumber(gridStepText);
    const gridCount = parsePositiveNumber(gridCountText);
    const martingalePercent = parsePositiveNumber(martingaleText) ?? 0;
    const requestedLeverage = parsePositiveNumber(leverageText) ?? 1;
    const leverage = maxInstrumentLeverage && maxInstrumentLeverage > 0
      ? Math.min(requestedLeverage, maxInstrumentLeverage)
      : requestedLeverage;
    const tpPercent = parsePositiveNumber(tpText);
    const slPercent = parsePositiveNumber(slText);
    if (!instrument || instrument.state !== 'live') return null;
    if (!totalQuote || !minPrice || !maxPrice) return null;
    if (gridSpacingMode === 'step' && !priceStep) return null;
    if (gridSpacingMode === 'count' && !gridCount) return null;
    return {
      venue,
      instId,
      quoteCcy,
      totalQuote,
      minPrice,
      maxPrice,
      spacingMode: gridSpacingMode,
      priceStep,
      gridCount,
      martingalePercent,
      marginMode,
      positionMode,
      leverage,
      reservedFeeRate: tradeFeeReserveRate,
      tpPercent: tpPercent && tpPercent > 0 ? tpPercent : undefined,
      slPercent: slPercent && slPercent > 0 && venue === 'swap' ? slPercent : undefined,
    };
  }, [
    amountText,
    gridCountText,
    gridMaxText,
    gridMinText,
    gridSpacingMode,
    gridStepText,
    instId,
    instrument,
    leverageText,
    marginMode,
    martingaleText,
    maxInstrumentLeverage,
    positionMode,
    quoteCcy,
    slText,
    tradeFeeReserveRate,
    tpText,
    venue,
  ]);

  const handlePreviewGrid = useCallback(() => {
    const draft = makeGridDraft();
    if (!draft) {
      Alert.alert(t('terminal.grid_check_title'), t('terminal.grid_check_message'));
      return;
    }
    const result = buildGridPreview(draft, instrument, {
      invalidSettings: t('terminal.grid_warning.invalid_settings'),
      maxPending: (max) => t('terminal.grid_warning.max_pending', { max }),
      belowMin: (min, ccy) => t('terminal.grid_warning.below_min', { min, ccy }),
      aboveMax: (max) => t('terminal.grid_warning.above_max', { max }),
      invalidCount: (count) => t('terminal.grid_warning.invalid_count', { count }),
      feeReserved: (percent) => t('terminal.grid_warning.fee_reserved', { percent }),
    });
    setPreviewOrders(result.orders);
    setPreviewWarnings(result.warnings);
    setMode('grid');
  }, [instrument, makeGridDraft, t]);

  const confirmRows = useMemo(() => {
    if (confirmAction === 'single') {
      const amount = parsePositiveNumber(amountText) ?? 0;
      const price = orderType === 'limit' ? priceText : tickerLast(ticker) ?? 'market';
      const rows: { label: string; value: string }[] = [
        { label: t('terminal.field_exchange'), value: exchangeLabel(selectedExchange) },
        { label: t('terminal.field_account'), value: selectedAccount ? terminalAccountLabel(selectedAccount, accounts) : '-' },
        { label: t('terminal.field_instrument'), value: instId },
        { label: t('terminal.field_market'), value: venue === 'spot' ? 'Spot' : 'USDT-M SWAP' },
        { label: t('terminal.field_side'), value: side === 'buy' ? 'Buy' : 'Sell' },
        { label: t('terminal.field_type'), value: orderType.toUpperCase() },
        { label: t('terminal.field_price'), value: formatDecimal(price) },
        { label: t('terminal.field_amount'), value: `${formatCurrencyAmount(amount)} ${quoteCcy}` },
      ];
      const tp = parsePositiveNumber(singleTpText);
      const sl = venue === 'swap' ? parsePositiveNumber(singleSlText) : undefined;
      if (tp) rows.push({ label: t('terminal.take_profit'), value: `${formatDecimal(tp)} ${quoteCcy}` });
      if (sl) rows.push({ label: t('terminal.stop_loss'), value: `${formatDecimal(sl)} ${quoteCcy}` });
      return rows;
    }
    if (confirmAction === 'grid') {
      const total = previewOrders.reduce((sum, order) => sum + order.notional, 0);
      return [
        { label: t('terminal.field_exchange'), value: exchangeLabel(selectedExchange) },
        { label: t('terminal.field_instrument'), value: instId },
        { label: t('terminal.field_market'), value: venue === 'spot' ? 'Spot' : 'USDT-M SWAP' },
        { label: t('terminal.field_grid'), value: `${previewOrders.length} buy-limit ${t('terminal.orders').toLowerCase()}` },
        { label: t('terminal.field_range'), value: `${gridMinText} - ${gridMaxText}` },
        { label: t('terminal.field_martingale'), value: `${martingaleText || '0'}%` },
        { label: t('terminal.field_notional'), value: `${formatCurrencyAmount(total)} ${quoteCcy}` },
      ];
    }
    if (targetPlan) {
      return [
        { label: t('terminal.field_grid'), value: targetPlan.draft.instId },
        { label: t('terminal.field_status'), value: targetPlan.status },
        { label: t('terminal.orders'), value: String(targetPlan.orders.length) },
      ];
    }
    return [];
  }, [
    accounts,
    amountText,
    confirmAction,
    gridMaxText,
    gridMinText,
    instId,
    martingaleText,
    orderType,
    previewOrders,
    priceText,
    quoteCcy,
    selectedAccount,
    side,
    singleSlText,
    singleTpText,
    targetPlan,
    selectedExchange,
    t,
    ticker,
    venue,
  ]);

  const positionSideFor = useCallback((orderSide: TradeSide): 'long' | 'short' | undefined => {
    if (positionMode !== 'long_short_mode') return undefined;
    return orderSide === 'buy' ? 'long' : 'short';
  }, [positionMode]);

  const applySwapSettings = useCallback(async (keys: Awaited<ReturnType<typeof requireKeys>>, orderSide: TradeSide) => {
    if (venue !== 'swap') return;
    const requestedLeverage = parsePositiveNumber(leverageText) ?? 1;
    const leverage = maxInstrumentLeverage && maxInstrumentLeverage > 0
      ? Math.min(requestedLeverage, maxInstrumentLeverage)
      : requestedLeverage;
    if (leverage !== requestedLeverage) setLeverageText(String(leverage));
    await applyExchangeSwapSettings(selectedExchange, keys, t, {
      instId,
      leverage,
      marginMode,
      positionMode,
      posSide: positionSideFor(orderSide),
    });
  }, [instId, leverageText, marginMode, maxInstrumentLeverage, positionMode, positionSideFor, selectedExchange, t, venue]);

  const submitSingleOrder = useCallback(async () => {
    if (!selectedAccount) return;
    setBusy(true);
    try {
      if (!instrument || instrument.state !== 'live') throw new Error(t('terminal.select_live_ticker', { exchange: exchangeLabel(selectedExchange) }));
      const keys = await requireKeys(selectedAccount, t);
      const priceRef = orderType === 'limit' ? parsePositiveNumber(priceText) : lastPrice;
      if (!priceRef) throw new Error(t('terminal.need_price', { exchange: exchangeLabel(selectedExchange) }));
      const quoteAmount = parsePositiveNumber(amountText);
      if (!quoteAmount) throw new Error(t('terminal.enter_order_amount'));

      const spendQuoteAmount = venue === 'spot' && side === 'buy'
        ? quoteAmount * (1 - tradeFeeReserveRate)
        : quoteAmount;
      const quantity = estimateQuantityFromQuote(venue, spendQuoteAmount, priceRef, instrument);
      if (venue === 'swap') {
        await applySwapSettings(keys, side);
      }
      if (quantity <= 0) {
        throw new Error(t('terminal.order_below_step'));
      }
      const minSz = Number(instrument?.minSz ?? 0);
      const notional = estimateNotional(venue, quantity, priceRef, instrument);
      const minNotional = Math.max(
        MIN_SAFE_NOTIONAL,
        minSz > 0 ? estimateNotional(venue, minSz, priceRef, instrument) : 0,
      );
      if (quantity < minSz || notional < minNotional) {
        throw new Error(t('terminal.order_below_min', { min: formatCurrencyAmount(minNotional), ccy: quoteCcy }));
      }

      const clientOrderId = makeClientOrderId('acord');
      const payload = buildSingleOrderPayload(selectedExchange, {
        instId,
        venue,
        marginMode,
        side,
        orderType,
        quantity,
        quoteAmount: spendQuoteAmount,
        price: priceRef,
        clientOrderId,
        posSide: positionSideFor(side),
      });

      const singleTp = parsePositiveNumber(singleTpText);
      const singleSl = venue === 'swap' ? parsePositiveNumber(singleSlText) : undefined;
      if (selectedExchange === 'okx' && (singleTp || singleSl)) {
        const okxPayload = payload as OkxOrderRequest;
        okxPayload.attachAlgoOrds = [{
          attachAlgoClOrdId: makeClientOrderId('algo'),
          ...(singleTp ? { tpTriggerPx: String(roundPrice(singleTp, instrument)), tpOrdPx: '-1' } : {}),
          ...(singleSl ? { slTriggerPx: String(roundPrice(singleSl, instrument)), slOrdPx: '-1' } : {}),
        }];
      }

      const orderId = await placeSingleExchangeOrder(selectedExchange, keys, venue, payload, t);
      setLastMessage(t('terminal.order_sent', { id: orderId || clientOrderId }));
      setConfirmAction(null);
      await refreshOpenOrders();
    } catch (e) {
      Alert.alert(t('terminal.order_not_sent'), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }, [
    amountText,
    applySwapSettings,
    instId,
    instrument,
    lastPrice,
    marginMode,
    orderType,
    positionSideFor,
    priceText,
    quoteCcy,
    refreshOpenOrders,
    selectedAccount,
    selectedExchange,
    side,
    singleSlText,
    singleTpText,
    t,
    tradeFeeReserveRate,
    venue,
  ]);

  const submitGridOrders = useCallback(async () => {
    if (!selectedAccount) return;
    const draft = makeGridDraft();
    if (!draft || previewOrders.length === 0) return;
    if (!instrument || instrument.state !== 'live') {
      Alert.alert(t('terminal.grid_not_sent'), t('terminal.select_live_ticker', { exchange: exchangeLabel(selectedExchange) }));
      return;
    }
    const validOrders = previewOrders.filter((order) => !order.warning);
    if (validOrders.length === 0) {
      Alert.alert(t('terminal.grid_not_sent'), t('terminal.all_grid_orders_below_min'));
      return;
    }
    const skippedCount = previewOrders.length - validOrders.length;
    setBusy(true);
    try {
      const keys = await requireKeys(selectedAccount, t);
      if (venue === 'swap') {
        await applySwapSettings(keys, 'buy');
      }
      const orders = validOrders.map((order) => {
        const algoAttachment = buildAlgoAttachment(order);
        return buildGridOrderPayload(selectedExchange, {
          instId,
          venue,
          marginMode,
          order,
          posSide: positionSideFor('buy'),
          algoAttachment: selectedExchange === 'okx' ? algoAttachment : null,
        });
      });
      const result = await placeGridExchangeOrders(selectedExchange, keys, venue, orders, t);
      const failedAcks = result.filter((ack) => !ack.ok);
      const liveAcks = result.filter((ack) => ack.ok);
      if (liveAcks.length === 0) {
        throw new Error(failedAcks[0]?.message || t('terminal.no_grid_orders_accepted', { exchange: exchangeLabel(selectedExchange) }));
      }

      const now = new Date().toISOString();
      const plan: GridPlan = {
        id: makeClientOrderId('grid'),
        accountId: selectedAccount.id,
        exchange: selectedExchange,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        draft,
        orders: validOrders,
        exchangeOrderIds: result.map((ack) => ({
          clOrdId: ack.clOrdId,
          ordId: ack.ordId,
          state: ack.ok ? 'live' : 'failed',
          message: ack.ok ? undefined : ack.message,
        })),
      };
      await saveGridPlan(plan);
      setGridPlans(await loadGridPlans());
      const totalSent = orders.length;
      const skippedMsg = skippedCount > 0 ? t('terminal.skipped_min', { count: skippedCount }) : '';
      setLastMessage(t('terminal.grid_sent', { live: liveAcks.length, total: totalSent, skipped: skippedMsg }));
      setConfirmAction(null);
      if (failedAcks.length > 0) {
        Alert.alert(
          t('terminal.grid_partial'),
          t('terminal.grid_rejected', {
            live: liveAcks.length,
            total: totalSent,
            exchange: exchangeLabel(selectedExchange),
            failed: failedAcks.length,
            message: failedAcks[0]?.message || t('terminal.unknown_reason'),
          }),
        );
      }
      await refreshOpenOrders();
    } catch (e) {
      Alert.alert(t('terminal.grid_not_sent'), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }, [
    applySwapSettings,
    instId,
    instrument,
    makeGridDraft,
    marginMode,
    positionSideFor,
    previewOrders,
    refreshOpenOrders,
    selectedAccount,
    selectedExchange,
    t,
    venue,
  ]);

  const cancelPlanOrders = useCallback(async (plan: GridPlan, nextStatus: GridPlan['status']) => {
    setBusy(true);
    try {
      const keys = selectedAccount ? await loadKeys(selectedAccount) : undefined;
      // Only cancel orders the exchange actually accepted — failed/skipped ones never existed there.
      const orders = plan.exchangeOrderIds
        .filter((order) => order.state !== 'failed' && (order.ordId || order.clOrdId))
        .map((order) => ({
          instId: plan.draft.instId,
          ordId: order.ordId || undefined,
          clOrdId: order.ordId ? undefined : order.clOrdId,
        }));
      if (keys?.passphrase && orders.length > 0) {
        await cancelExchangeOrders(plan.exchange, keys, plan.draft.venue, plan.draft.instId, orders, t);
      } else if (keys && selectedAccount?.exchange === 'binance' && orders.length > 0) {
        await cancelExchangeOrders(plan.exchange, keys, plan.draft.venue, plan.draft.instId, orders, t);
      }
      setGridPlans(await updateGridPlan(plan.id, (item) => ({
        ...item,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      })));
      setLastMessage(t('terminal.grid_canceled_local'));
      setConfirmAction(null);
      setTargetPlan(null);
      await refreshOpenOrders();
    } catch (e) {
      Alert.alert(t('terminal.cancel_failed'), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }, [refreshOpenOrders, selectedAccount, t]);

  const closePlanPosition = useCallback(async (plan: GridPlan) => {
    if (!selectedAccount) return;
    if (plan.draft.venue !== 'swap') {
      Alert.alert(t('terminal.spot_close_title'), t('terminal.spot_close_message'));
      setConfirmAction(null);
      return;
    }
    setBusy(true);
    try {
      const keys = await requireKeys(selectedAccount, t);
      const result = await closeOkxPosition(keys, {
        instId: plan.draft.instId,
        mgnMode: plan.draft.marginMode,
        posSide: plan.draft.positionMode === 'long_short_mode' ? 'long' : 'net',
        autoCxl: true,
        clOrdId: makeClientOrderId('close'),
      });
      if (result.error) throw new Error(t('terminal.network_error', { exchange: 'OKX' }));
      const envelopeError = okxEnvelopeFailed(result.data);
      if (envelopeError) throw new Error(envelopeError);
      setGridPlans(await updateGridPlan(plan.id, (item) => ({
        ...item,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      })));
      setConfirmAction(null);
      setTargetPlan(null);
      await refreshOpenOrders();
    } catch (e) {
      Alert.alert(t('terminal.position_not_closed'), errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }, [refreshOpenOrders, selectedAccount, t]);

  const runConfirmedAction = useCallback(async () => {
    if (confirmAction === 'single') {
      await submitSingleOrder();
    } else if (confirmAction === 'grid') {
      await submitGridOrders();
    } else if (targetPlan && (confirmAction === 'cancel-plan' || confirmAction === 'pause-plan')) {
      await cancelPlanOrders(targetPlan, confirmAction === 'pause-plan' ? 'paused' : 'canceled');
    } else if (targetPlan && confirmAction === 'close-plan') {
      await closePlanPosition(targetPlan);
    }
  }, [
    cancelPlanOrders,
    closePlanPosition,
    confirmAction,
    submitGridOrders,
    submitSingleOrder,
    targetPlan,
  ]);

  const editPlan = useCallback((plan: GridPlan) => {
    const d = plan.draft;
    setMode('grid');
    setVenue(d.venue);
    setInstId(d.instId);
    setAmountText(String(d.totalQuote));
    setGridMinText(String(d.minPrice));
    setGridMaxText(String(d.maxPrice));
    setGridSpacingMode(d.spacingMode);
    setGridStepText(String(d.priceStep ?? ''));
    setGridCountText(String(d.gridCount ?? ''));
    setMartingaleText(String(d.martingalePercent));
    setMarginMode(d.marginMode);
    setPositionMode(d.positionMode);
    setLeverageText(String(d.leverage));
    setTpText(d.tpPercent ? String(d.tpPercent) : '');
    setSlText(d.slPercent ? String(d.slPercent) : '');
    setPreviewOrders(plan.orders);
    setPreviewWarnings([]);
  }, []);

  const selectedAccountLabel = selectedAccount ? terminalAccountLabel(selectedAccount, accounts) : t('terminal.no_account_label');
  const previewTotal = previewOrders.reduce((sum, order) => sum + order.notional, 0);
  const visibleGridPlans = useMemo(
    () => gridPlans.filter((plan) => (
      plan.accountId === selectedAccount?.id
      && plan.status !== 'canceled'
      && plan.status !== 'completed'
    )),
    [gridPlans, selectedAccount?.id],
  );

  return (
    <View style={styles.root}>
      <LiquidBackground />
      <SafeAreaView style={styles.fill}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t('terminal.title', { exchange: exchangeLabel(selectedExchange) })}</Text>
          <TouchableOpacity onPress={refreshMarket} hitSlop={8}>
            <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.70)" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {tradingAccounts.length === 0 ? (
              <LiquidCard>
                <Text style={styles.emptyTitle}>{t('terminal.no_account_title')}</Text>
                <Text style={styles.muted}>{t('terminal.no_account_description')}</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.82}>
                  <LinearGradient colors={['rgba(0,212,255,0.70)', 'rgba(0,180,160,0.72)']} style={styles.primaryBtn}>
                    <Text style={styles.primaryText}>{t('terminal.open_settings')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LiquidCard>
            ) : (
              <>
                <LiquidCard>
                  <View style={styles.accountHeader}>
                    <View>
                      <Text style={styles.caption}>{t('terminal.account')}</Text>
                      <Text style={styles.accountName}>{selectedAccountLabel}</Text>
                    </View>
                    <Text style={styles.badge}>LIVE</Text>
                  </View>
                  {tradingAccounts.length > 1 ? (
                    <View style={styles.accountList}>
                      {tradingAccounts.map((account) => (
                        <TouchableOpacity
                          key={account.id}
                          style={[styles.accountChip, selectedAccountId === account.id && styles.accountChipActive]}
                          onPress={() => setSelectedAccountId(account.id)}
                        >
                          <Text style={[styles.accountChipText, selectedAccountId === account.id && styles.accountChipTextActive]}>
                            {terminalAccountLabel(account, accounts)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </LiquidCard>

                <LiquidCard>
                  <SegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'single', label: t('terminal.mode_single') },
                      { value: 'grid', label: t('terminal.mode_grid') },
                    ]}
                  />
                  <View style={styles.controlGrid}>
                    <View style={styles.controlBlock}>
                      <Text style={styles.controlLabel}>{t('terminal.market')}</Text>
                      <SegmentedControl
                        value={venue}
                        onChange={setVenue}
                        options={[
                          { value: 'spot', label: 'Spot' },
                          { value: 'swap', label: 'USDT-M' },
                        ]}
                      />
                    </View>
                    <View style={styles.controlBlock}>
                      <Text style={styles.controlLabel}>{t('terminal.order_type')}</Text>
                      <SegmentedControl
                        value={orderType}
                        onChange={setOrderType}
                        options={[
                          { value: 'limit', label: 'Limit' },
                          { value: 'market', label: 'Market', disabled: mode === 'grid' },
                        ]}
                      />
                    </View>
                  </View>
                  <InstrumentSelector
                    instruments={availableInstruments}
                    selectedInstId={instId}
                    quoteCcy={quoteCcy}
                    lastPrice={lastPrice}
                    loading={marketLoading || instrumentsLoading}
                    exchangeLabel={exchangeLabel(selectedExchange)}
                    onSelect={selectInstrument}
                  />
                </LiquidCard>

                {mode === 'single' ? (
                  <LiquidCard title={t('terminal.single_order')}>
                    {venue === 'swap' ? (
                      <SegmentedControl
                        value={side}
                        onChange={setSide}
                        options={[
                          { value: 'buy', label: 'Buy' },
                          { value: 'sell', label: 'Sell' },
                        ]}
                      />
                    ) : null}
                    <AmountSelector
                      amountText={amountText}
                      setAmountText={setAmountText}
                      quoteCcy={quoteCcy}
                      depositQuote={depositQuote}
                      depositLoading={depositLoading}
                    />
                    {orderType === 'limit' ? (
                      <TerminalInput label={t('terminal.price')} value={priceText} onChangeText={setPriceText} keyboardType="decimal-pad" suffix={quoteCcy} />
                    ) : null}
                    <TradeSettings
                      venue={venue}
                      marginMode={marginMode}
                      setMarginMode={setMarginMode}
                      positionMode={positionMode}
                      setPositionMode={setPositionMode}
                      leverageText={leverageText}
                      setLeverageText={setLeverageText}
                      maxLeverage={maxInstrumentLeverage}
                      currentLeverage={currentLeverage}
                    />
                    <View style={styles.double}>
                      <TerminalInput
                        label={t('terminal.take_profit')}
                        value={singleTpText}
                        onChangeText={setSingleTpText}
                        keyboardType="decimal-pad"
                        suffix={quoteCcy}
                        placeholder={t('terminal.tp_price')}
                      />
                      {venue === 'swap' ? (
                        <TerminalInput
                          label={t('terminal.stop_loss')}
                          value={singleSlText}
                          onChangeText={setSingleSlText}
                          keyboardType="decimal-pad"
                          suffix={quoteCcy}
                          placeholder={t('terminal.sl_price')}
                        />
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                    </View>
                    <TouchableOpacity onPress={() => setConfirmAction('single')} activeOpacity={0.82}>
                      <LinearGradient colors={['rgba(0,212,255,0.72)', 'rgba(0,180,160,0.78)']} style={styles.primaryBtn}>
                        <Text style={styles.primaryText}>{t('terminal.check_and_send')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LiquidCard>
                ) : (
                  <LiquidCard title={t('terminal.mode_grid')}>
                      <Text style={styles.muted}>{t('terminal.grid_hint')}</Text>
                    <AmountSelector
                      amountText={amountText}
                      setAmountText={setAmountText}
                      quoteCcy={quoteCcy}
                      depositQuote={depositQuote}
                      depositLoading={depositLoading}
                    />
                    <View style={styles.double}>
                      <TerminalInput label={t('terminal.min_price')} value={gridMinText} onChangeText={setGridMinText} keyboardType="decimal-pad" suffix={quoteCcy} />
                      <TerminalInput label={t('terminal.max_price')} value={gridMaxText} onChangeText={setGridMaxText} keyboardType="decimal-pad" suffix={quoteCcy} />
                    </View>
                    <SegmentedControl
                      value={gridSpacingMode}
                      onChange={setGridSpacingMode}
                      options={[
                        { value: 'count', label: t('terminal.grid_count_mode') },
                        { value: 'step', label: t('terminal.price_step_mode') },
                      ]}
                    />
                    {gridSpacingMode === 'count' ? (
                      <TerminalInput label={t('terminal.grid_count')} value={gridCountText} onChangeText={setGridCountText} keyboardType="number-pad" />
                    ) : (
                      <TerminalInput label={t('terminal.price_step')} value={gridStepText} onChangeText={setGridStepText} keyboardType="decimal-pad" suffix={quoteCcy} />
                    )}
                    <TerminalInput label={t('terminal.martingale')} value={martingaleText} onChangeText={setMartingaleText} keyboardType="decimal-pad" suffix="%" />
                    <TradeSettings
                      venue={venue}
                      marginMode={marginMode}
                      setMarginMode={setMarginMode}
                      positionMode={positionMode}
                      setPositionMode={setPositionMode}
                      leverageText={leverageText}
                      setLeverageText={setLeverageText}
                      maxLeverage={maxInstrumentLeverage}
                      currentLeverage={currentLeverage}
                    />
                    <View style={styles.tpslSection}>
                      <Text style={styles.tpslTitle}>{t('terminal.tpsl_title')}</Text>
                      <Text style={styles.tpslHint}>{t('terminal.tpsl_hint')}</Text>
                      <TerminalInput
                        label={t('terminal.take_profit')}
                        value={tpText}
                        onChangeText={setTpText}
                        keyboardType="decimal-pad"
                        suffix="%"
                        placeholder={t('terminal.example_3')}
                      />
                      {venue === 'swap' ? (
                        <TerminalInput
                          label={t('terminal.stop_loss')}
                          value={slText}
                          onChangeText={setSlText}
                          keyboardType="decimal-pad"
                          suffix="%"
                          placeholder={t('terminal.example_2')}
                        />
                      ) : null}
                    </View>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={handlePreviewGrid}>
                        <Text style={styles.secondaryText}>{t('terminal.dry_run')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryBtn, previewOrders.length === 0 && styles.disabled]}
                        onPress={() => previewOrders.length > 0 && setConfirmAction('grid')}
                      >
                        <Text style={styles.secondaryText}>{t('terminal.place_grid')}</Text>
                      </TouchableOpacity>
                    </View>
                  </LiquidCard>
                )}

                {previewOrders.length > 0 ? (
                  <LiquidCard title={t('terminal.grid_preview')}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('terminal.orders')}</Text>
                      <Text style={styles.summaryValue}>{previewOrders.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Notional</Text>
                      <Text style={styles.summaryValue}>{formatCurrencyAmount(previewTotal)} {quoteCcy}</Text>
                    </View>
                    {previewWarnings.map((warning) => (
                      <Text key={warning} style={styles.warningText}>{warning}</Text>
                    ))}
                    {previewOrders.slice(0, 12).map((order) => (
                      <View key={order.clOrdId} style={styles.previewOrderBlock}>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewIndex}>#{order.index}</Text>
                          <Text style={styles.previewText}>BUY {formatDecimal(order.price)}</Text>
                          <Text style={styles.previewText}>{formatCurrencyAmount(order.notional)} {quoteCcy}</Text>
                          {order.warning ? <Ionicons name="warning" size={14} color="#FF9500" /> : null}
                        </View>
                        {(order.tpPrice || order.slPrice) ? (
                          <View style={styles.previewTpslRow}>
                            {order.tpPrice ? (
                              <Text style={styles.previewTp}>TP {formatDecimal(order.tpPrice)}</Text>
                            ) : null}
                            {order.slPrice ? (
                              <Text style={styles.previewSl}>SL {formatDecimal(order.slPrice)}</Text>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </LiquidCard>
                ) : null}

                <LiquidCard title={t('terminal.active_grids')}>
                  {visibleGridPlans.length === 0 ? (
                    <Text style={styles.muted}>{t('terminal.no_local_grids')}</Text>
                  ) : (
                    visibleGridPlans.slice(0, 8).map((plan) => (
                      <View key={plan.id} style={styles.planCard}>
                        <View style={styles.planHead}>
                          <View>
                            <Text style={styles.planTitle}>{plan.draft.instId}</Text>
                            <Text style={styles.muted}>{plan.orders.length} {t('terminal.orders').toLowerCase()} · {plan.status}</Text>
                          </View>
                          <Text style={styles.planDate}>{new Date(plan.updatedAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.planActions}>
                          <PlanButton label={t('terminal.cancel_grid')} danger onPress={() => { setTargetPlan(plan); setConfirmAction('cancel-plan'); }} />
                          <PlanButton label={t('terminal.recalc')} onPress={() => editPlan(plan)} />
                        </View>
                      </View>
                    ))
                  )}
                </LiquidCard>

                <LiquidCard title={t('terminal.positions')}>
                  {activePositions.length === 0 ? (
                    <Text style={styles.muted}>{t('terminal.no_positions', { instId })}</Text>
                  ) : (
                    activePositions.slice(0, 8).map((position) => (
                      <View key={position.id} style={styles.positionBlock}>
                        <View style={styles.positionHead}>
                          <View>
                            <Text style={styles.planTitle}>{position.symbol}</Text>
                            <Text style={styles.muted}>
                              {t('terminal.position_qty')} {formatDecimal(position.quantity)}
                            </Text>
                          </View>
                          <View style={styles.orderRight}>
                            <Text style={[styles.positionNet, { color: netColor(position.netProfitUSDT) }]}>
                              {formatSignedUSDT(position.netProfitUSDT)}
                            </Text>
                            <Text style={styles.muted}>{formatSignedPercent(position.netPercentChange)}</Text>
                          </View>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>{t('terminal.position_value')}</Text>
                          <Text style={styles.summaryValue}>
                            {position.valueUSDT != null ? `${formatCurrencyAmount(position.valueUSDT)} USDT` : '—'}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </LiquidCard>

                <LiquidCard title={t('terminal.order_feed')}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={refreshOpenOrders}>
                    <Text style={styles.secondaryText}>{t('terminal.refresh_orders')}</Text>
                  </TouchableOpacity>
                  {openOrders.length === 0 ? (
                    <Text style={styles.muted}>{t('terminal.no_open_orders', { instId })}</Text>
                  ) : (
                    openOrders.slice(0, 12).map((order) => (
                      <View key={openOrderKey(order)} style={styles.orderRow}>
                        <View>
                          <Text style={styles.orderTitle}>{openOrderSide(order)} {openOrderType(order)}</Text>
                          <Text style={styles.muted}>{openOrderClientId(order)}</Text>
                        </View>
                        <View style={styles.orderRight}>
                          <Text style={styles.orderTitle}>{openOrderPrice(order)}</Text>
                          <Text style={styles.muted}>{openOrderSize(order)} · {openOrderState(order)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </LiquidCard>

                {lastMessage ? <Text style={styles.footerMessage}>{lastMessage}</Text> : null}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ConfirmationModal
        visible={confirmAction != null}
        title={t(confirmTitle(confirmAction))}
        rows={confirmRows}
        warning={t('terminal.real_request_warning', { exchange: exchangeLabel(selectedExchange) })}
        confirmLabel={confirmAction === 'grid' ? t('terminal.place') : t('terminal.confirm')}
        busy={busy}
        onCancel={() => { setConfirmAction(null); setTargetPlan(null); }}
        onConfirm={() => void runConfirmedAction()}
      />
      {busy && <LoadingView />}
    </View>
  );
}

function buildAlgoAttachment(order: GridOrderPreview): import('../src/api/okxTrade').OkxAlgoAttachment | null {
  if (!order.tpPrice && !order.slPrice) return null;
  return {
    attachAlgoClOrdId: makeClientOrderId('algo'),
    ...(order.tpPrice ? { tpTriggerPx: String(order.tpPrice), tpOrdPx: '-1' } : {}),
    ...(order.slPrice ? { slTriggerPx: String(order.slPrice), slOrdPx: '-1' } : {}),
  };
}

async function requireKeys(account: ExchangeAccount, t: TFunction): Promise<NonNullable<Awaited<ReturnType<typeof loadKeys>>>> {
  const keys = await loadKeys(account);
  if (!keys) throw new Error(t('terminal.keys_not_found', { exchange: exchangeLabel(account.exchange as TradingExchange) }));
  if (account.exchange === 'okx' && !keys.passphrase) throw new Error(t('terminal.okx_passphrase_required'));
  return keys;
}

function confirmTitle(action: ConfirmAction | null): string {
  switch (action) {
    case 'single': return 'terminal.confirm_single';
    case 'grid': return 'terminal.confirm_grid';
    case 'pause-plan': return 'terminal.confirm_pause';
    case 'cancel-plan': return 'terminal.confirm_cancel';
    case 'close-plan': return 'terminal.confirm_close';
    default: return 'terminal.confirmation';
  }
}

function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof Error) return error.message;
  return t('terminal.unknown_error');
}

function okxFeeReserveRate(fee?: OkxTradeFee): number {
  const maker = Number(fee?.maker ?? fee?.makerU ?? NaN);
  const taker = Number(fee?.taker ?? fee?.takerU ?? NaN);
  const exchangeRate = Math.max(
    Number.isFinite(maker) ? Math.abs(maker) : 0,
    Number.isFinite(taker) ? Math.abs(taker) : 0,
  );
  return Math.min(0.01, Math.max(exchangeRate, 0.001) + 0.0002);
}

function binanceFeeReserveRate(fee?: BinanceCommission): number {
  const maker = Number(fee?.standardCommission?.maker ?? NaN);
  const taker = Number(fee?.standardCommission?.taker ?? NaN);
  const exchangeRate = Math.max(
    Number.isFinite(maker) ? Math.abs(maker) : 0,
    Number.isFinite(taker) ? Math.abs(taker) : 0,
  );
  return Math.min(0.01, Math.max(exchangeRate, 0.001) + 0.0002);
}

function terminalAccountLabel(account: ExchangeAccount, allAccounts: ExchangeAccount[]): string {
  if (account.label) return account.label;
  const exchangeAccounts = allAccounts.filter((item) => item.exchange === account.exchange);
  const index = exchangeAccounts.findIndex((item) => item.id === account.id);
  return `${exchangeLabel(account.exchange as TradingExchange)} ${index >= 0 ? index + 1 : 1}`;
}

function parseInstrumentParts(instId: string, exchange: TradingExchange): { base: string; quote: string } {
  if (exchange === 'okx') {
    const parts = instId.split('-');
    return { base: parts[0] || 'BTC', quote: parts[1] || 'USDT' };
  }
  if (instId.includes('-')) {
    const parts = instId.split('-');
    return { base: parts[0] || 'BTC', quote: parts[1] || 'USDT' };
  }
  if (instId.endsWith('USDT')) return { base: instId.slice(0, -4) || 'BTC', quote: 'USDT' };
  return { base: instId.slice(0, 3) || 'BTC', quote: instId.slice(3) || 'USDT' };
}

function buildInstrumentId(baseAsset: string, quoteCcy: string, venue: TradingVenue, exchange: TradingExchange): string {
  if (exchange === 'okx') return buildOkxInstrumentId(baseAsset, quoteCcy, venue);
  return `${baseAsset.trim().toUpperCase() || 'BTC'}${quoteCcy.trim().toUpperCase() || 'USDT'}`;
}

function sortInstruments(instruments: OkxInstrument[], exchange: TradingExchange): OkxInstrument[] {
  const preferred = exchange === 'okx'
    ? ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT']
    : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
  return [...instruments].sort((a, b) => {
    const aRank = preferred.findIndex((prefix) => a.instId.startsWith(prefix));
    const bRank = preferred.findIndex((prefix) => b.instId.startsWith(prefix));
    if (aRank >= 0 || bRank >= 0) return (aRank < 0 ? 999 : aRank) - (bRank < 0 ? 999 : bRank);
    const aUsdt = a.instId.includes('USDT') ? 0 : 1;
    const bUsdt = b.instId.includes('USDT') ? 0 : 1;
    if (aUsdt !== bUsdt) return aUsdt - bUsdt;
    return a.instId.localeCompare(b.instId);
  });
}

function exchangeLabel(exchange: TradingExchange): string {
  return exchange === 'binance' ? 'Binance' : 'OKX';
}

function tickerLast(ticker?: TerminalTicker): string | undefined {
  if (!ticker) return undefined;
  return formatDecimal('last' in ticker ? ticker.last : ticker.price);
}

function openOrderKey(order: TerminalOpenOrder): string {
  return 'ordId' in order ? order.ordId : String(order.orderId);
}

function openOrderSide(order: TerminalOpenOrder): string {
  return order.side.toUpperCase();
}

function openOrderType(order: TerminalOpenOrder): string {
  return 'ordType' in order ? order.ordType : order.type;
}

function openOrderClientId(order: TerminalOpenOrder): string {
  return 'clOrdId' in order ? order.clOrdId || order.ordId : order.clientOrderId || String(order.orderId);
}

function openOrderPrice(order: TerminalOpenOrder): string {
  const price = 'px' in order ? order.px : order.price;
  return price ? formatDecimal(price) : 'market';
}

function openOrderSize(order: TerminalOpenOrder): string {
  return formatDecimal('sz' in order ? order.sz : order.origQty);
}

function openOrderState(order: TerminalOpenOrder): string {
  return 'state' in order ? order.state : order.status;
}

async function fetchPublicInstruments(exchange: TradingExchange, venue: TradingVenue): Promise<OkxInstrument[]> {
  if (exchange === 'okx') {
    const res = await fetchOkxPublicInstruments(venue);
    return res.data?.code === '0' ? sortInstruments(res.data.data, exchange) : [];
  }
  const res = await fetchBinanceExchangeInfo(venue);
  return res.data ? sortInstruments(res.data.symbols.map((item) => normalizeBinanceInstrument(item, venue)), exchange) : [];
}

async function fetchInstrument(
  exchange: TradingExchange,
  venue: TradingVenue,
  instId: string,
): Promise<OkxInstrument | undefined> {
  if (exchange === 'okx') {
    const res = await fetchOkxPublicInstruments(venue, instId);
    return res.data?.code === '0' ? res.data.data.find((item) => item.instId === instId) : undefined;
  }
  const res = await fetchBinanceExchangeInfo(venue, instId);
  return res.data?.symbols[0] ? normalizeBinanceInstrument(res.data.symbols[0], venue) : undefined;
}

async function fetchTicker(
  exchange: TradingExchange,
  venue: TradingVenue,
  instId: string,
): Promise<TerminalTicker | undefined> {
  if (exchange === 'okx') {
    const res = await fetchOkxTicker(instId);
    return res.data?.code === '0' ? res.data.data[0] : undefined;
  }
  const res = await fetchBinanceTicker(venue, instId);
  return res.data;
}

async function fetchTradeFeeReserveRate(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  venue: TradingVenue,
  instId: string,
): Promise<number> {
  if (exchange === 'okx') {
    const res = await fetchOkxTradeFee(keys, venue, instId);
    return okxFeeReserveRate(res.data?.code === '0' ? res.data.data[0] : undefined);
  }
  if (venue === 'spot') {
    const res = await fetchBinanceCommission(keys, instId);
    return binanceFeeReserveRate(res.data);
  }
  return 0.0007;
}

async function fetchCurrentLeverage(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  instId: string,
  marginMode: MarginMode,
): Promise<number | undefined> {
  if (exchange === 'okx') {
    const res = await fetchOkxLeverageInfo(keys, instId, marginMode);
    const info = res.data?.code === '0' ? res.data.data[0] : undefined;
    return parsePositiveNumber(info?.lever ?? '');
  }
  const res = await fetchBinanceLeverageBracket(keys, instId);
  const bracket = Array.isArray(res.data) ? res.data[0] : res.data;
  return bracket?.brackets?.[0]?.initialLeverage;
}

async function fetchDepositQuote(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  venue: TradingVenue,
  quoteCcy: string,
): Promise<number> {
  if (exchange === 'okx') {
    const res = await fetchAccountBalance(keys);
    if (res.data?.code !== '0') return 0;
    const detail = res.data.data[0]?.details.find((item) => item.ccy.toUpperCase() === quoteCcy.toUpperCase());
    return parsePositiveNumber(detail?.availBal ?? detail?.availEq ?? detail?.eq ?? '') ?? 0;
  }
  if (venue === 'swap') {
    const res = await fetchBinanceFuturesBalance(keys);
    const item = res.data?.find((balance) => balance.asset.toUpperCase() === quoteCcy.toUpperCase());
    return parsePositiveNumber(item?.availableBalance ?? item?.balance ?? '') ?? 0;
  }
  const res = await fetchBinanceSpotAccount(keys);
  const item = res.data?.balances.find((balance) => balance.asset.toUpperCase() === quoteCcy.toUpperCase());
  return parsePositiveNumber(item?.free ?? '') ?? 0;
}

async function fetchOpenOrders(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  instId: string,
  venue: TradingVenue,
): Promise<TerminalOpenOrder[]> {
  if (exchange === 'okx') {
    const res = await fetchOkxPendingOrders(keys, instId, venue);
    return res.data?.code === '0' ? res.data.data : [];
  }
  const res = await fetchBinanceOpenOrders(keys, venue, instId);
  return res.data ?? [];
}

async function applyExchangeSwapSettings(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  t: TFunction,
  payload: { instId: string; leverage: number; marginMode: MarginMode; positionMode: PositionMode; posSide?: 'long' | 'short' },
): Promise<void> {
  if (exchange === 'okx') {
    const modeRes = await setOkxPositionMode(keys, payload.positionMode);
    if (modeRes.error) throw new Error(t('terminal.position_mode_failed'));
    const modeError = okxEnvelopeFailed(modeRes.data);
    if (modeError) throw new Error(modeError);
    const levRes = await setOkxLeverage(keys, {
      instId: payload.instId,
      lever: payload.leverage.toString(),
      mgnMode: payload.marginMode,
      ...(payload.marginMode === 'isolated' && payload.positionMode === 'long_short_mode' ? { posSide: payload.posSide } : {}),
    });
    if (levRes.error) throw new Error(t('terminal.leverage_failed'));
    const levError = okxEnvelopeFailed(levRes.data);
    if (levError) throw new Error(levError);
    return;
  }

  await setBinancePositionMode(keys, payload.positionMode);
  await setBinanceMarginType(keys, payload.instId, payload.marginMode);
  const leverageRes = await setBinanceLeverage(keys, payload.instId, payload.leverage);
  if (leverageRes.error) throw new Error(t('terminal.leverage_failed'));
}

function buildSingleOrderPayload(
  exchange: TradingExchange,
  params: {
    instId: string;
    venue: TradingVenue;
    marginMode: MarginMode;
    side: TradeSide;
    orderType: TradeOrderType;
    quantity: number;
    quoteAmount: number;
    price: number;
    clientOrderId: string;
    posSide?: 'long' | 'short';
  },
): OkxOrderRequest | BinanceOrderRequest {
  if (exchange === 'okx') {
    const payload: OkxOrderRequest = {
      instId: params.instId,
      tdMode: params.venue === 'spot' ? 'cash' : params.marginMode,
      side: params.side,
      ordType: params.orderType,
      sz: params.venue === 'spot' && params.orderType === 'market' && params.side === 'buy'
        ? params.quoteAmount.toFixed(8)
        : params.quantity.toString(),
      clOrdId: params.clientOrderId,
      tag: 'AirCapital',
    };
    if (params.orderType === 'limit') payload.px = params.price.toString();
    if (params.venue === 'spot' && params.orderType === 'market' && params.side === 'buy') payload.tgtCcy = 'quote_ccy';
    if (params.venue === 'swap' && params.posSide) payload.posSide = params.posSide;
    return payload;
  }

  const payload: BinanceOrderRequest = {
    symbol: params.instId,
    side: params.side === 'buy' ? 'BUY' : 'SELL',
    type: params.orderType.toUpperCase() as 'LIMIT' | 'MARKET',
    newClientOrderId: params.clientOrderId,
  };
  if (params.orderType === 'limit') {
    payload.timeInForce = 'GTC';
    payload.price = params.price.toString();
    payload.quantity = params.quantity.toString();
  } else if (params.venue === 'spot' && params.side === 'buy') {
    payload.quoteOrderQty = params.quoteAmount.toFixed(8);
  } else {
    payload.quantity = params.quantity.toString();
  }
  if (params.venue === 'swap') payload.positionSide = params.posSide === 'short' ? 'SHORT' : params.posSide === 'long' ? 'LONG' : 'BOTH';
  return payload;
}

function buildGridOrderPayload(
  exchange: TradingExchange,
  params: {
    instId: string;
    venue: TradingVenue;
    marginMode: MarginMode;
    order: GridOrderPreview;
    posSide?: 'long' | 'short';
    algoAttachment: import('../src/api/okxTrade').OkxAlgoAttachment | null;
  },
): OkxOrderRequest | BinanceOrderRequest {
  if (exchange === 'okx') {
    return {
      instId: params.instId,
      tdMode: params.venue === 'spot' ? 'cash' : params.marginMode,
      side: 'buy',
      ordType: 'limit',
      px: params.order.price.toString(),
      sz: params.order.quantity.toString(),
      clOrdId: params.order.clOrdId,
      tag: 'AirCapital',
      ...(params.venue === 'swap' && params.posSide ? { posSide: params.posSide } : {}),
      ...(params.algoAttachment ? { attachAlgoOrds: [params.algoAttachment] } : {}),
    };
  }
  return {
    symbol: params.instId,
    side: 'BUY',
    type: 'LIMIT',
    timeInForce: 'GTC',
    price: params.order.price.toString(),
    quantity: params.order.quantity.toString(),
    newClientOrderId: params.order.clOrdId,
    ...(params.venue === 'swap' ? { positionSide: params.posSide === 'long' ? 'LONG' : 'BOTH' } : {}),
  };
}

async function placeSingleExchangeOrder(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  venue: TradingVenue,
  payload: OkxOrderRequest | BinanceOrderRequest,
  t: TFunction,
): Promise<string | undefined> {
  if (exchange === 'okx') {
    const result = await placeOkxOrder(keys, payload as OkxOrderRequest);
    if (result.error) throw new Error(t('terminal.network_error', { exchange: 'OKX' }));
    const envelopeError = okxEnvelopeFailed(result.data);
    if (envelopeError) throw new Error(envelopeError);
    const failed = result.data.data.find((ack) => ack.sCode !== '0');
    if (failed) throw new Error(failed.sMsg || `OKX order error ${failed.sCode}`);
    return result.data.data[0]?.ordId;
  }
  const result = await placeBinanceOrder(keys, venue, payload as BinanceOrderRequest);
  if (result.error) throw new Error(t('terminal.network_error', { exchange: 'Binance' }));
  if (result.data.code) throw new Error(result.data.msg || `Binance order error ${result.data.code}`);
  return result.data.orderId ? String(result.data.orderId) : result.data.clientOrderId;
}

interface UnifiedAck {
  ok: boolean;
  clOrdId: string;
  ordId?: string;
  message?: string;
}

async function placeGridExchangeOrders(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  venue: TradingVenue,
  orders: (OkxOrderRequest | BinanceOrderRequest)[],
  t: TFunction,
): Promise<UnifiedAck[]> {
  if (exchange === 'okx') {
    const result = await placeOkxBatchOrders(keys, orders as OkxOrderRequest[]);
    if (result.error) throw new Error(t('terminal.network_error', { exchange: 'OKX' }));
    if (result.data.code !== '0' && result.data.data.length === 0) {
      throw new Error(result.data.msg || `OKX batch error ${result.data.code}`);
    }
    return result.data.data.map((ack) => ({
      ok: ack.sCode === '0',
      clOrdId: ack.clOrdId,
      ordId: ack.ordId,
      message: ack.sCode !== '0' ? ack.sMsg : undefined,
    }));
  }
  const result = await placeBinanceGridOrders(keys, venue, orders as BinanceOrderRequest[]);
  if (result.error) throw new Error(t('terminal.network_error', { exchange: 'Binance' }));
  return result.data.map((ack, index) => ({
    ok: !ack.code,
    clOrdId: ack.clientOrderId ?? (orders[index] as BinanceOrderRequest).newClientOrderId ?? '',
    ordId: ack.orderId ? String(ack.orderId) : undefined,
    message: ack.code ? ack.msg : undefined,
  }));
}

async function cancelExchangeOrders(
  exchange: TradingExchange,
  keys: NonNullable<Awaited<ReturnType<typeof loadKeys>>>,
  venue: TradingVenue,
  instId: string,
  orders: { ordId?: string; clOrdId?: string }[],
  t: TFunction,
): Promise<void> {
  if (exchange === 'okx') {
    const result = await cancelOkxBatchOrders(keys, orders.map((order) => ({
      instId,
      ordId: order.ordId,
      clOrdId: order.ordId ? undefined : order.clOrdId,
    })));
    if (result.error) throw new Error(t('terminal.network_error', { exchange: 'OKX' }));
    if (result.data.code !== '0' && result.data.data.length === 0) {
      throw new Error(result.data.msg || `OKX cancel error ${result.data.code}`);
    }
    return;
  }
  const result = await cancelBinanceOrders(keys, venue, instId, orders.map((order) => ({
    orderId: order.ordId,
    clientOrderId: order.clOrdId,
  })));
  if (result.error) throw new Error(t('terminal.network_error', { exchange: 'Binance' }));
}

function positionMatchesInstrument(position: PositionItem, instId: string, exchange: TradingExchange): boolean {
  const positionSymbol = normalizePositionSymbol(position.symbol, exchange);
  const selectedSymbol = normalizePositionSymbol(instId, exchange);
  const baseSymbol = parseInstrumentParts(instId, exchange).base.toUpperCase();
  return positionSymbol === selectedSymbol || positionSymbol === baseSymbol;
}

function normalizePositionSymbol(symbol: string, exchange: TradingExchange): string {
  if (exchange === 'okx') return symbol.toUpperCase();
  return symbol.replace(/[-_/]/g, '').toUpperCase();
}

function formatSignedUSDT(value?: number): string {
  if (value == null) return '—';
  return `${value > 0 ? '+' : ''}${formatCurrencyAmount(value)} USDT`;
}

function formatSignedPercent(value?: number): string {
  if (value == null) return '—';
  return `${value > 0 ? '+' : ''}${formatDecimal(value.toFixed(2))}%`;
}

function netColor(value?: number): string {
  if (value == null) return 'rgba(255,255,255,0.55)';
  if (value > 0) return '#34C759';
  if (value < 0) return '#FF3B30';
  return 'rgba(255,255,255,0.55)';
}

function normalizeBinanceInstrument(item: BinanceSymbolInfo, venue: TradingVenue): OkxInstrument {
  const priceFilter = item.filters.find((filter) => filter.filterType === 'PRICE_FILTER');
  const lotFilter = item.filters.find((filter) => filter.filterType === 'LOT_SIZE');
  const minNotional = item.filters.find((filter) => filter.filterType === 'MIN_NOTIONAL' || filter.filterType === 'NOTIONAL');
  return {
    instType: venue === 'spot' ? 'SPOT' : 'SWAP',
    instId: item.symbol,
    baseCcy: item.baseAsset,
    quoteCcy: item.quoteAsset,
    settleCcy: item.marginAsset,
    tickSz: priceFilter?.tickSize ?? '0.01',
    lotSz: lotFilter?.stepSize ?? '0.00001',
    minSz: lotFilter?.minQty ?? '0',
    minNotional: minNotional?.minNotional ?? minNotional?.notional,
    maxLmtSz: lotFilter?.maxQty,
    maxMktSz: lotFilter?.maxQty,
    lever: undefined,
    state: item.status === 'TRADING' ? 'live' : item.status.toLowerCase(),
    ctVal: '1',
  };
}
