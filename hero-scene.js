import * as THREE from './vendor/three.module.min.js';
import { concepts, createParticleStudy } from './hero-concepts.js';

export function mountHero(host) {
  if (!host) return;
  const figure = host.closest('figure');
  const picker = figure.querySelector('.concept-picker');
  const choices = [...picker.querySelectorAll('button')];
  const motionButton = figure.querySelector('.motion-toggle');
  const fallback = figure.querySelector('#hero-art-fallback');
  const description = figure.querySelector('#concept-description');
  const hint = figure.querySelector('#concept-hint');
  const status = figure.querySelector('.hero-art-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const fallbackSource = new URL('./assets/particle-fallback.svg', import.meta.url).href;
  const abort = new AbortController();
  const listen = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal: abort.signal });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
  camera.position.set(0, 0, 8.8);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { return; }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.25 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x081b2b, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const pivot = new THREE.Group();
  scene.add(pivot);
  let current;
  let currentName;
  let time = 0, clock = 0, lastTime = 0, frame = 0;
  let visible = true, lost = false, manualPause = false;
  let hover = 0, hoverTarget = 0, held = 0, heldTarget = 0;
  let impulseIndex = 0, activeUntil = 0, lastTrail = -1;
  let pointerDown = null;
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const tilt = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();

  function disposeCurrent() {
    if (!current) return;
    pivot.remove(current.group);
    const geometries = new Set();
    current.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) object.material.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
  }
  function updateMotionButton() {
    motionButton.setAttribute('aria-label', manualPause ? 'Play automatic motion' : 'Pause automatic motion');
    motionButton.firstElementChild.textContent = manualPause ? '▷' : 'Ⅱ';
    motionButton.hidden = lost || reducedMotion.matches;
  }
  function resetInteraction() {
    pointerDown = null;
    held = heldTarget = hover = hoverTarget = 0;
    activeUntil = 0;
    current.uniforms.uStatic.value = 0;
    current.uniforms.uImpulses.value.forEach(impulse => impulse.set(0, 0, -100, 0));
    tiltTarget.set(0, 0);
  }
  function choose(name, announce = true) {
    if (!concepts[name] || name === currentName) return;
    disposeCurrent();
    currentName = name;
    const concept = concepts[name];
    current = createParticleStudy(concept.mode, { compact: window.innerWidth < 800, pixelRatio });
    current.uniforms.uDistance.value = camera.position.z;
    pivot.add(current.group);
    time = 0;
    resetInteraction();
    pointer.set(0, 0); pointerTarget.set(0, 0); tilt.set(0, 0);
    figure.dataset.concept = name;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.concept === name)));
    figure.querySelector('#concept-kicker').textContent = concept.kicker;
    figure.querySelector('#concept-number').textContent = 'STUDY ' + concept.number;
    figure.querySelector('#concept-annotation').textContent = concept.annotation;
    description.textContent = concept.description;
    setHint();
    fallback.src = fallbackSource;
    host.setAttribute('aria-label', concept.action);
    if (announce) status.textContent = concept.title + '. ' + concept.description;
    wake();
  }
  function setHint() {
    const concept = concepts[currentName];
    hint.textContent = reducedMotion.matches ? 'Click, tap, or press Enter to place a still signal' : finePointer.matches ? concept.hint : 'Touch to gather · Release to send a wave';
  }
  function tick(milliseconds) {
    frame = 0;
    if (lost || !visible || document.hidden) return;
    const dt = Math.min(lastTime ? (milliseconds - lastTime) / 1000 : 1 / 60, .05);
    lastTime = milliseconds;
    const animated = !reducedMotion.matches;
    if (animated) clock += dt;
    if (animated && !manualPause) time += dt;
    const ease = animated ? 1 - Math.exp(-dt * 8) : 1;
    pointer.lerp(pointerTarget, ease);
    tilt.lerp(tiltTarget, ease * .5);
    hover += (hoverTarget - hover) * ease;
    held += (heldTarget - held) * ease;
    pivot.rotation.set(tilt.y * .04, tilt.x * .05, 0);
    const uniforms = current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uClock.value = clock;
    uniforms.uPointer.value.copy(pointer);
    uniforms.uHover.value = animated ? hover : 0;
    uniforms.uHeld.value = animated ? held : 0;
    renderer.render(scene, camera);
    const settling = pointer.distanceTo(pointerTarget) > .001 || tilt.distanceTo(tiltTarget) > .001 || Math.abs(hover - hoverTarget) > .001 || Math.abs(held - heldTarget) > .001;
    if (animated && (!manualPause || clock < activeUntil || settling)) frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && !lost && visible && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(tick); }
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function resize() {
    if (lost) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Preserve the full composition on portrait screens.
    camera.position.z = camera.aspect < 1.25 ? 8.8 * 1.25 / camera.aspect : 8.8;
    current.uniforms.uDistance.value = camera.position.z;
    camera.updateProjectionMatrix();
    wake();
  }
  function locate(event) {
    const rect = host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = 1 - (event.clientY - rect.top) / rect.height * 2;
    const halfHeight = Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
    pointerTarget.set(x * halfHeight * camera.aspect, y * halfHeight);
    tiltTarget.set(x, -y);
  }
  function impulse(strength = 1) {
    if (reducedMotion.matches) current.uniforms.uStatic.value = 1;
    else {
      current.uniforms.uImpulses.value[impulseIndex].set(pointerTarget.x, pointerTarget.y, clock, strength);
      impulseIndex = (impulseIndex + 1) % 8;
      activeUntil = clock + 5;
    }
    wake();
  }

  listen(host, 'pointermove', event => {
    if (reducedMotion.matches) return;
    if (event.pointerType === 'touch' && !pointerDown) return;
    const previous = pointerTarget.clone();
    locate(event);
    hoverTarget = 1;
    if (clock - lastTrail > .12 && previous.distanceTo(pointerTarget) > .07 && !heldTarget) { impulse(.2); lastTrail = clock; }
    wake();
  });
  listen(host, 'pointerleave', () => { hoverTarget = heldTarget = 0; pointerDown = null; tiltTarget.set(0, 0); wake(); });
  listen(host, 'pointerdown', event => {
    if (event.button !== 0) return;
    pointerDown = { x: event.clientX, y: event.clientY };
    locate(event);
    hoverTarget = heldTarget = 1;
    wake();
  });
  listen(host, 'pointerup', () => { heldTarget = 0; wake(); });
  listen(host, 'pointercancel', () => { pointerDown = null; heldTarget = hoverTarget = 0; wake(); });
  listen(host, 'click', event => {
    const moved = pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 12;
    pointerDown = null; heldTarget = 0;
    if (moved && !finePointer.matches) return;
    if (!event.detail) { pointerTarget.set(0, 0); pointer.copy(pointerTarget); }
    else locate(event);
    impulse(1.35);
    status.textContent = reducedMotion.matches ? 'A still signal marks the selected point.' : concepts[currentName].status;
  });
  listen(host, 'keydown', event => {
    if (event.key === 'Escape') { resetInteraction(); status.textContent = 'The particle field has been reset.'; wake(); }
  });
  choices.forEach(button => listen(button, 'click', () => choose(button.dataset.concept)));
  listen(motionButton, 'click', () => { manualPause = !manualPause; updateMotionButton(); wake(); });
  listen(reducedMotion, 'change', () => { resetInteraction(); updateMotionButton(); setHint(); wake(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) { resetInteraction(); stop(); } else wake(); });
  listen(renderer.domElement, 'webglcontextlost', event => {
    event.preventDefault(); lost = true; stop();
    figure.classList.remove('is-live');
    host.hidden = picker.hidden = motionButton.hidden = true;
    hint.textContent = 'Static illustration · Interactive view unavailable';
    status.textContent = 'The interactive view is unavailable. A static particle illustration is shown.';
  });
  listen(renderer.domElement, 'webglcontextrestored', () => {
    lost = false; resetInteraction();
    host.hidden = picker.hidden = false;
    figure.classList.add('is-live');
    updateMotionButton(); setHint(); resize();
  });

  choose('tide', false);
  host.hidden = picker.hidden = false;
  updateMotionButton(); resize();
  figure.classList.add('is-live');
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else { resetInteraction(); stop(); }
  }, { threshold: .02 });
  intersectionObserver.observe(host);
  return () => {
    abort.abort(); stop(); resizeObserver.disconnect(); intersectionObserver.disconnect();
    disposeCurrent(); renderer.dispose(); renderer.domElement.remove();
    host.hidden = picker.hidden = motionButton.hidden = true;
    figure.classList.remove('is-live');
  };
}
