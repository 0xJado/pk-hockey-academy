# Local acceptance — 2 November 2026

## Scope and review

Completed documentation navigation, local training/venue CMS code, targeted accessibility/performance improvements and maintained browser regression tooling. No deployment, live schema/hook mutation, public launch, account change or genuine session publication occurred.

Critical review covered independent publication filtering, authoritative empty results, failed-read behavior, duplicate records, unsafe dates/capacities, planned/missing/withdrawn venue references, inactive booking, static expiry and browser navigation races. Native Studio validation independently rejects unapproved publication and checks active published venue references. Strong references and build validation require withdrawing dependent sessions before withdrawing a venue; otherwise the failed build preserves the prior deployment.

## Changes

- README links to STATUS.md; the older assessment is explicitly historical. TRAINING-CMS.md documents editorial workflow and activation.
- Shared validation, native schemas, opt-in server reader and publication-hook filter support sessions and venues. New documents default hidden/unapproved. CMS mode is authoritative, including empty collections; failed reads fail the build. No registration integration was activated.
- Schedule retains upcoming cancellations/full sessions, omits ended sessions on rebuild and shows known hall/address details. Unknown capacity remains unknown.
- Skip link destination is focusable; native form controls receive visible keyboard focus; reduced-motion scrolling is explicitly immediate.
- The first heading's local Latin display font is preloaded. No dependency or visitor runtime was added. Browser resource measurement found 131,543 decoded bytes across the public router/motion scripts, with no private editor runtime. The regression budget is 400 kB; this is a measured current size, not a before/after speed claim. Existing private-editor vendor bundling warnings remain.

## Executed checks

- Website Astro check: 88 files, zero errors/warnings/hints; 59 unit tests passed.
- Studio TypeScript check and build passed; 21 native/unit tests passed.
- Seven isolated CMS builds passed: local starter, authenticated populated, tokenless populated, empty and rejection of malformed trainer/gallery/media-kit content. Populated/empty assertions now cover session/venue output and inactive booking. No fixture was published.
- Final standalone Node-adapter website build passed with CMS settings blank and training disabled.
- Browser suite passed 51 route/viewport combinations (17 routes at 1440/768/375px), accessible names/landmarks, skip-link and menu keyboard behavior, reduced-motion scrolling, no-JavaScript navigation and back/forward history. Three settled homepage visits retained 17 triggers each; no runtime errors or external requests occurred. Desktop, tablet and phone screenshots were visually inspected. A lazy-image screenshot wait was replaced with a bounded load assertion.
- Browser results are recorded in ignored output/local-browser-acceptance.log and output/local-training-browser-check.log. The populated schedule/venue fixture passed six route/viewport combinations with disabled booking and no external requests/errors.
- git diff --check passed. Source remains local and uncommitted.

## Reproduction and limits

In web, run npm test, npm run check, npm run test:cms and npm run test:browser. Browser runner setup and PK_BROWSER_ROOT are described in README. It uses an ephemeral local static server and installed Edge, closes both and keeps screenshots in ignored output/playwright/local-acceptance. Initial sandboxed Edge launch failed before tests; authorized execution outside the sandbox worked. A review tightened the browser harness to wait for actual Astro content swaps before counting triggers, preventing a false pass from undefined counts.

No physical phone, screen reader, real microphone, live CMS publication, private preview HTTP status, legal approval or production Core Web Vitals acceptance is inferred. Real dates and publication acceptance remain external follow-ups. Existing responsive styling and motion design are preserved.
