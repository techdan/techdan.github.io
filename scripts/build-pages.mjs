import { readFile, writeFile } from 'node:fs/promises';

const origin = 'https://www.manheimconsultingexperts.com';
const home = await readFile('index.html', 'utf8');
const footer = home.match(/<footer[\s\S]*?<\/footer>/)[0].replace('href="#"', 'href="/"');
const pages = [
  ['404', 'Page not found', 'The page you requested could not be found. Return to Manheim Consulting or discuss a software litigation matter.', '404 / A DIFFERENT PATH', 'Let’s find your way back.', '<p>This page may have moved, or the address may be mistyped.</p><a class="button button-primary" href="/">Return home ↗</a><p><a href="/#contact">Discuss a matter</a></p>', false],
  ['thank-you', 'Thank you for your inquiry', 'Next steps after contacting Manheim Consulting about software litigation technical consulting.', 'MESSAGE RECEIVED', 'Thank you for reaching out.', '<p>If you arrived here after sending the contact form, your inquiry was accepted by our form provider. We’ll follow up to discuss your technical needs.</p><p>Please wait to share confidential materials until we have agreed on a suitable way to exchange them. Sending an inquiry does not establish an engagement.</p><a class="button button-primary" href="/">Back to Manheim Consulting ↗</a>', false],
  ['privacy', 'Privacy policy', 'How Manheim Consulting handles website inquiries, service providers, and optional analytics, and how to contact us about privacy.', 'WEBSITE INFORMATION', 'Privacy policy', `<p class="policy-date">Updated September 13, 2026</p>
<p>This notice describes information handled through the Manheim Consulting website. Contact us through our <a href="/#contact">inquiry form</a> with questions about this notice or your information.</p>
<h2>Information you provide</h2><p>The inquiry form asks for your name, email address, an optional firm or organization, and your message. We use these details to respond and discuss potential consulting work. Please do not submit confidential case materials or sensitive personal information through this initial form.</p>
<h2>Website and form providers</h2><p>Our website host processes technical connection information, such as IP addresses and browser requests, to deliver and protect the website. Formspree processes form submissions and delivers them to us. Its processing may take place in the United States and other countries where it operates. Read <a href="https://formspree.io/legal/privacy-policy/">Formspree’s privacy policy</a> and <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s privacy policy</a> for provider details.</p>
<h2>Cookies and optional analytics</h2><p id="analytics-disclosure">Optional analytics is currently disabled on this website.</p><p>When optional analytics is enabled, you can accept or reject it and change your choice through Cookie settings in the footer. We store that preference in your browser for up to six months. The form and website remain available when you decline.</p>
<h2>Retention and requests</h2><p>Inquiry correspondence may be retained for follow-up, business records, and applicable legal requirements. To ask about access, correction, or deletion, use our <a href="/#contact">contact form</a> and identify your request as a privacy inquiry. Available rights and any exceptions depend on applicable law.</p>
<h2>External links and changes</h2><p>Links to social profiles and other websites take you to services with their own privacy practices. We may update this notice as the website or its services change; the date above identifies the latest revision.</p>`, true],
  ['terms', 'Terms and conditions', 'Terms for using the Manheim Consulting website, including inquiries, consulting engagements, intellectual property, and third-party links.', 'WEBSITE INFORMATION', 'Terms and conditions', `<p class="policy-date">Updated September 13, 2026</p>
<p>These terms apply to your use of the Manheim Consulting website. Questions can be sent through our <a href="/#contact">contact form</a>.</p>
<h2>Website information</h2><p>This website provides general information about our technical consulting services. It is not legal advice or a technical opinion about a particular matter. Experience descriptions do not promise a particular outcome.</p>
<h2>Inquiries and engagements</h2><p>Submitting a form does not establish a consulting engagement, confirm availability, or complete any conflict review. Scope, fees, confidentiality arrangements, and deliverables must be agreed separately. Please do not send confidential materials through the initial inquiry form.</p>
<h2>Permitted use</h2><p>You may use this website to learn about our services and make legitimate inquiries. Do not misuse the form, attempt unauthorized access, disrupt the website, or submit unlawful content.</p>
<h2>Content and third-party names</h2><p>Site content and design are protected by applicable intellectual property rights. Third-party names and logos belong to their respective owners. References to software we have analyzed do not imply endorsement by those companies.</p>
<h2>Availability and external services</h2><p>We aim to keep information accurate, but website content and availability may change. External websites and the form provider operate under their own terms. Nothing here excludes rights or responsibilities that cannot be excluded under applicable law.</p>
<h2>Updates</h2><p>We may revise these website terms. The date above identifies the latest version. A separate consulting agreement governs any engagement.</p>`, true],
];
for (const [slug, title, description, eyebrow, heading, content, indexed] of pages) {
  let head = home.match(/<head>[\s\S]*?<\/head>/)[0]
    .replace(/<title>.*?<\/title>/, `<title>${title} | Manheim Consulting</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${description}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title} | Manheim Consulting`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${description}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${origin}/${slug}.html`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${origin}/${slug}.html`)
    .replace(/  <script type="application\/ld\+json">[\s\S]*?<\/script>\s*/, '')
    .replaceAll('href="./', 'href="/')
    .replace('</head>', `${indexed ? '' : '  <meta name="robots" content="noindex, follow">\n'}</head>`);
  await writeFile(`${slug}.html`, `<!doctype html>\n<html lang="en">\n${head}\n<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="shell header-inner"><a class="brand" href="/">MANHEIM<span class="brand-sub">CONSULTING</span></a><nav aria-label="Main navigation"><a class="nav-contact" href="/#contact">Discuss a matter ↗</a></nav></div></header><main id="main" tabindex="-1" class="shell document-page"><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1><div class="document-copy">${content}</div></main>${footer}<script type="module" src="/site.js"></script></body></html>\n`);
}
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/privacy.html', '/terms.html'].map(path => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
