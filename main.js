import { sendInquiry } from './contact.js';

document.getElementById('year').textContent = new Date().getFullYear();
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = document.getElementById('submit-label');
let pending = false;

form.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) event.target.setCustomValidity('');
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pending) return;
  for (const id of ['name', 'message']) {
    const field = document.getElementById(id);
    field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
  }
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  if (data.get('_gotcha')) return;
  pending = true;
  submitButton.disabled = true;
  submitLabel.textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  status.dataset.state = 'pending';
  status.textContent = 'Sending your inquiry…';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    await sendInquiry(data, { signal: controller.signal });
    form.reset();
    status.dataset.state = 'success';
    status.textContent = 'Thank you. Your inquiry has been sent. We’ll be in touch.';
    window.location.assign('/thank-you.html');
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.message || 'We couldn’t confirm delivery. Your message is still here. Please try again in a moment.';
  } finally {
    window.clearTimeout(timeout);
    pending = false;
    submitButton.disabled = false;
    submitLabel.textContent = 'Send inquiry';
    form.removeAttribute('aria-busy');
  }
});

// The hero lens is optional: the page and form never wait for it or depend on it.
const byId = (id) => document.getElementById(id);
const loadLens = () => import('./lens.js')
  .then(({ mountLens }) => mountLens({
    field: byId('lens-field'), canvas: byId('lens-canvas'), hint: byId('lens-hint'), chart: byId('lens-chart'),
    count: byId('lens-count'), leaders: byId('lens-leaders'), grid: byId('hero-grid'), reset: byId('lens-reset'),
  }))
  .catch((error) => console.warn('Lens unavailable; showing the static texture.', error));
if ('requestIdleCallback' in window) window.requestIdleCallback(loadLens, { timeout: 1200 });
else window.setTimeout(loadLens, 200);
