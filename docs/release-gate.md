# Release gate

**Single source of truth for "can we publish and sell".** Every other document ([app-store.md](app-store.md), [google-play.md](google-play.md), [subscriptions.md](subscriptions.md), [marketing/store-readiness.md](../marketing/store-readiness.md)) is a log of what was done. This file only lists what is still open. When an item is closed, delete it here and note the date and evidence in the relevant log. Do not submit for review while any item in the "Blocking" tables is open for that platform.

Last reviewed: 12 September 2026 (evening). Repository version 2.5.0. iOS: builds 14 and 15 (2.5.0) are processed in TestFlight with status "Ready to Submit"; the App Store version card was renamed to **2.5.0** but still has build 12 (2.4.7) attached. Android 2.4.7 versionCode 3 (internal + closed Alpha drafts, test not launched). Nothing has been submitted for review on either platform.

## Decision: free download + AirCapital Pro subscription (taken 12 Sept 2026)

The owner chose model (B). **Apple pricing was switched to Free (USD 0.00, all 175 regions) on 12 Sept 2026**; no paid-download customers existed. Google Play still shows the paid USD 4.99 listing and must be aligned before any Android release. The website and its FAQ still advertise a one-time USD 4.99 purchase — see the website section.

- [ ] Google Play: change the app to free (Pricing) and remove "no subscriptions" wording from the listing when the Play Billing AAB is uploaded.
- [x] 12 Sept: website copy and legal documents now describe the free + Pro model unconditionally (`src/web/copy/index.ts`, `src/web/legal/documents.ts`, legal date 2026-09-12); store descriptions in 31 languages carry an "AirCapital Pro" paragraph (prices, term, renewal, privacy and terms links) in `marketing/texts/catalog.json`; App Store Connect descriptions updated in all 22 localizations; review notes updated. Remaining: **redeploy the website** (Railway build) so the live site stops showing "one-time US$4.99".

## Live website — fix immediately, independent of the decision

- [x] Source fixed 12 Sept: `storeAvailability` now follows `EXPO_PUBLIC_IOS_RELEASED` / `EXPO_PUBLIC_ANDROID_RELEASED` (default false), store buttons never link before release, the FAQ/pricing copy describes free + Pro.
- [ ] **Redeploy the live site.** Until the Railway build runs, aircapital.app still shows the old paid-download copy and an App Store button that 404s. Set `EXPO_PUBLIC_IOS_RELEASED=true` only after the app is actually live.

## Apple — blocking

| Item | Where to close it | State |
| --- | --- | --- |
| Paid Applications agreement | App Store Connect → Business | Status "New", not active. Nothing can be sold until active. |
| Bank account and tax forms | App Store Connect → Business | Not entered. Follows the agreement. Never store account or tax numbers in the repository. |
| Seller legal name and address | Apple Developer account | Correction Timofii → Tymofii Shkabrov and Norwegian address requested ([marketing/legal/apple-seller-name-correction.md](../marketing/legal/apple-seller-name-correction.md)); Apple acknowledged receipt, change not yet applied. |
| DSA trader verification | App Store Connect → Business | "In review" as of 7 Sept. Provide documents directly in the console if requested. |
| Export compliance | Answered per build in App Store Connect | `ITSAppUsesNonExemptEncryption` was removed from `app.json` again on 12 Sept (it had been re-added after the 6 Sept hardening). Answer the questionnaire from [release-hardening-2026-09-06/README.md](release-hardening-2026-09-06/README.md) §1: uses encryption, not limited to the OS (AES-256-GCM via `@noble/ciphers`, in-app HMAC), no proprietary algorithm. Decide the France declaration. Record the outcome here. |
| Third-party content rights | App Store Connect → App Information | Empty. The app calls exchange APIs and public prices; confirm the applicable terms. Do not claim "no third-party content" or "all rights held" without a basis. |
| Regional legality | App Store Connect → Pricing and Availability | 175 regions selected as a technical setting only. Check mainland China ICP applicability (no number exists) and exclude regions whose rules the app cannot meet. |
| Reviewer access | Review notes / build | Notes describe the demo. Confirm on the release build that the demo plus the connection workflow is enough for review without the owner's personal keys. |
| Subscription review screenshots | Subscriptions → each product → Review Information | **Missing on both products.** Apple requires a real screenshot of the paywall (min. 640×920) from the billing build before "Add for Review" works. Take it on the `billing-test-ios` TestFlight build. Review notes were filled on 12 Sept. |
| Build for review | App Store Connect → 2.5.0 | Version card renamed to 2.5.0 on 12 Sept; build **12 (2.4.7) is still attached**. Remove it (hover the build row → remove) and attach build **15** (2.5.0, "Ready to Submit" in TestFlight). Before that, confirm from the EAS build log that build 15 was built with `Subscription configuration: enabled`; a build with the flag off shows no paywall and the subscriptions cannot be reviewed. |

## Google — blocking

