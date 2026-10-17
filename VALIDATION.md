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
