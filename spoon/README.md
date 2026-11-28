# SPOON – private calorie & training tracker (PWA)

No account, no ads, no tracking. All data stays on your device.

## What's in this version
- **Instant search.** Typing searches your phone first (common foods, your own foods, everything you've looked up before, optional downloaded packs), so results appear as you type, with no Enter key and no spinner. Online results from Open Food Facts are always on as a background top-up with a timeout, retries and clear "offline / unavailable" states. A failed request never empties the screen.
- **Camera + AI.** The camera button in Add food photographs your meal; with your own API key the AI tab estimates calories and macros. Barcode numbers typed in the search box still work.
- **Avatar menu.** Tap the round letter at the top of Home to pick a language (English, Hindi, Spanish; menus and main screens), edit basic details, and see food suggestions that fit what is left of today's calorie goal, for the country you pick (detected automatically at first) with a search box; works even if data/foods.json is missing.
- **Metric and imperial.** kg/cm or lb/ft-in, ml or fl oz, g or oz for food, kcal or kJ. Defaults come from the phone's region (US → imperial, Australia/NZ → kJ). Data is always stored metric, so switching never changes history.
- **Real portions.** About 160 common foods (including Indian dishes) with servings: "2 × 1 roti", "1 cup rice", "1 medium banana". Create your own foods and recipes. Copy yesterday's meal.
- **AI is optional and out of the way.** It only appears (as a "Describe" tab) if you add your own API key under Profile → Advanced.
- **Your data.** JSON backup and restore, Google Sheets, PDF, CSV. Asks the browser for persistent storage.
- **Safer calorie goal:** floor of 1,200 kcal (1,500 for males) with a note, input sanity checks, and a non-binary option for the formula.
- Working offline app shell (the old `sw.js` was empty), accessible dialogs, Escape to close, keyboard support, and `?scan=1` / `?add=1` home-screen shortcuts.

## Put it on your iPhone
iPhones can only install web apps from an **https** link, so host the files first (free):
1. **GitHub Pages (recommended, enables daily food packs):** push this folder to a GitHub repo, then Settings → Pages → Source: **GitHub Actions**. The included workflow deploys the app and rebuilds the food packs every day.
   **Netlify Drop** (app.netlify.com/drop) also works, but without daily packs.
2. Open the link in **Safari**, tap **Share → Add to Home Screen**.

Test on a computer: `python3 -m http.server 8000`, then open http://localhost:8000 (the camera needs https or localhost).

## Daily offline food database
`tools/build-packs.mjs` reads the Open Food Facts daily dump, keeps the most-scanned products per country (20,000 per pack by default) and writes `data/packs/*.json` plus `data/packs.json`. In the app: Profile → Food database → Check → Get. Installed packs refresh automatically when a newer one is published, and scans/search then work with no internet.
- Run it yourself: `node tools/build-packs.mjs data` (Node 18+, downloads about 1 GB).
- Generic foods: edit `tools/foods.txt`, run `python3 tools/build-foods.py`.
- Until the workflow has run once, no packs are listed and the app uses online lookup plus its local cache.

## Why search used to fail
Open Food Facts limits its classic search to 10 requests per minute per IP and says not to use it for search-as-you-type; past that it answers 503. SPOON now searches locally while you type, queries the faster Search-a-licious endpoint only once you pause, caches every product it fetches, and retries with back-off.

## Files
index.html, style.css, app.js (UI and logic), db.js (local search, cache, packs), scan.js (barcode decoder), sw.js (offline), manifest.webmanifest, data/foods.json, tools/, .github/workflows/pages.yml.
`node tools/test-scan.js` runs the decoder tests.

## Notes
- Calorie numbers are estimates and this is not medical advice. Generic food values are rounded typical figures (USDA/IFCT style); mixed dishes are approximate.
- Not translated yet: the interface is English only (dates and numbers follow the device locale).

## Credits
- Food data: [Open Food Facts](https://world.openfoodfacts.org) (ODbL).
- Icons: Material Symbols (Outlined), Apache-2.0. Inspired by OpenNutriTracker.
- Support: https://buymeacoffee.com/ranex
