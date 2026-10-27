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

## Deploy (GitHub Pages)

1. Push to `main`.
2. In the repo go to **Settings → Pages → Source → GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes the site automatically.

`vite.config.js` uses `base: './'`, so images load correctly under `https://<user>.github.io/<repo>/`.
