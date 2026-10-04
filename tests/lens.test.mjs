import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus, tokenize, computeLayout, overEvidence, lineY, citation, leaderCurve, evidenceTarget, underLens, lensStep, GUT } from '../src/lens.js';

// Regression: when 1a was found its leader ran under the lens and vanished. The lens stopped
// 24 characters into the cited line, so the leader's end was under the glass but outside the
// magnified view. The lens must stop where the leader's end is well inside that view.
test('a found line is shown with its leader end inside the magnified view', () => {
  const files = buildCorpus();
  for (const [w, h] of [[720, 560], [1000, 640], [1200, 640]]) {
    const g = computeLayout(w, h);
    files.forEach((f, i) => {
      if (!f.el || !g.xs.has(i)) return;
      const x = g.xs.get(i), t = evidenceTarget(f, x, g);
      const end = leaderCurve({ right: 0, top: 0, height: 0 }, { left: 0, top: 0 }, f, x, g).p3;
      assert.ok(Math.hypot(end[0] - t.x, end[1] - t.y) < 0.6 * g.R / g.mag, `${f.name} at ${w}px`);
      assert.ok(overEvidence(t.x, t.y, f, x, g), 'arriving there counts as finding the line');
    });
  }
});

// Regression: a leader crossing the lens was drawn at normal size over the glass whenever its
// end was away from the lens centre. Any leader passing under the lens must be magnified there.
test('every leader that passes under the lens is magnified, wherever its end is', () => {
  const lens = { lx: 300, ly: 200, R: 112 };
  const across = { pts: [[100, 210], [300, 205], [500, 190]] };   // crosses the centre, ends far away
  const grazing = { pts: [[150, 400], [250, 300], [395, 260]] };   // last sample just inside the rim
  const clear = { pts: [[100, 500], [300, 480], [500, 470]] };     // never under the lens
  assert.equal(underLens(across, lens), true);
  assert.equal(underLens(grazing, lens), true);
  assert.equal(underLens(clear, lens), false);
});

test('lens speed does not depend on frame rate', () => {
  const one = lensStep(1000 / 60), two = 1 - (1 - lensStep(500 / 60)) ** 2;
  assert.ok(Math.abs(one - 0.035) < 1e-9, 'matches the original per-frame speed at 60fps');
  assert.ok(Math.abs(one - two) < 1e-9, 'two half frames move as far as one full frame');
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
