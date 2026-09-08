# AirCapital store screenshots

Approved visual direction: dark navy, mint headlines, the AirCapital icon, and an unbranded device frame. Screens use the real native app component tree with fixed fictional demo data, rendered through React Native Web in an isolated capture fixture. The original approval concept is in `concepts/en/`.

## Deliverables

`exports/<language>/<format>/` contains 310 opaque PNGs for all 31 app languages:

| Format | Pixels | Files per language | Destination |
| --- | --- | --- | --- |
| `apple` | 1242 × 2688 | 3 | App Store, iPhone 6.5-inch |
| `tablet` | 2064 × 2752 | 3 | App Store, iPad 13-inch |
| `play` | 1080 × 1920 | 3 | Google Play, phone screenshots |
| `feature` | 1024 × 500 | 1 | Google Play, feature graphic |

Order: `01-overview.png`, `02-exchanges.png`, `03-statistics.png`. All files are below 8 MB. Captions are editable in `captions.json`; reviewable localized copy is also in `../texts/<language>/screenshots.md`.

The tablet exports use the responsive app layout: overview and exchanges in adjacent columns, an exchange grid, and statistics in two columns. Include these app changes in the next submitted native build so screenshots match the released interface.

## Saved store drafts — 7 September 2026

- App Store: 22 localizations, each with 3 iPhone and 3 iPad screenshots. All 66 iPad screenshots were replaced after the responsive layout change. Saved files and their order were checked after reloading App Store Connect.
- Google Play: 28 localizations, each with 3 ordered phone screenshots and one localized feature graphic. The shared app icon is also present. Saved image URLs were checked after reloading the listing editor.
- Languages without a corresponding store localization remain available as local exports. Store locale mappings live under `../texts/`.
- This work saves draft store materials. It does not submit a release for review.

`apple-status.json` and `google-status.json` contain the latest verified store sets. `validation.json` records PNG dimensions, opacity and sizes. JSONL files retain rendering, upload and verification history.

## Reproduce

From the project root, after installing the normal app dependencies:

```sh
npm install --prefix tmp/store-render-deps --no-save --package-lock=false html-to-image@1.11.13
node marketing/screenshots/prepare-capture.mjs
cd tmp/store-capture
npx expo export --platform web --output-dir dist
cd ../..
node marketing/screenshots/serve.mjs
```

Open `http://127.0.0.1:8098/studio`. Use **Export current sample** for the English phone cover, **Export tablet sample** for the English tablet cover, **Export tablet images** for all 93 tablet images, or **Export all 31 languages** for all 310 images. Wait for the completion message before uploading the files. Each export overwrites its matching PNG.

The fixture copies the real screen, uses a fixed demo date, and disables analytics. It does not add capture routes to the production website. The local server embeds the app's icon font and exports the complete composition at the exact store resolution. Marketing exports are excluded from Docker and EAS build contexts.

After uploading to Apple, wait for server processing before checking the order: the initial local previews may differ from the saved order. In Google Play, select the three localized screenshots in the desired order and save the listing as a draft.
