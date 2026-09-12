# AirCapital subscriptions

Implementation date: 2026-09-08. **Not enabled for release yet.**

## Commercial model

Free download, two exchange **accounts** (including all their wallets), basic balance/allocation monitoring, 30 days of recorded history, manual cash-flow records, security and all languages. Two API connections to the same exchange count as two accounts.

Pro: unlimited connected accounts, full recorded history, detailed statistics and comparable periods, CSV portfolio reports, local capital-change notifications. Base prices: USD 4.99/month and USD 39.99/year. Local checkout prices always come from the store. No trial or introductory offer is configured by this implementation.

Alerts run only after a fresh, complete balance refresh while the app is open. They do not imply background exchange monitoring. Cash-flow-adjusted performance needs manually entered and confirmed cash flows. CSV is a monitoring report, not a tax report.

## Store catalog

| Setting | Value |
| --- | --- |
| RevenueCat project | AirCapital — `8f2a7b8d` |
| Entitlement | `aircapital_pro` |
| Offering | `aircapital` (saved as default; real Apple products attached) |
| Apple bundle / Google package | `tim.AirCapital` |
| Apple subscription group | AirCapital Pro — `22367980` |
| Apple monthly product | `tim.AirCapital.pro.monthly`, P1M, USD 4.99 |
| Apple yearly product | `tim.AirCapital.pro.annual`, P1Y, USD 39.99 |
| Google subscription | `aircapital_pro` |
| Google base plans | `monthly` (P1M), `annual` (P1Y), auto-renewing |
| RevenueCat packages | `$rc_monthly` and `$rc_annual` |

Apple product IDs created: monthly `6809705537`, annual `6809711338`. Both products are saved at service level **1** in group `22367980`, with USD 4.99 / USD 39.99 base prices and store-calculated local prices across the selected territories. The annual product charges the full year upfront; Apple's separate monthly-installment option is not enabled. All **22 Apple-supported localizations** are verified for each product and the subscription group after reloading. Apple initially returned ambiguous errors for two annual localizations, but both are present in the persisted catalog; do not recreate duplicates.

RevenueCat offering `ofrnga7670109ed` (`aircapital`) is saved as default. Its `$rc_monthly` package contains Apple product `tim.AirCapital.pro.monthly` (RevenueCat `prod496e8b0394`), and `$rc_annual` contains `tim.AirCapital.pro.annual` (`prod35ca059cb2`). Both real Apple products are attached to entitlement `entl8e58049098` (`aircapital_pro`); verified from the entitlement's saved product table. Existing Test Store products remain separate from the real offering, and no Test Store SDK key is configured in the app. Restore behavior is verified as **Transfer to new App User ID**.

The real Google Play app configuration is **AirCapital (Play Store)**, ID `app1efa52a2cf`, package `tim.AirCapital`. Google service-account credentials, notifications and real Play products/base plans are still pending. Its public `goog_` SDK key alone does not make Android purchases operational.

With the user's explicit approval on 2026-09-08, the dedicated Apple In-App Purchase key **AirCapital RevenueCat** was created: key ID `8KNB7XYBDF`, issuer ID `a25d125d-c465-4411-8199-d3cd1d56e9c2`. Apple's form provides no per-app scope selector. The user uploaded and saved the P8 in RevenueCat. The real Apple app is **AirCapital (App Store)**, ID `appc6aa05a8c8`, bundle `tim.AirCapital`; RevenueCat displays **Valid credentials**. The local Downloads file parses as a valid P-256 private key and has permissions 0600. Its contents have not been printed or copied into the repository, app or Expo environments. Do not create a duplicate key.

Both public SDK keys (`appl_` / `goog_`) are saved in ignored `.env.local` and in the **development, preview and production** EAS environments of `@tim_qiq/AirCapital` (`a2821bcd-746c-4c69-a511-6abf03991367`). `EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=false` is saved in all three environments. These are project-scoped public string variables; the private P8 stays outside the app and Expo. An additional App Store Connect API key is not configured: products were mapped manually by exact existing SKUs. RevenueCat's automatic catalog import/status checking is consequently unavailable; the displayed product status **Could not check** is not proof of a failed purchase credential.

The RevenueCat notification URL is saved in both Apple production and Sandbox fields, including the top-level App Information save. A signed App Store Server API Sandbox `TEST` notification returned delivery **SUCCESS** on 2026-09-08 at 08:49 UTC, and RevenueCat confirms receipt. This tests the notification path, not a purchase. The equivalent production test endpoint still returns **HTTP 401**; production delivery remains unverified and must be rechecked before launch. The root cause is not yet confirmed. No purchase, renewal, refund or public release was performed by this check.

Google Play currently shows only “Upload APK” on its Subscriptions page. A new AAB containing Play Billing must be uploaded before the console allows product creation; the uploaded 2.4.7 (3) binary predates this integration.

