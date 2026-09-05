import test from 'node:test';
import assert from 'node:assert/strict';
import { createClickWaves } from '../src/click-waves.js';

test('a rapid burst retains every wave until its own lifetime ends', () => {
  const waves = createClickWaves();
  for (let i = 0; i < 50; i++) waves.emit(i % 5 * 0.4, i % 3 * 0.3, i * 0.05);
  waves.advance(2.5);
  assert.equal(waves.count, 50);
  waves.advance(3.21);
  assert.equal(waves.count, 49);
  waves.advance(5.7);
  assert.equal(waves.count, 0);
});

test('later clicks leave the earlier wave at its original radius and phase', () => {
  const sequence = createClickWaves();
  const reference = createClickWaves();
  sequence.emit(0, 0, 0); reference.emit(0, 0, 0);
  for (let i = 1; i <= 12; i++) sequence.emit(-2, -2, i * 0.07);
  sequence.advance(1); reference.advance(1);
  const olderWave = reference.sample(1.8, 0);
  const combined = sequence.sample(1.8, 0);
  assert.ok(olderWave.height > 0.2);
  assert.ok(Math.abs(combined.height - olderWave.height) < 1e-8);
  assert.ok(Math.abs(combined.light - olderWave.light) < 1e-8);
});

test('overlapping waves add both displacement and highlight', () => {
  const a = createClickWaves(), b = createClickWaves(), both = createClickWaves();
  a.emit(0, 0, 0); b.emit(1, 0, 0.45);
  both.emit(0, 0, 0); both.emit(1, 0, 0.45);
  for (const field of [a, b, both]) field.advance(0.7);
  const p = a.sample(0.8, 0.3), q = b.sample(0.8, 0.3), r = both.sample(0.8, 0.3);
  assert.ok(p.light > 0 && q.light > 0);
  assert.ok(Math.abs(r.height - (p.height + q.height)) < 1e-8);
  assert.ok(Math.abs(r.light - (p.light + q.light)) < 1e-8);
});

test('repeated clicks on one point stay shallow without evicting waves', () => {
  const waves = createClickWaves();
  for (let i = 0; i < 50; i++) waves.emit(0, 0, 0);
  waves.advance(0.5);
  assert.equal(waves.count, 50);
  assert.ok(Math.abs(waves.sample(0.9, 0).height) <= 0.8);
});
