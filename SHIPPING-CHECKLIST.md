# Website shipping checklist

September 13, 2026. Status describes the local production build, not a deployment.

| Item | Status | Details |
|---|---|---|
| Custom 404 | Done | Root-relative assets work at nested missing URLs. Verify HTTP 404 on the deployed host. |
| Meta title on every page | Done | Unique titles on all five production pages. |
| Meta description on every page | Done | Unique descriptions on all five production pages. |
| CTA above the fold | Done | Existing hero and header links retained. |
| Favicon set | Done | SVG, multiresolution ICO, 180px Apple icon. |
| robots.txt | Done | Crawl policy and canonical sitemap reference. |
| sitemap.xml | Done | Home, privacy, terms; thank-you and 404 excluded and marked noindex. |
| Open Graph image | Done | 1200×630 PNG, absolute URL, dimensions, alt text, large Twitter card. |
| Alt text | Done | Descriptive text on informative images; decorative terrain has empty alt inside a labeled figure. |
| Mobile breakpoints | Done | Checked at 320, 390, 768 and 1440px without horizontal overflow. |
| Sticky mobile CTA | Done | Safe-area spacing; hides while contact is targeted or focused. |
| Loading states | Done | Sending state, duplicate prevention, timeout, terrain fallback. |
| Form error states | Done | Validation and provider/network errors retain entered text. |
| Thank-you page | Done | Redirect only after provider acceptance. No-JavaScript submissions still use Formspree's response page. |
| Privacy policy | Draft implemented | Owner should confirm actual retention and business practices before publication. |
| Terms and conditions | Draft implemented | Website use and engagement boundaries; no invented jurisdiction or business address. |
| Cookie banner | Ready, conditional | With a configured analytics ID: accept/reject, six-month preference, footer settings, withdrawal. |
| Analytics | Needs account ID | Integration implemented but disabled; enter owned GA4 ID in `site-config.json`. |
| Real contact address | Needs owner details | Verified inquiry form retained; public email/mailing address must be supplied. |
| Compressed images | Done | Portrait reduced from 140,098 bytes to 2,978-byte WebP; small vector logos retained. |

## Configuration and verification

Edit supporting-page content in `scripts/build-pages.mjs` and rebuild. All five pages share homepage head styling and footer links. Fonts are self-hosted with their licenses. The build excludes legacy drafts and development files.

To activate analytics, set `googleAnalyticsId` in `site-config.json`, rebuild, and configure the owned property. Disable Enhanced Measurement (especially form interactions and history changes), Google signals, advertising personalization, and user-provided data collection in that account. Check retention and update the privacy notice to match actual practices. The site sends a page-view event without query strings, fragments, referrers, or form values. No real analytics property, ingestion, or dashboard configuration was verified. Do not activate unrelated hosting analytics without updating the consent implementation.

The cookie UI appears only when analytics is configured. No tracker loads before acceptance. Rejecting preserves website/form access; withdrawal disables tracking, clears this integration's cookies, and reloads. Stored preferences expire after 180 days. Browser storage failures do not block the site.

`npm test` checks provider errors, duplicate submits, validation, success redirects, and terrain behavior. `npm run build` emits production pages, crawl files, configuration, social imagery, icons, and font licenses. Browser checks used mocked form and analytics responses, not real messages. They covered four widths, supporting pages, nested 404 rendering, form success/failure, and consent rejection/acceptance/withdrawal.

Publish only `dist/` using the existing Cloudflare Pages instructions in README. After deployment, check canonical-domain redirects, actual missing-page HTTP status, social image reachability, and intended analytics Realtime reporting after opt-in. Set the thank-you redirect in Formspree's dashboard for no-JavaScript submissions if the account supports it.

Privacy references: [Formspree privacy policy](https://formspree.io/legal/privacy-policy/) and [ICO cookie guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/). The policy and terms are website-specific drafts, not a certification of compliance.
