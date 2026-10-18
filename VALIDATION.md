# Validation record

Executed on 17 October 2026, Europe/Berlin, on the user's Windows PC. No unexecuted check is counted as a pass.

## Commands and outcomes

| Check | Actual outcome |
| --- | --- |
| `npm run check` | 26 Astro/source files checked, 0 errors, 0 warnings, 0 hints |
| `npm test` | 3 tests passed, 0 failures: chronological filtering, inactive registration boundary, demo/unavailable registration safety |
| `npm run build` | Success; ten requested pages plus 404, robots.txt and sitemap.xml generated in `web/dist` |
| Production HTTP checks | All ten requested routes returned 200; unknown route returned 404 |
| Source instructions | SHA-256 matches the supplied attachment: `729E8E4D37544D6041898C612A3C92144541F7D44AFC62C2257C9480081E5537` |

Commands were run using the equivalent local npm CLI, `node .tools/package/bin/npm-cli.js`, because this Codex runtime initially exposed only Node. npm dependencies and lockfile remain standard npm inputs. The initial attempt to install latest TypeScript encountered an upstream peer conflict; TypeScript 6.0.3, supported by `@astrojs/check`, was selected and the final checks above passed. Astro 7.4.0 requires Node >=22.22.0; package engines and README reflect that.

No lint script is configured. No deployment, booking, form delivery or external service test was attempted because those integrations are deliberately absent.

## Browser evidence

Playwright CLI with an isolated Microsoft Edge browser was used against both the local dev server (4321) and production preview (4322).

| Boundary | Result |
| --- | --- |
| All ten routes at 375, 768 and 1440 CSS px | 30 successful page checks; no horizontal overflow; exactly one H1; German language and page description present |
| Homepage visual QA | Full-page screenshots at all three widths inspected; original media, section contrast, typography and stacked mobile flow verified |
| Header and homepage CTAs | Correct internal destinations; menu closes after navigation |
| Internal links | All internal linked paths and cross-page anchors validated; no broken links |
| Keyboard navigation | Native details menu opened with Enter; Escape closed it and restored focus to its summary; visible outline present |
| Browser history | Back and forward returned to homepage and schedule with motion initialized |
| Hero animation | Browser measured headline opacity `0` initially and `1` after the short sequence, on desktop and mobile |
| Repeated route changes | Three homepage/schedule return cycles; ScrollTrigger counts did not accumulate: desktop 18, mobile 16 |
| Reduced motion | Separate reduced-motion context; zero ScrollTriggers and no hidden hero, story or reveal content |
| JavaScript disabled | Separate mobile context; content visible, no overflow, native menu opens and schedule link navigates |
| Missing media handling | All referenced images local and loaded; trainer photograph represented by an explicitly labeled graphic; no video dependency |
| Contact | No form exists; two visibly disabled contact controls; no invented destinations |
| Production resources | No resource requests outside the local origin |
| Cookies | Browser context reported an empty cookie collection |
| Console | No application runtime errors or warnings; Edge emitted informational lazy-image messages only |
| Pre-launch SEO | robots.txt is `Disallow: /`; sitemap is an empty valid urlset; no fictional canonical domain |

The first sandboxed browser/server attempt could not connect because of Windows sandbox isolation. The isolated Edge browser and local servers were then run with the required process/network permissions; the checks above completed successfully.

### Local artifacts

Screenshots are intentionally ignored rather than published to GitHub:

- `output/playwright/home-desktop.png`: 1440px initial view.
- `output/playwright/home-mobile.png`: 375px initial view.
- `output/playwright/home-375-full.png`, `home-768-full.png`, `home-1440-full.png`: complete homepage.
- `output/playwright/schedule-desktop.png`: production schedule page.
- `output/playwright/contact-mobile.png`: contact page.
- `output/playwright/reduced-motion.png`: desktop reduced-motion view.
- `output/playwright/no-js-schedule.png`: no-JavaScript mobile schedule.

## Limits and remaining inputs

This is an internal pre-launch foundation. Real media, logo, detailed biography/qualifications, concrete rinks, confirmed sessions, registration-link semantics, contact destinations/backend, package conditions and complete legal inputs are still required. Tests verify the current empty schedule and inactive contact state, not an external registration or enquiry service. No real video was available to test. No screen-reader audit or physical-device performance profiling was performed. A future hosting provider must serve generated static directory routes and the custom 404 correctly.

The local dev preview is left available at `http://127.0.0.1:4321/` for the user's requested remote review on this PC. This is not a public deployment.

