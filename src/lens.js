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

// Where a page point appears through the lens. The centre is a true magnifier (×mag);
// the outer `bezel` px of the lens compress everything else it covers, ending at the
// identity on the edge, so lines crossing the rim stay continuous instead of vanishing.
export function lensMap(x, y, { lx, ly, R, mag, bezel }) {
  const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
  if (d === 0 || d >= R) return [x, y];
  const inner = R - bezel, r0 = inner / mag;
  const s = d <= r0 ? d * mag : inner + (d - r0) / (R - r0) * bezel;
  return [lx + dx / d * s, ly + dy / d * s];
}

export const BEZEL = 18;  // px of compressing rim around the magnified centre
const DRAW_MS = 1100; // matches the leader draw-in animation in style.css
const COLORS = { k: '#1D3FCF', t: '#12161D', i: '#3E4752', s: '#8A5A0B', n: '#8A5A0B', c: '#8C958F', p: '#6B747E' };
const MINI = { k: 'rgba(29,63,207,.55)', t: 'rgba(18,22,29,.55)', i: 'rgba(62,71,82,.34)', s: 'rgba(138,90,11,.45)', n: 'rgba(138,90,11,.45)', c: 'rgba(120,130,124,.3)', p: 'rgba(107,116,126,.25)' };
const MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';

