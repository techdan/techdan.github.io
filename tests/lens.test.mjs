import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus, tokenize, computeLayout, overEvidence, lineY, citation, leaderCurve, lensMap, GUT } from '../src/lens.js';

// Regression: a leader ending under the lens looked broken. A plain magnifier shows only
// the centre R/mag of what it covers; anything between R/mag and R was hidden, so the
// outside line stopped at the rim and its magnified copy appeared elsewhere. lensMap must
// be continuous: linear in the centre, compressing in the rim, identity at the edge.
test('the lens mapping magnifies the centre and joins the page seamlessly at the rim', () => {
  const lens = { lx: 300, ly: 200, R: 112, mag: 4.4, bezel: 18 };
  const at = (dx, dy) => lensMap(lens.lx + dx, lens.ly + dy, lens);
  const r0 = (lens.R - lens.bezel) / lens.mag;
  // centre: exact linear magnification, so leaders line up with the magnified code
  assert.deepEqual(at(5, -3).map(v => +v.toFixed(6)), [lens.lx + 5 * lens.mag, lens.ly - 3 * lens.mag]);
  // inner edge of the rim
  const [ix] = at(r0, 0); assert.ok(Math.abs(ix - (lens.lx + lens.R - lens.bezel)) < 1e-9);
  // outer edge: a point on the rim stays put, so the line outside meets the line inside
  for (const a of [0, 1, 2, 3, 4, 5]) {
    const dx = Math.cos(a) * lens.R, dy = Math.sin(a) * lens.R, [x, y] = at(dx, dy);
    assert.ok(Math.hypot(x - lens.lx - dx, y - lens.ly - dy) < 1e-9);
  }
  // monotonic along a ray: nothing folds over or disappears
  let prev = -1;
  for (let d = 0; d <= lens.R; d += 0.5) { const [x] = at(d, 0); assert.ok(x - lens.lx > prev); prev = x - lens.lx; }
});

// Regression: the 1b leader stopped short with no end dot. The draw-in animation
// used a fixed 600px dash, so any curve longer than 600px was cut off. Leaders must
// use a normalised path length so the dash always covers the whole curve.
test('leader curves run from the claim row to the start of the cited line, at any length', () => {
  const g = computeLayout(760, 640), files = buildCorpus();
  const row = { right: 420, top: 900, height: 40 };            // far from the field: a long curve
  const field = { left: 480, top: 100 };
  files.forEach((f, i) => {
    if (!f.el) return;
    const x = g.xs.get(i), c = leaderCurve(row, field, f, x, g);
    assert.deepEqual(c.p0, [row.right, row.top + row.height / 2]);
    assert.equal(c.p3[0], field.left + x + GUT * g.cw - 4);
    assert.equal(c.p3[1], field.top + lineY(g, f.evidence) + g.lh * .3);
    assert.equal(c.pathLength, 1, 'dash animation is normalised, never truncated');
  });
});

test('the example corpus is deterministic and cites the three claim lines', () => {
  const a = buildCorpus(), b = buildCorpus();
  assert.deepEqual(a.map(citation), b.map(citation));
  const cited = Object.fromEntries(a.filter(f => f.el).map(f => [f.el, f.lines[f.evidence].trim()]));
  assert.equal(cited['1a'], 'PlaybackPosition pos = request.readPosition(deviceId);');
  assert.equal(cited['1b'], 'table.upsert(key, pos.withTimestamp(clock.now()));');
  assert.equal(cited['1c'], 'return transport.send(target, ResumeResponse.of(last.orElse(START)));');
  assert.ok(a.every(f => f.lines.every(l => !l.includes('§'))), 'evidence markers are stripped');
});

test('the tokenizer classifies keywords, types, strings, and comments', () => {
  const kinds = tokenize('  return SyncResult.rejected("negative offset"); // done').map(t => t.k);
  assert.deepEqual(kinds, ['k', 't', 'p', 'i', 'p', 's', 'p', 'p', 'c']);
});

// Regression: the lens sometimes rendered nothing until a refresh. It measured the
// field once at load; a hidden or not-yet-laid-out field measured 0×0, produced a
// negative column width, and was never re-measured.
test('a field with no size yet produces no layout instead of a broken one', () => {
  assert.equal(computeLayout(0, 0), null);
  assert.equal(computeLayout(800, 0), null);
  assert.equal(computeLayout(0, 560), null);
});

for (const [w, h] of [[360, 420], [720, 560], [1100, 640]]) {
  test(`at ${w}×${h} all three cited lines are visible and reachable by the lens`, () => {
    const g = computeLayout(w, h), files = buildCorpus();
    assert.ok(g.cw > 0 && g.lh > 0);
    files.forEach((f, i) => {
      if (!f.el) return;
      const x = g.xs.get(i);
      assert.notEqual(x, undefined, `${f.name} has a column`);
      assert.ok(f.evidence < g.maxLines, `${f.name} cited line is on screen`);
      assert.ok(x + g.colW <= w, `${f.name} column fits`);
      assert.ok(overEvidence(x + (GUT + 24) * g.cw, lineY(g, f.evidence) + g.lh * .3, f, x, g));
      assert.ok(!overEvidence(x, lineY(g, f.evidence) + g.R, f, x, g), 'a lens well off the line does not match');
    });
  });
}
