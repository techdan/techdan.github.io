import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/style.css', '-o', 'style.css', '--minify'], { stdio: 'inherit' });
for (const file of ['main.js', 'site.js', 'contact.js', 'hero-scene.js', 'hero-concepts.js', 'topology.js', 'ripple-field.js', 'click-waves.js']) await copyFile(`src/${file}`, file);
await import('./build-pages.mjs');
await mkdir('assets', { recursive: true });
// A deterministic terrain illustration survives JavaScript or WebGL failures.
const heightAt = (x, y) => 0.68 * Math.sin(x * 1.45) * Math.cos(y * 1.08) + 0.23 * Math.sin(y * 2.8 + x * 0.7);
function point(x, y) {
  const z = heightAt(x, y), a = -0.31;
  const rx = x * Math.cos(a) - y * Math.sin(a);
  const ry = x * Math.sin(a) + y * Math.cos(a);
  const sy = ry * Math.cos(-1.02) - z * Math.sin(-1.02);
  return `${(520 + rx * 126).toFixed(1)},${(395 - sy * 126).toFixed(1)}`;
}
const paths = [];
for (let i = 0; i <= 46; i++) {
  const x = -2.9 + (i / 46) * 5.8;
  paths.push(`<polyline points="${Array.from({length: 53}, (_,j) => point(x, -2.4 + j / 52 * 4.8)).join(' ')}"/>`);
}
for (let j = 0; j <= 40; j++) {
  const y = -2.4 + (j / 40) * 4.8;
  paths.push(`<polyline points="${Array.from({length: 65}, (_,i) => point(-2.9 + i / 64 * 5.8, y)).join(' ')}"/>`);
}
const scan = Array.from({length: 151}, (_, i) => point(-2.9 + i / 150 * 5.8, 0.65)).join(' ');
await writeFile('assets/topology-fallback.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760"><g fill="none" stroke="#6998b0" stroke-width="0.65" opacity="0.35">${paths.join('')}</g><polyline points="${scan}" fill="none" stroke="#e6edb6" stroke-width="1.3"/></svg>\n`);
console.log('Static site built: CSS, contact, topology, and fallback graphic.');

// A self-hosted particle illustration survives disabled JavaScript and WebGL loss.
let particleSeed = 7219;
const particleRandom = () => { particleSeed = (Math.imul(particleSeed, 1664525) + 1013904223) >>> 0; return particleSeed / 4294967296; };
const particleDots = [];
for (let i = 0; i < 3200; i++) {
  const x = (particleRandom() - .5) * 8.5, z = (particleRandom() - .5) * 5.7;
  const y = Math.sin(x + z * .7) * .46 + Math.sin(x * .48 - z * 1.26) * .38 + Math.sin(x * 1.63 + z * .31) * .18 + .65 * Math.exp(-Math.pow(z + Math.sin(x * .65) * 1.4, 2) * 1.7);
  const ry = y * Math.cos(.49) + z * Math.sin(.49), rz = -y * Math.sin(.49) + z * Math.cos(.49);
  const rx = x * Math.cos(-.12) + ry * Math.sin(-.12), yy = -x * Math.sin(-.12) + ry * Math.cos(-.12);
  const scale = 92 * 8.8 / (8.8 - rz);
  const light = Math.max(0, Math.min(1, (y + .5) / 1.6));
  const color = light > .82 ? '#d6eabc' : light > .6 ? '#91e4df' : z > 0 ? '#697bd1' : '#43abbf';
  const opacity = (.2 + light * .5) * Math.min(1, (4.25 - Math.abs(x)) * 2, (2.85 - Math.abs(z)) * 2);
  particleDots.push(`<circle cx="${(500 + rx * scale).toFixed(1)}" cy="${(320 - yy * scale).toFixed(1)}" r="${(.45 + particleRandom() * .8).toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
}
await writeFile('assets/particle-fallback.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 640">${particleDots.join('')}</svg>\n`);
