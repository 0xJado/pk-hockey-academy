# Private registration management — issue #14 candidate

Update, 12 November 2026: **34 actual STRATO/MariaDB checks** now pass on isolated fictional tables: real Secure/HttpOnly/SameSite cookies, origin/CSRF, encrypted record reads, escaping, concurrent status/audit updates, withdrawal, revocation/recovery, role refusal, logout, private backup/restore with erasure replay and paused intake, category expiry/final deletion, maintenance and cleanup. Production users/requests remain zero; no real operator account or permanent staff route was enabled. The local suite now has 63 PHP assertions plus 26 browser checks at 1440/768/375px.

`Maintenance.php` adds daily staff/intake retention, an authenticated encrypted request-only snapshot, same-day retry verification and owned-file expiry. Eight local checks pass, including tamper refusal and missing-journal failure. The actual empty production DB was maintained twice: first encrypted backup created privately, second run verified it without duplication; helpers were removed. This is operator execution evidence, not proof that a scheduler or its failure notifications have run. The gated GitHub workflow is prepared in `.github/workflows/strato-maintenance.yml`; scheduling/alert acceptance and real Pierre credential/canonical-route handoff remain open. #13's provider timeout and #12/#15 activation gates remain unchanged.

Host tools: `node hosting/strato/accept-staff.mjs` (disposable fictional acceptance) and `node hosting/strato/maintain-registrations.mjs` (real operator retention/backup). Both use the shared release lock and temporary dual-authenticated PHP helpers; they preserve the router and remove the helpers. Current operation requires the protected hosting phase; final public-launch changes must re-accept the job path rather than silently relaxing authentication. Maintenance transmits count-only status to the CI operator, never keys, registration payloads or backup bytes. PHP/source/backups remain outside the public document root. Current backup destination is STRATO itself; independent offsite recovery is not claimed.

The schedule is 02:17 UTC daily (03:17 CET / 04:17 CEST), guarded by `STRATO_DATA_MAINTENANCE_ENABLED`. It uses existing scoped SFTP/review secrets plus verified public/private path secrets. No database credential or encryption key is copied into GitHub. Workflow failures use the previously selected GitHub Actions operator-notification channel; a definition alone is not a receipt/response test. Keep the gate off until secrets, one real CI execution and operator failure handling are accepted.

