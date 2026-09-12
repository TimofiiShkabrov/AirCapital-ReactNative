# AirCapital website

## Deploy to Railway

The root `Dockerfile` builds only the production Expo web export with Node 22, then copies static output into Nginx. `railway.json` selects the Dockerfile, uses the image's default startup command and checks `/healthz` before switching traffic. No Expo development server, native build, database or persistent volume is required.

For the existing service shown in the Railway screenshots:

1. Connect the GitHub repository and select the branch that should deploy automatically on push. Keep the service root at the repository root and Dockerfile Path as `Dockerfile`. Commit the website source, translations, public images, `vendor/`, lockfile and deployment files together.
2. Set service variable `PORT=80` to match the current custom domain target port **80**. Nginx also supports another Railway `PORT`; if you change it, change the domain target port to the same value. Port 443 belongs to Railway's public HTTPS edge, not the container.
3. Public URLs and support email have defaults in `src/web/config.ts`: `https://aircapital.app`, App Store ID `6792837154`, Google Play package `tim.AirCapital`, and `timofii.shkabrov@gmail.com`. Optional `EXPO_PUBLIC_*` variables override them. Keep `EXPO_PUBLIC_IOS_RELEASED=false` and `EXPO_PUBLIC_ANDROID_RELEASED=false` until each app is publicly available. Railway passes these declared Docker build arguments during the build. Changing them requires a rebuild.
4. Leave custom build/start commands empty; the Dockerfile handles both. Apply the staged Railway changes and push the selected Git branch. Subsequent pushes trigger deployments while GitHub autodeploy is enabled. Repository files alone cannot enable the GitHub connection or autodeploy toggle.
5. The screenshot shows **Waiting for DNS update** for `aircapital.app`. Use **Show DNS records** and copy the exact records Railway provides to the domain's DNS provider. Railway handles the public HTTPS certificate after the domain is verified.
6. Verify `/`, `/demo`, `/faq`, `/contact` and `/healthz` on the public domain, then perform the GA4 checks below. Unknown URLs return the branded 404 page; legacy app routes redirect to `/demo`. Hashed Expo assets receive a one-year cache lifetime; HTML and unversioned assets are revalidated. Gzip is enabled.

Local Docker verification:

```sh
docker build -t aircapital-web .
docker run --rm -p 8080:80 -e PORT=80 aircapital-web
# Visit http://localhost:8080 and http://localhost:8080/demo
```

`.dockerignore` excludes local dependencies, builds, environment files and credentials from the build context. Only exported static files enter the runtime image. Public build arguments are embedded in the website and must never contain secrets.

