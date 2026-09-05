import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/style.css', '-o', 'style.css', '--minify'], { stdio: 'inherit' });
for (const file of ['main.js', 'contact.js', 'topology.js', 'ripple-field.js', 'click-waves.js']) await copyFile(`src/${file}`, file);
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
