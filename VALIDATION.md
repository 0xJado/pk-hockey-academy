# Validation record

## Git handoff — 20 October 2026

At the user's request, grouped the pending work into three cohesive commits: training-card visuals/assets and their documentation; the separate Sanity CMS and ignore rules; the public camp gallery, On-Ice/Off-Ice sections, edge spotlights, tests and remaining documentation. Earlier entries describing work as local/uncommitted record the status at the time of those checks.

Immediately before committing, fetched `origin/main` and confirmed no divergence. Re-ran web Astro check (40 files, zero errors/warnings/hints), all 16 web tests and the static build, plus Studio TypeScript check, its asset-validation test and Studio build with explicit test identifiers. All passed. Only environment examples are included; credentials, dependencies, generated output and QA artifacts remain ignored. The user authorized pushing these commits to `main`. The real Sanity project, administrator invitations, Studio deployment and build webhook still require connection; pushing source does not activate CMS uploads.

## Follow-up: five-column grid and edge-only spotlights — 20 October 2026

Changed camp media grids to five square columns on desktop. CMS photo display choices are normal, spotlight left, or spotlight right. Spotlights reserve exactly two columns/two rows, exclusively desktop columns 1–2 or 4–5. The shared packing function fills free cells without overlap; normal tiles cannot inherit a poster's spotlight. Three-column tablet grids keep spotlights at an edge, and one-column phone grids render ordinary full-width tiles. Thumbnails crop to their cells; enlargement preserves the complete photograph. Photo captions/credits overlay tiles; native video controls remain usable, with full text alternatives below the grid.

Files added: `web/src/lib/gallery-layout.ts`, `web/src/components/GalleryTile.astro`, `web/tests/gallery-layout.test.mjs`. Updated gallery types, normalization/query, GalleryMedia, interactions, CSS, existing gallery boundary tests, Studio photo schema, README, Studio guide and this record. No new package, real media, account or deployment was added. No new animation was introduced; reduced-motion rules and existing motion lifecycle remain intact.

Keyboard/DOM/lightbox order follows the current visual layout. Filtering repacks visible tiles, and breakpoint changes update their order while retaining an open photo. New media-query listeners use the existing abort/disconnect cleanup. Initial five- and three-column coordinates are rendered in static HTML, so edge placement also works without application scripts.

Executed checks:

- Final `web`: Astro check, **40 files, zero errors/warnings/hints**; **16 tests pass**; successful final static build. Temporary spotlight and script-free test routes are absent from final source/output.
- Studio: TypeScript check, **1 test passes**, successful Studio bundle build and schema extraction to ignored `output/gallery-spotlight-schema.json`, using explicit test identifiers.
- New tests cover ordinary 20-photo grids, exact 2×2 left/right occupancy, 72 combinations of 60 tiles across 5/3/1 columns, no collisions/out-of-bounds/middle positions, filter compaction, unsupported spotlight values and video/poster independence.

In-app-browser verification used a temporary labeled fixture with 20 graphics, three spotlights and one video-poster tile. At 1440px, normal tiles measured approximately **246.4 × 246.4px**, spotlight tiles **504.8 × 504.8px**, with a 12px gutter. Confirmed left column 1/span 2, right column 4/span 2 and row span 2. Checked widths **1440, 1001, 1000, 768, 700 and 375px**: correct 5/3/1 column breakpoints, square dimensions, edge positions and no horizontal overflow. Desktop and phone views were inspected visually.

Clicking the right spotlight opened the full photo at its visual album position (11/20); changing to phone size retained that photo and updated its position to 7/20. Escape and reopening worked. Video filtering packed the single remaining video into row 1/column 1; photo filtering restored 20 photographs, edge spotlights and lightbox behavior. Video notes were hidden/restored with filters. No application warnings/errors were recorded in this session.

