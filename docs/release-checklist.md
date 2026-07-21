# Release Checklist

## Required Checks

```bash
npm install
npm run lint
npm run test
npx tsc --noEmit
npx expo-doctor
npx expo install --check
```

Do not use `npm audit fix --force` casually. At the time this checklist was written, the force fix path wants a breaking Expo SDK upgrade.

## Native Tooling

- CocoaPods installed and available with `pod --version`.
- Xcode command line tools installed for iOS builds.
- Android Studio SDK and emulator installed for Android builds.
- Restart any running Expo dev server after dependency changes.

## App Config

- `app.json` scheme is lowercase: `aircapital`.
- iOS bundle id and Android package are final.
- App icon, adaptive icon, splash, and favicon are final assets.
- EAS project id is present.
- Production profile uses Android app bundle.

## Security Review

- API setup instructions say Read + Trade only.
- API setup instructions say Withdraw must stay disabled.
- LIVE request warnings are visible before trading.
- Binance Spot TP/SL is blocked until explicitly implemented.
- Exchange errors are visible per account.

## Store Text Draft

Short description:

AirCapital tracks crypto balances across exchanges and provides controlled LIVE trading tools for OKX, Binance, and Bybit.

Privacy summary:

AirCapital stores exchange API keys locally on the device using secure storage. The app communicates directly with configured exchange APIs to sync balances, positions, and orders. Do not enable withdrawal permissions on exchange API keys.

Support:

For support, include device platform, app version, exchange, account label, approximate time, and the visible API error. Never send API secrets.
