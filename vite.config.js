import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths so it works on GitHub Pages under /<repo-name>/
  server: {
    port: 3000,
    host: true,
  },
});