export function mountLens({ field, canvas, hint, chart, count, leaders, grid, reset }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const FILES = buildCorpus();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = createRandom(31), pick = a => a[Math.floor(rnd() * a.length)];
  const found = new Set(), foundAt = new Map();
  let curves = [], fieldOff = { left: 0, top: 0 };
  let g, dpr, mini, lx, ly, tx, ty, auto = true, tour = 0, dwell = 0, idleTimer = 0, visible = true;

  const shown = () => FILES.map((f, i) => [f, g.xs.get(i)]).filter(([, x]) => x !== undefined);
  const row = el => chart.querySelector(`li[data-el="${el}"]`);

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

  function nextTarget() {
    const pending = shown().filter(([f]) => f.el && !found.has(f.el));
    if (pending.length && tour % 2 === 1) { const [f, x] = pending[0]; return { x: x + (GUT + 24) * g.cw, y: lineY(g, f.evidence) + g.lh * .3 }; }
    const [, x] = pick(shown());
    return { x: x + rnd() * g.colW, y: HEAD + rnd() * (g.H - HEAD - 30) };
  }
  function mark(f) {
    found.add(f.el); foundAt.set(f.el, performance.now());
    const li = row(f.el);
    li.classList.add('found');
    li.querySelector('.cite').textContent = citation(f);
    count.textContent = found.size === 3 ? 'All elements located' : `${found.size} / 3 located`;
    placeLeaders();
  }
  // SVG leaders join the chart to the field. Their part under the lens is masked out
  // and redrawn magnified on the canvas (see drawLens), so the lens magnifies them too.
  function placeLeaders() {
    leaders.replaceChildren(); curves = [];
    if (!g) return;
    const gr = grid.getBoundingClientRect(), fr = field.getBoundingClientRect();
    fieldOff = { left: fr.left - gr.left, top: fr.top - gr.top };
    if (getComputedStyle(leaders).display === 'none') return;
    const ns = 'http://www.w3.org/2000/svg', now = performance.now();
    for (const [f, x] of shown()) {
      if (!f.el || !found.has(f.el)) continue;
      const r = row(f.el).getBoundingClientRect();
      const c = leaderCurve({ right: r.right - gr.left, top: r.top - gr.top, height: r.height }, fieldOff, f, x, g);
      curves.push({ c, el: f.el });
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', `M${c.p0} C ${c.c1}, ${c.c2}, ${c.p3}`);
      path.setAttribute('pathLength', c.pathLength);
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', c.p3[0]); dot.setAttribute('cy', c.p3[1]); dot.setAttribute('r', 2.5);
      // Re-placed after a resize: show already-drawn leaders without replaying the animation.
      if (now - foundAt.get(f.el) > DRAW_MS) { path.classList.add('drawn'); dot.classList.add('drawn'); }
      leaders.append(path, dot);
    }
  }

  function highlight(f, x, tag) {
    const y = lineY(g, f.evidence);
    ctx.fillStyle = 'rgba(243,222,79,.85)';
    ctx.fillRect(x + GUT * g.cw - 2, y - g.lh * .45, f.lines[f.evidence].length * g.cw + 4, g.lh * 1.5);
    if (tag) { ctx.fillStyle = '#1D3FCF'; ctx.font = `500 9px ${MONO}`; ctx.fillText(f.el, x - 1, y + g.lh); }
  }
  // The rim shows the code it covers, compressed through lensMap, so highlighted lines and
  // the leaders ending on them stay joined all the way from the page to the magnified centre.
  function drawRim() {
    const lens = { lx, ly, R: g.R, mag: g.mag, bezel: BEZEL }, { R, lh, cw, colW } = g;
    const strokeAlong = (x0, x1, y) => {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const [mx, my] = lensMap(x0 + (x1 - x0) * i / 8, y, lens); if (i) ctx.lineTo(mx, my); else ctx.moveTo(mx, my); }
      ctx.stroke();
    };
    ctx.lineCap = 'butt';
    for (const [f, x] of shown()) {
      if (lx + R < x || lx - R > x + colW + GUT * cw) continue;
      const i0 = Math.max(0, Math.floor((ly - R - HEAD) / lh)), i1 = Math.min(g.maxLines - 1, Math.ceil((ly + R - HEAD) / lh));
      if (f.el && found.has(f.el) && f.evidence >= i0 && f.evidence <= i1) {
        ctx.strokeStyle = 'rgba(243,222,79,.85)'; ctx.lineWidth = 6;
        strokeAlong(x + GUT * cw - 2, x + (GUT + f.lines[f.evidence].length) * cw + 2, lineY(g, f.evidence) + lh * .3);
      }
      ctx.lineWidth = 2;
      for (let i = i0; i <= i1; i++) {
        const y = lineY(g, i) + lh * .3;
        for (const tk of f.toks[i]) {
          const tx = x + (GUT + tk.x) * cw;
          ctx.strokeStyle = MINI[tk.k];
          strokeAlong(tx, tx + Math.max(cw * tk.t.length - cw * .3, cw * .6), y);
        }
      }
    }
  }

  // Leaders under the lens are drawn through lensMap: magnified in the centre and
  // compressed through the rim, meeting the unmasked SVG exactly at the lens edge.
  function drawLeadersThroughLens() {
    const now = performance.now(), ox = fieldOff.left, oy = fieldOff.top;
    const lens = { lx, ly, R: g.R, mag: g.mag, bezel: BEZEL };
    const map = (px, py) => lensMap(px - ox, py - oy, lens);
    ctx.strokeStyle = '#1D3FCF'; ctx.fillStyle = '#1D3FCF'; ctx.lineWidth = 2;
    for (const { c, el } of curves) {
      if (now - foundAt.get(el) < DRAW_MS) continue; // still drawing in; appears once complete
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const t = i / 160, u = 1 - t;
        const bx = u * u * u * c.p0[0] + 3 * u * u * t * c.c1[0] + 3 * u * t * t * c.c2[0] + t * t * t * c.p3[0];
        const by = u * u * u * c.p0[1] + 3 * u * u * t * c.c1[1] + 3 * u * t * t * c.c2[1] + t * t * t * c.p3[1];
        const [mx, my] = map(bx, by);
        if (i) ctx.lineTo(mx, my); else ctx.moveTo(mx, my);
      }
      ctx.stroke();
      const [ex, ey] = map(c.p3[0], c.p3[1]);
      const inCentre = Math.hypot(c.p3[0] - ox - lx, c.p3[1] - oy - ly) <= (g.R - BEZEL) / g.mag;
      ctx.beginPath(); ctx.arc(ex, ey, inCentre ? Math.min(2.5 * g.mag, 7) : 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawLens() {
    const { R, mag, lh, cw, colW } = g;
    ctx.save();
    ctx.shadowColor = 'rgba(18,22,29,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.fillStyle = '#FBFBF9'; ctx.fill();
    ctx.restore();
    const inner = R - BEZEL;
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.arc(lx, ly, inner, 0, Math.PI * 2, true); ctx.fillStyle = '#EEF0EA'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, inner, 0, Math.PI * 2); ctx.clip();
    // Text is drawn in screen space at a readable size: browsers clamp tiny canvas
    // fonts, so scaling a 2px font up would render far too large.
    const r = inner / mag, sx = v => lx + (v - lx) * mag, sy = v => ly + (v - ly) * mag;
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
    ctx.restore();
    ctx.strokeStyle = 'rgba(18,22,29,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(lx, ly, inner, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.arc(lx, ly, inner, 0, Math.PI * 2, true); ctx.clip();
    drawRim();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    drawLeadersThroughLens();
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

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !g) return;
    if (auto && !reduce) {
      if (Math.hypot(tx - lx, ty - ly) < 2 && ++dwell > 50) { tour++; ({ x: tx, y: ty } = nextTarget()); dwell = 0; }
      lx += (tx - lx) * .035; ly += (ty - ly) * .035;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mini, 0, 0);
    ctx.scale(dpr, dpr);
    for (const [f, x] of shown()) if (f.el && found.has(f.el)) highlight(f, x, true);
    for (const [f, x] of shown()) if (!found.has(f.el) && overEvidence(lx, ly, f, x, g)) mark(f);
    drawLens();
    leaders.style.setProperty('--lx', `${fieldOff.left + lx}px`);
    leaders.style.setProperty('--ly', `${fieldOff.top + ly}px`);
    leaders.style.setProperty('--lr', `${g.R}px`);
  }

  const toLocal = e => { const r = field.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  field.addEventListener('pointermove', e => {
    auto = false; [lx, ly] = toLocal(e); hint.hidden = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { auto = true; ({ x: tx, y: ty } = nextTarget()); }, 2600);
  });
  field.addEventListener('pointerdown', e => { auto = false; [lx, ly] = toLocal(e); });
  reset.addEventListener('click', () => {
    found.clear(); tour = 0;
    chart.querySelectorAll('li').forEach(li => { li.classList.remove('found'); li.querySelector('.cite').textContent = 'not yet located'; });
    count.textContent = '0 / 3 located'; placeLeaders();
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
