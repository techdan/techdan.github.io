import { copyFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/style.css', '-o', 'style.css', '--minify'], { stdio: 'inherit' });
for (const file of ['main.js', 'site.js', 'contact.js', 'lens.js']) await copyFile(`src/${file}`, file);
await import('./build-pages.mjs');
// Self-hosted fonts (no third-party font requests), copied from @fontsource packages.
await mkdir('assets/fonts', { recursive: true });
const fonts = [
  ['@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2', 'newsreader-opsz.woff2'],
  ['@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2', 'newsreader-opsz-italic.woff2'],
  ['@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2', 'public-sans.woff2'],
  ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', 'ibm-plex-mono-400.woff2'],
  ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'ibm-plex-mono-500.woff2'],
  ['@fontsource-variable/newsreader/LICENSE', 'Newsreader-OFL.txt'],
  ['@fontsource-variable/public-sans/LICENSE', 'Public-Sans-OFL.txt'],
  ['@fontsource/ibm-plex-mono/LICENSE', 'IBM-Plex-Mono-OFL.txt'],
];
for (const [from, to] of fonts) await copyFile(`node_modules/${from}`, `assets/fonts/${to}`);
console.log('Static site built: CSS, scripts, pages, and fonts.');
