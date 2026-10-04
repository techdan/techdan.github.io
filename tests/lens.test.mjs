import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorpus, tokenize, computeLayout, overEvidence, lineY, citation, GUT } from '../src/lens.js';

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
