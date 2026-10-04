// Optional analytics never loads before an explicit, current opt-in.
(async () => {
const key = 'mc-analytics-consent-v1';
const lifetime = 180 * 24 * 60 * 60 * 1000;
const settings = document.querySelector('[data-cookie-settings]');
let config;
try {
  const response = await fetch('/site-config.json', { cache: 'no-cache' });
  if (response.ok) config = await response.json();
} catch { /* The readable site and contact form do not depend on analytics. */ }
const id = config?.googleAnalyticsId;
if (/^G-[A-Z0-9]+$/.test(id || '')) {
  const disclosure = document.getElementById('analytics-disclosure');
  if (disclosure) disclosure.textContent = 'With your permission, Google Analytics measures page visits and device/browser information using analytics cookies. We do not send contact form contents to analytics. Google processes this information; see policies.google.com/privacy. You can withdraw permission using Cookie settings.';
  let choice;
  try { choice = JSON.parse(localStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }
  if (!choice || !['accepted', 'rejected'].includes(choice.value) || !Number.isFinite(choice.time) || Date.now() - choice.time >= lifetime || choice.time > Date.now()) choice = null;
  let started = false;
  function start() {
    window[`ga-disable-${id}`] = false;
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: 'none' });
    // Drop query strings, fragments, and referrers which may contain private details.
    window.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: '', page_title: document.title });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(script);
  }
  const panel = document.createElement('section');
  panel.className = 'cookie-panel';
  panel.setAttribute('aria-label', 'Cookie preferences');
  panel.innerHTML = '<h2>Optional analytics</h2><p>May we use Google Analytics cookies to understand visits? Your choice won’t affect the contact form. <a href="/privacy.html">Privacy policy</a></p><div class="cookie-actions"><button type="button" data-choice="rejected">Reject optional</button><button type="button" data-choice="accepted">Accept analytics</button></div>';
  panel.hidden = !!choice;
  document.body.append(panel);
  if (settings) {
    settings.hidden = false;
    settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  }
  panel.addEventListener('click', event => {
    const value = event.target.dataset.choice;
    if (!['accepted', 'rejected'].includes(value)) return;
    try { localStorage.setItem(key, JSON.stringify({ value, time: Date.now() })); } catch { /* Honor the current choice even without persistence. */ }
    panel.hidden = true;
    settings?.focus();
    if (value === 'accepted') start();
    else {
      window[`ga-disable-${id}`] = true;
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_')) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
      if (started) location.reload();
    }
  });
  if (choice?.value === 'accepted') start();
}
})();
