import test from 'node:test';
import assert from 'node:assert/strict';
import { createRippleField } from '../src/ripple-field.js';

test('a local disturbance travels outward after the pointer stops', () => {
  const field = createRippleField();
  field.disturb(0, 0);
  assert.ok(Math.abs(field.sample(0.9, 0).height) < 0.00001);
  for (let i = 0; i < 50; i++) field.advance(1 / 120);
  assert.ok(Math.abs(field.sample(0.9, 0).height) > 0.001);
});

test('rapid overlapping strokes stay bounded and eventually settle', () => {
  const field = createRippleField();
  for (let i = 0; i < 180; i++) {
    field.disturb(Math.sin(i * 0.1) * 1.7, Math.cos(i * 0.13), -0.16);
    field.advance(1 / 60);
    const value = field.sample(0.3, 0.4);
    assert.ok(Number.isFinite(value.height) && Math.abs(value.height) < 0.5);
  }
  for (let i = 0; i < 1800; i++) field.advance(1 / 120);
  assert.equal(field.active, false);
  assert.equal(field.sample(0.3, 0.4).height, 0);
});

test('wave speed is independent of the display frame rate', () => {
  const a = createRippleField(), b = createRippleField();
  a.disturb(0, 0); b.disturb(0, 0);
  for (let i = 0; i < 60; i++) a.advance(1 / 60);
  for (let i = 0; i < 120; i++) b.advance(1 / 120);
  assert.ok(Math.abs(a.sample(1.2, 0.2).height - b.sample(1.2, 0.2).height) < 0.00001);
});
