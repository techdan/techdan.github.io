import test from 'node:test';
import assert from 'node:assert/strict';
import { sendInquiry, CONTACT_ENDPOINT } from '../src/contact.js';

test('sends FormData to the existing provider and accepts successful delivery', async () => {
  const data = new FormData();
  data.set('name', 'Form verification');
  const controller = new AbortController();
  await sendInquiry(data, { signal: controller.signal, fetchImpl: async (url, options) => {
    assert.equal(url, CONTACT_ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.body, data);
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.signal, controller.signal);
    return { ok: true, status: 200 };
  }});
});
for (const [status, message] of [[429, /too many requests/], [422, /couldn’t accept/], [503, /temporarily unavailable/]]) {
  test(`does not report success on HTTP ${status}`, async () => {
    await assert.rejects(sendInquiry(new FormData(), { fetchImpl: async () => ({ok:false, status}) }), message);
  });
}
for (const reason of ['network failure', 'AbortError']) {
  test(`handles ${reason} without claiming delivery`, async () => {
    await assert.rejects(sendInquiry(new FormData(), { fetchImpl: async () => { throw new Error(reason); } }), /couldn’t confirm delivery/);
  });
}
