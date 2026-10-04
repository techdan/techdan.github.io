import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'

export default defineConfig({
  root: '.',
  plugins: [{
    name: 'static-site-metadata',
    writeBundle() {
      mkdirSync('dist/assets/fonts', { recursive: true })
      for (const file of ['robots.txt', 'sitemap.xml', 'site-config.json', 'favicon.ico', 'apple-touch-icon.png']) copyFileSync(file, `dist/${file}`)
      copyFileSync('assets/social-preview.png', 'dist/assets/social-preview.png')
      for (const file of ['Newsreader-OFL.txt', 'Public-Sans-OFL.txt', 'IBM-Plex-Mono-OFL.txt']) copyFileSync(`assets/fonts/${file}`, `dist/assets/fonts/${file}`)
    },
  }],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: { input: ['index.html', '404.html', 'thank-you.html', 'privacy.html', 'terms.html'] },
  },
  server: {
    port: 3000,
    open: false,
  },
})
