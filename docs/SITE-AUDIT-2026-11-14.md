# Website audit — 14 November 2026

Scope: the current STRATO build, all 19 public HTML routes at 1440/768/375px, plus a visual walkthrough in the in-app browser and the protected-host fictional registration/admin journey. Genuine submission stays disabled. This is an executed engineering/UX audit, not a guarantee against every failure or a legal/accessibility certification.

## Results and fixes

- **274 automated checks passed**: pages, one h1, German document language, titles/descriptions, noindex, heading order, unique IDs, image alternatives and decoded assets, internal links, responsive overflow, mobile menu/Escape, no-JS headings and disabled form input. Public Sanity CDN images were allowed and checked; unrelated external resources were blocked.
- **13 footer destinations passed** native/client navigation and scroll/history checks. Switching the registration route to native navigation initially exposed a real missing motion/menu initialization; the hosted starter-browser suite caught it. The native-page initialization and its footer regression expectation are fixed. A full-site audit rerun including this same footer test passed locally.
- Corrected the schedule page's h1→h3 skip to h1→h2, preserving embedded homepage headings and styling.
- Replaced the contact page's self-referencing secondary CTA with the verified Academy email link. No WhatsApp destination was invented.
- Improved Impressum text spacing, body size and visibly underlined contact links. No legal wording or the user's separate uncommitted privacy/legal changes were committed by this work.
- The original two-page PDF downloaded in IAB: **203522 bytes**, SHA-256 **5ad3b2845008b09213280653fda49d6fb15882a4ddbfcb0ca975dc664162bff9**. This verifies delivery/integrity, not legal suitability or paper hand-in acceptance.
- The connected protected STRATO form/PHP/MariaDB/staff HTTP journey passed **27 checks**, including response loss after commit, duplicate-free retry, authenticated reading, human status confirmation, health withdrawal and logout denial. Disposable accounts/tables/helpers were removed. Permanent personal credentials and genuine collection remain separate.

## Visual walkthrough

Screenshots below were captured, saved and inspected in the current IAB audit. The requested viewport override did not change that browser's measured 707px viewport, so these are labelled accordingly. The automated browser checks independently exercised the three specified widths. No screenshot is presented as a 1440px IAB capture.

1. **Homepage — healthy.** Clear schedule/contact CTAs, coherent brand and readable introductory copy. The screenshot records the first viewport; lower-page motion was checked by the existing browser suite rather than inferred from one image.

   ![Homepage at the measured IAB viewport](../output/playwright/full-site-audit/iab/01-start-707.png)

2. **Schedule — healthy empty state; launch content pending.** It correctly states that no sessions/places are currently published. The heading-level issue was fixed and recaptured; no fictional booking option was exposed.

   ![Schedule after the heading fix](../output/playwright/full-site-audit/iab/02-schedule.png)

3. **Registration/PDF — protected and intentionally inactive.** Field groups and the disabled notice are visible. Fictional enabled-form behavior is covered separately by 31 local browser/PHP checks and the connected host checks; the public screenshot does not claim live submission.

   ![Disabled registration](../output/playwright/full-site-audit/iab/03-registration.png)

4. **Navigation — healthy.** The menu exposes the main destinations. Escape behavior is exercised automatically, including on the native registration page. Native back/reload confirmation retains uncertain retry state in the fictional journey.

   ![Expanded navigation](../output/playwright/full-site-audit/iab/04-navigation.png)

5. **Contact — healthy; WhatsApp deliberately unavailable.** The contact address is a real mailto link. The final CTA now opens email instead of returning to the same contact page. The full-page capture was retaken after scrolling to allow the below-fold heading reveal to finish.

   ![Contact with the corrected email CTA](../output/playwright/full-site-audit/iab/05-contact.png)

6. **Impressum — readable; approval pending.** Confirmed business/contact facts are rendered, with a visible pre-launch review notice. Text spacing and link visibility were fixed. Provider/legal acceptance is not conferred by this visual review.

   ![Impressum after readability fixes](../output/playwright/full-site-audit/iab/06-impressum.png)

7. **Privacy — readable; final alignment pending.** The local substantive policy and contents list render with a clear review notice. This local build includes the user's pending uncommitted legal/privacy work; it is not evidence that this wording has been pushed or deployed. The private staff session uses a 20-minute idle/8-hour absolute lifetime, which still needs alignment with the final cookie wording; that differs from the one-hour editorial preview session.

   ![Privacy notice](../output/playwright/full-site-audit/iab/07-privacy.png)

## Evidence and limits

Reproduce the engineering audit with `npm run test:strato:audit --prefix web` after `build:strato`; screenshots and JSON are under ignored `output/playwright/full-site-audit/`. The test is wired into quality CI. These screenshots remain local, so their relative links resolve in the workspace, not on GitHub.

Other executed checks in this increment: 87 website unit tests, zero Astro diagnostics, 31 fictional registration browser/PHP checks, 18 private-runtime/installer checks, 12 release/rollback checks, 63 staff/104 intake/8 maintenance PHP assertions and a verified 146-file static artifact. CMS publication/withdrawal/invalid-content scenarios, preview, staff lifecycle/restore and interview omission run in the full quality workflow; report the final hosted result separately rather than treating a configured job as passed.

The first full hosted quality run for `a830399` failed only at the footer/native initialization regression described above, so it was not deployed. Its earlier steps, including the new permanent-runtime and registration tests, passed. The corrected source must pass a fresh hosted run before protected publication.

Remaining human/provider acceptance: permanent Pierre credentials and operator use, representative Sanity/Studio editing, genuine training/venue data and media permissions, final legal/text/provider-contract alignment, manual assistive-technology/actual-device checks, verified paper hand-in instructions, and explicit real-registration/public-launch decisions. The slow-upload hard deadline and restricted database-user questions remain documented hosting limitations; no timeout fix or extra database user is claimed. Automatic testing cannot establish legal correctness, real email delivery, human operational acceptance or universal assistive-technology compatibility.
