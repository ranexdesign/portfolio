# Karan Saxena — Portfolio

UI/UX & graphic designer portfolio. Static site built with [Vite](https://vitejs.dev/).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # outputs to dist/
npm run preview
```

## Structure

```
.
├── index.html          # the whole site (HTML + CSS + JS)
├── vite.config.js
├── package.json
├── package-lock.json
└── public/
    └── images/         # case study thumbnails (webp)
```

## Deploy

Works on Vercel, Netlify or GitHub Pages — build command `npm run build`, output directory `dist`.
For GitHub Pages under a repo subpath, set `base: '/<repo-name>/'` in `vite.config.js`.
