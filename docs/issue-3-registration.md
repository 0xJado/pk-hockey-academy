# Registration template — partial issue #3

The user supplied the blank v2 PDF on 23 October 2026. The website now offers the unchanged original for A4 printing and reproduces its eight sections at `/anmeldung`, using the existing site typography, colors and responsive layout. Source copy and download metadata are separate from presentation. No dependency or new visitor JavaScript was added. The page is independently noindex and remains outside the launch sitemap.

## Completed

- All source sections, labels, options, pricing text, legal paragraphs and signature labels are represented. ASCII transliterations such as `fuer` are intentionally preserved for source parity. The three media choices remain separate unchecked boxes, matching the paper source rather than inventing consent semantics.
- Every text control has an associated label; fieldsets/legends group the sections and position choices. Guardian phone/email labels carry accessible person-specific context. The 28 controls are disabled individually as well as through their enclosing fieldsets, with no assumed required fields or preselected choices.
- There is no HTML form, named control, submission action, success state, browser storage or backend. Disabled fields cannot collect personal details, including without JavaScript. Signature lines show the paper requirement without implementing or claiming a digital signature.
- The original PDF downloads anonymously through ordinary same-origin links. It is a two-page A4 paper template, not a fillable PDF. The route explains that online submission and the paper hand-in process are pending, and no training place is booked through it.
- Training schedule, organisation and footer links expose the template without suggesting online registration is active. The original health/insurance/media wording is quoted from the supplied template, including its explicit legal-review warning; it has not been adopted as reviewed legal policy.

## Confirmed direction — 23 October 2026

- This form registers a child for academy training; it does not create a website account.
- The user clarified that SpielerPlus becomes relevant only for participants who booked multiple sessions. Single-session registration must not default to SpielerPlus. The exact multi-session workflow and links still need confirmation.
- The online pricing presentation consolidates package savings into the 5er card, as requested in a browser annotation. It shows the unchanged 200 EUR package total, 40 EUR per double session and 50 EUR total saving; the original PDF is unchanged. The savings figure is 50 EUR, not the per-session price of 40 EUR.
- Keep Sanity as the website CMS; no Orchard Core migration or self-hosted server is planned. The user selected a **private Google Sheet, one row per registration**, outside Sanity, then explicitly deferred the connection until they speak with Pierre about setting up the Sheet. Account ownership, destination URL/ID, staff sharing and server authentication remain unconfigured. No Google file has been created or shared, and no registration was submitted.

## Planned Google Sheets delivery

Pierre's German [setup guide](PIERRE-SETUP.md) now covers creating an academy-controlled blank Sheet, the `Anmeldungen` tab, restricted sharing (including inherited folder access), optional named staff access and the private handoff of the Sheet URL. It also covers Sanity Free setup. These are owner preparation steps, not a completed API connection. Column mapping, server authentication, allowed fields and retention remain pending; no Sheet, sharing invitation or Google Cloud credential has been created.

The existing branded website form will eventually send to a server-side handler that validates the agreed fields, applies spam/abuse protection, and appends one registration row to the private Sheet. Google Forms is not required, and neither browser code nor Sanity receives Google write credentials. Staff use the private Sheet through named Google accounts; the Sheet must not be published, publicly editable or embedded in the public website. The blank printable PDF remains available independently.

Before implementation/activation, confirm the academy-owned Google account and Sheet, intended staff access and deletion process, Google authentication method, field/consent rules and privacy handling. Use the authenticated Sheets API's `spreadsheets.values.append` with `valueInputOption=RAW` so submitted strings are not interpreted as spreadsheet formulas. Submission success must mean that Google acknowledged the write; retries need duplicate protection and delivery failures must remain visible without claiming a booking succeeded. Sensitive values must stay out of URL parameters, logs, public build files and notifications. The currently disabled preview is unchanged; no handler or Google integration is claimed yet.

Primary references: [Google Sheets append API](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append), [value interpretation](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption).

## Required before activation

1. Agree delivery destination, authorized staff access and retention/deletion. Registration and health data must not be put into the public website bundle or the editorial media CMS. No such storage has been configured.
2. Confirm which fields and declarations are mandatory. The PDF marks none as required. Do not infer an exact birth-date requirement from `Geburtsdatum / Jahrgang`, or require a second guardian automatically.
3. Approve privacy information, health-data handling, insurance/medical language, media-consent scope and withdrawal route. Clarify how the public-use yes/no choices relate to the separate internal-video-analysis box. Preserve voluntary choices without preselection.
4. Decide how the signature fields translate to online confirmation and whether one or two guardian signatures are needed.
5. Confirm where completed paper forms should be handed in and the exact SpielerPlus workflow for multi-session participants. The scope of SpielerPlus is confirmed; paper hand-in, eligibility/link mechanics and any synchronization remain unverified.
6. Implement an actual accessible form with agreed validation, secure server-side delivery and spam protection; verify real success/failure handling, staff-only access and deletion. The current inert preview is deliberately not counted as a completed submission flow.

## Review and verification

Adversarial self-review focused on accidental GET/POST submission without JavaScript, child/health-data storage, invented consent/requiredness, implicit signatures, inactive booking promises and PDF content drift. The implementation avoids a form element entirely, names no controls, keeps inputs disabled and leaves all choices blank. Native download links work without JavaScript. No active submission code or credentials exist. Unchanged PDF bytes plus 61 source-copy matches establish fidelity; no legal adequacy or source-policy approval is inferred from that check.

See `VALIDATION.md` for executed build/browser/PDF checks. Source/download provenance is in `ASSETS.md`. Real submission, spam protection, legal/privacy review, paper hand-in and SpielerPlus acceptance remain open; issue #3 is not closed. No commit, push, deployment or account change is included in this increment.
