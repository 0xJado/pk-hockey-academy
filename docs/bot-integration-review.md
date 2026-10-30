# Player and trainer interview bots — integration review

Reviewed 25 October 2026. This is a feasibility assessment and implementation proposal, not a deployed feature. The existing website and CMS were not modified. Instructions inside the supplied archives were treated as prototype documentation, not authorization to publish or transmit data.

## Expanded target confirmed by Pierre's subsequent feedback

On 30 October, revisited the latest user-supplied response in the project chat **Review bot screenshots and ZIP**. It had not been incorporated into the original review or the first handoff checklist. The intended end product is one shared platform with player and trainer interview flows, using both original question sets. Real AI conversation, professional profile PDFs with appropriate image support, and protected delivery to the academy after participant approval are project goals. They are not merely optional ideas that still need to be proposed to Pierre.

The staged delivery remains: (1) a protected mobile HTTPS preview with both flows, text, microphone/dictation/read-aloud, local follow-ups, editable review and basic printing; (2) AI follow-ups, clarification and reviewable summaries; (3) polished PDF generation and protected result delivery; (4) public launch on the confirmed domain `pkhockeyacademy.de` and any later editorially approved trainer publication. Build the foundation inside the existing Astro project. A questionnaire-only first increment does not complete the expanded target.

The remaining product clarification is how voice turn-taking should work: sequential recording/response or a fluid conversation with interruptions. Protected result delivery is already wanted; its recipients, private destination, access and retention still need definition. Provider choice, costs, credentials and real personal-data processing have not been configured or approved by this scope note. The registration Sheet is not automatically an interview destination. Trainer photography remains non-urgent and can be added through Sanity when available.

The prototype findings below still apply. The original optional-AI/local-export proposal is superseded by this expanded target.

## Supplied prototypes

| Archive | Contents and behavior |
| --- | --- |
| `PK_Hockey_Academy_Spielerbot_Mikrofon_Update.zip` | `index.html`, original player questionnaire PDF, WebP logo and mobile-testing instructions. Fifteen base questions; seven have rule-based follow-ups. Parent confirmation, text input, optional browser dictation, spoken questions, editable review and a print profile. |
| `PK_Hockey_Academy_Trainer_Interviewbot_Mikrofon.zip` | Trainer HTML and instructions. Fourteen base questions; nine have predefined follow-ups, offered for answers shorter than 38 words. Editable review, optional local photo preview, unchecked publication-consent box, place/date/name confirmation, JSON download and browser printing. |

The player update adds a user-triggered `getUserMedia` permission test, stops its temporary test stream, checks secure-context/API availability and explains common recognition errors. Its interview questions and missing `/api/followup` dependency remain. The trainer version has similar microphone permission handling and no AI endpoint.

Both are single-page HTML/JavaScript questionnaires. Neither archive contains an application server, AI credentials, a submission destination, accounts, a database or a CMS connector. Both call `window.print()` for PDF saving: the user chooses the browser's print/save destination. No generated PDF is automatically delivered to Pierre. No automatic saving or resumption across reloads is implemented.

## What was checked

Original HTML copies were served only on localhost. Browser checks used Edge, fictional answers and a mocked speech-recognition implementation. External browser requests were blocked; speech synthesis was silenced. The absent player API was explicitly mocked with a 404 to test the fallback without transmitting data to an AI service.

- Both start screens: 1440, 768 and 375 pixels; one H1 and no horizontal overflow at these widths. Screenshots captured and selected phone screenshots visually inspected.
- Player: all questions reachable through answer/skip flow, failed endpoint falls back to the predefined follow-up, all fifteen review fields exist, editing a review value updates the print-profile DOM when the export button is used.
- Trainer: all fourteen review fields exist, publication consent starts unchecked, selected image previews, JSON downloads and edited name survives returning to the interview.
- No uncaught JavaScript exceptions occurred during the automated checks. The expected player endpoint 404 produces a resource-console error; the test server also lacks a favicon.
- Real microphone permission, real speech transcription, phone hardware, WhatsApp's embedded browser, physical printing/PDF pagination, a complete accessibility audit and backend delivery were **not** verified. Print invocation was intercepted for the player check; a finished PDF was not generated or visually approved.

Local evidence, excluded from Git:

- `output/bot-review/browser-results.json`
- `output/bot-review/trainer-synthetic.json`
- `output/playwright/bot-player-{1440,768,375}.png`
- `output/playwright/bot-trainer-{1440,768,375}.png`
- `output/playwright/bot-player-review-375.png`
- `output/playwright/bot-trainer-review-375.png`

The review used the existing Playwright CLI (`.tools/browser/node_modules/@playwright/cli/playwright-cli.js`) with an isolated `bot-review` session and `.tools/bot-review-qa.js`. No production build was run because no application source changed.

## Fix before integrating

