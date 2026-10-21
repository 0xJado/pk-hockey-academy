# Validation record

## Media kit — 20 October 2026

Before pushing, integrated the newer gallery/Sanity commits from main, preserving their footer links, sitemap entries and documentation. Re-ran Astro check (42 files, zero errors/warnings/hints), all 16 web tests and the static build successfully on the combined source.

Added `/medienkit` with one original logo download, an optimized preview and a footer link. Astro check passed for 28 files with zero errors, warnings or hints; all three existing content tests passed; the static build succeeded.

Chromium/Playwright checks against the production preview at 375, 768 and 1440px verified the image loads, exactly one H1 and download link, no horizontal overflow or application runtime errors, footer navigation and browser back/forward. Actual browser downloads used `PK-Hockey-Academy-Logo.png`; all three matched the original PNG's SHA-256 and 1,558,622-byte length. A JavaScript-disabled page retained the download link. Noindex metadata, robots `Disallow: /` and the empty pre-launch sitemap were preserved. Browser checks used reduced motion. Screenshots are ignored under `output/playwright/media-kit/`. No deployment was performed.

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
## Local-only gallery placeholders — 20 October 2026

The user supplied four photographs and one video for temporary gallery demonstration, explicitly requesting that they stay outside Git. Prepared optimized WebP copies, a poster and a silent 24.53-second MP4 locally; originals are untouched. All media, personal metadata and the album manifest live under the ignored `web/.local-gallery/` folder, outside `public/`. Preparation/QA tools and screenshots are also ignored. No media was uploaded to Sanity or another service, committed, pushed or deployed.

Added an optional development-only filesystem adapter and media middleware, with byte-range support for native video seeking. Existing gallery components accept local media URLs, label preview albums prominently and omit unknown dates/locations. On-Ice has a left spotlight, normal photo and video; Off-Ice has a normal photo and right spotlight. Desktop retains five columns, tablet three, phone one. Existing hover/reveal/reduced-motion behavior is reused; no new animation system or browser interaction code was introduced. Node type definitions are the only added project dependency (development only).

Files changed: `.gitignore`; gallery types, source adapter and image URL helper; album index/detail pages; GalleryAlbums, GalleryImage and GalleryMedia; new GalleryPreviewNotice, `src/lib/local-gallery.ts`, `web/local-gallery-plugin.mjs` and local gallery tests; gallery CSS; Astro config; package manifest/lock; README, ASSETS and this record.

Executed with the bundled npm CLI from `web`:

- `run check`: 44 files, zero errors/warnings/hints.
- `test`: 18 passing tests, including production filesystem gating and local filename validation.
- `run build`: successful static build with 13 pages; no local album generated.
- `git diff --check`: clean after removing an extra documentation blank line. `git check-ignore` confirms the manifest and sample assets are ignored; `git ls-files web/.local-gallery` is empty.

### Verification report: local gallery samples

Story: opening the gallery album reads an ignored local manifest, serves its media through the dev server, and renders the existing gallery; production must exclude both data and media.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Album entry → local data | Passed | Dev logs return 200 for index/detail; index reports four photos and one video. Detail has one H1, no inferred date and forced noindex. |
| Local data → media response | Passed | Actual video byte-range requests return 206, invalid range 416; POST is 405. The manifest is not served by the media endpoint (404). Media responses use no-store and noindex headers. |
| Media response → browser | Passed | All four photos load. Native playback reaches readyState 4 at 480 × 848; duration 24.533 seconds. Poster is visible before playback. |
| Production exclusion | Passed | Audited all 108 output files: no matching sample media hashes, sample route, title or local media reference. Built preview returns 404 for both the sample album and its MP4. |

In-app-browser checks at 1440, 768 and 375px found no horizontal overflow. Desktop spotlights occupy columns 1–2 and 4–5 at approximately 505px square; tablet uses the appropriate three-column edges; phone tiles are 320px square. Visuals were inspected at all three widths. Keyboard Enter opens the photo dialog, ArrowRight advances from photo 1 to 2, Escape closes and restores visible focus. Filters show four photos or one video and pause hidden playback. Mobile menu Enter/Escape and album/index browser back/forward pass. Repeated album navigation retains one gallery element. Browser logs contain no warnings/errors in the monitored session.

