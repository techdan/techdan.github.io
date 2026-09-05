export const CONTACT_ENDPOINT = 'https://formspree.io/f/xjkrepbw';

export async function sendInquiry(data, { fetchImpl = globalThis.fetch, signal } = {}) {
  let response;
  try {
    response = await fetchImpl(CONTACT_ENDPOINT, {
      method: 'POST', body: data, headers: { Accept: 'application/json' }, signal,
    });
  } catch {
    throw new Error('We couldn’t confirm delivery. Your message is still here. Please try again in a moment.');
  }
  if (response.ok) return;
  if (response.status === 429) throw new Error('The form is temporarily receiving too many requests. Your message is still here. Please try again later.');
  if (response.status >= 400 && response.status < 500) throw new Error('The form provider couldn’t accept your inquiry. Please check your email address and try again. Your message is still here.');
  throw new Error('The form service is temporarily unavailable. Your message is still here. Please try again in a moment.');
}
