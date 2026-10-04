# Manheim Consulting website

A static, GitHub Pages-compatible website. The hero ("The Lens") is a progressively loaded canvas animation; the readable page and native contact form work without it.

## Local development

```sh
npm install
npm run build-static
npm run dev
```

Edit `index.html` for content and metadata, and the files in `src/` for styles and behavior. Run `scripts/build.bat` on Windows (or `npm run build-static`) after source changes. This updates root-level CSS and JavaScript for GitHub Pages. JavaScript source imports are relative to the generated root-level files. The hero lives in `src/lens.js`.

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

`src/lens.js` draws a minimap of example source files with a magnifier that finds the three lines supporting an example claim chart (the code and claim are illustrative, and labeled as such on the page). Its pure parts (example corpus, tokenizer, layout, hit test) are covered by `tests/lens.test.mjs`. The field re-measures itself with a `ResizeObserver` and waits until it has a real size before drawing, so a page opened in a background tab or a hidden frame still starts correctly. Without JavaScript the field shows a static code texture. Reduced-motion users get the finished chart without the moving lens. Rendering pauses offscreen.

The link-sharing image `assets/social-preview.png` (1200×630) is drawn by `scripts/social-preview.html` using the same example code as the hero. After design changes, run `npm run social-preview` (needs Chrome or Edge; set `CHROME_PATH` if neither is in the usual place).

Fonts (Newsreader, Public Sans, IBM Plex Mono) are self-hosted from `@fontsource` packages; `npm run build-static` copies them into `assets/fonts` with their OFL licenses.

The company-name strip describes whose software has been analyzed; it is not a client or endorsement list. The experience figures and service descriptions use the supplied business facts. Detailed service pages, additional credentials, approved case studies, analytics, and Search Console setup can be added later.

## SEO and shipping checklist

See [SHIPPING-CHECKLIST.md](SHIPPING-CHECKLIST.md) for all 20 items, remaining owner details, and analytics activation. Edit supporting pages in scripts/build-pages.mjs and rebuild. The production build includes privacy, terms, thank-you, and 404 pages. Successful JavaScript form submissions redirect to thank-you.html.
