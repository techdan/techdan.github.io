// The Lens: a minimap of example source files with a magnifier that "finds"
// the three lines supporting an example claim chart. The pure functions below
// (corpus, tokenizer, layout, hit test) are exported for tests; mountLens()
// owns the canvas, pointer input, and the claim chart DOM.

export const GUT = 5;      // gutter characters reserved for line numbers
export const CHARS = 72;   // characters per minimap column
export const HEAD = 34;    // px above the first code line (file name row)

export function createRandom(seed) {
  let s = seed;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2654435761) + 0x9E3779B9 | 0) >>> 0) / 4294967296;
}

// The example claim's supporting code. `§` marks the cited line.
const BLOCKS = {
  '1a': ['  /** Accepts a position update from a client device. */',
    '  public SyncResult onPositionUpdate(User user, DeviceId deviceId, Request request) {',
    '    requireAuthenticated(user);',
    '    §PlaybackPosition pos = request.readPosition(deviceId);',
    '    if (pos.offsetMs() < 0) {',
    '      return SyncResult.rejected("negative offset");',
    '    }',
    '    accounts.put(user.account(), request.mediaId(), pos);',
    '    return SyncResult.accepted(pos);', '  }', ''],
  '1b': ['  /** Persists the latest position, keyed by account and media. */',
    '  public void put(AccountId account, MediaId media, PlaybackPosition pos) {',
    '    final Key key = Key.of(account, media);',
    '    §table.upsert(key, pos.withTimestamp(clock.now()));',
    '    cache.invalidate(key);', '  }', ''],
  '1c': ['  /** Called when a second device asks to resume playback. */',
    '  public ResumeResponse handleResume(User user, DeviceId target, MediaId media) {',
    '    final Optional<PlaybackPosition> last = accounts.get(user.account(), media);',
    '    §return transport.send(target, ResumeResponse.of(last.orElse(START)));', '  }', ''],
};
const SPECS = [
  { name: 'SyncService.java', start: 354, el: '1a', at: 52 },
  { name: 'DeviceRegistry.java', start: 1 },
  { name: 'AccountStore.java', start: 61, el: '1b', at: 96 },
  { name: 'MediaSession.java', start: 212 },
  { name: 'ResumeHandler.java', start: 118, el: '1c', at: 34 },
  { name: 'TokenPolicy.java', start: 40 },
];
// Columns shown at each width, in display order; the three evidence files always appear.
const PRIORITY = [0, 2, 4, 1, 3, 5];

const KW = /^(public|private|protected|final|return|if|new|throw|void|null|package|import|class|for)$/;
export function tokenize(line) {
  const out = [], re = /(\/\/.*|\/\*\*.*|"[^"]*"|\b\d+\b|[A-Za-z_]\w*|\S)/g;
  let m;
  while ((m = re.exec(line))) {
    const t = m[0];
    const k = t.startsWith('//') || t.startsWith('/**') ? 'c' : t[0] === '"' ? 's' : /^\d/.test(t) ? 'n'
      : KW.test(t) ? 'k' : /^[A-Z]/.test(t) ? 't' : /\w/.test(t) ? 'i' : 'p';
    out.push({ t, k, x: m.index });
  }
  return out;
}