Both Apple products must be at the same service level in the same group. Both Android plans belong to the same subscription. Existing subscribers use the native store subscription-management screen, rather than a second purchase checkout. Restore is explicit and uses the original store account. There is no AirCapital login or automatic Apple-to-Google purchase transfer.

## Trust and storage

`react-native-purchases` uses RevenueCat's managed backend to validate store purchases and acknowledge eligible Google purchases. The client accepts only signed, verified CustomerInfo and a recognized store/product entitlement. Neither a successful button press, local preference, backup, nor pending payment unlocks Pro.

INFORMATIONAL trusted-entitlement verification is checked explicitly: FAILED and NOT_REQUESTED are rejected. VERIFIED and VERIFIED_ON_DEVICE are accepted. Offline access is bounded by both the verified store expiration/grace date and three days from the SDK request date. Active entitlements with expired/ambiguous dates become unknown until refreshed. Cancellation keeps access through the paid period; a verified revocation removes it. New purchases are blocked while entitlement status is unknown.

RevenueCat owns its durable receipt/customer cache. App subscription state is memory-only. No private RevenueCat key, Apple .p8, Google service account JSON, receipt, exchange secret or balance is sent to our website or analytics. Public SDK keys are intended for the client. Rooted/modified clients cannot be made tamper-proof by client code alone.

Free connection selection is an encrypted preference, never proof of a purchase. The account write queue enforces the two-account limit under concurrent additions. On expiry, extra accounts stop refreshing, but their saved data stays. Import cannot restore a Pro entitlement. A partially paused portfolio never creates a misleading fresh total snapshot.

## Console state on 12 September 2026

Verified in the consoles and changed with the owner's approval:

- RevenueCat, app `appc6aa05a8c8`: bundle `tim.AirCapital`, IAP key `8KNB7XYBDF` / issuer `a25d125d-…` shows **Valid credentials**; Apple server-notification URL last received 2026-09-08; "Track new purchases from server-to-server notifications" off; forwarding URL empty; 0 integrations. Products `tim.AirCapital.pro.annual` / `.monthly` show **Could not check** only because no App Store Connect API key is uploaded. Entitlement `aircapital_pro` has 4 products (2 Apple + 2 Test Store). Offering `aircapital` has `$rc_annual` and `$rc_monthly` mapped to the Apple products; a second offering `default` holds the Test Store products and is unused by the app.
- App Store Connect: both subscriptions are in group 22367980 at level 1 with 22 localizations and status "Prepare for Submission"; **review screenshots are missing on both** and must be real paywall screenshots from the billing build. Review notes were filled on both products. Family Sharing is off. Both App Store Server Notification URLs equal the RevenueCat webhook.
- **Billing Grace Period enabled** (16 days, all renewals, production and sandbox). `accessFromCustomer` already honours `gracePeriodExpiresDate`.
- **App Privacy** republished with Purchase History (App Functionality + Analytics, linked to the user, not used for tracking).
- **App price changed to Free** (USD 0.00, 175 regions, effective immediately). No paid-download customers existed, so item 6 below is moot for Apple. Google Play still lists USD 4.99.
- Paid Applications agreement is still "New" and the Business page still shows the old Ukrainian legal address with the note that the legal entity must be updated before signing. Owner action only.

## Required external setup before activation

1. Complete the real Google Play connection to RevenueCat. The real Apple configuration is saved and its purchase key is valid; the existing Test Store is not a production configuration.
2. Apple: investigate/recheck the production test notification HTTP 401 and verify real sandbox purchases in a new native binary. Both notification URLs are saved; Sandbox notification delivery is verified. Do not regenerate the valid purchase key or reuse the EAS build-upload key as a workaround.
3. Google: a dedicated service account with only RevenueCat's required API/Play permissions, restricted to AirCapital in Play Console; configure RTDN/Pub/Sub as documented. Required Google Cloud roles in the dedicated AirCapital project: Pub/Sub Editor and Monitoring Viewer. In Play, scope access to AirCapital and grant viewing app info, viewing financial/order data, and managing orders/subscriptions. Manage store presence is additionally needed if RevenueCat creates/updates the catalog; omit it when all catalog editing is done directly in Play. Do not grant release/publication permissions. Do not disable organization key restrictions as a workaround. Check credentials become valid before testing (Google propagation can take time).
4. Attach the remaining two Google base-plan mappings to `aircapital_pro` and their respective monthly/yearly packages in `aircapital`. Both Apple mappings and restore behavior **Transfer to new App User ID** are already verified. Keep advertising/analytics integrations off.
5. Finish subscription localizations, prices/territories and review screenshot. Activate eligible Android base plans for sandbox billing, without publishing the application. Apple's first subscriptions must accompany a new app version with billing support.
6. Confirm no real paid-download customers exist before changing the download price. If any exist, implement verified receipt-based preservation of their purchased access first. Do not replace this with an editable local flag.
7. Change both apps to free download only when the subscription binary, store metadata, website pricing and legal documents are ready to go live together.

## Configuration and release gate

```dotenv
EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=false
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…
```

