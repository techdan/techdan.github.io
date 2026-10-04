import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as Three from '../vendor/three.module.min.js';

// Exercise the real scene geometry and lifecycle without requiring a GPU.
const models = (await readFile(new URL('../src/hero-concepts.js', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replaceAll('export ', '');
const lifecycle = (await readFile(new URL('../src/hero-scene.js', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replaceAll('export ', '')
  .replaceAll('import.meta.url', JSON.stringify(new URL('../hero-scene.js', import.meta.url).href));

class Element extends EventTarget {
  constructor() {
    super(); this.hidden = true; this.attributes = {}; this.dataset = {}; this.children = [];
    const classes = new Set();
    this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value), toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value) };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(child) { this.children.push(child); }
  remove() {}
  getBoundingClientRect() { return { width: 600, height: 440, left: 0, top: 0 }; }
}

function harness({ reduced = false, unavailable = false } = {}) {
  const nodes = Object.fromEntries(['.concept-picker', '.motion-toggle', '#hero-art-fallback', '#concept-description', '#concept-hint', '#concept-annotation', '.hero-art-status', '#concept-kicker', '#concept-number'].map(key => [key, new Element()]));
  const figure = new Element();
  figure.querySelector = selector => nodes[selector];
  const host = new Element();
  host.closest = () => figure;
  const choices = ['tide', 'bloom', 'well'].map(name => { const node = new Element(); node.dataset.concept = name; return node; });
  nodes['.concept-picker'].querySelectorAll = () => choices;
  nodes['.motion-toggle'].firstElementChild = new Element();
  const media = new Element(); media.matches = reduced;
  const document = new Element(); document.hidden = false;
  document.createElement = () => ({ getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) });
  const frames = new Map();
  let frameId = 0, milliseconds = 0, renders = 0, lastScene, observer, renderer;
  class Renderer {
    constructor() { if (unavailable) throw new Error('WebGL unavailable'); this.domElement = new Element(); renderer = this; }
    setPixelRatio() {} setClearColor() {} setSize() {} dispose() {}
    render(scene) { renders++; lastScene = scene; }
  }
  const context = vm.createContext({
    THREE: { ...Three, WebGLRenderer: Renderer }, document, URL, AbortController,
    window: { devicePixelRatio: 1, innerWidth: 1264, matchMedia: query => query.includes('reduced-motion') ? media : { matches: true } },
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; }, cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { constructor(callback) { observer = callback; } observe() {} disconnect() {} },
  });
  vm.runInContext(models + '\n' + lifecycle, context);
  const dispose = context.mountHero(host);
  const step = () => { const callbacks = [...frames.values()]; frames.clear(); milliseconds += 16; callbacks.forEach(callback => callback(milliseconds)); };
  const click = node => node.dispatchEvent(new Event('click'));
  return { nodes, host, choices, figure, document, media, frames, dispose, step, click, renderer: () => renderer, scene: () => lastScene, renders: () => renders, visibility: value => observer([{ isIntersecting: value }]) };
}

test('reduced motion places a still signal without starting an animation loop', () => {
  const h = harness({ reduced: true });
  h.step();
  assert.equal(h.frames.size, 0);
  assert.equal(h.nodes['.motion-toggle'].hidden, true);
  h.click(h.host); h.step();
  assert.match(h.nodes['.hero-art-status'].textContent, /still signal/);
  assert.equal(h.frames.size, 0);
  assert.equal(h.renders(), 2);
  h.dispose();
});

test('offscreen and background scenes stop rendering and resume when visible', () => {
  const h = harness(); h.step();
  assert.equal(h.frames.size, 1);
  h.visibility(false);
  assert.equal(h.frames.size, 0);
  h.visibility(true); h.step();
  assert.equal(h.frames.size, 1);
  h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.frames.size, 0);
  h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange')); h.step();
  assert.equal(h.frames.size, 1);
  h.click(h.nodes['.motion-toggle']); h.step();
  assert.equal(h.frames.size, 0);
  h.dispose();
});

test('switching concepts disposes previous GPU resources and resets the reveal', () => {
  const h = harness({ reduced: true }); h.step();
  const geometries = new Set(), materials = new Set();
  h.scene().traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
  let disposed = 0;
  [...geometries, ...materials].forEach(resource => resource.addEventListener('dispose', () => disposed++));
  h.click(h.host); h.step();
  h.click(h.choices[1]); h.step();
  assert.equal(disposed, geometries.size + materials.size);
  assert.equal(h.figure.dataset.concept, 'bloom');
  assert.equal(h.host.attributes['aria-label'], 'Scatter the signal bloom particles');
  h.click(h.choices[2]); h.step();
  assert.equal(h.figure.dataset.concept, 'well');
  assert.match(h.nodes['#hero-art-fallback'].src, /particle-fallback\.svg$/);
  h.dispose();
  assert.equal(h.frames.size, 0);
});

test('WebGL failure retains the fallback and exposes no nonfunctional controls', () => {
  const h = harness({ unavailable: true });
  assert.equal(h.host.hidden, true);
  assert.equal(h.nodes['.concept-picker'].hidden, true);
  assert.equal(h.figure.classList.contains('is-live'), false);
  assert.equal(h.frames.size, 0);
});

test('context loss shows the current fallback and restoration re-enables the scene', () => {
  const h = harness(); h.step();
  h.renderer().domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  assert.equal(h.host.hidden, true);
  assert.equal(h.figure.classList.contains('is-live'), false);
  assert.equal(h.frames.size, 0);
  h.renderer().domElement.dispatchEvent(new Event('webglcontextrestored')); h.step();
  assert.equal(h.host.hidden, false);
  assert.equal(h.figure.classList.contains('is-live'), true);
  assert.ok(h.renders() > 1);
  h.dispose();
});

test('a burst of click ripples stays bounded and finishes while idle motion is paused', () => {
  const h = harness(); h.step();
  h.click(h.nodes['.motion-toggle']); h.step();
  assert.equal(h.frames.size, 0);
  for (let i = 0; i < 30; i++) { h.click(h.host); h.step(); }
  let uniforms;
  h.scene().traverse(object => { if (object.material?.uniforms) uniforms = object.material.uniforms; });
  assert.equal(uniforms.uImpulses.value.length, 8);
  assert.ok(uniforms.uImpulses.value.every(pulse => pulse.toArray().every(Number.isFinite)));
  assert.equal(h.frames.size, 1);
  for (let i = 0; i < 340; i++) h.step();
  assert.equal(h.frames.size, 0);
  assert.equal(h.host.children.length, 1);
  h.dispose();
});

test('changing motion preferences clears disturbances and preserves a manual pause', () => {
  const h = harness(); h.step();
  h.click(h.nodes['.motion-toggle']); h.click(h.host); h.step();
  h.media.matches = true; h.media.dispatchEvent(new Event('change')); h.step();
  assert.equal(h.frames.size, 0);
  assert.equal(h.nodes['.motion-toggle'].hidden, true);
  h.media.matches = false; h.media.dispatchEvent(new Event('change')); h.step();
  assert.equal(h.nodes['.motion-toggle'].attributes['aria-label'], 'Play automatic motion');
  assert.equal(h.frames.size, 0);
  h.dispose();
});
