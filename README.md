# Manheim Consulting — Topology

A static, GitHub Pages-compatible website with a progressively loaded Three.js terrain hero. The readable page and native contact form work without the animation.

## Local development

```sh
npm install
npm run build-static
npm run dev
```

Edit `index.html` for content and metadata, and the files in `src/` for styles and behavior. Run `scripts/build.bat` on Windows (or `npm run build-static`) after source changes. This updates root-level `style.css`, `main.js`, `contact.js`, `topology.js`, and the fallback SVG for GitHub Pages. JavaScript source imports are relative to the generated root-level files.

```sh
npm test
npm run build
```

The production build writes a separate `dist/` directory. The existing GitHub Pages workflow can continue serving the repository root; both outputs include the canonical domain, robots.txt, and sitemap.xml. No deployment is performed by these commands.

## Publishing

The public domain is hosted by the existing **Cloudflare Pages** project `manheim-consulting` (`manheim-consulting.pages.dev`). Both `manheimconsultingexperts.com` and `www.manheimconsultingexperts.com` point to that project. It currently uses direct uploads with no Git connection, so pushing to GitHub does **not** update the public domain, even when the separate GitHub Pages build succeeds.

To publish, run `npm test` and `npm run build`, then upload the contents of `dist/` to the existing Cloudflare Pages project using **Create deployment → Production**. A ZIP must contain `index.html` and `assets/` at its root, not an enclosing `dist/` folder. Select **Save and deploy**, then verify the public domain, contact form configuration, and terrain interaction. Upload only the production output; local notes, drafts, tests, and dependencies are not deployment assets.

The Topology v1 source release is commit `9726fdb`, published to Cloudflare Pages on September 5, 2026. The contact form's real delivery was confirmed by the site owner before release.

## Contact

The existing Formspree endpoint is retained: `https://formspree.io/f/xjkrepbw`. It appears both as a native POST action and in `src/contact.js`. There are no public email addresses or phone numbers in the new page or structured data.

The form uses Formspree's `_gotcha` honeypot, native required-field validation, duplicate-submit prevention, a request timeout, and persistent success/error feedback. Failed requests retain entered text. Formspree account settings, spam controls, plan limits, and recipient delivery remain managed in the existing account.

Tests mock the provider. They do not send email or verify inbox delivery. Before publishing, submit one real inquiry yourself to confirm the existing account still delivers correctly.

## Motion and assets

Three.js 0.160.1 is self-hosted in `vendor/`, with its MIT license. The scene is an original procedural landscape inspired by the selected Topology concept. Pointer movement stirs a shallow, damped surface-wave simulation: disturbances propagate through neighboring cells, overlap, and settle after movement stops. There is no sustained gravity well. The simulation lives in `src/ripple-field.js`, copied to the root during the static build. Clicks or taps retain the gold radial pulse and projected evidence marker. Enter/Space triggers a trace from the keyboard and Escape clears it. Reduced-motion users get a static evidence marker. There is no idle animation, and rendering stops after interactions settle, offscreen, or in a background tab. A generated SVG appears while loading or if WebGL is unavailable. Fonts are loaded from Google Fonts with local sans-serif fallbacks.

The company-name strip describes whose software has been analyzed; it is not a client or endorsement list. The experience figures and service descriptions use the supplied business facts. Detailed service pages, additional credentials, approved case studies, analytics, and Search Console setup can be added later.
