import * as THREE from './vendor/three.module.min.js';

// Original GPU particle studies. The seeded attributes stay on the GPU;
// only time, pointer state, and a bounded list of impulses change per frame.
export const concepts = {
  tide: { mode: 0, title: 'Tidal Field', kicker: 'ORDER IN THE UNDERCURRENT', number: '01', description: 'A living surface, written in light.', hint: 'Move to part the tide · Hold to gather · Release to ripple', action: 'Send a ripple through the tidal particle field', annotation: 'PARTICLE STUDY / 01', status: 'A ripple travels through the tidal field.' },
  bloom: { mode: 1, title: 'Signal Bloom', kicker: 'A SIGNAL TAKES SHAPE', number: '02', description: 'Thousands of fragments. One emerging pattern.', hint: 'Move to sculpt the bloom · Hold to gather · Release to scatter', action: 'Scatter the signal bloom particles', annotation: 'PARTICLE STUDY / 02', status: 'The bloom scatters and reforms around the signal.' },
  well: { mode: 2, title: 'Gravity Well', kicker: 'DRAWN TO WHAT MATTERS', number: '03', description: 'A quiet center. A universe in motion.', hint: 'Move to bend the orbit · Hold to gather · Release a wave', action: 'Release a wave through the gravity well', annotation: 'PARTICLE STUDY / 03', status: 'A wave bends the particle orbits around the gravity well.' },
};