## Hero photography and training spacing revision — 17 October 2026

Replaced the displayed geometric hockey figure with a locally stored Ron Lach/Pexels stock photograph, credited and labeled `Symbolbild`. Its source/license are recorded in `ASSETS.md`. The heading, CTA placement and hero spacing were retained. Astro generated four responsive WebP variants, approximately 31–141 KiB each. The old SVG remains as an unused source artifact.

Added a scoped action wrapper in the training target-group section: the CTA now has a measured 30px gap after the paragraph at 375, 768, 817 and 1440px.

Re-ran `npm run check` (zero errors/warnings/hints), `npm test` (3 passed) and `npm run build` (successful static output and optimized images). Browser checks covered homepage and training at all four widths: no overflow, one H1 per page, no broken images. Hero opacity changed from `0` to `1`; three navigation returns retained 18 desktop ScrollTriggers. Back/forward passed. Separate reduced-motion and JavaScript-disabled contexts loaded the photograph and showed the headline, without overflow; reduced motion created zero triggers. No external resource requests or application runtime errors occurred. The `#zielgruppe` deep link positioned the correct section below the header.

Revision screenshots are stored locally under `output/playwright/hero-revision/` (ignored). The development site remains running for review.

## Vercel review hosting — 18 October 2026

Created `driftwoodmedia/pk-hockey-academy` with `web` as the root, Astro static output, Node 24.x, `npm ci` and `dist`. Deployed GitHub commit `454a83c` using the authenticated Vercel connector. Kept `PUBLIC_LAUNCH_READY=false`, no canonical site URL and Vercel Authentication enabled. A non-expiring shareable link is scoped to the main-branch alias and kept out of Git.

Re-ran Astro checks locally (26 files, zero errors/warnings/hints), all three content tests and the static build successfully. The initial telemetry config write was restricted by the local sandbox; rerunning with `ASTRO_TELEMETRY_DISABLED=1` succeeded.

Hosted checks: all ten content routes, robots.txt and sitemap.xml returned 200 through a fresh HTTP session initialized with the shareable link. All ten pages emitted `noindex,nofollow`; robots.txt retained `Disallow: /`. Browser inspection used the in-app browser without a Vercel login: the share link opened the website, desktop (1440px), tablet (768px) and phone (375px) had no horizontal overflow, the desktop hero photo loaded, and mobile keyboard activation opened the menu. Selecting the schedule closed the menu and loaded the permanent route. No booking or contact service was enabled. The browser recorded Google sign-in warnings/errors on the earlier Vercel login page; these were not academy runtime errors.

The final Vercel deployment (`dpl_GHNCSqoDcW3A2BVmcHGNAbQ4kz38`, Production target, commit `454a83c`) reached READY after running the complete `npm run check && npm test && npm run build` command: 26 files checked with zero errors/warnings, three passing tests and successful static output. Browser back and forward navigation restored the correct homepage and schedule titles. Build infrastructure emitted npm `cache-dir` warnings and a notice that the open-ended package Node engine permits future major upgrades; these did not fail the build. The project is set to Node 24.x.

Added `web/vercel.json`, ignored `.vercel/`, and documented the review workflow in README. Vercel's initial GitHub repository linking returned `repo_no_access`; the first successful deployments read the public GitHub commit directly and did not prove that Git integration worked. No frontend design or motion code changed in this increment.

Follow-up after the user installed the GitHub App: queried the existing project, Git deployment context and Git namespaces. The PK project was still absent from the linked-project list, and the only GitHub namespace was `adorajado`. A fresh connection attempt for `0xJado/pk-hockey-academy` again returned `repo_no_access`.

The user explicitly approved disconnecting the old `adorajado` GitHub login. Removed that login through Vercel's Authentication page; the page subsequently displayed `0xJado` and a successful login-connection toast. The namespace API independently confirmed `0xJado`. Connected `0xJado/pk-hockey-academy` to the existing PK project using the Git settings UI. Both the visible Connected Git Repository section and the authenticated Git deployment context confirmed the correct project/repository pair. Google and email stayed listed as sign-in methods. The existing Multi-Kulti project's Git link remained present in the connector response; its automatic deployment flow was not tested.

Pushed configuration commit `fd44099e8ed8729f85a67e9967f3cdf6d1b0b08d` to `main`. Without requesting a manual deployment, Vercel created `dpl_g3o37kfb5A9fJnwvgxX9BNcuKuhp` for that exact commit and reached READY. Build logs confirmed 26 checked files with zero errors/warnings, three passing tests and successful static output. The branch alias resolved to the new deployment and retained its non-expiring shareable-link access. A fresh HTTP session using that link loaded all ten content pages with 200 responses, one H1 each and `noindex,nofollow`. Reloading the hosted homepage in the browser showed the expected title and content without horizontal overflow. This verifies the automatic main-branch deployment path; feature-branch previews were not separately exercised.