A **script-stripped built fixture** was served through the already-running static preview on port 4322. It contained zero script tags and retained the five-/three-column spotlight placements and one-column fallback at 1440/768/375px, with loaded local photos and no overflow. No global browser JavaScript setting was changed. A second preview launch was refused because that preview already existed; it was reused without stopping/replacing it. All temporary QA pages were removed by the final build. Actual OS reduced-motion switching, physical-device testing and real authenticated CMS uploads were not repeated in this layout increment.

Preview: `http://127.0.0.1:4323/galerie` or the existing static preview at `http://127.0.0.1:4322/galerie`. The gallery remains empty until real albums are connected. Content/Studio activation requirements remain unchanged in the earlier CMS record and Studio setup guide.

## Follow-up: On-Ice / Off-Ice gallery sections — 20 October 2026

Added an optional **Galerie-Bereich** choice to photo/video uploads: On-Ice, Off-Ice, or Weitere Camp-Momente. Existing/unassigned media remain visible in the last group. Video posters inherit their video's assignment. The build query/normalizer passes this field through to stable sections, preserving media order within each. Public sections have H2 headings, counts and native jump links; media filters hide empty sections/links and recalculate visible counts. Lightbox navigation spans all album photos. Existing scoped motion and reduced-motion behavior are preserved; no new animation or dependency was added.

Files updated: `studio/schemaTypes/gallery.ts`, `web/src/types/gallery.ts`, `web/src/lib/gallery.ts`, `web/src/lib/gallery-interactions.ts`, `web/src/components/GalleryMedia.astro`, `web/src/styles/gallery.css`, `web/tests/gallery.test.mjs`, root README, Studio README and this log.

Checks executed: `web` Astro check (37 files; zero errors/warnings/hints), 11 passing web tests and successful final static build; Studio TypeScript check, 1 passing Studio test, successful Studio build and schema extraction to ignored `output/gallery-sections-schema.json` using test identifiers. Two new tests cover the 20-photo split, stable ordering, missing/unknown section values, empty groups and a video assigned differently from its poster.

Browser verification used a clearly labeled temporary fixture with 20 local test graphics plus one video-poster entry, removed before the final build. At 1440/768px the tile grid had two columns, at 375px one column; no horizontal overflow. All three section headings and links appeared. Opening a photo showed “Foto 1 von 20”; previous navigation wrapped to “Foto 20 von 20”, including across section boundaries; Escape closed it. Photos filtering showed 20 photos with counts 10/9/1; Videos showed just the Off-Ice section with one item and hid empty sections/jump links; Alle restored all three sections and 21 items. No application errors/warnings were recorded for the fixture. Real authenticated CMS upload remains dependent on connecting the project, as described below.

## Camp gallery and Sanity CMS — 20 October 2026

Implemented locally; no commit, push, live CMS provisioning, invitations or deployment performed. Preserved the existing uncommitted training-card/design changes.

Files added: `studio/` (pinned npm manifest/lockfile, strict TS, German Studio configuration, gallery photo/video/album schemas, asset validation, tests, environment template and setup guide); gallery types, build-time retrieval/normalization and browser interactions in `web/src/`; three gallery components; `/galerie`, `/galerie/[slug]`, `/verwaltung`; gallery CSS and boundary tests. Updated Header, Footer, Base metadata, homepage teaser, sitemap, privacy draft, environment template, ignore rules, README and asset documentation. Existing academy content and motion implementation were not replaced.

Design: the site's established ice-white, navy and cobalt system, condensed headings, a CSS rink graphic for the empty state, image-led album cards, native videos and a centered photo dialog. No fictional camps, images or coach identities are published. Gallery cards/empty-state copy reuse scoped reveals; modest image hover scaling respects reduced motion. The gallery custom element disconnects listeners/observers and pauses videos when leaving a page.

Commands actually run using `node ../.tools/package/bin/npm-cli.js`:

