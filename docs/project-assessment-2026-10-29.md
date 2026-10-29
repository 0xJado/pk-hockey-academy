# Project assessment — 29 October 2026

Follow-up, 30 October: the omitted Sanity media-kit scope from closed issue #2 is now implemented; see [the media-kit workflow and verification](issue-2-media-kit.md). The historical finding below describes the original assessment.

Follow-up: the pending source was subsequently committed and pushed. The gallery validation mismatch below has been repaired with shared publication/asset rules and build failures for malformed approved albums. The native coach workflow has now passed [issue #4 acceptance](issue-4-acceptance.md) using the user-approved logo backdrop. This report preserves the state found during the initial assessment; follow the linked acceptance record for the later results.

Scope: the academy website, CMS, registration, gallery, social content, administration and Pierre's player/trainer interview prototypes. The shop is excluded.

The project has a substantial, working website and editorial foundation. It is still a protected review site: a parent cannot currently book training, submit a registration or contact the academy through it. The largest gaps concern operating workflows and approved content, rather than rebuilding the frontend.

This assessment inspected the existing working tree without replacing its changes, fetched the actual GitHub issues and their comments, checked current Vercel deployment metadata, ran both projects' checks/tests/builds, and exercised the compiled website in Edge. Application code, CMS content, accounts, GitHub issues and deployments were not changed. This report is the only new non-ignored project file.

## What exists today

| Area | Available | Remaining limitation |
| --- | --- | --- |
| Website and branding | German Astro/TypeScript pages, Tailwind v4, supplied crest and academy photograph, self-hosted fonts, responsive layouts, shared navigation and footer. All ten required routes exist. | Several pages intentionally describe future functionality; existence of a route does not establish a working service. |
| Motion | Implemented GSAP hero wipe, headline/CTA entrance, desktop image parallax, training-panel story, section/venue reveals, hover states and Astro transitions. Cleanup and reduced-motion handling exist. | Further art-direction work is optional. Maintain the current accessibility/performance safeguards. |
| Training information | Confirmed audience, small groups, 60/60 concept, three active cities, three planned cities and supplied pricing. | Hall details, approved coach biography/portrait and real training dates remain missing. |
| Schedule | Stable `/trainingstermine`, typed sessions, chronological sorting, date/time/group/capacity/status rendering and honest empty state. | Both session collections are empty. Sessions and venues are local source data, with no Sanity editing workflow. Registration URLs are deliberately disabled. |
| Trainer CMS | German schema, published-content adapter, ordering, optional portraits, explicit approval, private Studio preview and authoritative empty-state behavior. Pierre's verified starter profile is connected. | Authentic portrait/media acceptance and new-profile acceptance remain incomplete. The newer website Visual Editing implementation is local. |
| Admin access | `/verwaltung` links to the hosted Sanity Studio; native authentication and permissions are used. Owner sign-in and coach publishing acceptance are documented. | Invitation, other-member roles, recovery, sign-out, MFA and open-session revocation still need real-account acceptance. |
| Publishing | Existing Sanity webhook triggers the protected Vercel review website. Prior publish/edit/unpublish/restore acceptance has four successful builds. | Publication uses committed source. It cannot deploy the uncommitted social/editor implementation. Media upload/withdrawal acceptance is separate. |
| Gallery | Album schema, build-time reader, responsive mixed-media layout, On-Ice/Off-Ice tabs, viewer, keyboard controls and shared video player are implemented. Development samples are isolated from production. | Current compiled production gallery has no approved albums. Real media publishing/withdrawal remains unverified. A validation mismatch is reproduced below. |
| Registration | `/anmeldung`, supplied two-page A4 PDF, all eight source sections and branded online preview. | All 28 inputs/textareas are disabled. No live form, validation, submission endpoint, spam protection, delivery or success/failure flow exists. |
| Media kit | `/medienkit` serves the supplied original transparent logo with format, resolution, size and an accessible download. | Download metadata is a local module. There is no media-kit Sanity schema or administrator upload/replacement/removal workflow. |
| Social content | Local, opt-in `socialPost` schema, shared validation, build adapter, ordered link cards and manual unavailable-post fallback. | Not deployed as website code; disabled. No real accounts/posts are supplied. Full embeds, consent handling and live platform acceptance are unfinished. |
| Contact | German contact page and explicit pending states. | Neither a contact form nor WhatsApp/email destination is active. The homepage enquiry CTA ends on this pending page. |
| Legal and launch | Visible incomplete legal notices, noindex defaults, robots disallow and empty prelaunch sitemap. | Business/legal information, privacy content, final domain and public-launch approval remain outstanding. |
| Interview bots | Player/trainer prototype HTML copies and a detailed integration review are available locally. | Neither interview exists under `web/src/pages`; no shared website controller, delivery service, CMS import or AI endpoint is implemented. |

## Committed, local and hosted are different states

- Local `HEAD` and its recorded `origin/main` are `bcd64ab2096e7697f1ac3182cc456c2edc06b92c`.
- Current Vercel API inspection confirms the latest deployment is READY, built from that same commit. The review aliases include `https://pk-hockey-academy.vercel.app`. Vercel authentication protection remains enabled.
- This main-branch deployment uses Vercel's Production target, but it remains the protected academy review environment; it is not a public launch.
- The working tree contains 24 modified tracked files plus untracked implementation/documentation/test entries. Major additions include curated social posts, shared publication-hook tooling, authenticated trainer Visual Editing and its adapter/dependency changes.
- Trainer Visual Editing is more advanced than a mockup: signed preview sessions, native preview-secret validation, draft rendering, overlay field mappings, Presentation navigation and regression tests exist. Earlier evidence verifies local Studio connection repair. Hosted activation and complete native click/edit/refresh/new-profile acceptance remain pending.
- The current build prerenders public pages and adds server routes for private editing. `web/dist/client` can serve the public website statically; private Visual Editing requires its Node runtime or Vercel functions. This change should be part of the release review. [Astro documents the adapter requirement for on-demand routes](https://docs.astro.build/en/guides/on-demand-rendering/).

Suggested source handoff: review the pending publication/social and Visual Editing changes as cohesive changesets, preserving their shared dependencies; then deploy to the existing protected review environment and finish acceptance. Do not count a local passing build as a deployed feature.

## GitHub ticket assessment

The GitHub issue bodies were fetched on 29 October. Each non-shop ticket has zero comments, so the issue tracker does not yet communicate the substantial implementation progress recorded locally. A pull-request search returned no PRs.

| Ticket | Actual state | Useful remaining work | Recommended disposition |
| --- | --- | --- | --- |
| [#1 — Admin sign-in and content management](https://github.com/0xJado/pk-hockey-academy/issues/1) | Open; implementation substantially present, owner sign-in and coach publishing previously accepted. | Finish owner account/recovery/MFA and applicable member lifecycle checks; test approved gallery uploads/publication/withdrawal; complete owner handoff. Distinguish native backend permissions from UI labels. | Keep open. Update its checklist with verified work and remaining real-account/media checks. Do not remove the only owner to test revocation. |
| [#2 — Media kit](https://github.com/0xJado/pk-hockey-academy/issues/2) | Closed as completed; public logo download works. | Original scope also requires Sanity-managed assets and usage guidance. No media-kit CMS schema exists. Add approval, metadata, upload/replacement/removal and safe missing-file behavior; await approved additional assets/usage wording. The ZIP was optional. | Reopen it or create an explicit follow-up for the omitted CMS scope. The original acceptance criteria are not fully met. |
| [#3 — Registration and printable form](https://github.com/0xJado/pk-hockey-academy/issues/3) | Open; paper PDF and inert online reproduction complete. | Implement agreed editable fields, accessible errors, server validation, spam/abuse protection, duplicate-safe private Sheets delivery and honest success/failure feedback. Confirm privacy/retention, signatures, consent choices, paper hand-in and multi-session SpielerPlus process. | Keep open; separate completed PDF/preview from backend and operational acceptance. The private Google Sheet direction is decided, but account/Sheet/access/authentication are not configured. |
| [#4 — Editable coach profiles](https://github.com/0xJado/pk-hockey-academy/issues/4) | Open; closest to completion. Schema, retrieval, ordering, existing-profile publish/edit/withdrawal and documentation are present. | Accept creation of a new approved real profile, portrait and ordering changes; complete the newer local Visual Editing deployment and native field/edit/refresh checks if retained in scope. | Keep open until remaining acceptance passes. Visual Editing can be a separate follow-up: the original ticket did not require click-to-edit website overlays. |
| [#5 — Facebook/Instagram feedback feed](https://github.com/0xJado/pk-hockey-academy/issues/5) | Open; finished empty state is committed, curated link-card implementation is local. | Deploy/accept curation with real approved accounts/posts. Decide whether static link cards satisfy the first release or whether actual embeds are required. Embeds need their own platform/privacy/fallback acceptance. | Keep open. Clearly separate the link-card increment from unfinished embedded-post scope. Availability is manually maintained, not automatic synchronization. |

No GitHub issue currently tracks either interview bot. No ticket was edited, reopened, created or closed during this assessment.

## Specific defect reproduced during this review

**Gallery publication accepts content that the website silently discards.**

`studio/schemaTypes/gallery.ts` uses `Rule.required().max(160)` for photo credit. Native Sanity document validation accepts `credit: "   "` with no error. `web/src/lib/gallery.ts` trims this to empty and rejects the photo. An album containing only that photo disappears from the normalized public result without failing the build.

Fresh synthetic verification, without uploading or publishing anything:

- Valid album: native validation passes; website renders one album.
- Same album with whitespace-only photo credit: native validation still passes; website renders zero albums.
- Unconfirmed publication rights and unsupported asset types correctly produce blocking native errors in the tested cases.

Proposed ticket: **Align gallery publication validation with the website renderer**. Share trimmed text/asset rules between the Studio and website, reject invalid approved content with an actionable build/editor error, and add native gallery-schema regression cases. Cover whitespace-only title/city/description/alt/credit/video text as well as the reproduced photo-credit case. Keep deliberate draft/withdrawal filtering distinct from invalid approved content.

This is an editorial correctness/reliability defect; the reproduction does not show a draft leak or a rights-check bypass.

## Pierre's interview bots

The existing [bot integration review](bot-integration-review.md) accurately describes prototypes, not an implemented website feature. The local player source still contains a POST to `/api/followup`; no such route exists in the application. The current player/trainer HTML is under ignored review output, rather than maintained application routes.

Available prototype behavior:

- Player: 15 base questions, predefined follow-ups, parent confirmation, text/optional dictation, spoken questions, editable review and browser printing.
- Trainer: 14 base questions, predefined follow-ups, editable review, local photo preview, publication-consent control, JSON download and browser printing.
- Neither automatically delivers a profile to Pierre, saves/resumes an interview or connects to Sanity. Browser printing asks the user to save/print; it is not automatic PDF delivery. Trainer JSON does not contain the selected photo bytes.

Recommended new tickets, ready to draft from the supplied material:

1. **Integrate a shared interview flow and trainer interview preview.** Add the branded Astro route and typed question definitions, bounded local follow-ups, progress, back/skip, labelled review controls, reset and deliberate print/JSON export. Use a scoped controller that disposes recognition/speech/listeners on question changes and Astro navigation. Keep preview noindex and protected for restricted testing. Acceptance: complete/edit/restart/export, long-answer printing, keyboard/mobile/reduced-motion, no-script explanation and repeated navigation work without unsolicited API requests.
2. **Integrate the player interview with the approved question set.** Reuse the controller; remove the unconditional `/api/followup` request. Confirm which child fields are needed and the parent flow before real collection. Use fictional answers for the preview. Bind voice callbacks to the question/session so late speech results cannot overwrite the next answer. Acceptance includes no background transmission, text input everywhere, explicit voice opt-in and reliable back/review/correction.
3. **Add a reviewed trainer-interview-to-CMS draft workflow.** Initially Pierre can review the export and enter approved public material through Studio. A later authenticated import should whitelist existing public trainer fields and create a hidden, unapproved draft. Internal contacts, birth year, consent evidence and raw interviews must stay outside the public dataset. Self-reported qualifications still need verification; the interview checkbox must not set publication approval automatically.
4. **Add private interview delivery only after a separate destination decision.** Define authorized access, retention, allowed fields, server validation, abuse protection and receipt/failure semantics. The private registration Sheet is not automatically the destination for player/trainer interviews.

The first local preview does not require an AI provider, new database or a new application framework. Start with the trainer flow and shared controller; the player preview can follow once its question/parent wording is agreed. Generative follow-ups are a later optional feature with explicit data-flow approval and server-side credentials.

Speech recognition needs separate real-device acceptance. [MDN documents limited browser support and possible browser-provider server processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition); microphone permission alone does not establish dictation support or local-only processing. Test Pierre's actual Android/iPhone and WhatsApp-opened browser before promising the voice experience.

## Additional backlog worth tracking

| Priority | Proposed ticket | Acceptance boundary |
| --- | --- | --- |
| High | CMS-managed training sessions and venue details | Pierre can draft/publish/edit/cancel sessions without code; date/time/timezone, group, venue, capacity and status are validated; chronological upcoming display and past-session handling are explicit; the QR route stays permanent. |
| High | Connect session registration without making SpielerPlus the default | The present `getRegistrationUrl()` always returns no link. Implement the agreed registration/session relationship and unavailable/full/cancelled behavior. Its dormant CTA still says “Bei SpielerPlus anmelden”; do not activate that as a universal booking path. |
| High before launch | Activate contact form and confirmed direct contact | Approved destination, minimal enquiry fields, server delivery, accessible validation, abuse protection and real success/failure acceptance; add the verified WhatsApp link. These can be separated from child registration. |
| High before launch | Complete business/legal content and release acceptance | Real provider/contact/privacy information, final origin, reviewed media/process wording, functional conversions and explicit launch approval before enabling indexing. Placeholder legal pages do not complete this work. |
| Medium | Gallery media publishing acceptance | Use cleared real media to verify upload, order, sections, poster/text alternatives, public rendering, withdrawal and appropriate asset removal handling after a successful rebuild. The current empty production gallery cannot establish this. |
| Medium | Automate checks for both projects | Vercel currently runs website check/test/build. There is no tracked GitHub Actions workflow covering Studio or the five CMS build scenarios. Add reproducible checks for both projects, CMS integration and focused browser smoke coverage. |
| Low/medium | Review editor build warnings and bundle separation | Website build succeeds but emits Sanity/Framer module-directive warnings and a chunk-size warning. Preserve private-preview lazy loading while checking useful splitting. The sampled public homepage loaded only the router/motion scripts, not the large editor runtime. |
| Low | Improve topic-specific page titles and consolidate styling | Several page titles are campaign phrases rather than explicit topic names. Prefix the topic where useful; reduce repeated hero/breakpoint overrides in the large global stylesheet without changing the approved visual direction. |

Suggested execution order: first make the pending local work reviewable and repair gallery validation; complete #4's remaining acceptance and the shared/trainer bot preview; add session administration; finish #1's real owner/media checks. Registration/contact activation and legal launch work depend on Pierre's operational inputs. Social accounts/embeds can progress separately and need not hold up the local bot preview.

## Fresh verification and limits

Executed using Node 24.22.1 and the repository's existing ignored npm CLI (npm is not on this environment's normal PATH):

| Command/check | Result |
| --- | --- |
| `web`: `npm test` | 39 tests passed. |
| `web`: `npm run check` | 70 files; zero errors, warnings or hints. |
| `web`: `npm run build` | Passed with the Node adapter; warnings described above. |
| `web`: `npm run test:cms` | All five isolated Vercel-adapter build cases passed: starter, populated with token, populated without token, empty, malformed-content rejection. |
| `studio`: `npm test` | 15 tests passed. |
| `studio`: `npm run check` / `npm run build` | Both passed. |
| Compiled website in Edge | 14 routes at 1440×1000, 768×1000 and 375×812: 42 successful page/viewport checks, one H1, German language/meta description, no horizontal overflow or public editor attributes. 16 distinct local linked URLs returned no errors. |
| Interaction checks | Mobile Enter/Escape menu and restored visible focus; repeated client navigation/back/forward; normal hero reveal; reduced-motion branch with zero triggers; no-JavaScript pages/menu; anonymous preview 401 with no trainer content and private/no-store headers; PDF HTTP 200 with 203,522 bytes; unknown route 404. |
| Motion lifecycle follow-up | After animation-frame settlement, homepage trigger count stayed at 17 across three fresh-load/back-navigation cycles. Earlier immediate samples were taken before refresh and were not used as the settled count. |
| Browser logs | No runtime errors or console warnings in the public-page smoke suite. Edge's lazy-image informational messages are not errors. |
| Native gallery validation probe | Reproduced whitespace-credit mismatch; tested rights and asset-type errors without live mutations. |
| `git diff --check` | Passed; Git printed normal Windows line-ending notices. |

Local compiled preview: `http://127.0.0.1:4337/`. Screenshots/results are ignored under `output/playwright/overall-audit-*`; CMS build fixtures are under `output/cms-integration-ZN6apM/`. Helper scripts are ignored under `.tools/project-audit-*`. Desktop/phone homepage and phone registration/photo screenshots were visually inspected.

This is not a full accessibility, penetration or performance audit. Real account revocation/recovery/MFA, authenticated hosted Visual Editing, real gallery/video publication, actual voice/microphone behavior and bot PDF pagination were not freshly accepted. The PDF response was checked; the earlier recorded A4 visual inspection was not repeated. The live deployment was identified through the authenticated Vercel API, while fresh responsive/browser checks used the locally compiled working tree. Previously documented publishing acceptance is distinguished from checks rerun today.

## Inputs needed from Pierre

- Real session dates/times/groups, rink details, capacity and the registration/confirmation process.
- Academy-controlled private Google Sheet/account, named staff access, authentication/retention decisions and the approved registration field/consent/signature rules.
- Approved contact destinations, paper hand-in instructions and exact multi-session SpielerPlus workflow.
- Public coach information and portraits; cleared gallery media and download usage guidance.
- Approved player/trainer interview fields, parent/voice explanations, export expectations and any private delivery destination.
- Real social accounts/posts if that feature should be activated.
- Business/legal information, final domain and public-launch approval.

These inputs do not prevent source cleanup, gallery validation repairs, focused CMS improvements or a protected trainer interview preview from proceeding.
