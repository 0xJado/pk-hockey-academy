# Registration form implementation — #15

13 November 2026: work can progress locally while #13 awaits STRATO's substantive support response. The user supplied the automated acknowledgement; it is not provider acceptance of either hosting question.

## Implemented transport candidate

`web/src/lib/registration/intake-client.ts` implements the existing PHP JSON contract. The form now imports it, but its public caller never enables input or submission. No public PHP endpoint, private host configuration or genuine-data activation changed.

- Fetch the signed retry token by POSTing an empty JSON object; no participant data is sent to the token route.
- Serialize once before the write. Concurrent clicks cannot start another token request or write.
- Only a 200/201 `received` response with a valid opaque receipt counts as successful receipt, never as a confirmed booking.
- On a lost response, timeout, malformed reply or uncertain server error, retain the exact body/token in page memory. Explicit `retry()` resends those same bytes with the same token. No automatic retries or browser storage.
- A PHP 422 permits corrections with the same token; server errors are represented only by field names, not arbitrary returned text.
- A 409 requires review rather than silently creating a new token; this includes expired tokens, restore epochs, policy changes, conflicts and reconciliation.
- Bound network and response-body waits. A client abort does not prove that the server rolled back. Reloading loses the in-memory retry state; the UI warns against starting over after an uncertain outcome, guards navigation and offers the Academy's contact route.

Verification: seven fault-injection tests in `web/tests/intake-client.test.mjs` cover receipt loss and edited drafts, double clicks, corrected validation, conflicts/expiry, misleading success responses, token failure and stalled responses. These are transport tests, not browser accessibility or PHP/database end-to-end acceptance.

## Form and integrated acceptance — 14 November

`TrainingRequestForm.astro` and `form.ts` implement the selected minimal German request, conditional single/package choices, year rather than birth date, one main contact, separate optional consents, health input only after consent, inline errors and a focused linked error summary. The final section asks the guardian to review all entries and explains receipt versus personal booking confirmation. Fields and drafts never enter browser storage. Pending/uncertain writes freeze editing; a successful receipt clears inputs. Inputs are disabled in server HTML, including the fictional fixture, and only an explicitly enabled caller plus successfully initialized JavaScript enables them. The public `/anmeldung` caller remains disabled.

The dedicated `tests/fixtures/registration.config.mjs` injects a fictional page only into its explicit test server. The normal config/export does not include this route. `registration-form-browser.mjs` passes 25 checks at 1440/768/375px, including error-summary/control focus, genuine PHP validation correction, no-JS/public disabled inputs, unselected consents, health clearing/exclusion, single/package submissions and no sensitive browser storage or URL values. The harness forwards only to loopback PHP and emulates the accepted origin there; it does not verify real-host TLS/Origin transport. Browser-created records are encrypted in isolated SQLite storage and decrypted through the actual authenticated staff listing/detail code. Losing a response after a committed write and retrying produces one record and one claim. The test creates no real account or participant record on STRATO. Mobile screenshots were inspected. No manual screen-reader acceptance is claimed.

Commands: `npm run test:strato:registration:browser --prefix web` (PHP with PDO SQLite and sodium; pinned Playwright Chromium installed), `npm test --prefix web`, `npm run check --prefix web`, `npm run build:strato --prefix web`. Windows portable PHP overrides are `PK_PHP_EXECUTABLE`, `PK_PHP_EXTENSION_DIR`; `PK_BROWSER_CHANNEL=msedge` uses installed Edge. CI now runs the integrated fixture after the HTTP checks. Local verification passed 86 unit tests, zero Astro diagnostics, and a verified 145-file STRATO export with no Node server.

## Remaining acceptance

Connect real published requestable session options when enabling the public form; server revalidation remains authoritative. Keep package scheduling with Pierre and SpielerPlus entirely separate. Verify the full browser/private MariaDB/staff HTTP journey on the protected host, navigation/back-forward behavior with an unresolved request, and manual assistive-technology acceptance. Preserve the unchanged A4 PDF; the page now explains its differences from the minimal online policy. Paper hand-in guidance still needs a verified destination; none is invented.

The user directed rapid completion on 14 November and agreed that the pending provider questions are not absolute implementation blockers. Treat the upload deadline and broader database-scoped privileges as documented hosting limitations for launch review, not as fixed or as requiring an indefinite wait for support. This direction does not make a failed timeout test pass or constitute final legal/text acceptance. Existing genuine-data and public-launch gates remain independent.

Final acceptance and activation still depend on #12, #13, #14, fictional end-to-end verification and explicit approval of genuine-data collection. This increment closes none of those gates.
