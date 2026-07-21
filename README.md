# AirCapital

AirCapital is an Expo React Native app for crypto portfolio tracking and controlled LIVE trading.

It can sync balances and positions from Binance, Bybit, BingX, OKX, and Gate.io. The trading terminal currently supports LIVE order actions for OKX, Binance, and Bybit.

## Safety Model

AirCapital sends real exchange requests. Use API keys with:

- Read permission for portfolio sync.
- Trade permission only for accounts that should trade from the app.
- Withdraw permission disabled.
- IP whitelist enabled when the exchange supports it.

API keys are stored on-device with `expo-secure-store`. Account metadata and local grid plans are stored with AsyncStorage.

## Supported Features

- Portfolio total across saved exchange accounts.
- Per-account wallet sections and spot/futures positions.
- Balance history snapshots for total/account charts.
- Local language switch: English and Russian.
- OKX trading: spot/swap single orders, grid orders, attached TP/SL, cancel, close swap position.
- Binance trading: spot/swap single orders, grid orders, USD-M TP/SL via futures algo orders, cancel, close swap position.
- Bybit trading: spot/linear single orders, grid orders, native TP/SL fields, cancel, close linear position.

## Known Trading Limits

- BingX and Gate.io are portfolio-only in the current terminal.
- Binance Spot TP/SL is not automated. The app blocks Binance Spot TP/SL submission instead of silently ignoring it.
- Bybit Spot market TP/SL is blocked; use Bybit Spot limit orders for TP in this terminal.
- Binance USD-M TP/SL uses `/fapi/v1/algoOrder`; large grids are capped to 200 conditional TP/SL orders.
- Grid plans are local state. Always verify open orders on the exchange after network errors or partial acceptance.

## Development

```bash
npm install
npm start
```

Useful checks:

```bash
npm run lint
npm run test
npx tsc --noEmit
npx expo-doctor
```

For iOS local builds, CocoaPods must be installed:

```bash
pod --version
```

## Release

Read [docs/release-checklist.md](docs/release-checklist.md) before shipping, and run the manual trading scenarios in [docs/live-trading-qa.md](docs/live-trading-qa.md) with small amounts.
