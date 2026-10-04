# Manheim Consulting — website roadmap and session handoff

Prepared September 5, 2026. Internal working document, not website copy.

This document consolidates the original competitor research, Dan's decisions, the published v1, and proposed next steps. It supersedes conflicting recommendations in `website-improvement-research.md`. The priorities below are recommendations for the next session, not a record that every feature has been approved for implementation.

## 1. Objective and agreed positioning

Help two audiences quickly determine fit and make contact: attorneys referred to Dan by name, and litigation teams discovering the firm through search. The business outcome is qualified inquiries for source code analysis, not visits or animation engagement alone.

- Present **Manheim Consulting in “we” language**, with **Dan Manheim as the primary consultant**.
- Lead with **source code analysis for software litigation**, especially patent litigation and work supporting counsel and testifying experts.
- Deposition and trial testimony are available, but Dan prefers analysis work; testimony should remain a secondary offer.
- Convey experienced, thorough, dependable work when the technical analysis must be done well. Do not position the firm as a low-cost analyst shop or invent rate comparisons.
- A competitor's “gold standard” comment informed the positioning. It is not an approved public testimonial. Use a public quote only after confirming exact wording, attribution, and permission.
- Preserve a short path to **Discuss a matter**. The contact form is the sole public contact route: **no public email address or phone number**, including in HTML, scripts, structured data, CVs, PDFs, or contact cards.
- Keep Formspree while it meets the need. Dan tested delivery successfully. A free contact option remains a requirement; verify current provider terms if reconsidering providers.
- Keep the approved **Topology** visual direction. “Start with basics” meant limited content scope, not a generic or visually timid site.

Owner-supplied facts used in v1: **15+ years**, **100+ litigation cases**, and experience analyzing software from **Alphabet, Amazon, Apple, Meta, and Microsoft**. The company names describe whose software was analyzed; they do not establish client relationships or endorsements. “Eight figures at issue” was a draft idea, not published proof of results.

## 2. What is already complete

| Area | Current baseline |
| --- | --- |
| Homepage | Navy Topology design, large typography, “See the system. Find the signal.” hero, service-specific eyebrow, prominent contact actions. |
| Positioning | Source code analysis first, “we” voice, Dan identified as principal consultant, testimony secondary. |
| Process | Ingest → Digest → Synthesize, with technical notes, architecture overview, and cited claim charts as outputs. |
| Experience | 100+ cases, 15+ years, six technology areas, clearly labeled software-company name strip. |
| Contact | Existing Formspree endpoint, native POST fallback, required-field checks, honeypot, duplicate-submit prevention, timeout, persistent accessible feedback, retained text after errors. Inquiry contents are not logged. |
| Search foundation | Descriptive title/description, HTTPS www canonical, crawlable HTML, robots.txt, one-page sitemap, Organization/Person/Service structured data, basic social metadata. |
| 3D | Self-hosted Three.js, fluid hover ripples, independent overlapping click waves, click-linked illustrative evidence marker, static fallback, reduced-motion behavior and keyboard interaction. |
| Verification | 18 automated tests pass; production build and browser checks passed. Dan confirmed real form delivery. |
| Security follow-up | Patched npm build dependencies, including Browserslist 4.28.9 and Vite 6.4.3. At the September 5 check: zero known npm vulnerabilities and zero open GitHub Dependabot alerts. This is a dated dependency check, not a comprehensive security certification. |

Do not re-list the old site's missing canonical, sitemap, form fallback, console logging, mixed logo grid, or obsolete analytics snippet as current defects. Those observations describe the pre-redesign site.

### Interaction decisions to preserve

The owner rejected a deeper gravity funnel and wanted second-order, fluid-like ripple effects instead. Pointer motion now stirs shallow waves that propagate, overlap, and settle. Rapid clicks must retain older waves until their own lifetimes end; do not restore a small fixed wave pool that replaces earlier clicks.

“Evidence found” belongs to the click interaction and is labeled illustrative. “System landscape,” “Pause motion,” and an unrelated “Signal located” status were removed. A large yellow canvas focus border was also removed; keyboard focus is indicated through the interaction hint instead. Keep accessible focus feedback when changing this area.

The terrain is a metaphor, not evidence of an automated analysis product. There is no public source-code upload or claim-chart generation service.

## 3. Competitor lessons worth acting on

These summarize the public-page review recorded in the original September 5 research. They are content and usability observations, not measured search rankings, verified claims of competitor quality, or fresh checks of every page. Private relationship notes and unverified staffing claims are deliberately excluded.

