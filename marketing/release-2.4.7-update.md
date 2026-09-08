# AirCapital 2.4.7 — update, 8 September 2026

The owner authorized new Expo builds and store uploads. No Git commit/push, public release, review submission or closed-test rollout is authorized by this update.

## Changes

- Native iOS/Android analytics consent dialog replaces the full-screen card; consent remains optional and off until accepted.
- Android excludes unnecessary media/storage permissions and the advertising ID permission.
- App version remains 2.4.7 to update existing store drafts. EAS remote counters advanced to iOS 12 and Android 3; local app.json matches.
- Release notes are prepared in 31 languages, with 28 supported Google Play localizations.

## Build and upload status

- Android: [EAS build](https://expo.dev/accounts/tim_qiq/projects/AirCapital/builds/9a28af57-d263-440c-acac-5ad76bcc26f0), versionCode 3 — built, uploaded to Google Play and saved in both the internal and closed Alpha release drafts with 28 localized release notes each; both verified after reload.
- iOS: [EAS build](https://expo.dev/accounts/tim_qiq/projects/AirCapital/builds/5b6dabcd-6166-4e33-83e2-853c1629ee71), build 12 — build finished successfully and [uploaded to Apple](https://expo.dev/accounts/tim_qiq/projects/AirCapital/submissions/25e80d4b-de0e-4e8b-acff-6cf41a9dc58a); Apple processing completed. Build 12 is assigned to the existing Team (Expo) group and selected/saved in the App Store 2.4.7 draft; selection was verified after reload. TestFlight notes were saved and verified after reload in all 22 supported languages.

## Validation

- TypeScript and targeted ESLint: passed.
- Vitest: 171 tests passed in 18 files.
- Native dialog appearance and interaction still require a device check on the new build.

- Downloaded AAB: 63,749,553 bytes; SHA-256 `ef51a3849d6f8f8b94c648c5501d11a7ddcc3819d9c4b6d66df265a7ee85ebe9`. The packaged manifest contains none of READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE or com.google.android.gms.permission.AD_ID.

- Alpha release validation: no blocking errors; only warnings about missing testers and an optional deobfuscation mapping. The previous photo/video permission error is resolved. The validation screen was closed without proceeding to publication/review.