| Project / check | Result |
| --- | --- |
| `web`: `run check` | 37 files, zero errors/warnings/hints |
| `web`: `test` | 9 passing tests: existing booking safety plus CMS configuration, publication filters, ordering, invalid media and API failures |
| `web`: `run build` | Successful final static build; temporary QA routes absent |
| `studio`: `run check` | TypeScript passes |
| `studio`: `test` | 1 passing asset type/size validation test |
| `studio`: `run build` | Successful bundle using explicit synthetic project/dataset identifiers; no remote project created |
| `studio`: `run schema:extract -- --path ../output/gallery-schema-final.json` | Schema extracted successfully; ignored local artifact |
| `git diff --check` | No whitespace errors; existing LF/CRLF normalization notices |

Studio installation initially needed network permission. Astro needed permission to use its user configuration directory. A repeated schema extraction refused to overwrite the earlier QA artifact; the final extraction succeeded at the new path above. Web tests have no dependency on installing the separate Studio package. A search of final `web/dist` found no synthetic project identifier, test token or test-album copy.

In-app-browser checks:

- Final `/galerie` and `/verwaltung` at **1440, 768 and 375px**: six combinations, one H1, German metadata, `noindex,nofollow`, no horizontal overflow. Desktop, tablet and phone screenshots inspected.
- Phone menu opens; Escape closes it and returns focus to its summary. Gallery/navigation links are present.
- A temporary, explicitly labeled local fixture exercised the actual gallery components with two local SVGs and two generated, silent WebM clips. It was removed from source and the final build.
- Photo dialog opens, centers correctly, locks background scrolling, changes photo with arrow keys, closes with Escape and restores focus/scrolling. Fixed its initial missing auto margins.
- Photos/videos filters show the correct two media entries, update pressed states/status and pause filtered-out videos. The generated video played with native controls; starting another paused the previous one.
- Settled back/forward navigation restores the pages and working gallery filters. Three repeated cycles retained one gallery element and one ScrollTrigger, without accumulating triggers. QA must allow Astro's transition to complete before clicking the newly restored UI.
- Reduced-motion **startup harness** overriding the media query produced zero ScrollTriggers and visible album content. CSS reduced-motion rules were inspected. The real OS/browser preference was not toggled; this is not physical-device or native media-emulation verification. Astro emitted its expected reduced-motion transition warning in that harness.
- A script-stripped static fixture had zero scripts, all four media entries, loaded photo links, hidden enhancement-only filters and native video controls/posters. This checked content fallback; its temporary font/brand asset proxy was incomplete, so it is not a complete JavaScript-disabled visual signoff.
- No application console errors were reported on the final gallery/administrator entry checks. Temporary QA asset endpoints produced development errors while being corrected; all were removed before final checks.

Preview: `http://127.0.0.1:4323/galerie` (new local dev session). Setup and Pierre's editing workflow: [`studio/README.md`](studio/README.md).

Remaining external verification: real Sanity project/private dataset, dedicated server-only read token, Studio hostname/CORS, Pierre/admin membership, authenticated photo/video uploads and publication/withdrawal through a build webhook. No account access or live synchronization is claimed. Sanity dataset assets remain publicly retrievable by URL even for drafts; Studio guidance requires clearing rights before upload. Real licensed camp media and reviewed privacy/consent/removal procedures are required before publication. Physical-device, screen-reader and actual academy video-format checks remain unperformed.

## Original website validation

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

## On-Ice / Off-Ice training cards — 20 October 2026

Fast-forwarded the clean local checkout to the cloud-session commit `d9cfdc7`, preserving its supplied Off-Ice image. Removed the explicit diagonal CSS `clip-path` from the photo frame; the source image did not have a missing corner. Generated a fictional On-Ice youth-practice image with the built-in Image Gen tool and saved it with the full prompt in `web/src/assets/`. Provenance and visible illustration labeling are documented in `ASSETS.md`.