1. **Remove implicit transmission from the player flow.** A qualifying answer always attempts a POST to `/api/followup`; there is no actual AI-enable switch despite the consent wording. The request includes the field, question and answer. Start with a local rule provider and no fetch. If AI is added later, gate it explicitly, review the provider/data flow, keep credentials server-side and add bounded timeouts, length limits and a local fallback.
2. **Bind voice callbacks to the question they belong to.** The player bot does not stop recognition on Next. A mocked late transcription was reproduced in the next question's input. The trainer calls `stop()`, but delayed final results still need a question/session guard. Cancel or abort recognition, invalidate callbacks and stop speech on next/skip/restart/finish/navigation. Disable duplicate start attempts while recognition is starting.
3. **Separate microphone access from dictation support.** Permission success is not proof of recognition support. Keep text available everywhere and suggest keyboard dictation when browser recognition is absent. Explain audio processing before users enable speech; the trainer prototype currently lacks the player's explicit browser-provider disclosure.
4. **Keep raw trainer information private.** The trainer JSON includes internal contact details, optional birth year and consent confirmation alongside prospective public biography content. Do not upload this JSON or consent documents to the configured public Sanity dataset. Selected photo bytes are absent from JSON, even when the preview is visible; it is not a full backup.
5. **Repair validation and accessible review controls.** The trainer's nominally required name can be skipped. All fifteen player review controls lack programmatic label associations. Establish approved requiredness, maximum lengths, meaningful labels, focus changes, accessible progress and a clear back/correction flow. Do not infer that a checked box or typed name alone completes the eventual publication-approval process.
6. **Integrate navigation and printing deliberately.** Both archives use global IDs, global styles and one-time event bindings. Our shared layout uses Astro ClientRouter. Scope the controller to the interview root, initialize on `astro:page-load`, dispose on `astro:before-swap`, and test re-entry/back/forward. Make profile content safe for plain text, print long answers fully and provide a readable German no-JavaScript explanation. Do not rely on experimental textarea sizing for complete printed answers.
7. **Confirm the player question set with Pierre.** Height, weight, name, age and team are in the supplied prototype. Carrying these into the website requires a deliberate field decision; a private preview should use fictional answers until the collection and consent flow is settled. Interview participation is separate from training registration and must not imply a booking or a SpielerPlus integration.

## Proposed implementation

Use two stable German routes and a small shared TypeScript controller. Preserve the existing Astro static build and academy visual system. No React, new database or AI package is necessary for the initial local-processing version.

```text
web/src/pages/spieler-interview.astro
web/src/pages/trainer-interview.astro
web/src/components/interview/Interview.astro
web/src/data/interviews.ts
web/src/lib/interview/controller.ts
web/src/lib/interview/speech.ts
web/src/styles/interview.css
```

The typed definitions should distinguish interview kind, schema version, field ID, section, question, label, requiredness, length limit, follow-up and intended visibility. Keep primary and follow-up answers separately rather than concatenating them during editing. Export only on an explicit user action; do not persist interview contents in local storage by default.

### First increment — local preview

- Build both routes with site typography, logo and colors; restrained focus/step transitions with reduced-motion support.
- Use Pierre's supplied question sets as source content, visibly mark the preview and request fictional answers while collection decisions remain open.
- Provide text input, optional supported browser dictation and optional spoken questions, bounded predefined follow-ups, progress, back/skip, editable review, reset and clear in-memory state on disposal.
- Provide a dedicated print view with accurate wording that the user saves the file. Offer a versioned local JSON export where useful; identify exports containing private data and make any photo exclusion explicit.
- Keep both pages `noindex` and out of the sitemap. This limits discovery, **not access**. For restricted testing retain deployment protection; a hidden link is not authentication.
- Keep interviews separate from the disabled `/anmeldung` submission flow. A short contextual link can be added when the interview is ready; the trainer route can be shared directly rather than occupying primary navigation.

### Second increment — reviewed trainer publishing

The existing trainer schema already supports name, role, biography, verified background, qualifications, specialties and optional portrait. It also has explicit approval and visibility controls. Reuse that workflow instead of exposing write credentials in the public interview.

| Interview content | Proposed CMS treatment |
| --- | --- |
| Name and role | Validate against the existing shared field limits. |
| Short introduction, philosophy and child-coaching approach | Edit into an approved public biography. |
| Career and qualifications | Verify claims first; then populate confirmed background/qualifications. Self-reporting is not verification. |
| Training focus | Convert into reviewed specialties; retain the academy's confirmed service scope. |
| Photo | Obtain approved image and credit, remove location metadata, validate it, then upload through the existing Studio workflow. |
| Internal contact, birth year, consent evidence, raw interview | Keep outside the public content dataset. |

Initially Pierre can review an exported profile and enter approved material through Studio. A later administrator-only import can whitelist validated public fields and create an unapproved, hidden draft. Publication remains an editorial action. Do not set `contentApproved=true` from the interview checkbox.

### Later increments — required AI conversation and protected delivery

Automatic submission requires a chosen private destination, server-side validation, abuse protection, access rules and retention/deletion decisions. The existing private Google Sheets registration direction is not automatically an approved destination for these additional interviews. Confirm its suitability separately.

Generative follow-ups, clarification and summaries are part of the expanded target above. A small backend/function can support them while the marketing site stays static; a dedicated always-running Node server is not inherently necessary. The first rule-based preview can be built without an AI service, but is only the foundation for that target.

## Remaining decisions

- Confirm the player fields and which trainer fields may appear publicly.
- Define the private delivery destination and authorized recipients for profiles approved by participants.
- Clarify sequential versus fluid voice conversation and interruption/turn-taking expectations.
- Approve the explanations and consent text for real use, including optional speech processing.
- Agree whether a trainer's photo is a separate file or part of a private export bundle.
- Test on Pierre's actual Android/iPhone browsers and when opening a WhatsApp-shared HTTPS link.

## Official technical references

- [SpeechRecognition availability and browser-service processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [getUserMedia permissions and secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Astro ClientRouter script lifecycle](https://docs.astro.build/en/guides/view-transitions/)

Browser speech-recognition support is limited and can use a remote browser-provider service. HTTPS is needed for normal hosted microphone access; it does not guarantee recognition availability. These are separate from any future academy AI endpoint.