The initial server was no longer listening; the replacement sandboxed server could not accept browser connections. Restarted the local dev server with process/network permissions and recovered the preview in a fresh browser tab. The final development server is `http://127.0.0.1:4323/`; built preview is on port 4322. Screenshot: `output/gallery-local/desktop.png` (ignored).

No physical-device or screen-reader check was performed. Actual reduced-motion preference and JavaScript-disabled browser settings were not retoggled for this adapter-only increment; existing checks cover the unchanged motion and interaction system. Server HTML contains the five native media tiles, direct photo links, section headings and native video fallback without depending on client rendering. Real CMS project credentials, administrator invitations and approved publication media remain separate inputs from Pierre. The local samples are not evidence of a confirmed academy camp.

## Expanded local gallery and label removal — 21 October 2026

Imported all ten images from the user-supplied ChatGPT image collection into the existing ignored local gallery: six On-Ice and four Off-Ice scenes. Combined with the earlier samples, the preview contains 14 photos and one video. Originals, optimized WebP copies, descriptions and provenance remain under `web/.local-gallery/`; the import tools and screenshots are also ignored. No sample asset or album data was added to tracked source, uploaded, committed or pushed.

At the user's request, removed visible caption/credit overlays and their shading from every photo and video tile, and hid the enlarged photo description visually. Descriptive alternatives and credits remain accessible to assistive technology; the shared dialog now references its description. Moved album media counts below the cover image. Updated GalleryTile, GalleryMedia, GalleryAlbums, gallery CSS and README. The page-level local-preview notice remains visible. No image pixels, new animation, dependency or browser event code changed.

Re-ran Astro check (44 files, zero errors/warnings/hints), all 18 tests and the static build successfully. Audited all 108 production output files again: no sample media hashes, sample route/title or local media references. The production preview returns 404 for sample routes; video range requests still pass. Git confirms the expanded manifest, originals, optimized files and provenance are ignored and untracked.

Browser checks at 1440, 768 and 375px show five/three/one columns respectively, no horizontal overflow, and no visible captions or caption gradients. All 14 photos loaded; the two edge spotlights remain intact. A new photo opens from the keyboard at its full 1600px width, Escape closes it, and the image-only filter shows all 14 photos while hiding the video. No warnings/errors were recorded in the browser session. Existing reduced-motion and no-JavaScript behavior was not retested for this presentation change. Screenshots: `output/gallery-local/expanded-on-ice.png` and `expanded-off-ice.png` (ignored). Local preview remains `http://127.0.0.1:4323/galerie/lokale-vorschau`.

## Gallery section tabs — 21 October 2026

Replaced the photo/video filters and jump links with joined, curved-border section tabs following the user's annotation. One section is shown at a time with JavaScript; normal section links and stacked content remain without it. Added tab/tablist/tabpanel semantics, arrow-key wrapping, Home/End/Space behavior, roving tab stops, hash restoration and hidden-section video pause. The photo lightbox now uses only the selected section. Removed section counts, secondary filter count and visible video-to-text controls; retained the overall media total. Video descriptions remain linked for assistive technology inside visually hidden captions.

Changed GalleryMedia, GalleryTile, gallery-interactions, gallery CSS and the layout helper's explanatory comment. Updated README, Studio editing documentation and `design-qa.md`; the latter records source/implementation comparison evidence and `final result: passed`. No dependency, source image, CMS schema or publication configuration changed. Local media and QA artifacts remain ignored.

Executed `run check` (44 files; zero errors/warnings/hints), all 18 existing tests and `run build` (13 static pages) successfully. Browser checks at 1608, 768 and 375px confirm one selected panel, no overflow, five/three/one columns and readable 64px-high phone controls. Keyboard arrow wrapping, Home/End/Space/Enter, scoped lightbox totals of eight/six photos, Escape focus restoration, native video playback and pause after switching all passed. Selected Off-Ice state survives reload and album/index back-forward navigation without duplicate gallery elements.

A local no-script harness rendered both complete sections with all 14 direct photo links and zero scripts; Off-Ice anchor navigation passed without overflow. The actual browser JavaScript setting and reduced-motion preference were not toggled. New tab transitions have the reduced-motion guard; no new scroll or reveal animation was introduced. Browser logs were checked, with no warnings/errors. Visual comparison and screenshots are under `output/gallery-local/` (ignored). The preview remains `http://127.0.0.1:4323/galerie/lokale-vorschau`; no commit, push, upload or deployment was performed.

## Gallery goalkeeper selector — 21 October 2026