References: [Railway Docker builds and build arguments](https://docs.railway.com/builds/dockerfiles), [Railway health checks and PORT](https://docs.railway.com/deployments/healthchecks), [Dockerfile reference](https://docs.docker.com/reference/dockerfile).

The web export is a public presentation site. `/` is the landing page, `/demo` is a fictional interactive portfolio, `/faq` explains actual capabilities and `/contact` contains public contact channels. Old application URLs redirect to `/demo`. Native iOS/Android routes and protected storage are separate; the website does not hydrate exchange accounts, read keys or call exchange APIs.

## Launch settings

The registered store URLs are linked on Home and FAQ. They currently return HTTP 404 before publication (checked 7 September 2026), so the links are marked **Coming soon**, with an explanation that store pages become accessible after publication. Publication status is independent of the presence of a URL. Only set a platform's `EXPO_PUBLIC_*_RELEASED=true` after verifying its public listing; this changes that platform's label and analytics event. Invalid URL overrides render a non-clickable placeholder. Store links must use `https://apps.apple.com` or `https://play.google.com`; Telegram links must use `https://t.me`.

Pricing and release/contact information are translated into all 31 website languages. The site explains the free download, the AirCapital Pro subscription (US base prices 4.99/month and 39.99/year, local store prices/taxes, automatic renewal and cancellation) and the free web demo. This copy is composed at build time from `src/billing/locales.json` in `src/web/copy/index.ts`, so it stays in sync with the paywall strings. Store buttons stay "coming soon" until `EXPO_PUBLIC_IOS_RELEASED` / `EXPO_PUBLIC_ANDROID_RELEASED` are set to `true` on the web deploy. Contact includes the verified public operator name/address from `src/web/legal/operator.json` and links to privacy, data deletion and legal information. No private review phone number is published.

Set `EXPO_PUBLIC_SITE_URL` to the actual HTTPS origin before building to include canonical URLs and an absolute sharing image. Rebuild after changing these values; Expo embeds `EXPO_PUBLIC_*` variables at build time.

```sh
npx expo export --platform web
```

Publish `dist/` on a static HTTPS host that resolves clean paths to exported HTML (e.g. `/demo` → `/demo.html`). Serve each exported HTML file; do not rewrite all pages to `index.html`. Configure a host redirect from old `/details/*` URLs to `/demo` if desired, since unknown dynamic account IDs have no static page. Test direct visits and reloads on `/demo`, `/faq` and `/contact` after deployment.

English is the static/default language. The browser detects a supported device language on the first visit and remembers explicit choices. All 31 app languages have complete site copy. Screenshots are actual English app screens with fictional data; the interactive demo follows the selected language.

## Google Analytics 4

Measurement ID: **G-BLV9ZEBKW9**. The tag is loaded once per document only after consent. Before acceptance, no Google scripts or measurement requests are initiated (basic consent mode). Advertising storage, advertising user data and personalization are always denied; Google signals and ad personalization are disabled. A saved choice expires after 180 days. Footer **Cookie settings** allows refusal or acceptance later. Revocation disables measurement and removes `_ga` cookies.

Public navigation uses ordinary document links. One `gtag('config', ...)` sends the page view; there is no extra manual `page_view` or SPA route listener. Keep this navigation model if using the present analytics implementation. Converting to client-side routing requires revisiting GA enhanced history measurement to avoid duplicate views. See [Google page-view documentation](https://developers.google.com/analytics/devguides/collection/ga4/views) and [consent implementation](https://developers.google.com/tag-platform/security/guides/consent).

Allowlisted events: `demo_open` (header/hero/footer/download), `demo_tab_change` (overview/exchanges/statistics), `demo_period_change` (day/week/month/all), `download_click` (ios/android), `store_open` (ios/android), `contact_click` (email/telegram). Links for unreleased apps emit `store_open`; released app links emit `download_click`. Neither event proves an installation or purchase. Non-clickable placeholders emit no events. The `action` parameter contains only those allowlisted values. No balances, account identifiers, API keys, typed data or email addresses are sent as event values. Page URLs strip queries/fragments except bounded UTM campaign parameters; referrers have queries/fragments removed. Do not put personal data in campaign tags or public page paths.

Analytics is disabled on local/private hosts, redirect/unknown routes and in development. Report titles stay in English so language hydration cannot split the same page across titles. In-page links scroll without changing history. Unit tests check consent, expiry, revocation, script/config deduplication, URL filtering and event allowlists. They do not confirm delivery to the real Google property.

Before production launch, verify on the deployed HTTPS site with Google Tag Assistant / GA DebugView: decline and confirm no tag requests; accept and confirm one page view; follow Home → Demo → FAQ → Contact and confirm one view per document; switch demo periods/tabs and check each custom event once; revoke via Cookie settings and confirm subsequent actions are not measured. Use a fresh browser profile to test first-visit consent. Check the GA web-stream URL and enhanced-measurement settings in the property, and ensure no second tag is injected by the hosting provider or tag manager. Blockers and refused consent legitimately reduce counts.

The GA4 configuration and iOS companion stream were audited on 6 September 2026. See [analytics.md](analytics.md) for the registered streams, configured reports, native consent behavior and delivery checks.

### Railway: Dockerfile missing from code archive

This error occurs before Docker runs. Verify the service source is `TimofiiShkabrov/AirCapital-ReactNative`, branch `main`, Root Directory `/` (repository root), Dockerfile Path `Dockerfile`. The file is tracked at the repository root since commit `1602f30`. Check whether an explicit `RAILWAY_DOCKERFILE_PATH` overrides the configured path. Deploy the latest commit after correcting the source; redeploying an old snapshot can reuse the same incomplete archive. Changing Nginx or the port cannot fix a missing source file.

Deployment verified on 6 September 2026: correct repository/main selected, `PORT=80` added to match the public domain target. Home, demo, FAQ, contact and health check all return HTTP 200.
