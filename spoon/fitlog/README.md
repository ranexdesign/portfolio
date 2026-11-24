# SPOON – private calorie & training tracker (PWA)

Inspired by OpenNutriTracker. No account, no ads, no tracking. All data stays on your device (browser storage).

## Features
- New look: week strip, calorie ring, macro rings, meal cards, recently logged list, statistics chart
- Daily calorie goal from age, sex, height, weight, activity and goal (Mifflin–St Jeor), plus BMI
- Food diary by meal (Breakfast / Lunch / Dinner / Snack) with calorie ring and protein/carb/fat bars
- Food search + barcode number lookup via Open Food Facts, quick-add, recent foods
- Optional AI meal assistant: type "2 rotis and dal", get calories and macros (your own Anthropic API key)
- Training: cardio/activity with estimated burn (added to your daily goal) and a lifting log with sets, reps, kg, volume and best weight
- Water tracker, 7-day trends, streak, weight chart
- JSON backup/restore and CSV export, works offline, dark mode

## Put it on your iPhone
iPhones can only install web apps from a **https** link, so host these files first (all free):
1. **Netlify Drop**: go to app.netlify.com/drop and drag this whole folder in. You get an https link.
   (Or GitHub Pages / Cloudflare Pages: upload the files to a repo and enable Pages.)
2. Open the link in **Safari** on your iPhone.
3. Tap **Share → Add to Home Screen**. It now opens full screen like an app.

To test on a computer: `python3 -m http.server 8000` in this folder, then open http://localhost:8000

## AI meal assistant (optional)
Profile → AI meal assistant → paste an API key from console.anthropic.com. Use a key with a small spend limit, since it is stored in your browser. Default model: `claude-haiku-5-5`. Without a key, everything else still works.

## Notes
- Data lives in Safari storage for that site. Clearing website data erases it, so use Export JSON regularly.
- Open Food Facts mostly covers packaged foods. For home-cooked food use Quick add or AI.
- Calorie numbers are estimates and this is not medical advice.

## Files
index.html, style.css, app.js (all logic), sw.js (offline), manifest.webmanifest, icon files.