| Item | Where to close it | State |
| --- | --- | --- |
| App access declaration | Play Console → App content | Saved as "no restricted sections", which is untrue for exchange-backed screens. Google rejected honest limited-demo instructions without the full-access attestation. Ship a full review demo in a build or provide dedicated non-personal test access, then correct the declaration. |
| Tester list | Play Console → Closed testing | One address supplied; list not saved or assigned; no invitation sent. |
| 12 testers × 14 days | Play Console → Closed testing | Test not launched; 0 participants. Production access cannot be requested before the 14 continuous days elapse. Applies because this is a personal account created after 13 Nov 2023; an organization account would be exempt (would require a D-U-N-S number, a new account and an app transfer — unverified path, see audit 12 Sept). |
| Production access application | Play Console | Blocked by the previous row. |
| Bank account | Google Payments profile | Not added (account holder, IBAN, SWIFT). |
| Tax information | Google Payments profile | United States and Taiwan sections show "not provided". Check which apply to a Norwegian individual; enter directly in Google Payments. |
| 15% service-fee programme | Play Console | Optional. Requires truthful disclosure of associated developer accounts; not enrolled. |
| Deobfuscation warning | Play Console validator | **Not a blocker.** R8 is off by default in the generated Gradle project; no mapping exists. Leave empty. See [google-play.md](google-play.md). |

## Subscriptions — blocking (model B chosen)

| Item | State |
| --- | --- |
| Play Billing in the uploaded AAB | Absent (2.4.7 versionCode 3 predates the integration); the Subscriptions page only offers "Upload APK". Upload a new AAB built from 2.5.0 first. |
| Google products | Subscription `aircapital_pro` with base plans `monthly` (P1M) and `annual` (P1Y) do not exist yet. IDs must match `BILLING.android` in `src/billing/config.ts` (`aircapital_pro:monthly`, `aircapital_pro:annual`). |
| RevenueCat ↔ Google | Service account, Play permissions and RTDN/Pub/Sub not configured. Remaining two base-plan mappings not attached to `aircapital_pro` / `aircapital`. |
| Apple production server notification | Both URLs in App Store Connect match the RevenueCat webhook (verified 12 Sept). The production *test* endpoint returns HTTP 401; Apple's App Store Server API rejects production test notifications for apps that have never been published, so this is expected until the first release. Re-run the test after the app is live; do not block on it. |
| Real purchase tests | None performed on either platform. Use `npm run build:ios:billing-test` for iOS; build 13 was **not** a billing build. Run the full list in [subscriptions.md](subscriptions.md) → Validation. |
| Store metadata | Apple: 22 localizations and prices verified; only the review screenshots remain (see Apple table). Android: base plans and localizations do not exist yet. |
| Privacy labels | Apple done 12 Sept. Google: add purchase history and pseudonymous identifiers in Data safety per [subscriptions.md](subscriptions.md). |
| Flip the flag | `EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=true` in the production EAS environment only after all rows above, together with the website and legal switch. |

## Technical checks before any submission

Run [release-checklist.md](release-checklist.md) in full on the exact commit being built. The last documented run (227 tests, `tsc`, exports) predates the 12 Sept configuration changes; rerun. No signed native binary has yet been exercised with real exchange credentials or device authentication by the implementation itself — do that on the release candidate.

## Closed items (keep short, newest first)

- 2026-09-12: App Store Connect version card renamed 2.4.7 → 2.5.0; English review notes replaced (free download, optional Pro, paywall path); descriptions in all 22 localizations extended with the AirCapital Pro paragraph (verified after reload for en, ar, hu, el, da, es, it, pl, ro, ru, sv; all 22 saves reported success).
- 2026-09-12: Repository copy aligned with the model: website copy/legal (31 languages), store catalog (31 languages, regenerated `marketing/texts/*/app-store.md` and `google-play.md`), README, docs/website.md, release checklist, marketing README, Apple review notes source.

- 2026-09-12: Apple app price changed from USD 4.99 to Free in all 175 regions (immediate).
- 2026-09-12: Billing Grace Period enabled: 16 days, all renewals, production + sandbox.
- 2026-09-12: App Privacy republished with Purchase History (App Functionality + Analytics, linked to user, no tracking).
- 2026-09-12: Review notes saved on both subscription products (English, paywall path and read-only scope).
- 2026-09-12: RevenueCat Apple side verified complete: bundle `tim.AirCapital`, IAP key `8KNB7XYBDF` valid, both products in `aircapital_pro` and offering `aircapital`, server-notification URL matches ASC, 0 integrations. Product status "Could not check" is only the missing App Store Connect API key.

- 2026-09-12: `buildNumber`/`versionCode` removed from `app.json`; EAS remote versioning is authoritative (`eas build:version:get`).
- 2026-09-12: Deobfuscation-mapping warning classified as expected; no mapping exists because R8 is disabled.
- 2026-09-08: Android AAB 3 verified free of READ_MEDIA_*, READ/WRITE_EXTERNAL_STORAGE and AD_ID.
- 2026-09-08: Google Data safety saved; target audience corrected to 18+.
- 2026-09-08: Apple build 12 selected in 2.4.7; TestFlight metadata in 22 languages.
- 2026-09-07: Five legal pages live on aircapital.app (`fc9273f`); Android upload key created in EAS and pinned by Google.
