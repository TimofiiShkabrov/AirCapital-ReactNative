# Google Play setup

Developer account: Tymofii Shkabrov, `7326666823529484978`.
App: AirCapital, `4976225602897874213`, Android package `tim.AirCapital`.
Version: 2.4.5. Status: draft; no release or review submission performed.

## Saved in Console on 6 September 2026

- App category: Finance.
- Public support email supplied by the owner: timofii.shkabrov@gmail.com; website https://aircapital.app.
- Default listing: English (UK), title AirCapital, short and full descriptions saved as a draft.
- Short description: Track crypto exchange balances and portfolio changes in one clear overview.
- Ads: none.
- Advertising ID: not used; matches blocked Android AD_ID permission and disabled Firebase advertising ID collection.
- Government affiliation: no.
- Health features: none.
- Financial features: Other, explicitly described as read-only aggregation and history of third-party crypto exchange balances, without trading, transfers, custody, loans or advice.

## Remaining before review

- A complete, published privacy policy. The existing website privacy section is only a brief summary.
- Store icon, feature graphic and actual Android screenshots. Existing icon asset: public/branding/icon-512.png.
- Target audience and IARC age-rating questionnaire (requires contact email).
- Data safety declaration covering actual exchange API traffic and optional Firebase Analytics; do not declare that no data is collected merely because balances are kept locally.
- Reviewer access: demo mode exists but full access to connection functionality needs validation on the Android release. No fabricated API credentials or full-access attestation were submitted.
- Signed Android App Bundle and testing. Console currently requires at least 12 opted-in closed testers for at least 14 days before a production-access application.

Build an installable APK using `npx eas-cli@latest build --platform android --profile preview`; build a store bundle using `npx eas-cli@latest build --platform android --profile production`.
