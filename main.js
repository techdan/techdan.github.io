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

// The optional scene never blocks the form or readable page.
const loadTerrain = () => import('./topology.js')
  .then(({ mountTerrain }) => mountTerrain(document.getElementById('terrain-canvas')))
  .catch(() => { /* Keep the static terrain visible if WebGL cannot load. */ });
if ('requestIdleCallback' in window) window.requestIdleCallback(loadTerrain, { timeout: 1800 });
else window.setTimeout(loadTerrain, 200);
