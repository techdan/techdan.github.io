// Renders scripts/social-preview.html to assets/social-preview.png (1200×630) with headless Chrome.
// Usage: npm run social-preview   (set CHROME_PATH if Chrome or Edge is installed elsewhere)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, join, resolve } from 'node:path';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(root) || !(await stat(path).catch(() => null))?.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(await readFile(path));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));

const candidates = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
const chrome = candidates.find(p => p && existsSync(p));
// A throwaway profile keeps headless Chrome separate from any browser the user has open.
const profile = mkdtempSync(join(tmpdir(), 'social-preview-'));
try {
  if (!chrome) throw new Error('No Chrome or Edge found; set CHROME_PATH.');
  // Async on purpose: a synchronous call would block this process's server and Chrome's page load would abort.
  await promisify(execFile)(chrome, ['--headless=new', `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630',
    '--virtual-time-budget=8000', `--screenshot=${join(root, 'assets/social-preview.png')}`,
    `http://127.0.0.1:${server.address().port}/scripts/social-preview.html`]);
  console.log('Wrote assets/social-preview.png');
} finally {
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
