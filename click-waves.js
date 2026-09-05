const LIFETIME = 3.2;

export function createClickWaves() {
  const waves = [];

  function emit(x, y, now) {
    // Each click owns its clock. New clicks never recycle a live wave.
    waves.push({ x, y, started: now, radius: 0, fade: 1 });
  }

  function advance(now) {
    for (let i = waves.length - 1; i >= 0; i--) {
      const age = now - waves[i].started;
      if (age >= LIFETIME) waves.splice(i, 1);
      else {
        waves[i].radius = Math.max(0, age) * 1.8;
        waves[i].fade = 1 - Math.max(0, age) / LIFETIME;
      }
    }
  }

  function sample(x, y) {
    let height = 0;
    let light = 0;
    for (const wave of waves) {
      const dx = x - wave.x, dy = y - wave.y;
      const distanceSquared = dx * dx + dy * dy;
      // Only evaluate the moving annulus; the omitted tails are invisible.
      if (distanceSquared > (wave.radius + 1.5) ** 2 ||
          (wave.radius > 1.5 && distanceSquared < (wave.radius - 1.5) ** 2)) continue;
      const front = Math.sqrt(distanceSquared) - wave.radius;
      const envelope = Math.exp(-front * front / 0.16) * wave.fade;
      height += Math.cos(front * 13) * envelope * 0.38;
      light += envelope;
    }
    // Preserve ordinary interference, but soften extreme stacks at one point.
    // This affects amplitude only, never a wave's age, radius, or lifetime.
    if (Math.abs(height) > 0.55) height = Math.sign(height) * (0.55 + 0.25 * (1 - Math.exp(-(Math.abs(height) - 0.55) / 0.25)));
    return { height, light };
  }

  return { emit, advance, sample, clear: () => { waves.length = 0; }, get count() { return waves.length; } };
}
