# Interview portal — first working increment

Implemented 30 October 2026. This completes the first questionnaire/voice-preview foundation, not Pierre's full AI-interview project. The [expanded target](bot-integration-review.md) still includes real AI conversation, professional profile generation/image support and protected delivery after participant approval. Voice turn-taking and delivery recipients remain open questions.

## Try the preview

Open [the protected interview portal](https://pk-hockey-academy.vercel.app/interviews). Choose `/spieler-interview` or `/trainer-interview`. Use fictional answers only. For local development run the existing website commands; no new dependency or credential is needed.

1. Confirm the test-only notice. An adult accompanies the player test.
2. Type an answer or opt into browser speech recognition under **Optionale Sprachfunktionen**, then choose **Antwort sprechen**. Recognition is not started automatically. **Frage vorlesen** reads the fixed question; automatic question reading is off by default.
3. Use **Weiter**, **Zurück** or **Überspringen**. The trainer's name is the only required source field, and cannot be skipped; an invented name is sufficient. Local follow-ups are optional and bounded to one per base question.
4. Review and edit answers. Primary and follow-up answers remain separate. **Zur Frage zurück** reopens the selected question.
5. **Antworten als JSON speichern** downloads a versioned test export. **Drucken / als PDF speichern** opens the browser's print dialog. The print view uses plain text and prints full long answers rather than textareas with clipped contents.
6. **Neu starten** asks for confirmation before clearing the current test. Leaving/reloading clears in-memory answers and stops speech. Previously downloaded files remain on the user's device.

## Implemented boundaries

- One typed engine with both original question sets: 15 player questions and 14 trainer questions, extracted as literal data from the supplied prototypes without executing their code. Source question text/labels/sections are retained. Existing academy branding, self-hosted fonts, header/footer and logo are reused.
- `/interviews` is a shared portal. Dedicated routes reuse `InterviewPage.astro` and `Interview.astro`. No React island, new package, database, CMS write or AI endpoint was introduced.
- All routes are noindex and excluded from the sitemap. They are not in primary navigation. The existing Vercel Deployment Protection is required for restricted testing; noindex/hidden links are not authentication.
- When `PUBLIC_LAUNCH_READY=true`, builds render inactive explanatory pages without the interview input root. Enabling public interviews later requires a deliberate implementation/release decision; a public academy launch does not automatically enable this test collection.
- Text answers stay in memory. There is no application fetch/submission, local/session storage, autosave or resume feature. No interview data are placed in Sanity or in the separate planned registration Sheet. Exported JSON is explicitly `testOnly`, `responseMode: local-rules`, and `reviewedForPublication: false`; it is not a publishing approval or verified trainer biography.
- Browser speech recognition may send audio to the browser vendor's service. This is disclosed before optional opt-in. Text input remains available when recognition/HTTPS support is missing or permission fails. Microphone permission alone is not described as proof of recognition support.
- Voice callbacks belong to a particular recognition instance/generation. Next/back/skip/review/reset, manual typing, visibility changes and Astro route disposal abort recognition and cancel spoken questions. Late results/errors/end events cannot overwrite a new question/session. Duplicate starts while permission is pending are ignored.
- Astro page-load/before-swap/pagehide/pageshow handling initializes one controller, removes listeners, revokes temporary download URLs and clears disposed fields. Re-entry starts a new test; it never restores earlier answers from browser history.
- Fields are labelled, question headings receive focus, status/error feedback is accessible, the reset dialog uses native modal focus handling, and motion is a short opacity/transform entrance. Reduced motion removes it. Scoped light-surface outline buttons preserve text/border contrast.

## Executed checks

- Website: 54 tests (including nine new interview/state/voice regressions), Astro check (84 files, no diagnostics), and configured build passed.
- Edge: portal and both welcome pages at 1440/768/375px; long active question at all three widths; one h1/no overflow, noindex, test gate, mandatory-name errors, all original questions, back/follow-up preservation, labelled editable review, real JSON downloads, literal HTML safety, print-dialog invocation and reset/cancel.
- Mocked audio: no automatic microphone/speech activation, Next aborts capture, a delayed transcript is rejected, manual reading runs, and unsupported recognition leaves typing available. Unit regressions also cover permission denial, duplicate pending starts, stale errors/end callbacks and interim transcript replacement. Real microphone/provider/device behavior remains unverified.
- Navigation: browser Back after leaving clears answers; repeated Astro navigation produces one controller/root, reload clears answers, mobile-menu Enter/Escape works, keyboard order/focus is usable, reduced-motion entrance is disabled, and a no-JavaScript phone context shows an explanation with a disabled start button and no submitting form.
- Browser network monitoring recorded no application POSTs, no external page requests and no page exceptions during the mocked-audio run. This does not claim that real browser speech recognition is local-only.
- Both actual downloaded JSON files retain all 15/14 questions, literal edited text and the explicit test/unapproved flags. Both print profiles were saved as A4 PDFs with three pages each; all six pages were rasterized/visually inspected, and the end of each long answer was verified. PDF extraction initially inserted inter-letter whitespace, so the text assertion was normalized; rendering showed the full text correctly.
- An isolated launch-enabled build confirmed no input/textarea/interview root on all three routes and no interview sitemap entries. Its first output location outside `/web` failed dependency resolution during prerendering; repeating inside ignored `web/.astro/interview-launch-check` passed. No deployment environment/domain setting was changed for this fixture.
- Visual inspection found inherited white-on-white outline controls; the scoped fix was rebuilt and responsive/keyboard checks repeated successfully. Existing Sanity vendor bundling warnings remain; no application build error remains.

Ignored evidence: `output/playwright/interview-*.png`, `interview-*-answers.json`, `interview-*-profile.pdf`, `interview-pdf-checks.json`, `interview-layout-qa.log`; build logs under `output/`; task-owned harnesses under `.tools/`. No real personal answers or credentials are committed.

## Hosted acceptance

Deployment `dpl_3Ho6iwSoBwEzz9UWwMer5NvRVMbw` reached READY from `c1599c0`. Readback confirmed existing Deployment Protection remains enabled and `PUBLIC_LAUNCH_READY=false`. Native signed-in review-browser checks verified the portal, both interview start gates, player advance/back answer preservation, trainer-name error/disabled skip, optional skipping and the trainer role follow-up. All answers were fictional and were cleared by returning to the portal. The tab's error log was empty. Full local flow/export/voice-mock acceptance is recorded above; real microphone or AI behavior is not inferred from this hosted smoke test. Saved `output/playwright/interview-hosted-final.png` and retained the portal for review.

## Next increments and remaining inputs

The rule-based preview is the starting point. Keep these as required follow-up work:

1. Define sequential versus fluid voice turn-taking, then implement server-side AI clarification/follow-ups and participant-correctable summaries with a reviewed provider, budget and data flow.
2. Add the professional PDF/profile generator and appropriate optional image support. The current browser-print export is a basic answer profile. Trainer portraits remain optional and can already be maintained in Sanity independently.
3. Agree private recipients, storage/access, retention, approval and failure behavior, then implement protected delivery. Do not assume that the registration Sheet is an approved interview destination.
4. Review player field requiredness, privacy/guardian wording and real processing before inviting families to supply actual data. Test real Android/iPhone microphones and a WhatsApp-opened protected HTTPS link.
5. Add any later trainer-to-CMS import as an authorized, whitelisted hidden/unapproved draft workflow. Raw player interviews, internal trainer contacts and consent evidence must stay outside the public content dataset.

## References

- [Astro page transitions and lifecycle](https://docs.astro.build/en/guides/view-transitions/)
- [SpeechRecognition support and service processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Aborting recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/abort)