export function buildCorpus(seed = 7, length = 420) {
  const rnd = createRandom(seed), pick = a => a[Math.floor(rnd() * a.length)];
  const T = ['String', 'long', 'boolean', 'MediaItem', 'DeviceId', 'SessionToken', 'SyncState', 'Duration', 'Manifest', 'Lease'];
  const V = ['resolve', 'fetch', 'validate', 'apply', 'merge', 'schedule', 'refresh', 'encode', 'notify', 'flush', 'register', 'release'];
  const N = ['Session', 'Queue', 'Manifest', 'Token', 'Cursor', 'Snapshot', 'Policy', 'Buffer', 'Endpoint', 'Checksum', 'Lease', 'Revision'];
  const v = ['session', 'queue', 'manifest', 'token', 'cursor', 'snapshot', 'policy', 'buffer', 'lease', 'revision', 'state', 'entry', 'device'];
  const C = ['Retry once on transient failure.', 'Tokens rotate every 24 hours.', 'Keep ordering stable for clients.', 'Guard against clock skew.', 'Server is the source of truth.', 'Caller holds the session lock.', 'Idempotent; safe to replay.'];
  const stmt = () => pick([
    () => `final ${pick(T)} ${pick(v)} = ${pick(v)}.${pick(V)}${pick(N)}(${pick(v)});`,
    () => `log.debug("${pick(V)} ${pick(N).toLowerCase()} for {}", ${pick(v)});`,
    () => `${pick(v)}.set${pick(N)}(${pick(v)}.get${pick(N)}());`,
    () => `metrics.increment("${pick(N).toLowerCase()}.${pick(V)}");`,
    () => `// ${pick(C)}`,
    () => `${pick(v)} = Math.max(${pick(v)}, ${Math.floor(rnd() * 900) + 10});`,
    () => `${pick(v)}Cache.invalidate(${pick(v)}.id());`,
  ])();
  function method(out) {
    out.push(`  /** ${pick(C)} */`, `  ${pick(['public', 'private', 'protected'])} ${pick(T)} ${pick(V)}${pick(N)}(${pick(T)} ${pick(v)}) {`);
    const n = 3 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) {
      if (rnd() < .18) {
        out.push(`    if (${pick(v)} == null || ${pick(v)}.isExpired()) {`);
        out.push(`      ${rnd() < .5 ? `throw new IllegalStateException("${pick(N)} expired");` : stmt()}`, '    }');
      } else out.push('    ' + stmt());
    }
    out.push(`    return ${pick(v)};`, '  }', '');
  }
  return SPECS.map(spec => {
    const out = [];
    if (spec.start === 1) out.push('package com.example.media.sync;', '', 'import java.time.Clock;', 'import java.util.Optional;', '', 'public final class DeviceRegistry {', '');
    let placed = false;
    while (out.length < length) {
      if (spec.el && !placed && out.length >= spec.at) { out.push(...BLOCKS[spec.el]); placed = true; } else method(out);
    }
    let evidence = -1;
    const lines = out.map((l, i) => { if (l.includes('§')) { evidence = i; return l.replace('§', ''); } return l; });
    return { ...spec, lines, evidence, toks: lines.map(tokenize) };
  });
}

export const citation = file => `${file.name}:${file.start + file.evidence}`;

// Geometry for a field of width W and height H, or null while the field has no size
// (hidden, or not laid out yet). Column x positions are keyed by file index.
export function computeLayout(W, H, fileCount = SPECS.length) {
  if (!(W > 0 && H > 0)) return null;
  const gap = W < 500 ? 12 : 22;
  const cols = Math.max(3, Math.min(fileCount, Math.floor((W - 24) / (CHARS * 1.7 + gap))));
  const cw = Math.min(1.7, (W - 24 - gap * (cols - 1)) / (cols * CHARS));
  const lh = cw * 1.85, colW = CHARS * cw;
  const offX = (W - (cols * colW + gap * (cols - 1))) / 2;
  const xs = new Map();
  PRIORITY.slice(0, cols).sort((a, b) => a - b).forEach((fi, c) => xs.set(fi, offX + c * (colW + gap)));
  return { W, H, gap, cols, cw, lh, colW, xs, mag: 7.4 / cw, R: W < 500 ? 78 : 112, maxLines: Math.floor((H - HEAD - 8) / lh) };
}
export const lineY = (g, i) => HEAD + i * g.lh;

// Is the lens centre (lx, ly) over this file's cited line?
export function overEvidence(lx, ly, file, x, g) {
  if (!file.el || x === undefined || file.evidence >= g.maxLines) return false;
  const y = lineY(g, file.evidence) + g.lh * .3;
  return Math.abs(ly - y) < g.R * .28 && lx > x - g.R * .2 && lx < x + g.colW * .8;
}

// Leader from a claim-chart row to the start of the cited line, as a cubic Bézier.
// rowBox and fieldBox share one origin (the hero grid). pathLength 1 normalises the
// draw-in dash so long curves are never cut short.
export function leaderCurve(rowBox, fieldBox, file, x, g) {
  const p0 = [rowBox.right, rowBox.top + rowBox.height / 2];
  const p3 = [fieldBox.left + x + GUT * g.cw - 4, fieldBox.top + lineY(g, file.evidence) + g.lh * .3];
  const mx = (p0[0] + p3[0]) / 2;
  return { p0, c1: [mx, p0[1]], c2: [mx, p3[1]], p3, pathLength: 1 };
}

