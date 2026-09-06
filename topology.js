import * as THREE from './vendor/three.module.min.js';
import { createRippleField } from './ripple-field.js';
import { createClickWaves } from './click-waves.js';

export function mountTerrain(host) {
  const figure = host.closest('figure');
  const marker = figure.querySelector('.terrain-evidence');
  const markerTitle = marker.querySelector('strong');
  const markerDetail = marker.querySelector('small');
  const announcement = figure.querySelector('.terrain-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
  camera.position.set(0, 0.2, 9.3);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.25 : 1.5));
  renderer.setClearColor(0x081b2b, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const landscape = new THREE.Group();
  landscape.position.set(0.3, -0.05, 0);
  landscape.rotation.set(-1.02, 0, -0.31);
  scene.add(landscape);
  const baseHeight = (x, y) => 0.68 * Math.sin(x * 1.45) * Math.cos(y * 1.08) + 0.23 * Math.sin(y * 2.8 + x * 0.7);
  const geometry = new THREE.PlaneGeometry(5.8, 4.8, 90, 74);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) positions.setZ(i, baseHeight(positions.getX(i), positions.getY(i)));
  // Pick the resting surface so small waves do not deflect the pointer's path.
  const pickSurface = new THREE.Mesh(geometry.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }));
  landscape.add(pickSurface);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
  landscape.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    vertexColors: true, wireframe: true, transparent: true, opacity: 0.65, depthWrite: false,
  })));
  landscape.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: 0x102d40, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  })));

  const baseColor = new THREE.Color(0x527e9a);
  const waterColor = new THREE.Color(0x9fdcf0);
  const pulseColor = new THREE.Color(0xf2f4b1);
  const contourGeometry = new THREE.BufferGeometry();
  const contourPositions = new Float32Array(160 * 3);
  contourGeometry.setAttribute('position', new THREE.BufferAttribute(contourPositions, 3));
  const contour = new THREE.Line(contourGeometry, new THREE.LineBasicMaterial({ color: 0xdce7ac, transparent: true, opacity: 0.6 }));
  contour.frustumCulled = false;
  landscape.add(contour);

  const beacon = new THREE.Group();
  beacon.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: 0xf2f4b1 })));
  beacon.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({
    color: 0xe0f3b2, transparent: true, opacity: 0.12, depthWrite: false,
  })));
  const beaconRing = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.182, 48), new THREE.MeshBasicMaterial({
    color: 0xe8efb5, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false,
  }));
  beacon.add(beaconRing);
  beacon.visible = false;
  landscape.add(beacon);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const rippleField = createRippleField();
  let lastHover = null;
  const clickWaves = createClickWaves();
  let evidence = null;
  let traceCount = 0;
  let visible = true;
  let lost = false;
  let frame = 0;
  let lastTime = 0;
  let pointerDown = null;
  let expiryTimer = 0;

  function sample(x, y, now) {
    const water = rippleField.sample(x, y);
    const click = clickWaves.sample(x, y);
    const z = baseHeight(x, y) + water.height + click.height;
    return { z, light: click.light, waterLight: Math.min(0.85, Math.abs(water.height) * 11 + Math.abs(water.velocity) * 0.18) };
  }

  function updateSurface(now) {
    for (let i = 0; i < positions.count; i++) {
      const point = sample(positions.getX(i), positions.getY(i), now);
      positions.setZ(i, point.z);
      const cool = point.waterLight;
      const warm = Math.min(1, point.light * 1.5);
      const offset = i * 3;
      colors[offset] = THREE.MathUtils.lerp(THREE.MathUtils.lerp(baseColor.r, waterColor.r, cool), pulseColor.r, warm);
      colors[offset + 1] = THREE.MathUtils.lerp(THREE.MathUtils.lerp(baseColor.g, waterColor.g, cool), pulseColor.g, warm);
      colors[offset + 2] = THREE.MathUtils.lerp(THREE.MathUtils.lerp(baseColor.b, waterColor.b, cool), pulseColor.b, warm);
    }
    positions.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    for (let i = 0; i < 160; i++) {
      const x = -2.9 + i / 159 * 5.8;
      contourPositions[i * 3] = x;
      contourPositions[i * 3 + 1] = 0.65;
      contourPositions[i * 3 + 2] = sample(x, 0.65, now).z + 0.025;
    }
    contourGeometry.attributes.position.needsUpdate = true;

  }

  function updateEvidence(now) {
    if (!evidence) return;
    const age = now - evidence.started;
    if (age >= 5.5) {
      evidence = null;
      beacon.visible = false;
      marker.hidden = true;
      return;
    }
    const { x, y } = evidence;
    beacon.position.set(x, y, sample(x, y, now).z + 0.13);
    beacon.scale.setScalar(reducedMotion.matches ? 1 : 1 + Math.exp(-age * 2) * Math.sin(age * 9) * 0.4);
    beaconRing.rotation.z = age * 0.3;
    beacon.visible = true;
    landscape.updateMatrixWorld(true);
    projected.copy(beacon.position);
    landscape.localToWorld(projected);
    projected.project(camera);
    const width = host.clientWidth;
    const height = host.clientHeight;
    const screenX = (projected.x * 0.5 + 0.5) * width;
    const screenY = (-projected.y * 0.5 + 0.5) * height;
    // Keep the card on the visible side of its actual projected anchor.
    marker.classList.toggle('label-left', screenX > width - 205);
    marker.classList.toggle('label-below', screenY < 100);
    marker.style.left = screenX + 'px';
    marker.style.top = screenY + 'px';
    marker.style.opacity = String(Math.min(1, (5.5 - age) * 2));
    marker.hidden = screenX < 10 || screenX > width - 10 || screenY < 10 || screenY > height - 10;
  }

  function draw(now) {
    clickWaves.advance(now);
    updateSurface(now);
    updateEvidence(now);
    renderer.render(scene, camera);
  }

  function tick(milliseconds) {
    frame = 0;
    if (lost || !visible || document.hidden) return;
    const now = milliseconds / 1000;
    const delta = Math.min(lastTime ? now - lastTime : 1 / 60, 0.035);
    lastTime = now;
    if (!reducedMotion.matches) rippleField.advance(delta);
    draw(now);
    // Let the wake propagate after movement stops, then stop rendering at rest.
    if (!reducedMotion.matches && (rippleField.active || clickWaves.count || evidence)) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!frame && !lost && visible && !document.hidden) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function locate(clientX, clientY) {
    const rect = host.getBoundingClientRect();
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(pickSurface, false)[0];
    return hit ? landscape.worldToLocal(hit.point.clone()) : null;
  }

  function trace(point) {
    if (!point || lost) return;
    const now = performance.now() / 1000;
    traceCount++;
    evidence = { x: point.x, y: point.y, started: now };
    if (!reducedMotion.matches) {
      clickWaves.emit(point.x, point.y, now);
    }
    markerTitle.textContent = 'Evidence found';
    markerDetail.textContent = 'ILLUSTRATIVE TRACE ' + String(traceCount).padStart(2, '0');
    announcement.textContent = 'Illustrative evidence trace ' + traceCount + ' located. Click another point to trace again.';
    figure.classList.add('has-traced');
    window.clearTimeout(expiryTimer);
    expiryTimer = window.setTimeout(() => {
      evidence = null;
      beacon.visible = false;
      marker.hidden = true;
      wake();
    }, 5500);
    wake();
  }

  function resize() {
    if (lost) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = width < 500 ? 10.8 : 9.3;
    camera.updateProjectionMatrix();
    draw(performance.now() / 1000);
  }

  host.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType === 'touch' || reducedMotion.matches || lost) return;
    const point = locate(event.clientX, event.clientY);
    const now = performance.now() / 1000;
    if (point) {
      if (!lastHover) {
        rippleField.disturb(point.x, point.y, -0.14);
        lastHover = { x: point.x, y: point.y, time: now };
      } else {
        const distance = Math.hypot(point.x - lastHover.x, point.y - lastHover.y);
        if (distance > 0.08) {
          const speed = distance / Math.max(0.016, now - lastHover.time);
          const strength = -(0.07 + Math.min(0.09, speed * 0.009));
          const steps = Math.min(8, Math.ceil(distance / 0.16));
          for (let i = 1; i <= steps; i++) {
            const fraction = i / steps;
            rippleField.disturb(
              lastHover.x + (point.x - lastHover.x) * fraction,
              lastHover.y + (point.y - lastHover.y) * fraction,
              strength
            );
          }
          lastHover = { x: point.x, y: point.y, time: now };
        }
      }
    } else lastHover = null;
    host.classList.toggle('is-over-surface', !!point);
    wake();
  });
  host.addEventListener('pointerleave', () => {
    lastHover = null;
    host.classList.remove('is-over-surface');
    pointerDown = null;
    wake();
  });
  host.addEventListener('pointerdown', event => {
    if (event.button === 0) pointerDown = { x: event.clientX, y: event.clientY };
  });
  host.addEventListener('pointercancel', () => { pointerDown = null; });
  host.addEventListener('pointerup', event => {
    if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) < 10) trace(locate(event.clientX, event.clientY));
    pointerDown = null;
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      trace(new THREE.Vector3(0.8, 0.3, 0));
    } else if (event.key === 'Escape') {
      lastHover = null;
      rippleField.clear();
      clickWaves.clear();
      evidence = null;
      marker.hidden = true;
      beacon.visible = false;
      wake();
    }
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; lastHover = null; rippleField.clear(); }
    else wake();
  }, { threshold: 0.05 });
  intersectionObserver.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastHover = null; rippleField.clear(); }
    else wake();
  });
  reducedMotion.addEventListener('change', () => {
    lastHover = null; rippleField.clear(); clickWaves.clear();
    wake();
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame); frame = 0;
    figure.classList.remove('is-live');
    marker.hidden = true;
    host.removeAttribute('tabindex');
    host.removeAttribute('role');
    host.setAttribute('aria-hidden', 'true');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    lost = false;
    enhance();
    resize();
    wake();
  });

  function enhance() {
    host.removeAttribute('aria-hidden');
    host.setAttribute('role', 'button');
    host.setAttribute('tabindex', '0');
    host.setAttribute('aria-label', 'Interactive terrain. Move to send ripples through the surface. Click or press Enter to reveal an illustrative evidence trace. Escape clears the trace.');
    figure.classList.add('is-live');
  }
  resize();
  enhance();
}