| Reference | Useful pattern | Adaptation for Manheim |
| --- | --- | --- |
| [Quandary Peak](https://quandarypeak.com/areas-of-expertise/) | Distinct routes for analysis, expert witnesses, technical expertise, and litigation services. | Create a substantive source-code analysis page. Clearly explain support for the client's existing testifying expert. Do not adopt competitor cost-saving claims as our positioning. |
| [Prolifogy code review](https://www.prolifogy.com/intellectual-property/code-review/) | Concrete explanations of code analysts, capabilities, and engagement options. | Explain deliverables, Dan's role, scope, and how an engagement begins. Confirm staffing and availability language before publishing. |
| [Lumenci](https://lumenci.com/) | Technical services connected to litigation evidence, supported by educational content. | Tie services to usable work product and publish a few strong attorney-oriented guides. |
| [Exponent: Daniel Vasquez](https://www.exponent.com/people/daniel-vasquez) | Detailed qualifications and accessible profile/CV material. | Build a substantial Dan profile. Retain the form contact route and remove direct contact details from any public CV. |
| [Sidespin: Istvan Jonyer](https://sidespingroup.com/istvan-jonyer-phd-expert-witness/) | Specific qualifications and selected experience. | Add supported credentials and accurately described roles in representative matters. |
| [DisputeSoft](https://www.disputesoft.com/) | Clear focus on a recognizable dispute category. | Keep analysis central rather than listing every possible consulting service equally. |
| [Barr Group](https://barrgroup.com/software-expert-witness) | Clear engagement actions and links to distinct litigation needs. | Repeat a consistent “Discuss a matter” action on each substantive page. |
| [Andrew Schulman](https://www.softwarelitigationconsulting.com/) | Extensive original material about source-code examination and methods. | Demonstrate first-hand expertise through Dan-authored explanations and fictional worked examples. |

The broader owner shortlist also included LevelBlue/Elysium Digital, UnitedLex, Kroll, Copperpod, FTI, TechPats, and individual experts. Those are potential future research leads, not a reason to expand v1 into every service they list. Recheck current names, URLs, offerings, and relevance before a new competitive review.

## 4. Recommended next work, in order

### Phase 1 — explain the service and strengthen trust

**1. Build `/source-code-analysis/` as the first substantive service page.**

Target people looking for source code analysis for litigation, litigation source code review, and technical support for a testifying expert. Proposed page outline:

1. Clear service headline and a short statement of who the work helps.
2. Typical questions the analysis addresses, using confirmed examples of actual work.
3. Ingest, Digest, Synthesize explained in more detail than the homepage.
4. Concrete deliverables: documented findings, architecture explanations, and claim charts with supporting citations.
5. How counsel, Dan, and the testifying expert work together.
6. Confirmed technical domains and relevant experience.
7. A short engagement FAQ and the contact action.

Suggested copy to refine: “We examine complex software, develop a clear understanding of the system, and connect technical findings to the questions in your case.” For expert-report support: “We identify technical findings, test competing explanations, and develop well-supported theories for your expert's report.”

Do not imply that analysis will always find infringement or support every claim element. Explain gaps, uncertainty, and competing interpretations where appropriate. Avoid invented turnaround guarantees, immediate-availability promises, or specific secure-review arrangements.

**2. Build `/dan-manheim/` with stronger evidence of expertise.**

Add an approved portrait, a fuller biography, accurate education and professional background, relevant software experience, and Dan's role in analysis engagements. Consider a public CV or qualifications summary with contact details removed. Use the form as the contact destination. Add selected matters or anonymized examples only when the descriptions and disclosure are approved.

This page should reassure a referral visitor that they found the right person and help a new visitor understand who will lead the work.

**3. Add a short engagement explanation.**

Start with a compact section or FAQ, not a separate intake application. Useful questions: Can you support our existing expert? What should we include in an initial inquiry? What work product do you provide? How is scope established? How are findings communicated? Confirm the answers with Dan rather than borrowing competitor operating claims.

**Done when:** both pages contain substantive original HTML, have distinct titles/descriptions and canonicals, are linked from the homepage, appear in the sitemap, and work on mobile and by keyboard. Every contact action reaches the form. No private contact details or unsupported credentials appear in the output.

### Phase 2 — establish a search and inquiry baseline

Set up or verify Search Console access, inspect the homepage and new service/profile URLs, and submit the sitemap. A Google verification TXT record was observed during deployment troubleshooting, but Search Console access and reporting were not inspected.

Audit HTTP/HTTPS and apex/www behavior, with one consistent preferred URL. Do not assume the canonical tag itself redirects visitors. Check real status codes, indexing, rendered text, sitemap entries, and old useful links. Add a deliberate 404 experience as the site grows; test that nonexistent paths are not silently served as successful homepages.

Choose lightweight measurement if desired. Track contact-action clicks and successful inquiry submissions without collecting form text, email addresses, or names in analytics. Keep qualified-inquiry notes separately. Establish a baseline for branded versus nonbranded queries, landing pages, impressions, clicks, and actual inquiries before promising search gains.

Run a mobile performance and accessibility review on the published site. Targets: LCP ≤2.5 seconds, INP ≤200 ms, CLS ≤0.1. These are targets, not measured v1 results. Use lab checks initially and field data when available. Test WebGL failure, reduced motion, keyboard navigation, narrow screens, form errors, and slow connections. Fix measured problems before adding more animation.

**Done when:** indexing and redirect findings are recorded, the sitemap is submitted where access permits, a baseline report exists, and performance/accessibility issues have concrete priorities. Do not equate lab scores or added schema with guaranteed ranking gains.

### Phase 3 — demonstrate the work

**Create one fictional code-to-evidence example.** Show a few system notes, an architecture diagram, and a short claim-chart excerpt. Selecting an element highlights its documented feature and supporting citation. Include an unsupported or uncertain mapping if it helps illustrate rigorous analysis.

Use the existing process as the structure. A clear SVG/HTML interaction may explain the work better than another 3D scene. Preserve the terrain as the visual introduction. Label all materials illustrative and use no client code or confidential matter information.

**Publish one original guide first**, then expand if useful:

- What attorneys should provide before a source-code review begins.
- Ingest, digest, synthesize: from system notes to a cited mapping.
- How source-code analysts and testifying experts work together.

Give each article a named author, original examples, useful answers, and links to the relevant service and contact sections. Prefer a small number of substantial articles over a high-volume generic blog.

**Done when:** the example is understandable without animation, accessible on mobile and by keyboard, and clearly fictional; the first guide reflects Dan's actual method and has been reviewed for accuracy.

### Phase 4 — expand only where distinct content is justified

| Candidate page | Purpose and condition |
| --- | --- |
| `/software-patent-litigation/` | Explain patent-specific technical work after there is enough distinct material to avoid repeating the analysis page. |
| `/software-expert-witness/` | Address testimony-related searches while keeping analysis the primary business emphasis. Clearly distinguish personal testimony from support for another expert. |
| `/insights/` | Organize the first useful articles; a CMS is not required for a small library. |
| Trade secrets, copyright, code similarity, reverse engineering, prior art | Confirm these are services Dan wants to promote and obtain useful supporting material before creating pages. |
| Technical-domain pages | Add only where there is substantial distinct expertise to explain, not one thin page per keyword. |

Avoid near-duplicate pages for each city or keyword. “Software litigation expert” and related phrases can be used naturally in relevant copy; they do not require an exact-match page for every variation.

## 5. Visual and credibility ideas to keep in the backlog

- Replace the DM monogram with a strong approved portrait, or combine the two in a deliberate profile treatment.
- Create a designed social-sharing image. V1 has social text metadata but no dedicated `og:image`.
- Add a compact representative-work section: technical question, approach, useful output. Confirm what can be disclosed; do not invent outcomes or imply the firm caused a recovery.
- Reintroduce selected law-firm logos only if desired and appropriate to display. Source fresh official SVGs or transparent high-resolution files, preserve geometry, and balance perceived size and contrast. Official starting points from the original review: [Quinn Emanuel](https://www.quinnemanuel.com/), [Susman Godfrey](https://www.susmangodfrey.com/), [Russ August & Kabat](https://www.raklaw.com/), [Foley & Lardner](https://www.foley.com/). No refreshed asset pack has been obtained. Firm names in text remain a viable alternative.
- Use precise diagrams and citations as the next source of visual distinction. Further terrain effects are lower priority than explaining the service.
- Consider a compact mobile contact action only if testing shows it helps without covering content or competing with the form.

Design inspiration: [ThreeUI](https://threeui.com/) and its [source repository](https://github.com/MengTo/threeui). The implemented terrain is an original scene; it is not a complete imported template. Stitch and the supplied frontend-design posts were ideation references, not instructions to migrate the working stack or install additional tools.

## 6. Inputs to obtain from Dan

These are content dependencies, not reasons to halt all independent work. Draft page structure and use existing approved facts while identifying missing material explicitly.

- Approved portrait and current biography/CV; identify what may be made public.
- Education, employment history, technical specialties, publications, presentations, and other credentials worth highlighting.
- Two or three representative technical problems and deliverables, with permitted disclosure level.
- How Dan wants to describe collaboration, staffing, scope, deadlines, and initial engagement steps.
- Which additional services should actually be promoted, especially testimony, copyright, trade secrets, prior art, and reverse engineering.
- Whether any law-firm names, logos, or testimonials should return.
- Search Console access and analytics preference when starting measurement work.

## 7. Implementation and publishing handoff

**Workspace:** `C:\src\Github\techdan.github.io-master`

**Live site:** https://www.manheimconsultingexperts.com/

**Repository:** https://github.com/techdan/techdan.github.io — branch `main`.

- `9726fdb`: approved Topology v1; deployed to Cloudflare Pages.
- `2e85de6`: dependency security fixes; committed and pushed. These update build tools. The Cloudflare deployment remains the v1 output; it was not redeployed for that dependency-only commit.
- Cloudflare Pages project: **`manheim-consulting`**, production branch label `main`, currently **direct upload with no Git connection**.
- Verified live deployment: `72b7dca3-41e2-4ce8-a1c1-c90fc9a979cd` on September 5, 2026.
- Both apex and www are attached to that Cloudflare Pages project. GitHub Pages also builds the root on pushes, but **a successful GitHub Pages build does not update the custom domain**.

### Files and build behavior

| File or directory | Role |
| --- | --- |
| `index.html` | Homepage content, form markup, metadata, structured data. |
| `src/style.css`, `src/main.js` | Editable styles and main behavior. |
| `src/contact.js` | Formspree transport and error handling. Endpoint: `https://formspree.io/f/xjkrepbw`. |
| `src/topology.js` | Three.js scene, interactions, lifecycle, accessibility. |
| `src/ripple-field.js`, `src/click-waves.js` | Fluid simulation and independently timed click waves. |
| Root CSS/JS files | Generated static outputs; update through the build, not independently. |
| `scripts/build.bat`, `scripts/build-static.mjs` | Windows build wrapper and root static generation. |
| `vite.config.js`, `dist/` | Production bundling and deployable output. `dist/` is ignored by Git. |
| `tests/` | 18 existing contact/UI, ripple, and click-wave tests. |

Run `scripts/build.bat` after code updates, then `npm test` and `npm run build` for a release. Wait for build completion before testing or packaging its output. For a production preview on this Windows environment, the direct command avoids npm argument-forwarding issues:

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort
```

When adding pages, update the build deliberately: the current Vite setup is a single-page entry. Configure all intended HTML entries and shared assets, then verify that each route exists in `dist/`, uses correct asset paths and cross-page links, has its own canonical, and appears in the sitemap. Merely adding a root HTML file is not sufficient to prove it will be included in the Cloudflare upload.

Publish through the existing Cloudflare Pages project using **Create deployment → Production** and upload only `dist/` contents. A ZIP must have `index.html` and `assets/` at its root, not an enclosing `dist/` directory. Select **Save and deploy**, then verify the public domain and key interactions. Do not upload repository notes, drafts, tests, or `node_modules`. Treat automated Git-to-Cloudflare deployment as a separate future improvement; do not assume it exists.

### Working-tree state to preserve

At handoff, `README.md` has local deployment instructions from this session that were not committed. Automatic approval review rejected that additional documentation commit as beyond the earlier release; Dan has not separately approved it. Do not silently include it in a future unrelated commit.

Other pre-existing local items: deleted `.cursor/rules/general.mdc`, untracked `.cursor/rules/all.mdc`, `Figma Template/`, `new-index.html`, and `website-improvement-research.md`. Preserve these. `new-index.html` is not the current website or a reliable source of approved contact details. This roadmap is also a local planning artifact, not a public page.

## 8. Suggested opening prompt for the next session

> Read WEBSITE-ROADMAP.md and inspect the current site and Git state. Preserve the approved Topology design, the fluid hover and independent click waves, “we” positioning with Dan as lead, and form-only contact. Start with the source-code analysis service page and stronger Dan profile described in Phase 1. Draft substantive copy using the confirmed facts and flag missing credentials or engagement details rather than inventing them. Make the new pages work in the existing static production build, with proper navigation, metadata, canonicals, and sitemap entries. Keep unrelated local changes out of the work. Verify the result before publishing, and remember that the live domain uses a direct-upload Cloudflare Pages project, not the GitHub Pages deployment.

## 9. Source notes and research limits

The original local research is `website-improvement-research.md`. It contains useful source links but also superseded direct-contact recommendations, abandoned design options, and line-number findings about the old homepage. Use this roadmap to interpret it.

The competitor review did not establish search volumes, controlled ranking positions, a backlink inventory, or Search Console performance. Page priorities are hypotheses based on service fit and observed competitor content. Measure results over time; do not promise a ranking position.

Useful primary guidance referenced in the original research: [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [helpful, reliable content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), and [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals). Recheck current documentation when implementing changes that depend on platform behavior. Structured data should match visible facts; it is not a guaranteed ranking boost or rich result.
