# Release checks for the read-only monitor

This file lists the technical checks for a release candidate. The current store, legal and billing blockers are tracked in one place: [release-gate.md](release-gate.md). Do not treat a green checklist here as permission to publish.

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
- Build numbers are not in `app.json`. `eas.json` uses `appVersionSource: "remote"` with `autoIncrement`, so the iOS build number and Android versionCode live in EAS: read them with `eas build:version:get` and set them with `eas build:version:set`. Only the marketing `version` stays in `app.json`. Do not add `buildNumber`/`versionCode` back: they are ignored by EAS and only confuse the record of what was uploaded.
- `ITSAppUsesNonExemptEncryption` is intentionally absent from `app.json`, so App Store Connect asks the export-compliance questionnaire for every uploaded build. Answer it from [the technical inventory](release-hardening-2026-09-06/README.md): the app uses encryption; it is not limited to the OS, because local records are encrypted with AES-256-GCM from `@noble/ciphers` and exchange requests are signed with HMAC inside the app; no proprietary algorithm is used. Also decide the France declaration if France stays in the distribution list. Once Apple confirms the status, record the outcome in [release-gate.md](release-gate.md) and only then consider adding the confirmed key (with a documentation code if Apple issues one) so the prompt stops. Never re-add the bare `false` without that confirmation: it was found back in `app.json` on 2026-09-12 after the 2026-09-06 hardening pass had removed it.

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