The hosted robots.txt retained `Disallow: /`, and an unknown route returned 404 after applying `web/vercel.json`.

Connection screenshot: `output/playwright/vercel/git-connected.jpg` (local, ignored). No website design or motion code changed. The setup files and documentation were committed and pushed; no shareable-link tokens or credentials were included.

## Supplied crest and flyer branding — 19 October 2026

Integrated Pierre's supplied transparent crest unchanged, with Astro-generated optimized variants in the header, footer, trainer graphic, favicon and configured social metadata. Used the supplied flyer as general visual direction: ice-white, navy and cobalt, condensed display headings, “Skills. Mindset. Zukunft.” and an earlier, prominent training-program section. Shared styles update all ten content pages. Retained the existing licensed stock photo and explicit illustration labels. The flyer is flattened; no standalone trainer portrait, contact destination, qualification or booking claim was extracted into the website. The registration form is deferred and was not incorporated.

Files changed: the original crest and asset documentation; Wordmark, Header, Footer, TrainerCard and TrainingStory; Base metadata; homepage; shared CSS; hero parallax and training accent colors; README and design QA record. No new dependency or backend was added. Original `AGENTS.md` is unchanged.

Commands executed from `web` using the bundled npm CLI (`node ../.tools/package/bin/npm-cli.js`), with `ASTRO_TELEMETRY_DISABLED=1`:

- `run check`: 26 files, zero errors/warnings/hints.
- `test`: all three content tests passed.
- `run build`: successful static output, including optimized supplied-crest variants. Header images are approximately 6/16 KB at 1x/2x; the favicon is approximately 9 KB.

In-app-browser verification covered all ten routes at 375, 768 and 1440 CSS pixels (30 combinations): one H1 per page and no horizontal overflow. German language and pre-launch robots metadata were retained. Fixed a legacy mobile wordmark rule that initially caused overflow. Verified the replacement parallax covers the photo frame at both ends of its scroll range.

Keyboard Enter opened the mobile menu; Escape closed it and restored visible focus to its summary. Selecting the schedule navigated and closed the menu. Browser back/forward restored the correct titles. Three repeated homepage/schedule cycles retained 18 desktop ScrollTriggers, without accumulation. All six homepage images loaded after scrolling. No application console errors or warnings were recorded.

Static fallbacks were checked on the built output using ignored, local-only QA endpoints. With all application scripts stripped, content and images remained visible, the native menu worked, schedule navigation passed and the document had zero scripts. A second endpoint emulated the reduced-motion startup query and CSS branch: zero ScrollTriggers, visible headline, no parallax and negligible animation duration. This was harness emulation; the real OS/browser reduced-motion preference was not toggled in this revision. No real video, physical device or screen reader was available for validation.

Final visual comparison with the source flyer and the resolved findings are in `design-qa.md` (`final result: passed`). Screenshots and comparison images are ignored under `output/design/`. The whole flyer, registration PDF and share-link token are not included in the repository. Existing contact, schedule and legal placeholders remain pre-launch limitations.

The first redesign deployment (`dpl_E5rSmBo9gM2eJbfH8RzvacKhvh6i`, commit `5f48fec`) reached READY with zero Astro errors/warnings, three passing tests and a successful static build. A fresh HTTP session using the existing share link loaded all ten pages with 200 responses, one H1 and noindex; the supplied crest and PNG favicon were served successfully and robots remained `Disallow: /`. A live browser check at a 611px window caught a hero text/photo collision between the original phone/tablet breakpoints. The final stacked brand-layout breakpoint was widened to 900px and image sizing updated accordingly before final delivery.

After the initial breakpoint correction, Astro check again reported zero errors/warnings/hints and the static build succeeded. All ten routes at 611px passed the H1/overflow checks, and 375px remained free of horizontal overflow. Visual inspection at 721px still showed text/photo crowding, so the final layout stacks through tablet widths rather than only through 720px.

The final 900px breakpoint passed another Astro check and static build. Rechecked all ten routes at 768px: one H1 and no horizontal overflow. At 900px the hero is stacked, and at 901px it returns to the split layout. Final captures include `home-tablet.jpg` and `home-901.jpg`; desktop 1440px and phone 375px styling are unaffected by this boundary change.
