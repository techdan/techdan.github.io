// A damped 2D wave field. Neighboring cells exchange motion, so disturbances
// propagate and interfere instead of staying attached to the pointer.
export function createRippleField(columns = 91, rows = 75, width = 5.8, depth = 4.8) {
  const height = new Float32Array(columns * rows);
  const velocity = new Float32Array(height.length);
  const damping = new Float32Array(height.length);
  const dx = width / (columns - 1);
  const dy = depth / (rows - 1);
  const inverseDx2 = 1 / (dx * dx);
  const inverseDy2 = 1 / (dy * dy);
  const speedSquared = 1.5 * 1.5;
  // Respect the 2D stability limit, including when tests use a different grid.
  const step = Math.min(1 / 120, 0.45 / Math.sqrt(speedSquared * (inverseDx2 + inverseDy2)));
  let accumulator = 0;
  let active = false;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const edge = Math.min(x, y, columns - 1 - x, rows - 1 - y);
      damping[y * columns + x] = 1.65 + Math.pow(Math.max(0, 1 - edge / 8), 2) * 7;
    }
  }

  function disturb(x, y, strength = -0.14, radius = 0.18) {
    const cx = (x + width / 2) / dx;
    const cy = (depth / 2 - y) / dy;
    const rx = Math.ceil(radius * 3 / dx);
    const ry = Math.ceil(radius * 3 / dy);
    for (let row = Math.max(0, Math.floor(cy) - ry); row <= Math.min(rows - 1, Math.ceil(cy) + ry); row++) {
      for (let col = Math.max(0, Math.floor(cx) - rx); col <= Math.min(columns - 1, Math.ceil(cx) + rx); col++) {
        const distanceSquared = Math.pow((col - cx) * dx, 2) + Math.pow((row - cy) * dy, 2);
        const q = distanceSquared / (radius * radius);
        // A shallow depression with displaced water around it; no sustained sink.
        const impulse = strength * (1 - q / 2) * Math.exp(-q / 2);
        const i = row * columns + col;
        height[i] = 0.32 * Math.tanh((height[i] + impulse) / 0.32);
      }
    }
    active = true;
  }

  function advance(seconds) {
    if (!active) return false;
    accumulator += Math.min(seconds, 0.05);
    while (accumulator + 1e-10 >= step) {
      let energy = 0;
      // Read all heights before updating them, avoiding directional bias.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const h = height[i];
          const laplacian = ((height[x ? i - 1 : i] + height[x < columns - 1 ? i + 1 : i]) - 2 * h) * inverseDx2
            + ((height[y ? i - columns : i] + height[y < rows - 1 ? i + columns : i]) - 2 * h) * inverseDy2;
          velocity[i] += (speedSquared * laplacian - damping[i] * velocity[i] - h * 0.4) * step;
        }
      }
      for (let i = 0; i < height.length; i++) {
        height[i] += velocity[i] * step;
        energy = Math.max(energy, Math.abs(height[i]) + Math.abs(velocity[i]) * 0.06);
      }
      accumulator -= step;
      // Discard subpixel residual motion instead of running an invisible tail.
      if (energy < 0.0015) { clear(); break; }
    }
    return active;
  }

  function sample(x, y) {
    const gx = Math.max(0, Math.min(columns - 1.001, (x + width / 2) / dx));
    const gy = Math.max(0, Math.min(rows - 1.001, (depth / 2 - y) / dy));
    const ix = Math.floor(gx), iy = Math.floor(gy);
    const fx = gx - ix, fy = gy - iy;
    const i = iy * columns + ix;
    const interpolate = values => (values[i] * (1 - fx) + values[i + 1] * fx) * (1 - fy)
      + (values[i + columns] * (1 - fx) + values[i + columns + 1] * fx) * fy;
    return { height: interpolate(height), velocity: interpolate(velocity) };
  }

  function clear() {
    height.fill(0);
    velocity.fill(0);
    accumulator = 0;
    active = false;
  }
  return { disturb, advance, sample, clear, get active() { return active; } };
}
