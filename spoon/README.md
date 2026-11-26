# SPOON – private calorie & training tracker (PWA)

No account, no ads, no tracking. All data stays on your device (browser storage).

## Features
- New look: week strip, calorie ring, macro rings, meal cards, recently logged list, statistics chart
- Daily calorie goal from age, sex, height, weight, activity and goal (Mifflin–St Jeor), plus BMI
- Food diary by meal (Breakfast / Lunch / Dinner / Snack) with calorie ring and protein/carb/fat bars
- Food search + barcode number lookup, quick-add, recent foods (kept for 24 hours)
- Customisable Home: switch each Home card on or off in Profile → Home widgets
- Optional AI meal assistant: type "2 rotis and dal" or snap a photo of your plate, get calories and macros (free Google Gemini or Groq key, or paid Anthropic)
- Training: cardio/activity with estimated burn (added to your daily goal) and a lifting log with sets, reps, kg, volume and best weight
- Water tracker, 7-day trends, streak, weight chart
- Export your diary to Google Sheets (copy + paste), PDF or CSV, works offline, dark mode

## Put it on your iPhone
iPhones can only install web apps from a **https** link, so host these files first (all free):
1. **Netlify Drop**: go to app.netlify.com/drop and drag this whole folder in. You get an https link.
   (Or GitHub Pages / Cloudflare Pages: upload the files to a repo and enable Pages.)
2. Open the link in **Safari** on your iPhone.
3. Tap **Share → Add to Home Screen**. It now opens full screen like an app.

To test on a computer: `python3 -m http.server 8000` in this folder, then open http://localhost:8000

## AI meal assistant (optional, free)
Profile → AI meal assistant → choose a provider and paste its key:
- **Google Gemini (free tier)**: create a key at aistudio.google.com/apikey. Default model `gemini-flash-lite-latest`.
- **Groq (free tier)**: create a key at console.groq.com/keys. Default model `qwen/qwen3.6-27b` (reads photos too).
- **Anthropic Claude (paid)**: key from console.anthropic.com. Default model `claude-haiku-5-5`.

Leave the model field empty to use the default. Free tiers have daily request limits and may use prompts to improve their products. Without a key, everything else still works.

## Notes
- Data lives in Safari storage for that site. Clearing website data erases it, so export to Google Sheets or PDF now and then.
- Search mostly covers packaged foods. For home-cooked food use Quick add or AI.
- Calorie numbers are estimates and this is not medical advice.

## Files
index.html, style.css, app.js (all logic), sw.js (offline), manifest.webmanifest, icon files.

## Credits
- Food data: [Open Food Facts](https://world.openfoodfacts.org) (ODbL).
- Font: Inter, SIL Open Font License 1.1 (see INTER-LICENSE.txt). Type sizes follow the Material 3 type scale.
- Icons: Material Symbols (Outlined), Apache-2.0, inlined as SVG paths in app.js.
- Inspired by OpenNutriTracker.
