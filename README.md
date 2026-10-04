# Manheim Consulting — Interactive hero concepts

A static, GitHub Pages-compatible website with three progressively loaded Three.js hero concepts. The readable page and native contact form work without the animation.

## Local development

```sh
npm install
npm run build-static
npm run dev
```

Edit `index.html` for content and metadata, and the files in `src/` for styles and behavior. Run `scripts/build.bat` on Windows (or `npm run build-static`) after source changes. This updates root-level CSS and JavaScript for GitHub Pages. JavaScript source imports are relative to the generated root-level files. The hero's scene models live in `src/hero-concepts.js`; controls, rendering, and lifecycle live in `src/hero-scene.js`.

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

Three.js 0.160.1 is self-hosted in `vendor/`, with its MIT license. The hero offers three original GPU particle studies, informed by the public MotionSites previews for [Anchor AI](https://motionsites.ai/?prompt=anchor-ai), [Particle Field](https://motionsites.ai/?prompt=particle-field), and [Futuristic Cinematic](https://motionsites.ai/?prompt=futuristic-cinematic):

- **Tidal Field:** a folded particle surface with traveling swells, coherent filaments, and loose spray.
- **Signal Bloom:** a flowing canopy rises from a narrow stem above reflected interference rings.
- **Gravity Well:** an iridescent particle disc spirals around a quiet center.

Each study uses 48,000 seeded particles on desktop or 22,000 on mobile. Custom vertex shaders animate the forms, apply a circular cursor lens, and propagate up to eight overlapping disturbances. A second point pass adds a soft light halo. Move to part the particles, hold to gather them, and release to send a wave. Enter/Space sends a centered wave; Escape clears disturbances. The motion button pauses idle movement while allowing deliberate interactions to finish. Reduced-motion users receive a still signal without animation. Rendering stops offscreen and in background tabs; switching studies disposes GPU resources. An original generated SVG covers disabled JavaScript and unavailable/lost WebGL. The old sphere, constellation, and layers studies have been removed. The original terrain modules remain available but are not loaded by the homepage. Fonts are self-hosted in assets/fonts.

The company-name strip describes whose software has been analyzed; it is not a client or endorsement list. The experience figures and service descriptions use the supplied business facts. Detailed service pages, additional credentials, approved case studies, analytics, and Search Console setup can be added later.

## SEO and shipping checklist

See [SHIPPING-CHECKLIST.md](SHIPPING-CHECKLIST.md) for all 20 items, remaining owner details, and analytics activation. Edit supporting pages in scripts/build-pages.mjs and rebuild. The production build includes privacy, terms, thank-you, and 404 pages. Successful JavaScript form submissions redirect to thank-you.html.
