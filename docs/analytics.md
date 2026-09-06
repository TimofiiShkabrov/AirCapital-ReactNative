# Google Analytics: web, iOS and Android

## Registered resources

- GA account: AirCapital (`407019446`). Property: AirCapital WEB (`552896775`), shared by the website, iOS and Android apps; use the platform/stream dimension to separate them.
- Web: `https://aircapital.app`, stream `15728819828`, measurement ID `G-BLV9ZEBKW9`.
- Firebase project: `aircapital-web`, number `718518593608` (Spark/free plan).
- iOS: AirCapital iOS, bundle `tim.AirCapital`, stream `15729307851`, Firebase app `1:718518593608:ios:bd0f33afb95853c085107d`, App Store ID `6792837154`.
- Android: AirCapital Android, package `tim.AirCapital`, stream `15729418213`, Firebase app `1:718518593608:android:7d42baac0a17734c85107d`. Google Play listing is not created yet; Analytics does not require it.
- The earlier Android registration `com.tim_qiq.AirCapital` / stream `15729440344` is unused. Select the `tim.AirCapital` Android stream for release validation.
- SKU is an App Store Connect reference, not an Analytics configuration field.

The verified `config/firebase/GoogleService-Info.plist` and `config/firebase/google-services.json` files are public client configuration, not a service-account credential. Keep it in Git so EAS receives it. Do not add Admin SDK keys or Measurement Protocol secrets to the application.

## Native integration

React Native Firebase app/analytics are pinned to 26.4.0. The official Firebase app plugin configures both native platforms; a shared native driver handles consent and screen events. Web uses its existing Google tag integration. Expo Go and JavaScript development builds do not collect analytics. A **new native build for each platform** is required; an OTA JavaScript update alone cannot install Firebase.

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
# Installable Android APK, without a Play Store listing:
npx eas-cli@latest build --platform android --profile preview
# Android App Bundle for the future Play Store listing:
npx eas-cli@latest build --platform android --profile production
```

Firebase Apple 12.18 requires Xcode 26.2+. All iOS EAS profiles pin `macos-tahoe-26.5-xcode-26.6`, matching the locally checked Xcode release; see [EAS images](https://docs.expo.dev/build-reference/infrastructure/). The current Expo 54 integration uses CocoaPods/static frameworks, disables RNFirebase's default SPM integration, and forces static linking of the two RNFirebase pods. The pinned CocoaPods versions remain installable; plan migration to SPM when upgrading Expo/native dependencies (Firebase announced no new CocoaPods releases after October 2026). Do not remove the static-linking workaround or upgrade RNFirebase independently without a native build test.

Collection, Analytics storage, IDFV, advertising consent, automatic native screen reporting and ad-network registration default to off in `firebase.json`. The Analytics IdentitySupport pod is excluded (no IDFA/AdSupport). Native Firebase initialization is injected into AppDelegate exactly once by the Expo plugin.

Android AD_ID permission is explicitly removed; advertising ID and SSAID collection are disabled in `firebase.json`. Google Services configuration is copied during Expo prebuild. SHA signing fingerprints are not required for Analytics.

The consent prompt appears inside the existing privacy guard, after preferences load and the app unlocks. Copy is translated into all 31 supported languages. Consent is optional and can be changed under Settings → Privacy and data → Usage analytics. Refusal stops app events immediately, disables SDK collection and resets local Analytics data/instance ID. Delete-all first revokes Analytics. Previously uploaded events are not remotely deleted by a local reset.

The app sends only static `screen_view` names: `overview`, `exchanges`, `statistics`, `settings`, `account_details`, `flows`, `connection_guide`. Account IDs/route parameters are never passed. Firebase supplies installation/session/engagement, app/device/version data after consent. No balances, API keys, wallet contents, exchange labels, entered text, email or User-ID are passed. This is pseudonymous usage analytics, not a claim of anonymity. Update the App Store privacy answers and Google Play Data safety declaration and public privacy notice for the shipped SDK/data practices before release.

## Web audit (6 September 2026)

The web URL and measurement ID match source code. Enhanced measurement is configured for page loads and scrolls; browser-history page views, outgoing clicks, site search, forms, videos and downloads are disabled to avoid overlap with the site's explicit events. Google signals and user-provided data collection are off. The Internal Traffic filter is in testing mode, so it does not discard visitors. Advertising personalization is disabled for all regions. The event-scoped custom dimension `Action` maps to `action`. `download_click` is registered as a key event once per session, with no default monetary value; it measures a store-link click, not an installation. The coming-soon buttons do not send it.

The initial Railway fallback was resolved by selecting `TimofiiShkabrov/AirCapital-ReactNative` / `main` and setting `PORT=80` to match domain routing. The deployed `/`, `/demo`, `/faq`, `/contact` and `/healthz` all returned HTTP 200. Live browser checks confirmed no Google tag before consent or after refusal, and exactly one matching Google tag script after acceptance. Receipt of events in GA Realtime remains a release check.

## Delivery validation

Local policy tests cover opt-in, persisted consent, refusal, pending-event cancellation, storage failure, visibility, deduplication and route sanitization. These are not proof of delivery to Google.

Local iOS simulator Release build succeeded with native Firebase; compiled privacy defaults were verified. Android Expo prebuild and JavaScript export are checked separately; this machine lacks Java/Android SDK, so no local APK build was performed.

For the website, follow the consent and single-page-view checks in `docs/website.md`. After installing each new native release (iOS/TestFlight or Android APK): accept analytics, open each screen, background/resume, and check the corresponding platform stream in GA Realtime. Decline/revoke and confirm no further app usage events. For an isolated simulator release test, launch with `-FIRDebugEnabled` and inspect Firebase/GA DebugView; remove the debug argument for normal usage. Debug JavaScript builds intentionally remain disabled.

Sources: [Expo Firebase integration](https://docs.expo.dev/guides/using-firebase/), [React Native Firebase](https://rnfirebase.io/), [Analytics collection controls](https://firebase.google.com/docs/analytics/configure-data-collection), [Firebase CocoaPods migration](https://firebase.google.com/docs/ios/cocoapods-deprecation).
