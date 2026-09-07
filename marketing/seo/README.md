# AirCapital: multilingual search setup

English uses the existing root URLs. Each of the other 30 app languages has its own home, demo, FAQ and contact page. The URL determines the website language; switching languages navigates to the equivalent page. Native device-language detection is unchanged.

## Implemented

- 124 statically rendered marketing/demo pages. Their translated content, title and description are available before JavaScript runs.
- Self-referencing HTTPS canonicals, reciprocal hreflang for all 31 languages, and English x-default.
- An XML sitemap with 129 canonical URLs: 124 translated pages and five English legal documents. Legal documents do not claim nonexistent translations.
- Crawlable language links, localized navigation, HTML language attributes and right-to-left Arabic layout.
- WebSite, WebPage and BreadcrumbList JSON-LD. No invented ratings, reviews or purchase availability.
- A branded 1200 × 630 social card, favicon, Open Graph and Twitter metadata. Social previews and Google search snippets are different features.
- Localized analytics routes retain the actual page URL. Consent remains required; private/local previews do not send analytics.
- Permanent redirects for English aliases, trailing slashes and HTML extensions; unknown routes return HTTP 404 with noindex.
- Every Railway build validates all translated pages and generates sitemap.xml and robots.txt automatically.

## Source files

SEO text: src/web/seo-copy.json. Visible page translations: src/web/copy/*.json. Metadata: src/web/Seo.tsx. Routes: src/web/routes.ts. Build validation: scripts/export-seo.mjs. Nginx rules: deploy/nginx.conf.template.

Run npm run build:web, npx tsc --noEmit and npx vitest run src/web. The export check validates canonical URLs, every language alternative, translated descriptions and headings, JSON-LD, one H1, one title, and the 404 page.

## After app publication

Enable EXPO_PUBLIC_IOS_RELEASED=true and/or EXPO_PUBLIC_ANDROID_RELEASED=true in Railway only after the corresponding store page is public, then rebuild. The existing analytics distinguishes store_open for upcoming apps from download_click for released apps. These are website clicks, not verified paid purchases; purchase totals come from the stores.

Review Google Search Console impressions, clicks, indexed pages and Core Web Vitals after data becomes available. Update copy based on relevant search queries and real product changes. Do not mass-generate near-identical keyword pages, buy backlinks or fabricate reviews. Structured data does not guarantee a rich result; Google can rewrite titles and descriptions.

## Official references

- [Google: managing multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: hreflang and localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: site names](https://developers.google.com/search/docs/appearance/site-names)
- [Expo: static rendering](https://docs.expo.dev/router/web/static-rendering/)