// Where the lens stops to "find" a cited line: one character into it, so the leader's end
// sits well inside the magnified view when the leader draws in.
export function evidenceTarget(file, x, g) {
  return { x: x + (GUT + 1) * g.cw, y: lineY(g, file.evidence) + g.lh * .3 };
}

// Does any part of this leader (sampled points, field coordinates) pass under the lens?
// If so, the plain line is hidden there and the lens shows it magnified, like the code.
export function underLens(curve, { lx, ly, R }) {
  return curve.pts.some(([x, y]) => Math.hypot(x - lx, y - ly) < R + 2);
}

// What clicking a claim chart row does: send the lens to find an unfound line, otherwise
// hide or redraw that line's leader.
export function chartAction({ found, hidden }) {
  if (!found) return 'find';
  return hidden ? 'show' : 'hide';
}

// Fraction of the remaining distance the lens covers in dt ms: 0.035 per 60fps frame, as
// originally, but time-based so a slow frame never slows the lens down.
export const lensStep = dt => 1 - (1 - 0.035) ** (dt / (1000 / 60));

const DRAW_MS = 1100;   // leader draw-in
const HOLD_MS = 1700;   // the lens rests on a found line while its leader arrives
const DWELL_MS = 830;   // pause at ordinary waypoints
const easeOut = t => 1 - (1 - t) ** 3;
const COLORS = { k: '#1D3FCF', t: '#12161D', i: '#3E4752', s: '#8A5A0B', n: '#8A5A0B', c: '#8C958F', p: '#6B747E' };
const MINI = { k: 'rgba(29,63,207,.55)', t: 'rgba(18,22,29,.55)', i: 'rgba(62,71,82,.34)', s: 'rgba(138,90,11,.45)', n: 'rgba(138,90,11,.45)', c: 'rgba(120,130,124,.3)', p: 'rgba(107,116,126,.25)' };
const MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';
const SVG = 'http://www.w3.org/2000/svg';

