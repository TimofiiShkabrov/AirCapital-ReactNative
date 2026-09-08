# Google Play setup

Updated: 8 September 2026. Developer account: Tymofii Shkabrov, `7326666823529484978`.
App: AirCapital, `4976225602897874213`, Android package `tim.AirCapital`.
Uploaded version: **2.4.7 (versionCode 2)**. No review submission or rollout performed.

## Saved in Play Console

- Finance category, public support email `timofii.shkabrov@gmail.com`, website `https://aircapital.app`.
- 28 store listing languages, descriptions, icon, feature graphics and phone screenshots prepared previously; listing changes remain ready for review.
- Paid download: base price USD 4.99 with local prices previously saved. No subscriptions or in-app purchases.
- Privacy policy `https://aircapital.app/privacy`; deletion URL `https://aircapital.app/data-deletion`.
- No ads, Advertising ID, government affiliation or health features. Financial features describe read-only aggregation of exchange balances, without trading, transfers, custody, loans or advice.
- IARC age ratings saved previously. **Target audience corrected to 18+** on 8 September; this is separate from the content rating.
- **Data safety saved on 8 September:** User IDs for exchange authentication (required/app functionality); approximate location, app interactions and app-instance/device IDs (optional/analytics). Collected, not shared under Google's service-provider/user-initiated transfer exceptions, not ephemeral. TLS in transit; no AirCapital cloud account. No portfolio records or API keys sent to Analytics.
- Internal release draft: 2.4.7 (2), release notes in 28 languages.
- **Closed Alpha draft:** `2.4.7 (2) — closed beta`, same existing AAB selected from the library, release notes 28/28, 172 available countries/regions, feedback email saved. Test is inactive.

[Closed test settings](https://play.google.com/console/u/0/developers/7326666823529484978/app/4976225602897874213/tracks/4698696636091967409)

## Remaining before review/testing

1. **Replace the AAB to remove unnecessary photo permissions.** The release validator found READ_MEDIA_IMAGES in versionCode 2, introduced by expo-screen-capture. AirCapital uses screenshot prevention, not photo-library access. `app.json` now blocks READ_MEDIA_IMAGES, READ_MEDIA_VIDEO and legacy READ/WRITE_EXTERNAL_STORAGE, in addition to AD_ID. Expo introspection confirms manifest removal directives; this does not modify the already uploaded AAB. No new EAS build was run. Do not invent a photo-permission justification.
2. **Provide full reviewer access and correct App access.** The currently saved declaration says no restricted sections, which is inaccurate for exchange-backed functions. The existing demo hides account details/transaction history and cannot perform live sync. Google rejected truthful limited-demo instructions without a full-access attestation. The attestation was not checked and the failed edits were discarded. Provide a complete review demo in a future build or dedicated, non-personal test access before changing this declaration and submitting for review.
3. **Save and assign the tester list.** The owner supplied one address; automatic entry failed. A temporary CSV outside the repository was prepared and the owner was asked to import it. Neither successful list creation nor assignment has been verified. No invitation was sent and no test was launched.
4. **Closed testing for production access:** at least 12 opted-in testers continuously for 14 days, followed by the production-access application. Merely saving email addresses does not satisfy this requirement. The console currently shows zero participating testers.
5. **Payments/tax requirements:** bank details remain excluded by the owner's instruction. Applicable tax declarations need truthful owner information. The optional 15% service-fee programme needs disclosure of associated developer accounts; their absence has not been assumed.

The release validator also warns about missing testers and a missing R8/ProGuard deobfuscation file. Native debug symbols are attached. Supply a deobfuscation mapping only if the release actually uses obfuscation; do not fabricate one.

## Local verification of the permission fix

- `npx expo config --type introspect --json`: all blocked permissions have `tools:node="remove"` in the generated manifest model.
- Existing analytics configuration and privacy-session tests: 13 passed.
- Import/export use the system document picker and app-private cache. Screen-capture prevention uses FLAG_SECURE; it does not require photo-library access.
- The final merged release manifest and real device behavior still need verification in the replacement Android build.

See [store readiness](../marketing/store-readiness.md) and [uploaded builds](../marketing/release-2.4.7.md).

## Official requirements

- [Prepare an app for review and provide full access](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en#app_access)
- [Testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Restricted photo and video permissions](https://support.google.com/googleplay/android-developer/answer/16935362)
