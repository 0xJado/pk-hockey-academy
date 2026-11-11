# Current project status

Daily maintenance now has configured encrypted path secrets, an enabled 02:17 UTC schedule and a successful first CI execution ([43121714991](https://github.com/0xJado/pk-hockey-academy/actions/runs/43121714991), `9847268`). It verifies the private encrypted daily backup and runs retention while intake/staff remain disabled. Failure-channel receipt, real operator/canonical-route handoff, #13 provider acceptance and final policy/form activation remain separate.

12 November 2026: fixed and pushed the CMS-free media-kit export regression (`b46f71e`); hosted quality run 43118264712 passed. Extended #13 testing found that a slow-drip JSON request exceeded the reported 60-second input setting and remained open to the 75-second client limit. The timeout gate remains false; [STRATO support questions](STRATO-SUPPORT-QUESTIONS.md) are prepared, not sent. No experimental timeout setting was retained.

#14 progressed independently using isolated fictional data: 34 real-host MariaDB checks passed for staff auth/cookies, concurrent updates, withdrawal, revocation/recovery, backup/restore erasure replay, category deletion and cleanup. Production still has no staff users/requests. Daily retention/encrypted-backup code has eight local assertions; manual actual-host creation and same-day verification of an empty encrypted backup passed. The gated CI schedule is prepared; its live dispatch/notification and owner handoff remain open. Existing legal/privacy edits were preserved separately.

#13 implementation increment, 11 November 2026: the [private PHP intake candidate](STRATO-REGISTRATION-BACKEND.md) now validates the selected versioned policy, writes category-bound encrypted staff records and durable receipts atomically, rejects conflicting retries, persists abuse limits, checks published sessions and reconciles ambiguous commits. Passed 104 PHP assertions, 16 two-worker HTTP checks and 26 actual MariaDB checks, including real lock timeout, both commit-loss timings and published Sanity transport. Fictional tables and temporary helpers were removed. Three paused intake tables and disabled private source/configuration are installed; public endpoint/form and staff access remain disabled. #13 remains open for runtime privilege/upstream timeout acceptance and #12 final policy dependency; #14/#15 still gate genuine end-to-end collection. No new static release was deployed or source pushed.

Follow-up host inspection confirmed database-scoped grants without user-administration/grant authority, zero production requests/claims/users, PHP input limit 60 seconds and a stalled fictional upload connection closed by the server in about 10.1 seconds. No settings were changed and its helper was removed. This does not prove second-user support or every slow-drip/upstream case; the two host-acceptance gates remain false rather than inferring approval.

Database increment, 11 November 2026: the account holder created private MariaDB and entered credentials locally. PHP connectivity, six empty InnoDB/utf8mb4 foundation tables, Unicode round-trip, rollback and sodium prerequisites passed on STRATO. Configuration/keys/journal/library are outside the public root; the temporary helper was removed and its 404 verified. No registrations or staff accounts exist; staff access and intake remain disabled. See [database setup and remaining #13/#14 work](STRATO-DATABASE.md). Runtime privilege separation, validated/idempotent intake and full lifecycle/restore acceptance remain open. This supersedes the earlier read-only/no-database checkpoint below.

This is the current entry point. Dated assessments and VALIDATION.md preserve historical evidence, not current task lists.

Launch work is tracked in [STRATO migration and webapp launch #7](https://github.com/0xJado/pk-hockey-academy/issues/7), with twelve native sub-issues (#8–#19) covering dependencies and acceptance. Start with [protected production hosting #8](https://github.com/0xJado/pk-hockey-academy/issues/8). Existing feature issues remain referenced; optional social/shop work is not silently added to the launch scope.

Overnight increment, 11 November 2026: the user requested #14 followed by the next two dependency-free tickets (#12 and #18). #14 now has a [locally tested PHP staff candidate](STRATO-STAFF.md): authentication/revocation, bounded login/CSRF/origin defenses, encrypted categories, revision-checked status changes, retention, narrow holds and private backup/restore reconciliation. It remains open because #13 has no production database/intake contract. Read-only STRATO inspection found 0/25 databases used and MariaDB 11.8/MySQL 8.0 available; no database, credentials or account settings were created/changed. Staff source is excluded from deployment artifacts and public registration remains inactive.

#12 has a [concrete versioned text/policy draft](REGISTRATION-TEXT-V1.md), all 28 paper fields mapped, separate optional consents and receipt copy bound into the checker. Final owner/text/legal acceptance is still unclaimed; no duplicate questionnaire or SpielerPlus dependency was added. #18's [chosen omission scope](INTERVIEW-LAUNCH-SCOPE.md) is implemented: STRATO never exposes interview inputs, even with launch=false. Original fictional questionnaires remain in separate protected review builds; actual-device/real-data interview acceptance is deferred with the feature. These new source changes have not been deployed.

Current stage, 10 November 2026: #8 and #9 are closed. #10's GitHub secrets/build variables, dedicated dispatch token and separate Sanity publication hook are configured, and protected automatic publishing is enabled. The initial CI delivery and a real approved-logo edit/withdrawal passed; the old download URL returned 404 after withdrawal. Draft-only creation/removal triggered no production build. Deliberately invalid required metadata failed before deployment while the previous page/download-response hashes remained unchanged. Original CMS business fields and download bytes were restored exactly. Restoration delivery and the latest rollback round trip passed, preserving authentication and verifying served bytes. Earlier protected-host interrupted-upload checks remain recorded. The operator confirmed receipt of the intentional failed-build alert on 10 November 2026. Pierre's representative update and retirement of the old publishing hook remain open. See [publishing operations](STRATO-PUBLISHING.md). Accepted CI runs build the previously pushed `688918f`; later local source/legal/privacy work is not part of that release.

Parallel #11 progress: a PHP private-preview candidate is deployed on the protected STRATO host, with outside-root configuration, the existing Astro trainer layouts and native editing/navigation code. Native secret/session/draft/published checks, standalone browser handoff/sign-out at 1440/768/375px and 127 host HTTP checks passed; five additional private/encoded paths were denied. Studio still uses Vercel. Actual Studio-frame field selection, automatic mutation refresh, browser cookie acceptance and the user's cutover acceptance remain open. See [private preview runbook](STRATO-PRIVATE-PREVIEW.md). CI now sets `STRATO_PRIVATE_PREVIEW_ENABLED=true` to retain this candidate. No trainer records, Studio settings, registration processing or database were changed.

Parallel #12, simplified on 10 November: the user delegated simple options and excluded SpielerPlus entirely from the website workflow. The [start model](REGISTRATION-LAUNCH-POLICY.md) maps all 28 paper fields/choices to a minimal training request: one guardian contact, child name/year, optional planning/health notes, separate optional consents and personal booking confirmation by Pierre. Access/retention rules are already chosen in the privacy operating rules, rather than awaiting another questionnaire. The source-review checker now binds to the selected model and unchanged PDF; private worksheets cannot approve or activate collection. Final text/legal/implementation acceptance remains separate; #12 is not represented as Pierre's signed approval. No database or live form is activated.

## Approved design checkpoint — 7 November 2026

The user approved the homepage/subpage redesign and coach profile extension for merging from `develop/strato-migration` into `main`, following the final skate-outline refinement. This is a design and CMS-schema checkpoint, not completion of the STRATO migration or public launch. Hosted Studio deployment, approved coach career content and the remaining dependencies below still apply.

## Completed foundation

STRATO hosting acceptance (#8) completed and the issue was closed on 8 November 2026. The single production domain is HTTPS-only and password-protected, with scoped SFTP and verified PHP/private configuration capabilities. The first protected Astro deployment (#9) now serves published Sanity content. Automated Sanity delivery, private Visual Editing replacement and registration/storage/staff workflows remain separate later stages; this is not public-launch approval.

STRATO restructuring, 7 November 2026: separate review runtime source, a static-only `build:strato` target, checked deployment artifact, Apache extensionless-route configuration and inactive PHP entry points. No Node process is needed for this hosting target; local/CI Astro builds still use Node/npm. Private Visual Editing remains on the existing review host. PHP/Apache hosting acceptance, deployment automation, database and staff workflows remain pending. See [hosting instructions](../hosting/strato/README.md).

German responsive website, supplied branding, reusable motion, trainer CMS, hosted Visual Editing, Sanity-managed media kit, printable registration PDF and simple player/trainer questionnaires. Interview AI was cancelled. Trainer photography is optional under the approved logo presentation.

## Local increment — 2 November 2026

Registration now has a server-only, policy-injected processing foundation with fake-delivery tests; the public endpoint still rejects submissions without reading them. The contact page lists the academy email and a placeholder for WhatsApp. Full mobile player/trainer journeys now run in the maintained browser suite. See [forms foundation](FORMS-FOUNDATION.md) for contracts and activation limits.

Opt-in session/venue schemas and retrieval, shared validation, upcoming schedule handling, venue details and keyboard improvements. See [local acceptance](LOCAL-ACCEPTANCE.md) for checks and limits, and [training editing](TRAINING-CMS.md) for activation.

## Remaining dependencies

- Environment decision, 7 November 2026: one STRATO production environment at `pkhockeyacademy.de`, initially password-protected for acceptance. Separate staging/QA hosting is not required. Temporary protection does not replace the remaining server, publishing, privacy and launch checks.

- Coach profiles implemented locally, 7 November 2026: dedicated `/trainerpool/{document-id}` pages, biography, optional years as player/trainer, highest division, selected playing teams and an eight-image player gallery. Homepage and trainer-list links now open the profile. The Studio's new Laufbahn fields are built locally; hosted Studio deployment and Pierre's approved career facts/photos remain pending. No career facts or gallery records were fabricated or published.
- Hosting decision, 6 November 2026: migrate production to Pierre's existing STRATO Hosting Basic package. Keep Astro static public pages and Sanity for public website content; use PHP and a private STRATO database for registrations. Google Sheets delivery is abandoned. The developer-owned Vercel site remains the protected review host until migration is implemented and verified. See [migration decision](STRATO-MIGRATION.md).
- Registration: private STRATO database, PHP processing and protected staff interface, approved fields/consents/signatures/retention, durable request state, production activation and booking process. No Google Sheet is needed.
- Schedule: real dates, halls, groups and capacity. New CMS source stays disabled pending live deployment and publishing acceptance.
- Contact: WhatsApp number.
- Launch: legal content, domain connection and explicit approval.
- Admin/gallery: account recovery/MFA/member lifecycle and approved real-media acceptance.
- Interviews: excluded from STRATO/public launch; actual phone/voice/privacy acceptance and private delivery are deferred with any future activation. No AI work remains.
- Social: real accounts/posts and privacy/embed acceptance. Can follow launch.
- Shop: future scope, excluded from MVP.

[Pierre checklist](PIERRE-CHECKLIST.md) · [Publishing runbook](CMS-PUBLISHING.md)

The original local increment was committed in 7eb5d23, 307d3d9 and 05199eb. The protected website deployment for 05199eb reached READY before reproducible testing work began. Training CMS activation and live schema/hook changes remain pending.

The new [quality workflow and test guide](TESTING.md) covers clean installs, pinned tooling and isolated CI checks.