export function mountLens({ field, canvas, hint, chart, count, leaders, grid, reset }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const FILES = buildCorpus();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = createRandom(31), pick = a => a[Math.floor(rnd() * a.length)];
  const found = new Set(), foundAt = new Map(), hiddenLines = new Set();
  let curves = [], fieldOff = { left: 0, top: 0 };
  let g, dpr, mini, lx, ly, tx, ty, targetEl = null, auto = true, tour = 0, dwellMs = 0, holdUntil = 0, last = 0, idleTimer = 0, visible = true;

  const shown = () => FILES.map((f, i) => [f, g.xs.get(i)]).filter(([, x]) => x !== undefined);
  const row = el => chart.querySelector(`li[data-el="${el}"]`);
  const progress = el => reduce ? 1 : easeOut(Math.min(1, (performance.now() - foundAt.get(el)) / DRAW_MS));

  // Re-measure whenever the field itself changes size, not only on window resize:
  // the field can be 0×0 at first (hidden tab, embedded frame, late layout).
  function layout() {
    const r = field.getBoundingClientRect();
    const next = computeLayout(r.width, r.height);
    if (!next) return;
    const first = !g;
    dpr = Math.min(devicePixelRatio || 1, 2);
    g = next;
    canvas.width = g.W * dpr; canvas.height = g.H * dpr;
    drawMini(); placeLeaders();
    if (first) {
      lx = g.W * .55; ly = g.H * .45; ({ x: tx, y: ty } = nextTarget());
      if (reduce) for (const [f] of shown()) if (f.el) mark(f);
      field.classList.add('is-live');
    } else {
      lx = Math.min(lx, g.W); ly = Math.min(ly, g.H); ({ x: tx, y: ty } = nextTarget());
    }
  }
  function drawMini() {
    mini = document.createElement('canvas'); mini.width = canvas.width; mini.height = canvas.height;
    const m = mini.getContext('2d'); m.scale(dpr, dpr);
    m.fillStyle = '#E8EAE4'; m.fillRect(0, 0, g.W, g.H);
    for (const [f, x] of shown()) {
      m.fillStyle = '#535D68'; m.font = `500 10px ${MONO}`; m.fillText(f.name, x, 18);
      m.fillStyle = '#D2D6CE'; m.fillRect(x, 24, g.colW, 1);
      for (let i = 0; i < g.maxLines && i < f.lines.length; i++) {
        const y = lineY(g, i);
        for (const tk of f.toks[i]) {
          m.fillStyle = MINI[tk.k];
          m.fillRect(x + (GUT + tk.x) * g.cw, y, Math.max(g.cw * tk.t.length - g.cw * .3, g.cw * .6), g.lh * .6);
        }
      }
    }
  }

  // The tour alternates random waypoints with the next unfound cited line.
  function nextTarget() {
    const pending = shown().filter(([f]) => f.el && !found.has(f.el));
    if (pending.length && tour % 2 === 1) { const [f, x] = pending[0]; targetEl = f.el; return evidenceTarget(f, x, g); }
    targetEl = null;
    const [, x] = pick(shown());
    return { x: x + rnd() * g.colW, y: HEAD + rnd() * (g.H - HEAD - 30) };
  }
  function mark(f) {
    found.add(f.el); foundAt.set(f.el, performance.now());
    const li = row(f.el);
    li.classList.add('found');
    li.querySelector('.cite').textContent = citation(f);
    count.textContent = found.size === 3 ? 'All elements located' : `${found.size} / 3 located`;
    syncRow(f.el);
    placeLeaders();
  }

  // Claim chart rows are buttons: find an unfound line, or hide / redraw a found line's leader.
  function syncRow(el) {
    row(el).setAttribute('aria-pressed', String(found.has(el) && !hiddenLines.has(el)));
  }
  function act(el) {
    const i = FILES.findIndex(f => f.el === el), f = FILES[i], x = g && g.xs.get(i);
    const action = chartAction({ found: found.has(el), hidden: hiddenLines.has(el) });
    if (action === 'find') {
      if (!g || x === undefined) return;
      if (reduce) { mark(f); return; }
      clearTimeout(idleTimer); auto = true; holdUntil = 0; dwellMs = 0;
      targetEl = el; ({ x: tx, y: ty } = evidenceTarget(f, x, g));
    } else if (action === 'hide') {
      hiddenLines.add(el); syncRow(el); placeLeaders();
    } else {
      hiddenLines.delete(el); foundAt.set(el, performance.now()); syncRow(el); placeLeaders();
    }
  }
  chart.querySelectorAll('li[data-el]').forEach(li => {
    li.setAttribute('role', 'button'); li.tabIndex = 0; syncRow(li.dataset.el);
    li.addEventListener('click', () => act(li.dataset.el));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(li.dataset.el); } });
  });

  // Leaders: SVG lines from the claim chart to the code. Each has its own mask so that,
  // wherever it passes under the lens, the plain line is hidden there and the
  // canvas draws it magnified instead (drawLens). The draw-in is driven per frame so the
  // SVG part and the magnified part always show the same progress.
  function placeLeaders() {
    leaders.replaceChildren(); curves = [];
    if (!g) return;
    const gr = grid.getBoundingClientRect(), fr = field.getBoundingClientRect();
    fieldOff = { left: fr.left - gr.left, top: fr.top - gr.top };
    if (getComputedStyle(leaders).display === 'none') return;
    const defs = document.createElementNS(SVG, 'defs');
    leaders.append(defs);
    for (const [f, x] of shown()) {
      if (!f.el || !found.has(f.el) || hiddenLines.has(f.el)) continue;
      const r = row(f.el).getBoundingClientRect();
      const c = leaderCurve({ right: r.right - gr.left, top: r.top - gr.top, height: r.height }, fieldOff, f, x, g);
      const id = `lens-leader-${f.el}`, mask = document.createElementNS(SVG, 'mask');
      mask.setAttribute('id', id); mask.setAttribute('maskUnits', 'userSpaceOnUse');
      for (const [k, v] of [['x', -4000], ['y', -4000], ['width', 12000], ['height', 12000]]) mask.setAttribute(k, v);
      const keep = document.createElementNS(SVG, 'rect');
      for (const [k, v] of [['x', -4000], ['y', -4000], ['width', 12000], ['height', 12000], ['fill', '#fff']]) keep.setAttribute(k, v);
      const hole = document.createElementNS(SVG, 'circle');
      for (const [k, v] of [['r', 0], ['fill', '#000'], ['fill-opacity', 0]]) hole.setAttribute(k, v);
      mask.append(keep, hole);
      defs.append(mask);
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', `M${c.p0} C ${c.c1}, ${c.c2}, ${c.p3}`);
      path.setAttribute('pathLength', c.pathLength);
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('class', 'leader-end');
      dot.setAttribute('cx', c.p3[0]); dot.setAttribute('cy', c.p3[1]); dot.setAttribute('r', 2.5);
      for (const el of [path, dot]) el.setAttribute('mask', `url(#${id})`);
      leaders.append(path, dot);
      // Samples in field coordinates with cumulative length, for drawing a partial curve.
      const pts = [], lens = [0];
      for (let i = 0; i <= 120; i++) {
        const t = i / 120, u = 1 - t;
        pts.push([0, 1].map(j => u * u * u * c.p0[j] + 3 * u * u * t * c.c1[j] + 3 * u * t * t * c.c2[j] + t * t * t * c.p3[j] - (j ? fieldOff.top : fieldOff.left)));
        if (i) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
      curves.push({ el: f.el, path, dot, hole, pts, lens, weight: 0 });
    }
  }
  function updateLeaders() {
    for (const cv of curves) {
      const p = progress(cv.el);
      cv.weight = underLens(cv, { lx, ly, R: g.R }) ? 1 : 0;
      cv.path.style.strokeDashoffset = 1 - p;
      cv.dot.style.opacity = p >= 1 ? 1 : 0;
      cv.hole.setAttribute('cx', fieldOff.left + lx); cv.hole.setAttribute('cy', fieldOff.top + ly);
      cv.hole.setAttribute('r', g.R); cv.hole.setAttribute('fill-opacity', cv.weight);
    }
  }

  function highlight(f, x) {
    const y = lineY(g, f.evidence);
    ctx.fillStyle = 'rgba(243,222,79,.85)';
    ctx.fillRect(x + GUT * g.cw - 2, y - g.lh * .45, f.lines[f.evidence].length * g.cw + 4, g.lh * 1.5);
  }
  function drawLens() {
    const { R, mag, lh, cw, colW } = g;
    ctx.save();
    ctx.shadowColor = 'rgba(18,22,29,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.fillStyle = '#FBFBF9'; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    // Text is drawn in screen space at a readable size: browsers clamp tiny canvas
    // fonts, so scaling a 2px font up would render far too large.
    const r = R / mag, sx = v => lx + (v - lx) * mag, sy = v => ly + (v - ly) * mag;
    ctx.font = `400 ${(cw / 0.6) * mag}px ${MONO}`; ctx.textBaseline = 'middle';
    let under = null;
    for (const [f, x] of shown()) {
      if (lx + r < x - GUT * cw || lx - r > x + colW) continue;
      const i0 = Math.max(0, Math.floor((ly - r - HEAD) / lh)), i1 = Math.min(g.maxLines - 1, Math.ceil((ly + r - HEAD) / lh));
      if (f.el && found.has(f.el) && f.evidence >= i0 && f.evidence <= i1) {
        ctx.fillStyle = 'rgba(243,222,79,.8)';
        ctx.fillRect(sx(x + GUT * cw) - 3, sy(lineY(g, f.evidence) + lh * .3) - lh * mag * .55, f.lines[f.evidence].length * cw * mag + 6, lh * mag * 1.1);
      }
      for (let i = i0; i <= i1; i++) {
        const y = sy(lineY(g, i) + lh * .3);
        ctx.fillStyle = '#A3AAA4'; ctx.fillText(String(f.start + i).padStart(4), sx(x), y);
        for (const tk of f.toks[i]) { ctx.fillStyle = COLORS[tk.k]; ctx.fillText(tk.t, sx(x + (GUT + tk.x) * cw), y); }
        if (Math.abs(lineY(g, i) + lh * .3 - ly) < lh * .5 && lx > x - 4 && lx < x + colW) under = `${f.name}:${f.start + i}`;
      }
    }
    // Leaders under the lens: drawn magnified, as far as they have drawn in.
    ctx.strokeStyle = '#1D3FCF'; ctx.fillStyle = '#1D3FCF'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const cv of curves) {
      if (cv.weight <= 0) continue;
      const p = progress(cv.el), upto = p * cv.lens[cv.lens.length - 1];
      ctx.globalAlpha = cv.weight;
      ctx.beginPath(); ctx.moveTo(sx(cv.pts[0][0]), sy(cv.pts[0][1]));
      for (let i = 1; i < cv.pts.length; i++) {
        if (cv.lens[i] > upto) {
          const a = cv.pts[i - 1], b = cv.pts[i], t = (upto - cv.lens[i - 1]) / (cv.lens[i] - cv.lens[i - 1] || 1);
          ctx.lineTo(sx(a[0] + (b[0] - a[0]) * t), sy(a[1] + (b[1] - a[1]) * t));
          break;
        }
        ctx.lineTo(sx(cv.pts[i][0]), sy(cv.pts[i][1]));
      }
      ctx.stroke();
      if (p >= 1) { const e = cv.pts[cv.pts.length - 1]; ctx.beginPath(); ctx.arc(sx(e[0]), sy(e[1]), Math.min(2.5 * mag, 7), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = '#12161D'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx, ly, R + 5, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(18,22,29,.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#12161D'; ctx.lineWidth = 1.5;
    for (const [a, b] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { ctx.beginPath(); ctx.moveTo(lx + a * (R - 8), ly + b * (R - 8)); ctx.lineTo(lx + a * (R + 10), ly + b * (R + 10)); ctx.stroke(); }
    if (under) {
      ctx.font = `500 11px ${MONO}`;
      const w = ctx.measureText(under).width + 14, x = Math.min(Math.max(lx - w / 2, 4), g.W - w - 4), y = Math.min(ly + R + 16, g.H - 26);
      ctx.fillStyle = '#12161D'; ctx.fillRect(x, y, w, 20);
      ctx.fillStyle = '#F3DE4F'; ctx.textBaseline = 'middle'; ctx.fillText(under, x + 7, y + 10);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(64, last ? now - last : 16.7);
    last = now;
    if (!visible || !g) return;
    if (auto && !reduce && now >= holdUntil) {
      const k = lensStep(dt);
      lx += (tx - lx) * k; ly += (ty - ly) * k;
      if (Math.hypot(tx - lx, ty - ly) < 2 && (dwellMs += dt) > DWELL_MS) { tour++; ({ x: tx, y: ty } = nextTarget()); dwellMs = 0; }
    }
    for (const [f, x] of shown()) {
      if (!f.el || found.has(f.el)) continue;
      // The tour "finds" a line only once it has arrived on it; a visitor finds it by hovering.
      const arrived = auto && targetEl === f.el && Math.hypot(tx - lx, ty - ly) < 3;
      if (arrived || (!auto && overEvidence(lx, ly, f, x, g))) { mark(f); if (auto) holdUntil = now + HOLD_MS; }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mini, 0, 0);
    ctx.scale(dpr, dpr);
    for (const [f, x] of shown()) if (f.el && found.has(f.el)) highlight(f, x);
    updateLeaders();
    drawLens();
  }

  const toLocal = e => { const r = field.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  field.addEventListener('pointermove', e => {
    auto = false; [lx, ly] = toLocal(e); hint.hidden = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { auto = true; ({ x: tx, y: ty } = nextTarget()); }, 2600);
  });
  field.addEventListener('pointerdown', e => { auto = false; [lx, ly] = toLocal(e); });
  reset.addEventListener('click', () => {
    found.clear(); hiddenLines.clear(); tour = 0;
    chart.querySelectorAll('li').forEach(li => { li.classList.remove('found'); li.querySelector('.cite').textContent = 'not yet located'; syncRow(li.dataset.el); });
    count.textContent = '0 / 3 located'; placeLeaders();
    if (g) ({ x: tx, y: ty } = nextTarget());
  });
  let resizeTimer;
  const relayout = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 80); };
  if ('ResizeObserver' in window) {
    new ResizeObserver(relayout).observe(field);
    new ResizeObserver(() => placeLeaders()).observe(chart); // rows move as fonts load or text wraps
  }
  else addEventListener('resize', relayout);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(field);
  // File labels and lens text use the mono face; redraw once it has loaded.
  document.fonts?.ready.then(() => { if (g) { drawMini(); placeLeaders(); } });

  layout();
  requestAnimationFrame(frame);
}
