import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  root: '.',
  plugins: [{
    name: 'static-site-metadata',
    closeBundle() {
      for (const file of ['CNAME', 'robots.txt', 'sitemap.xml']) copyFileSync(file, `dist/${file}`)
      copyFileSync('vendor/THREE-LICENSE.txt', 'dist/THREE-LICENSE.txt')
    },
  }],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: false,
  },
})