const vertexShader = /* glsl */ `
  precision highp float;
  attribute vec4 aSeed;
  attribute float aLayer;
  uniform float uTime;
  uniform float uClock;
  uniform float uMode;
  uniform float uPixelRatio;
  uniform float uGlow;
  uniform float uDistance;
  uniform float uHover;
  uniform float uHeld;
  uniform float uStatic;
  uniform vec2 uPointer;
  uniform vec4 uImpulses[8];
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpark;
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;

  mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
  float swell(vec2 p, float t) {
    return sin(p.x * 1.0 + p.y * .7 + t * .32) * .46
      + sin(p.x * .48 - p.y * 1.26 - t * .24) * .38
      + sin(p.x * 1.63 + p.y * .31 - t * .41) * .18;
  }
  void main() {
    float u = position.x;
    float v = position.y;
    float w = position.z;
    float t = uTime;
    vec3 p;
    float light = .5;
    float alpha = 1.;
    float pointSize = 1.12 + pow(aSeed.x, 3.) * 2.2;
    float filament = step(.5, aLayer) * (1. - step(1.5, aLayer));
    vec3 deep = vec3(.14, .26, .64);
    vec3 middle = vec3(.15, .61, .88);
    vec3 bright = vec3(.63, .95, .92);

    if (uMode < .5) {
      // A broad, folded silk surface: coherent swells, fine filaments, loose spray.
      float x = (u - .5) * 8.5;
      float z = (v - .5) * 5.7;
      float y = swell(vec2(x, z), t);
      float fold = sin(x * .83 + z * .58 + t * .16);
      y += .65 * exp(-pow(z + sin(x * .65 + t * .16) * 1.4, 2.) * 1.7);
      y += (w - .5) * (.055 + (1. - filament) * .18);
      p = vec3(x, y, z);
      p.yz = turn(.49) * p.yz;
      p.xy = turn(-.12) * p.xy;
      p.y += .06;
      light = smoothstep(-.48, 1.12, y) * .8 + .16;
      float crest = pow(max(0., sin(x * .83 + z * .58 + t * .16)), 12.);
      light += crest * .3;
      alpha *= smoothstep(0., .1, u) * smoothstep(0., .1, 1. - u);
      alpha *= smoothstep(0., .09, v) * smoothstep(0., .09, 1. - v);
      alpha *= .62 + filament * .6;
      middle = mix(middle, vec3(.36, .32, .86), smoothstep(-2., 2., z) * .68);
    } else if (uMode < 1.5) {
      // A double-curved canopy opens from a narrow stem. Points flow through it.
      float flow = fract(v + t * .027);
      float angle = u * TAU + flow * 3.9 + t * .11;
      float spread = pow(sin(flow * PI * .8), 1.8) * 2.35;
      float r = spread * (.28 + pow(w, .45) * .72);
      float petal = sin(angle * 5. + flow * 7. - t * .26);
      r *= 1. + .16 * petal;
      p = vec3(cos(angle) * r, -1.7 + flow * 3.5 - pow(r / 2.4, 2.) * .85, sin(angle) * r * .67);
      p.y += sin(angle * 3. + t * .32) * .13 * flow;
      p.x += sin(flow * 3.5 + t * .23) * .3;
      p.z += sin(flow * 8. + t * .23) * .15;
      light = .25 + flow * .5 + pow(max(0., petal), 5.) * .4;
      alpha *= smoothstep(0., .045, flow) * smoothstep(0., .05, 1. - flow);
      alpha *= .48 + filament * .5;
      deep = vec3(.23, .12, .56);
      middle = vec3(.26, .39, .95);
      bright = vec3(.46, .9, 1.);
    } else {
      // A tilted accretion disc folds into a luminous central funnel.
      float angle = u * TAU + t * (.07 + (1. - v) * .12) + v * 5.;
      float r = .64 + pow(v, .78) * 2.78;
      float spiral = sin(angle * 3. - r * 3. + t * .25);
      r += spiral * .07;
      p = vec3(cos(angle) * r, -.55 / (r * .6 + .18) + .5, sin(angle) * r);
      p.y += sin(angle * 2. + r * 2. - t * .23) * .1 + (w - .5) * .15;
      p.yz = turn(.67) * p.yz;
      p.xy = turn(-.22) * p.xy;
      p.y += .15;
      light = .3 + pow(1. - v, 2.) * .78 + pow(max(0., spiral), 8.) * .27;
      alpha *= smoothstep(0., .08, 1. - v) * (.48 + filament * .5);
      deep = vec3(.25, .15, .53);
      middle = mix(vec3(.27, .43, .91), vec3(.4, .86, .84), smoothstep(-1., 1., sin(angle + .5)));
      bright = vec3(1., .82, .5);
    }

    if (aLayer > 2.5) {
      // Reflected concentric interference beneath the bloom.
      float angle = u * TAU;
      float r = .25 + v * 3.6;
      p = vec3(cos(angle) * r, -1.92 + sin(angle) * r * .27, sin(angle) * r * .7);
      p.y += sin(r * 9. - t * 1.5) * .018;

      light = pow(.5 + .5 * sin(r * 13. - t * 1.0), 10.);
      alpha = (.16 + light * .9) * (1. - v) * .75;
      pointSize *= .75;
    } else if (aLayer > 1.5) {
      p = vec3((u - .5) * 10., (v - .5) * 5.4, (w - .5) * 6.);
      p.y += sin(t * .16 + u * 20.) * .15;
      light = .3 + aSeed.z * .5;
      alpha = .12 + aSeed.y * .2;
      pointSize *= .7;
    }

    // Depth-aware circular cursor lens, in camera space (round at every angle).
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vec2 projected = mv.xy * uDistance / max(.1, -mv.z);
    vec2 delta = projected - uPointer;
    float d = length(delta);
    vec2 direction = d > .001 ? delta / d : vec2(cos(aSeed.w * TAU), sin(aSeed.w * TAU));
    float influence = exp(-d * d * 2.1) * uHover;
    float lens = max(0., .66 - d) * uHover;
    float held = uHeld * influence;
    vec2 displacement = direction * lens * .88 - delta * held * .83;
    displacement += vec2(-direction.y, direction.x) * held * .4;
    mv.xy += displacement * (-mv.z / uDistance);
    mv.z += influence * .24 - held * .35;

    float energy = 0.;
    float movement = 0.;
    for (int i = 0; i < 8; i++) {
      float age = uClock - uImpulses[i].z;
      float radius = distance(projected, uImpulses[i].xy);
      float wave = radius - age * 1.65;
      float envelope = exp(-wave * wave * 4.4) * exp(-age * .74) * step(0., age) * uImpulses[i].w;
      movement += sin(wave * 7.3) * envelope * .42;
      energy += envelope;
    }
    mv.y += movement * (uMode < .5 ? .85 : .4);
    mv.z += movement * 1.3;
    float stillRing = exp(-pow(d - .75, 2.) * 28.) * uStatic;
    energy += stillRing;
    light += energy * .85 + influence * .22;
    vColor = mix(deep, middle, smoothstep(.05, .65, light));
    vColor = mix(vColor, bright, smoothstep(.53, 1.14, light));
    vColor = mix(vColor, vec3(1., .86, .55), clamp(energy * .76 + held * .3, 0., .88));
    float twinkle = .8 + .2 * sin(t * (.5 + aSeed.z) + aSeed.y * 50.);
    float depth = clamp(1.3 - (-mv.z - 5.) * .085, .3, 1.);
    vAlpha = alpha * twinkle * depth * mix(1.1, .075, uGlow);
    vSpark = step(.991, aSeed.x);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(pointSize * uPixelRatio * (8.5 / -mv.z) * (1. + energy * .65) * mix(1., 5., uGlow), 1., 28. * uPixelRatio);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpark;
  void main() {
    vec2 q = gl_PointCoord * 2. - 1.;
    float r = dot(q, q);
    if (r > 1.) discard;
    float core = exp(-r * 5.5);
    float halo = exp(-r * 2.) * .18;
    float star = pow(max(0., 1. - abs(q.x)), 16.) * pow(max(0., 1. - abs(q.y)), 2.);
    star += pow(max(0., 1. - abs(q.y)), 16.) * pow(max(0., 1. - abs(q.x)), 2.);
    float alpha = (core + halo + star * vSpark * .35) * vAlpha;
    gl_FragColor = vec4(vColor * 1.4, alpha);
  }
`;

