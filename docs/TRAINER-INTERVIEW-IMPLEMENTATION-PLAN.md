# Trainer interview implementation plan

Working draft for the trainer portion of GitHub issue #20. Work on develop/feature/trainerInterviews and review in a draft PR against main. Use fictional data until separately approved for real intake.

## 1. Questionnaire

Reuse the German questionnaire, navigation and editable review. Remove birth year from the production trainer flow. Keep 13 main questions, 9 optional follow-ups and full name as the single required answer. Internal contact is optional. Keep dictation and read-aloud with text fallback. Add an optional photo at final submission and separate voluntary choices for publishing the profile and the photo. Keep the fictional preview available separately.

## 2. Invitation, draft and submission

Use a separate gated STRATO PHP runtime, private MariaDB storage and private photo storage. Reuse staff authentication and release and maintenance patterns. Pierre issues, revokes or replaces personal links and sends them manually via WhatsApp. Store token hashes, exclude link secrets from logs and referrers, and ensure link previews cannot consume invitations. Save draft answers server-side with visible save status and allow resume on another device. Validate photo size and content and keep files outside the public root. Make submission retry-safe, keep one completed record and confirm only after the full submission is durable.

## 3. Pierre's inbox and publishing

Notify Pierre by email without interview content or photos. Allow alert retries independently of successful submission. Add a private review area with PDF and JSON export and a profile-only copy that omits internal fields. Pierre edits and publishes the profile and permitted photo manually in Sanity. There is no automatic CMS write, AI generation or trainer approval round after editing.

## 4. Retention

- Invitations and unfinished drafts expire 10 days after invitation issue. Access stops at expiry and maintenance purges expired drafts. Replacing an invitation revokes the old link.
- Proposed for review: completed source interviews and private upload copies stay available while needed for profile preparation or an identified update. Pierre closes the editorial task when that need ends. Closing it removes the raw interview and unused private upload copies through maintenance. Give Pierre a review list for unresolved interviews so records are not kept indefinitely by default.
- Keep the current profile, permitted published photo, necessary operational contacts and minimal publication permission evidence according to their respective purposes. Reassess when a coach leaves or withdraws publication permission. Record the final review interval, post-closure cleanup timing, backup expiry and downloaded-copy handling before genuine intake. There is no blanket 90-day timer from submission in this proposal.

## 5. Review and release

Test fictional invite, resume, submit, notification, export and deletion on the STRATO architecture. Cover cross-coach access, revoked and expired links, preview agents, retries, invalid photos, alert failure, cleanup and recovery. Check desktop, keyboard, real Android and iPhone, including WhatsApp-opened links, speech permissions and browser fallback. Verify existing registration and Sanity publication. Confirm actual STRATO limits and mail behavior, settle the German privacy and permission wording, and include an operating guide in the draft PR. Merge and real-data activation are separate decisions.

## Local implementation and acceptance

The candidate includes two gated routes, /coach/interview and /intern/trainerinterviews. The existing staff login authorizes the inbox. Sending the coach link remains manual. The fragment carries the invitation secret, so link previews and ordinary server access logs only see the route. Coaches explicitly save answers to resume. Photos and permission choices are sent with final submission. The inbox has editable copy fields, supporting answers, JSON and photo downloads, and browser-print PDF. The private mail alert contains only a link to the inbox. If mail is rejected, the inbox retains the submission and lets Pierre retry. A transport accepting mail is not proof of inbox receipt.

For a private installation, place Runtime.php, Interviews.php, Http.php, coach.js and console.php from hosting/strato/interview together in a versioned directory outside the document root. Generate questions.json into that directory with node --experimental-strip-types hosting/strato/export-trainer-questions.mjs. Create a private config from config.example.json with its own random 32-byte base64 data key and interview database credentials. Reference the accepted staff library and staff configuration. Install the table with php console.php migrate PUBLIC_ROOT PRIVATE_CONFIG. The public root needs the denied dotfile .pk-trainer-interview-location.json with absolute publicRoot, runtimeFile and configFile paths. Keep both activation values false throughout installation and verify the closed response. Scheduled STRATO maintenance reads the locator to purge expired drafts after approval. The console also supports an operator purge.

Before turning on real intake, verify MariaDB privileges and encryption, PHP request and upload limits, mail receipt and failure recovery, production cookie behavior, the anonymous disabled route and authentication. Use a controlled fictional host fixture for those checks. Confirm the interview privacy and permission wording, account for exported files and backups, and set the owner review schedule for closed permission evidence. Confirm how interview data and keys will be backed up and how erasure is respected on restoration. Android, iPhone and WhatsApp-opened speech acceptance is still required. The existing public and registration switches cannot enable trainer interviews. The production hostname, mail destination, real data activation and public deployment require the separately reviewed release.

Local checks are repeatable with php hosting/strato/tests/trainer-interviews.php and node --experimental-strip-types web/tests/trainer-interview-browser.mjs after installing the Playwright Chromium used by the website. These use isolated SQLite and fictional data, a simulated mail transport, and browser PDF generation.

On 23 November 2026, a protected one-use helper on live STRATO sent one generic PHP mail test to info@pkhockeyacademy.de. PHP accepted it, the helper was removed and verified unavailable, and Pierre reported receipt on 24 November. This verifies the host-to-mailbox transport. The integrated interview runtime on STRATO and its notification retry behavior still require a hosted fictional submission test. The local A4 export was visually checked with fictional answers after removing screen-only controls and empty questions from print.
