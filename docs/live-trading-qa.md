# LIVE Trading QA Checklist

Use a separate low-balance exchange account or subaccount. API keys must have Read + Trade only, no Withdraw.

## Before Testing

- Confirm `npm run lint`, `npm run test`, `npx tsc --noEmit`, and `npx expo-doctor` pass.
- Confirm the device clock is accurate; signed exchange requests are timestamp-sensitive.
- Confirm each test account has enough USDT for minimum order size plus fees.
- Keep the exchange order page open next to the app.

## Portfolio Sync

- Add one account for each supported exchange: Binance, Bybit, BingX, OKX, Gate.io.
- Pull to refresh on Home.
- Confirm balances match each exchange within expected rounding.
- Open account details and confirm wallet sections and positions are visible.
- Temporarily break one API key and confirm the account row shows a sync warning.

## OKX Trading

- Place a small spot limit buy with TP.
- Cancel the open order from Active grids or the exchange if needed.
- Place a small USDT-M single order with TP and SL, then verify attached algo orders on OKX.
- Place a small USDT-M grid with 2 to 3 orders and TP/SL.
- Cancel the grid and verify no matching pending orders remain.
- Close a USDT-M plan position and verify the local plan becomes completed.

## Binance Trading

- Place a small Spot single order without TP/SL.
- Try Binance Spot with TP filled in; confirm the app blocks submission with the Binance Spot TP/SL warning.
- Place a small USDT-M single order with TP and SL, then verify `/algoOrder` TP/SL entries appear on Binance.
- Place a small USDT-M grid with 2 to 3 orders and TP/SL.
- Cancel the grid and verify normal orders and conditional algo orders are removed.
- Close a USDT-M plan position and verify the close market order uses the current position quantity.

## Bybit Trading

- Place a small Spot limit buy with TP, then verify the TP configuration on Bybit.
- Try Bybit Spot market with TP filled in; confirm the app blocks submission with the Bybit Spot TP/SL warning.
- Place a small Linear USDT single order with TP and SL, then verify TP/SL on Bybit.
- Place a small Linear USDT grid with 2 to 3 orders and TP/SL.
- Cancel the grid and verify matching open orders are removed on Bybit.
- Close a Linear plan position and verify the reduce-only market order uses the current position size.

## After Testing

- Confirm there are no orphan open orders on OKX, Binance, or Bybit.
- Confirm no API key has Withdraw enabled.
- Export screenshots or order IDs for the release record.