First actual CI operation succeeded on 12 November: [run 43121714991](https://github.com/0xJado/pk-hockey-academy/actions/runs/43121714991), source `9847268`. The verified path secrets are configured and the daily schedule gate is on. It ran retention against the still-empty database, verified today's encrypted backup and removed its helper; this does not activate collection or staff access. A manual `verify_failure_reporting=true` input deliberately fails before any server contact to verify the already selected notification channel. A human receipt must be recorded before claiming that notification test passed. A scheduled job is not a guarantee of deletion: monitor failures, catch up missed runs and perform the chosen monthly controls.

Failure-channel acceptance completed on 12 November: [run 43122305661](https://github.com/0xJado/pk-hockey-academy/actions/runs/43122305661), verified source `af2ff83`, failed only at the deliberate notification step; the server maintenance step was skipped. The user explicitly confirmed receipt of the GitHub notification. The earlier dispatch 43122110546 resolved to the prior workflow source and performed normal successful maintenance, so it was not counted as the failure test. [Full quality run 43122110515](https://github.com/0xJado/pk-hockey-academy/actions/runs/43122110515) passed, including all website/Studio/CMS/static-export, PHP, HTTP and browser steps. Remaining #14 work is real operator credential/canonical-route handoff and acceptance against #13/#12/#15; genuine collection remains disabled.

After the alert test, [ordinary maintenance run 43123602934](https://github.com/0xJado/pk-hockey-academy/actions/runs/43123602934) succeeded. The latest operational execution is healthy; the intentional failure is not an unresolved data-maintenance outage.

Implemented on 11 November 2026. This is a locally tested PHP candidate, **not an enabled staff service**. #14 depends on #13, which now has a separate [implemented, disabled intake candidate](STRATO-REGISTRATION-BACKEND.md). Public `/api/registration` still returns inactive 503 without parsing bodies. No real registrations or staff credentials were created. Source lives in `hosting/strato/staff/` and is deliberately excluded from the static deployment artifact.

## Verified account prerequisites

Later update, 11 November: the account holder created MariaDB and entered credentials privately. The [database foundation](STRATO-DATABASE.md) now has verified PDO access, six empty InnoDB/utf8mb4 tables, rollback and runtime encryption prerequisites. The staff library is installed outside the public root with activation disabled; no staff route/account exists. Runtime privilege separation, intake and full staff/lifecycle acceptance remain open. This supersedes the initial read-only checkpoint below.

Read-only STRATO inspection found **0 of 25 databases used**, with MariaDB 11.8 and MySQL 8.0 offered. No database was created and no hosting/security setting was changed. Creation requires entering a new password. That credential-entry step remains for the account holder; do not send the password in chat. No paid upgrade is needed based on the observed quota.

## Implemented boundary

- Separate personal staff authentication; Sanity membership grants no registration access. The supported launch role is a personally assigned administrator for Pierre. Unimplemented roles, including coaches, fail closed. No accounts are automatically provisioned.
- Opaque server-side sessions, authenticated-cookie rotation, strict SameSite/HttpOnly cookies (Secure plus `__Host-` in production), 20-minute idle/8-hour absolute expiry, per-request account/role/version checks and immediate sign-out/revocation. Password reset changes the account epoch and revokes existing sessions.
- Origin plus session-bound CSRF verification for every write/login; bounded form bodies, strict field sets, no arbitrary updates or uploads. Rate limits persist in storage and use HMAC references to the direct server peer/account, never trusted forwarded headers. Global/session limits bound unknown-account floods. A fail-closed SQL race is not retried blindly.
- List/detail/status views with escaped German HTML, no third-party assets, no visitor tracking, no-cache/noindex and frame denial. Personal data stays in response bodies, not query strings. Record IDs are opaque random references. No CSV/export endpoint; backups are offline-only.
- Human booking state is recorded only after the operator confirms the separate personal communication happened. Clicking a status button sends no email and guarantees no place. Optimistic revisions reject stale edits; real two-process tests prove only one competing transition commits.
- Sodium-authenticated encryption separates organizational, care/health and consent-evidence payloads. Audit rows contain only pseudonymous actor/record references, fixed actions and timestamps, with 90-day expiry. Application errors never print participant bodies, credentials or PDO diagnostics.
- Rejected/withdrawn care data is erased immediately. Completed-booking care data expires within 14 days of the actual last training; organizational data expires after closure/handling plus 90 days. Expired categories are hidden even before the scheduled purge. Pending requests with 90 days without progress are flagged for personal closure, not silently declared rejected.
- Consent withdrawals remove health notes independently of other necessary care contacts and record separate media withdrawals. Health/media evidence has independent purpose deadlines; actual media-use end must be documented. A longer-lived media proof never extends health-content retention. Actual photos/videos and CMS/CDN removals are separate operations; the UI does not claim to delete those assets. Pierre still performs the chosen annual/media and monthly deletion controls.
- Narrow legal holds require a concrete basis, category and review within 31 days; care holds require an explicit special-category basis. A new hold cannot resurrect already expired/missing data. Expired/released holds do not extend other categories.

## #13 storage contract, version 1

Later #13 implementation adopted this encrypted record contract. Local cross-reading and withdrawal/restore tests pass; actual MariaDB intake concurrency/failure tests pass using isolated fictional tables. The updated restore code pauses/rotates an existing intake epoch so recovery cannot silently replay old browser tokens. The current staff service is still disabled and its actual-host deployment/restore/operator acceptance remains #14; do not infer it from intake tests.

`Staff::migrate()` creates the prefixed InnoDB tables for MySQL/MariaDB or equivalent SQLite test tables. HTTP requests never migrate a database. `pk_staff_schema.version` must match 1. Production configuration rejects SQLite and requires the explicit `databaseContractAccepted` gate. MariaDB syntax, privileges, concurrency and performance must still be verified on the actual provisioned database.

`pk_staff_requests` holds opaque IDs, state, revision/timestamps, encrypted `org`, `care` and `proofs` plus independent deadlines and encrypted hold details. #13 must adopt or explicitly migrate this contract after implementing its own accepted-field validation, genuine-session checks, idempotency, request identity/rate controls and durable-write outcomes. The only insertion helper here is explicitly test-only and is not an intake API.

Organizational payloads contain the selected minimal child/contact/booking fields. Care payloads contain optional health, emergency and pickup information. Proofs are independently keyed `health`, `website`, `print`, `analysis`, with exact version, actor/subject references and declaration/withdrawal/use-end times; only the minimal identifying evidence belongs there, never health notes or full form copies. #13 must define the final validated payload and policy-version adapter before enabling the candidate. False/absent grants must not be turned into invented proof records.

Supported states: pending, personally confirmed, completed, rejected, withdrawn and reconciliation. Restoring a snapshot puts records into reconciliation; it does not silently reinstate a booked place. Actual commercial communication and safety decisions remain with Pierre. Coach assignments, accounting and media-asset management are not implemented by this candidate and must not be granted access through its administrator role.

## Private configuration and operator commands

Copy `hosting/strato/staff/config.example.json` **outside every public root**. Keep activation gates false and maintenance=true until the database contract and staff acceptance pass. Generate four distinct random 32-byte keys, base64-encode them and keep their purposes separate: data, session authentication, audit/journal and backup. Preserve data/journal keys separately through recovery. Neither config, classes, migrations, console script, SQLite fixtures nor backups may enter public assets.

`PK_STAFF_LIBRARY` selects the outside-root directory containing the three private PHP classes; copy only the tiny public entry after accepted routing is designed. A library inside the public root is rejected. `PK_STAFF_CONFIG` selects the outside-root file; `PK_PUBLIC_ROOT` identifies the actual public root for validation. Production requires the approved HTTPS origin, MySQL PDO, sodium and a private independent journal/backup directory. A missing or disabled configuration fails closed. Before routing `/intern/anmeldungen`, verify its Apache/TLS headers and cookie behavior on STRATO behind existing site protection. The current deployment does **not** contain this route.

Offline commands (from the repository root; use the accepted PHP executable):

```text
php hosting/strato/staff/console.php migrate
php hosting/strato/staff/console.php admin-password pierre
php hosting/strato/staff/console.php revoke pierre
php hosting/strato/staff/console.php retention
php hosting/strato/staff/console.php backup
php hosting/strato/staff/console.php restore PRIVATE_BACKUP_FILE
```

Password setup/recovery reads `PK_STAFF_PASSWORD_FILE` privately; never pass a password as a command argument. The file contains an operator-entered 16–72-byte password; no default password or shared account is shipped. Recovery requires verified account ownership and outside-root operator access. No unsolicited email/password-reset messages are sent. Remove the temporary password file securely after the operation under the operator's approved process.

Schedule and verify a daily retention run and daily backup after deployment, including visible operator failure reporting; no scheduler has been configured by this implementation. Retention/backup operations deliberately fail for workloads over 10,000 requests pending a reviewed larger batching strategy. Count-only summaries expose no participant values. Confirm receipt of failures and monthly controls before genuine data. Do not use the endpoint as a replacement for a scheduled deletion job.

## Recovery without resurrecting erased information

Backups contain encrypted request snapshots only, not passwords, accounts or authenticated sessions. The backup key is separate and never embedded in a backup. Operator-created files follow a fixed name in the configured outside-root directory; retained backups expire after 35 days. Offsite copies require a separately accepted destination/access policy.

The encrypted erasure/withdrawal journal is **independent of snapshots** and must survive recovery. It records pseudonymous category restrictions, purpose withdrawals and stricter deadlines for the 35-day backup window. Erasures are journaled before a database write: if the write fails, a future restore may conservatively redact more, never resurrect content. Do not replace the current journal with an old backup copy.

Restore only into an empty database with maintenance=true, original encryption keys and the current journal. The web entry refuses maintenance mode; the offline operator can migrate/recover while web activation remains disabled. Reject modified, over-age or incompatible snapshots. Replay erasures/withdrawals/deadlines and newly due category expiry before the app becomes available; revoke sessions and require personal state reconciliation. If the current journal/keys are missing or untrusted, keep access disabled rather than guessing. Credential/accounts are re-established separately through a verified operator process. Test full recovery on STRATO with fictional records before acceptance.

## Executed checks and remaining acceptance

Local PHP checks: 59 assertions including key separation, private-config boundaries, record/category-bound encryption and ciphertext-swap denial, direct record denial, token rotation, CSRF, role/version revocation, sign-out/timeouts, throttles, write failure, stale revisions, category expiry, legal holds, per-purpose proof expiry, backup tamper/age checks and restore reconciliation. HTTP/browser checks: 26 cases with real concurrent PHP workers, XSS escaping, wrong/opaque origin and CSRF, stale writes, no exports, logout/revocation, maintenance/outages and desktop/tablet/phone layouts. All use SQLite and fictional records; they do not establish MariaDB acceptance or actual Pierre account recovery.

Commands: `php hosting/strato/tests/staff.php` with PDO SQLite/sodium enabled; `npm run test:strato:staff:browser --prefix web` with a PHP executable and installed browser. On this Windows workspace the existing portable PHP 8.4.27 extensions were selected explicitly and Edge was used. CI runs these checks without academy credentials. Private fixture DB/config/logs/screenshots stay ignored under `output/staff-tests/` and are excluded from uploaded diagnostics.

Open: #13 accepted database/intake contract, private credential setup, MariaDB failure/concurrency tests, staff-account handoff, real-host TLS/cookie/routing/access-removal/recovery acceptance, scheduler/backup failure notification and restore verification. #14 stays open until those dependencies and actual operator acceptance pass. Public collection remains disabled.

API references: [PHP session security principles](https://www.php.net/manual/en/features.session.security.management.php), [PDO transactions](https://www.php.net/manual/en/pdo.transactions.php), [Sodium authenticated encryption](https://www.php.net/manual/en/function.sodium-crypto-secretbox.php).