Removed the repeated visible section heading when the gallery tabs initialize. Added a small transparent overhead goalkeeper beneath the selected tab label; it moves horizontally with a 420ms transform transition. Pointer and existing keyboard selection use the same position update. ResizeObserver tracks tab/label geometry and disconnects with the gallery; reduced motion disables movement in both CSS and JavaScript. Without scripts, both normal section headings remain visible and the decorative goalkeeper stays hidden.

Changed GalleryMedia, gallery-interactions and gallery CSS; added `src/assets/gallery-goalie.png` (352 × 165 RGBA) and its full prompt record. Built-in Image Gen produced and refined the fictional artwork; no external asset service or dependency was added. Updated README, ASSETS, assets README, `design-qa.md` and this record. Source/refinement originals remain unchanged in the local generated-image directory. Local gallery media/metadata and QA artifacts remain ignored.

Executed with the bundled npm CLI from `web`: `run check` (44 files, zero errors/warnings/hints), `test` (18 passing existing tests), and `run build` (13 static pages), all successful. `git diff --check` found no whitespace errors. Production isolation audit passed again across 109 output files, with no sample media hashes, sample route/title or local media references; built preview sample paths return 404. Development video range requests still return 206/416, and the manifest endpoint returns 404.

Browser checks at 1518 × 854, 768 × 1024 and 375 × 812 CSS pixels found no horizontal overflow. Goalkeeper center matches the active text-label center exactly at both desktop endpoints and on tablet/phone; its phone size is 76 × 40px, with 24px clearance to the grid. Intermediate computed transform confirms a real slide between positions. Arrow selection, visible keyboard focus, one visible panel and hidden repeated heading passed. Navigating to the album index and using browser Back restores one gallery, one goalkeeper and functioning keyboard selection without duplicated behavior.

A local reduced-motion harness exercised the matchMedia and CSS branches: `data-animate=false`, zero-second transition and immediately aligned endpoint after switching. The actual system/browser preference was not changed. A second harness strips scripts: zero scripts, marker hidden, both section headings readable and both sections visible. These temporary harnesses were closed and their proxy stopped. No physical-device or screen-reader audit was performed.

The first dev render briefly encountered a cached missing-image import while the new asset was being prepared; restarting the dev server cleared it and the optimized image then loaded successfully. Source/implementation combined comparisons were opened and reviewed; `design-qa.md` records `final result: passed`. Normal preview remains `http://127.0.0.1:4323/galerie/lokale-vorschau`. No CMS inputs from Pierre are needed for this UI change; the separate real-project/publication setup remains pending.

## Shared review link diagnostic — 21 October 2026

Queried the authenticated Vercel connector in the explicit `driftwoodmedia` scope. Confirmed project `pk-hockey-academy` (`prj_QRkJFAItBWzdKSugDp4Vn9vrJoik`), its project domain and three aliases. All aliases point to READY deployment `dpl_5hjkZPzppbuVPcJrneBUDLeNZM9c`, GitHub main commit `5e8d8e08b58bdb6073cb335f79429ef8a9654c57`. The original main-branch share link was recovered and confirmed non-expiring.

At the user's request to shorten the visible link to PK, attempted to add `pk.vercel.app` to this exact project. Vercel rejected it with HTTP 409, `owned-on-other-team`: the address is assigned to another project. No address was transferred or removed. Created a non-expiring, alias-scoped shareable link for the existing shorter `pk-hockey-academy.vercel.app` address instead. The original branch link was preserved, and a subsequent project read confirmed Vercel Authentication remains enabled with the same `all_except_custom_domains` configuration.

Using Vercel's authenticated share-link fetch, the shorter homepage and `/trainingstermine` both returned HTTP 200 with the expected German titles and `noindex,nofollow`. The schedule retained one H1. The connector confirmed the new share link has no expiry. Full share URLs and access tokens are intentionally excluded from these files. Updated the preferred review host in README. No application code, design or motion changed; no build, package test, browser layout audit, commit, push or new deployment was performed for this diagnostic. Existing local implementation changes remain unpushed.

## Gallery viewer controls and mixed media — 22 October 2026

