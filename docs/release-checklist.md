# Release checks for the read-only monitor

## Automated

```sh
npm ci
npm test
npx tsc --noEmit
npm run lint
npx expo install --check
npx expo export --platform all --output-dir .expo/monitor-build
```

Inspect remaining npm advisories by reachability. Do not apply a forced Expo major upgrade without native validation.

## Native acceptance

- Regenerate native configuration and rebuild the client after installing native dependencies, including Localization. For EAS builds the ignored native directories are generated automatically.
- Test cold start, authentication success/cancel/failure, app switcher, background/resume, device lock and network loss on iOS and Android.
- Verify protected storage migration, interrupted setup/removal/import, missing encryption key, JSON v1/v2 restore, reconnection and complete local deletion. An OS backup is not a portable encrypted backup.
- Test accessibility, larger system fonts, Arabic RTL and light/dark modes on devices.
- On a fresh install, check supported and unsupported primary device languages, regional variants, saved language after relaunch and language selection with the keyboard open. Check the localized Face ID permission prompt in the installed iOS build.
- Complete the App Store encryption questionnaire using [the technical inventory](release-hardening-2026-09-06/README.md). The unverified exemption flag has been removed.

## Exchange acceptance

- Use explicit read-only test accounts; never require trading/withdrawal/transfer permission.
- Reconcile each supported wallet and total against the exchange; test empty and negative equity, non-USDT funding, Earn active/pending/closed, revoked keys and 429/errors.
- Confirm the global endpoints are available for the target account/region and publish actual product coverage.
- Inspect the resulting bundle/source graph for order creation/cancellation or account-changing endpoints.
- Verify old terminal links and grid-plan migration. Existing exchange orders remain on the exchange.

## Product acceptance

- Demo stays separate from live storage and is visibly labelled.
- A failed source never produces a fake successful snapshot or unexplained zero.
- History uses explicit observation dates and matching account membership; legacy calculations remain distinguishable.
- Cash flows are labelled manual. Confirmed coverage is required for flow-adjusted results; percentages describe balance change.
- All real credentials are rejected on web. No plaintext localStorage fallback exists.
- No billing, push delivery or continuous server monitoring is advertised until implemented.