The shared `TrainingStory` now renders matching rectangular 16:9 photographs on `/` and `/training`. Desktop image, copy and tag rows align; smaller screens retain ordinary stacked cards. Added labeled H3 phase headings and data-driven image alternatives/captions, removed the noninteractive decorative arrows, and fixed the intro's missing mobile word space. Preserved the scoped card reveals and desktop accent handover, removing the obsolete SVG line animation and styles.

Files changed in this increment: `TrainingStory.astro`, `global.css`, `academy.ts`, `lib/motion/index.ts`, the new On-Ice PNG and prompt, `src/assets/README.md`, root `ASSETS.md`, `README.md` and this validation record. No dependency, backend, registration or contact change was required.

Executed from `web` with the bundled npm CLI (`node ../.tools/package/bin/npm-cli.js`) and `ASTRO_TELEMETRY_DISABLED=1`:

- `run check`: 26 files; zero errors, warnings or hints.
- `test`: all three existing content tests passed.
- `run build`: successful static output and local responsive WebP images. On-Ice variants are approximately 13–95 KiB; desktop uses the 640px rendition at approximately 26 KiB.
- `git diff --check`: no whitespace errors; Git reports its existing LF/CRLF normalization notices.

Verified the built static site in an isolated headless Edge session through Playwright CLI:

| Check | Result |
| --- | --- |
| Homepage and training page at 1440, 768 and 375px | All six combinations: no horizontal overflow, one H1, both photographs loaded, both photo clip paths `none` |
| Desktop card alignment | Both photo frames 557 × 313.3125px; copy and tag rows aligned |
| Mobile/tablet presentation | Normal stacked cards, intact image frames, readable captions and wrapping tags |
| Keyboard menu | Enter opens; Escape closes and restores summary focus with a visible 3px outline |
| Schedule navigation and history | Mobile menu navigates to the permanent schedule route; back/forward restores the expected pages |
| Repeated ClientRouter navigation | Three homepage/schedule cycles retain 16 desktop ScrollTriggers without accumulation; mobile homepage has 14 |
| Reduced motion | Actual Playwright media emulation; zero ScrollTriggers, visible cards/photos, no overflow |
| JavaScript disabled | Actual separate browser context at 375px; training cards and both images visible, no overflow; native menu and keyboard schedule navigation work |
| Console and requests | No application errors or warnings; no external requests in the monitored main-page session |

Screenshots and the one-time QA script are ignored under `output/playwright/training-cards/`, including homepage/training captures at all three widths and `reduced-motion.png`. Desktop, tablet and mobile screenshots were inspected visually. The initial sandboxed browser/server could not connect; the final isolated browser and local static preview were run with process/network permissions. QA waits account for Astro's page transition completion, and the JavaScript-disabled menu link was activated with the keyboard.

Local preview: `http://127.0.0.1:4322/`. This increment remains local and has not been committed, pushed or deployed. The generated scene remains labeled `KI-Symbolbild · On-Ice`; approved real academy training photography is still needed to replace the illustrative media. No video was introduced or available to test, and no physical-device or screen-reader audit was performed.

### Follow-up: navy vignette and caption removal

At the user's request, removed the visible captions from both training photos and the unused caption data/styles. Their alt text retains the illustrative provenance. Replaced the bottom-heavy caption shading with a subtle shared navy radial edge vignette and inset shade; the original image files remain unchanged. Updated README and asset documentation to reflect this preview preference.

Re-ran Astro check (26 files, zero errors/warnings/hints) and the static build successfully. Playwright verified both routes at 1440, 768 and 375px: no horizontal overflow, both photos loaded, intact corners, no captions or other text inside either photo, and the same navy radial gradient on both. No runtime errors were recorded. Visually inspected the desktop result. Updated screenshots are `output/playwright/training-cards/no-captions-1440.png` and `no-captions-375.png` (ignored). No new interaction or dependency was introduced; the existing content tests were not rerun for this presentation-only follow-up. Changes remain local, with the preview available at `http://127.0.0.1:4322/`.