Implemented the requested viewer refinements on top of the existing uncommitted gallery work. Replaced the lower arrow bar with elongated SVG chevrons over the actual media edges: translucent by default, clearer on hover and keyboard focus, and more visible without hover on touch devices. A short 180ms color/background transition follows the site's reduced-motion override. Photos and videos now share one sequence and counter based on the visible placement order of the selected section. Added an optional video expand button while preserving inline native controls and direct photo links without JavaScript. Native video arrow-key controls retain seeking behavior; gallery arrow keys work elsewhere in the dialog. Playback does not start automatically, and changing items or closing pauses and unloads the viewer video. Resizing preserves the currently playing video.

Files changed in this increment: `web/src/components/GalleryMedia.astro`, `web/src/components/GalleryTile.astro`, `web/src/lib/gallery-interactions.ts`, `web/src/styles/gallery.css`, README and this record. No package, CMS schema or asset change was needed. Existing sample media and other uncommitted changes were preserved.

Browser verification exposed that Astro's ClientRouter replaces inert video elements after custom-element connection. Deferred gallery initialization to the end of the synchronous swap so video references and listeners bind to the live nodes. Also gave viewer arrows an explicit stacking level so active video playback cannot paint over them. Rechecked real video playback after each of two client-navigation round trips, not only the media counter.

Executed with the bundled npm CLI from `web`: `run check` (44 files, zero errors/warnings/hints), `test` (18 passing tests), and `run build` (13 static pages). Browser checks in isolated Edge passed at 1440 × 1000, 768 × 1024, 375 × 812 and 812 × 375: mixed photo/video order matched the visible grid, wrapping worked in both directions, overlay controls stayed inside media with at least 44px targets, and no horizontal overflow occurred. Verified actual video playback, pause/unload on leaving/closing, playback preservation across responsive repacking, direct video expansion, keyboard navigation, visible focus, Escape, focus/scroll restoration, active-tab scoping, repeated navigation and browser Back/Forward. Hover increased arrow opacity as intended. Browser reduced-motion emulation produced the global 0.01ms transition override and retained immediate navigation. A separate touch-emulated context confirmed visible controls without hover and photo/video navigation by tapping.

An actual JavaScript-disabled browser context retained all 14 direct photo links, the native video player, both readable sections, anchor navigation and a phone layout without overflow; the nonfunctional expand button stayed hidden. The browser recorded zero errors and warnings. No physical-device or screen-reader audit was performed. Browser QA script/result and screenshots are ignored under `.tools/gallery-viewer-qa.js` and `output/playwright/` (including `gallery-viewer-photo-1440.png`, `gallery-viewer-photo-375.png`, `gallery-viewer-video-375.png` and `gallery-viewer-arrow-hover.png`).

Re-ran `.tools/media/verify-samples.mjs`: all 109 production output files excluded local sample hashes, routes, titles and media references. Production preview returned 404 for sample album/media paths; development video range requests returned 206/416 and the manifest endpoint returned 404. The initial sandboxed Edge/preview connection failed; verification used isolated local processes outside the sandbox after approval. The local development preview is `http://127.0.0.1:4323/galerie/lokale-vorschau`; the static production preview is on port 4322. No commit, push or deployment was performed. No new input from Pierre is needed for these UI refinements; actual albums/CMS activation remain pending.

## Gallery corner badge removal — 22 October 2026

Removed the diagonal expand badges throughout the gallery: photo corners, the custom video expand button, album-cover corner and decorative arrow after the album link text. Photos remain clickable, with their accessible labels and keyboard opening intact. Videos retain native playback/fullscreen controls and remain in the mixed-media viewer sequence. The viewer's previous/next chevrons remain available. Removed the unused badge CSS; no new motion, asset or content input was needed.

Changed `GalleryTile.astro`, `GalleryAlbums.astro`, gallery CSS, README and this record. Astro check passed for 44 files with zero diagnostics; all 18 tests and the static build passed. Browser checks at widths 1440, 768, 611 (the annotated viewport) and 375px found zero corner badges and no overflow. Keyboard photo opening, both viewer navigation arrows, video position 3 of 9, native video controls, all 14 photo links and album-cover navigation passed. The browser reported zero errors/warnings. Screenshot `output/playwright/gallery-no-badge-detail.png` visually confirms the selected goalkeeper tile has no corner overlay. Existing reduced-motion and no-JavaScript behavior was not retested for this markup/CSS removal. The final build was repeated after removing the remaining decorative album-link arrow. Changes remain local and unpushed; the temporary sample assets were not changed or uploaded.

## Video player polish and centered close button — 22 October 2026