export function createParticleStudy(mode, { compact = false, pixelRatio = 1 } = {}) {
  const group = new THREE.Group();
  const count = compact ? 22000 : 48000;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const layers = new Float32Array(count);
  let seed = 7219;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < count; i++) {
    const f = i / count;
    let layer = f < .65 ? 0 : f < .87 ? 1 : f < .90 || mode !== 1 ? 2 : 3;
    let u = random(), v = random(), w = random();
    if (layer === 1) {
      // Long coherent threads live among freely scattered particles.
      if (mode === 0) v = Math.floor(v * 72) / 72 + (random() - .5) * .0018;
      if (mode === 1) { u = Math.floor(u * 36) / 36 + (random() - .5) * .001; w = .9 + random() * .1; }
      if (mode === 2) v = Math.floor(v * 64) / 64 + (random() - .5) * .0015;
    }
    if (layer === 3) v = Math.floor(v * 24) / 24 + random() * .004;
    positions.set([u, v, w], i * 3);
    seeds.set([random(), random(), random(), random()], i * 4);
    layers[i] = layer;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
  const uniforms = {
    uTime: { value: 0 }, uClock: { value: 0 }, uMode: { value: mode }, uGlow: { value: 0 },
    uPixelRatio: { value: pixelRatio }, uDistance: { value: 8.8 },
    uPointer: { value: new THREE.Vector2(0, 0) }, uHover: { value: 0 }, uHeld: { value: 0 }, uStatic: { value: 0 },
    uImpulses: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -100, 0)) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const glowMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { ...uniforms, uGlow: { value: 1 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
  const glow = new THREE.Points(geometry, glowMaterial);
  glow.frustumCulled = false;
  group.add(glow, points);
  return { group, uniforms, count };
}