Use real public keys in the correct EAS environment. Never put secret keys in EXPO_PUBLIC variables, source control or the mobile bundle. `eas-build-post-install` runs `scripts/check-billing-config.mjs` and rejects missing/wrong-platform/secret/Test Store key formats when billing is enabled. It checks syntax, not remote credential health.

The launch flag defaults to false: current builds retain existing access, and new paywalls are hidden. With true, the native app enforces Free/Pro and the website uses the new pricing/legal disclosures. Coordinate the website and mobile rollout; do not deploy subscription claims before the store setup is ready.

Install native dependencies and create a new native build to test. EAS Update or Expo Go cannot add the billing/notifications native modules. No cloud build, Git commit, Git push, review submission or public release is performed by this implementation step.

### iOS TestFlight build with purchases enabled

iOS 2.4.7 build **13** (`68822f82-6785-4e31-8254-f8c184b8c980`) used the `production` profile. Its actual EAS build log says `Subscription configuration: disabled.` The production EAS environment still has `EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=false`; a successful build therefore did not mean purchases were available. Build 13 is not a subscription test build.

For the next iOS purchase test, use:

```sh
npm run build:ios:billing-test
```

The `billing-test-ios` profile inherits production signing, store distribution and remote build-number auto-increment. It reads the existing real public keys from the production EAS environment and explicitly overrides the subscriptions flag to `true` in the build profile. The build guard rejects Android or a disabled flag for this profile. The ordinary production profile and the website rollout remain disabled until release readiness is confirmed.

This command creates a cloud build, not a store submission. After it finishes, upload that exact iOS build to TestFlight using the existing production submit profile. Do not use `--latest` if other builds have run in the meantime. Test purchases, restoration and entitlement changes before selecting the binary for release. Preparing this profile does not resolve the outstanding Apple production notification check or the Google Play setup.

## Privacy declarations to update for the subscription binary

Apple: add **Purchase History**, used for App Functionality and Analytics (RevenueCat dashboard reporting). With the current anonymous identifiers and no contact attributes or identifying integration, RevenueCat documents that purchase history may be marked not linked to identity and not used for tracking. Preserve the existing accurate Firebase disclosures. Reassess if IDs are later joined to email/login records.

Google: disclose purchase history and relevant pseudonymous identifiers used for app functionality, fraud prevention and subscription reporting. Account creation remains absent. Apply the service-provider sharing exception only where its conditions actually hold; retain current optional Firebase declarations. Do not declare payment card details or exchange balances as collected by RevenueCat: the app does not send them. Review the complete form against the SDK configuration before saving.

Website legal documents include subscription processing, cancellation/restoration and billing-record deletion when the rollout flag is on. Local deletion/uninstall does not cancel store billing or erase RevenueCat/store records. Verify a deletion request proportionately before locating a purchase and deleting applicable provider records; explain required legal retention. The operator must maintain the provider DPA and applicable transfer safeguards.

Localized draft copy: `marketing/texts/<language>/subscriptions.md` (31 languages). These are new subscription-release drafts, not confirmation that every store field has been saved.

## Validation

Completed: TypeScript; 227 automated tests; iOS and Android production JS/Hermes export; Expo native configuration introspection; web static export and SEO validation of 31 languages / 124 localized pages; build-key guard failure/success cases. These checks do **not** constitute signed native builds or real-store billing tests.

Before production, test on both physical platforms with store sandbox/test accounts:

- Clean install, allow/decline analytics, free first and second connections, blocked third, all wallets under each connection.
- Monthly and annual checkout, exact localized full price, cancel sheet, pending payment, double taps, interrupted purchase and recovery.
- Restore after reinstall using the same store account; purchase on a different device of the same platform.
- Renewal, cancellation until paid expiry, grace period, account hold, refund/revocation, offline cache expiry and a changed clock.
- More than two accounts at expiry, selecting two, preserved backups/history, accurate stale-state labeling, resubscription.
- CSV injection/escaping, confirmed vs incomplete cash flows, capital notifications/permissions, no lock-screen financial values.
- Small phones/tablets, large text and RTL; paywall error visibility; real native SDK initialization and store-management links.
- RevenueCat server notifications and Google purchase acknowledgment; no secret or purchase details in analytics/logs.

Known dependency audit issue: npm reports pre-existing Expo/Metro `image-size` advisories in build tooling. Do not apply the suggested Expo major upgrade blindly; track the compatible upstream fix separately.

## Official references

- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Google Play Billing integration](https://developer.android.com/google/play/billing/integrate)
- [RevenueCat Expo installation](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [Trusted entitlements](https://www.revenuecat.com/docs/customers/trusted-entitlements)
- [RevenueCat caching](https://www.revenuecat.com/docs/test-and-launch/debugging/caching)
- [Apple purchase key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
- [Google service credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials)
- [Apple privacy labels](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy)
- [Google Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469)
- [RevenueCat DPA](https://www.revenuecat.com/dpa)