Replaced the close button's mixed typographic text/cross with an inline flex row, matching line heights, an explicit gap and a 16px SVG cross. Text and icon now share a center line, and their combined bounds are centered within the 44px-high button. Measured both alignment offsets as 0px at the supplied 611 × 884 viewport and all other checked sizes.

Added a shared, dependency-free video control component and controller for inline videos and the mixed-media viewer: a blue circular initial play action, a navy gradient control bar, progress track, elapsed/duration display, play/pause, mute and fullscreen. Buttons have German accessible names and a native range input supports seeking with the mouse, touch and keyboard. Focus moves to the pause control after the initial play button disappears. Native HTML video remains the no-JavaScript fallback; enhancement only removes native controls after binding the custom controls. A failed media source reveals a German error/direct link and restores native controls. Source errors are captured because their events do not bubble. Fullscreen is feature detected, including a WebKit video fallback; actual iOS/Safari device behavior has not been tested. Consulted [MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) and [Apple's API reference](https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen).

New files: `web/src/components/VideoControls.astro`, `web/src/lib/video-player.ts`. Updated `GalleryMedia.astro`, `GalleryTile.astro`, `gallery-interactions.ts`, gallery CSS, README and this record. The gallery pauses/unloads the player when changing media or closing. Player controls keep arrow keys for seeking, and navigation arrows sit above the video's compositing layer while avoiding the bottom controls. Short color transitions follow reduced motion. No dependency, media asset, CMS configuration or content input was added.

Final commands passed with the bundled npm CLI: Astro check (46 files, zero errors/warnings/hints), all 18 tests and the static build (13 pages). Isolated Edge browser checks passed at 1440 × 1000, 768 × 1024, 611 × 884, 375 × 812 and 812 × 375: centered close button, visible player, controls within the player bounds, 44px button targets and no horizontal overflow. Verified actual playback/pause, mouse and keyboard seeking without changing the gallery item, mute/unmute, fullscreen entry/exit, Escape and media cleanup, inline controls, playback after two Astro navigation round trips, browser reduced-motion emulation and touch-emulated playback. An actual JavaScript-disabled context retained native video controls and all 14 photo links, with custom controls hidden. A separate context returning 404 for the video confirmed the visible error, native controls and direct-link fallback. The main page recorded zero browser errors/warnings; the deliberate failed request occurred only in the separate failure context. No physical-device or screen-reader audit was performed.

Re-ran the production isolation audit: all 109 output files excluded temporary sample hashes/routes/titles/media references, production sample paths returned 404, and development range requests retained 206/416 behavior. QA scripts/results and screenshots are ignored: `.tools/gallery-player-qa.js`, `output/playwright/gallery-player-qa-result.json`, `gallery-close-aligned-611.png`, `gallery-player-styled-375.png` and `gallery-player-final-611.png`. The accepted screenshots were visually inspected. Preview remains `http://127.0.0.1:4323/galerie/lokale-vorschau`. Changes remain local and unpushed; no new input from Pierre is needed for this UI refinement.

## Gallery commit handoff — 22 October 2026

The user authorized committing and pushing the completed gallery work to main. Grouped the gallery tabs/indicator, mixed-media viewer, player polish, badge removal, isolated local-preview loader, tests and documentation into one cohesive commit. Temporary media/manifest, local tooling, QA artifacts, environment files and share-link access tokens are excluded. The decorative goalkeeper is an intentional interface asset with provenance, not a sample gallery photograph.

Fetched origin/main and rebased the unpublished gallery commit onto `5e8d8e0` (the newer media-kit commit). The media-kit page, footer link, sitemap change, source metadata and documentation were preserved without conflicts. Re-ran Astro check on the combined source (48 files, zero diagnostics), all 18 tests and the static build (14 pages), all successful. Updated the Studio guide to reflect mixed photo/video browsing and the shared player.

The running dev server briefly served sample media as 404 after the configuration reload during rebase. Restarting the existing local dev process restored the endpoint without source changes. A fresh isolated Edge session then passed the complete player/close-button checks at all five viewports, keyboard/touch/no-JavaScript/reduced-motion fallbacks and repeated navigation, with zero main-page errors/warnings. Production isolation passed across 114 output files, including the preserved media-kit assets: no temporary sample hashes/routes/titles/media references, and production sample paths stayed 404. `git diff --check` and the committed-path audit passed. Prior entries recording local/unpushed status describe their checks at that earlier point; this entry records the authorized commit preparation and final combined-source validation.
