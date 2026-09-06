# AirCapital

AirCapital is a read-only monitor of deposits across crypto exchanges. The app consolidates supported account balances, records their history and explains changes over time. It does not place, cancel or modify orders.

## Implemented

- Overview, Exchanges and Statistics screens, following the approved mobile concept.
- Binance, Bybit, BingX, OKX and Gate.io balance adapters; multiple accounts and exchange filters.
- 24-hour, 7-day, 30-day and full available history; amount and percentage changes, account contributions, wallet details.
- Explicit partial/stale/unpriced states. Confirmed zero and negative equity are preserved.
- Cash-flow journal and user-confirmed coverage before calculating a result excluding deposits/withdrawals. This is currently manual; it is not automatic transaction import or tax reporting.
- RU/EN/AR, RTL layouts, system/light/dark appearance and amount hiding.
- Device authentication, protected app-switcher preview, encrypted local records, JSON backup/import without keys, reconnection preserving history and recoverable full local deletion.
- Separate fictional demo. Demo observations never enter the real history.

## Start

```sh
npm ci
npm start
```

For browser preview, run `npm run web` and choose **Explore the demo**. Real credentials are supported on iOS/Android only; the web UI deliberately has no credential-storage fallback.

New native dependencies require rebuilding an existing development client:

```sh
npx expo run:ios
npx expo run:android
```

No real exchange credentials or device authentication were exercised during implementation. Production JavaScript/Hermes bundles were exported for iOS, Android and web; this does not replace testing an installed native binary.

## Verification

```sh
npm test
npx tsc --noEmit
npm run lint
npx expo install --check
npx expo export --platform all --output-dir .expo/monitor-build
```

The tests use mocked storage and exchange responses; unexpected network requests fail locally. Financial fixtures cover Earn duplication, stale updates, zero balances, non-USDT valuation, cash-flow separation, decimal arithmetic, encryption and deletion recovery.

## Data and coverage

[Release checks](docs/release-checklist.md) cover native testing and migration. [Exchange connection planning](docs/integrations/quick-connect.md) documents official guides and partner connection options. Historical audits, generated reports and design notes are kept locally and excluded from Git.

Use dedicated read-only API keys. The app checks exposed permissions for Binance, Bybit and OKX; for BingX and Gate.io the current adapter requires the user's explicit declaration. Old trading keys should be revoked and replaced on the exchange.

Old terminal bookmarks redirect to Settings. Existing grid plans are preserved as encrypted archives. Existing exchange orders are **not cancelled** during migration.

Snapshots from the previous calculation method are preserved in storage/export and excluded from new performance comparisons. Local ciphertext is tied to the device key; an OS backup alone is not a reliable portable backup. JSON export is readable and must be handled accordingly; JSON v1/v2 import merges records and reconnects restored accounts after keys are entered again.

Balances refresh on opening/resuming the app, manual refresh and every five minutes while active. Continuous cloud monitoring, push alerts, subscription billing, automatic flow import and additional locales are subsequent development stages.
