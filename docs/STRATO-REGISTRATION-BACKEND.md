# Private PHP registration intake — #13

Implemented and fictional-data tested on 11 November 2026. This adopts the selected minimal request model and version-1 encrypted staff storage contract. It is a **disabled backend candidate**, not an enabled registration journey or final policy approval. Public `/api/registration` remains the original unconditional 503 response; its source was not changed. The form remains inactive. No real registration or staff account was created.

## Components and protocol

Private source: `hosting/strato/registration/{Policy,Intake,Sessions,Http,Config}.php`, the offline console, candidate `public/index.php`, disabled configuration example and existing `policy.v1.json`. Neither the candidate entry nor private classes/configuration enter the static artifact; both build and release guards reject a `registration/` source directory. `api/registration.php` is still the deliberately inactive production entry.

The future #15 client requests a token with `POST /api/registration/token`, JSON `{}`, then submits JSON to `/api/registration` with that token in `Idempotency-Key`. Both require exact HTTPS origin `https://pkhockeyacademy.de`; no CORS permission or cookie session is issued. Reject methods, query parameters, missing/mismatched byte length, non-JSON/compressed bodies, malformed UTF-8/JSON, duplicate object keys (including escaped aliases), unknown/nested fields and bodies over 16 KiB. A body read that exceeds three seconds is rejected. Do not put tokens, references or participant values in URLs. These routes describe the candidate protocol; the token route is **not** publicly wired.

The server signs a random request token bound to the current admission epoch, with a 24-hour lifetime. Keep the same token and payload through retries, duplicate clicks and uncertain responses. It is one intended request, not reusable authentication or a booking. A lost/expired token or conflicting payload needs explicit user/operator handling; never generate a new token silently to retry an uncertain submission. #15 must explain this without storing sensitive fields in URLs, analytics or browser persistence. Anonymous tokens and Origin checks are abuse/CSRF controls, not proof of a guardian's identity.

The policy validator requires the exact version, child name/year, one guardian name/email/telephone, selected request type and explicit guardian authority. Optional planning/care fields follow the chosen limits and paired emergency contact rule. Years use a broad technical validity bound, not an invented U13 season cutoff. Unknown prices/statuses/fields cannot influence the result. Health text without separate affirmative health consent is rejected before fingerprint/storage. Only affirmative grants create independent health/website/print/analysis proof records; absent/false selections never become permission. Each proof records version, exact text SHA-256, server acceptance time and minimal actor/contact/child attribution. The archived policy supplies the actual text; do not discard it while proofs depend on it.

Single-session requests require a current, approved, published, future, open, non-demo session and approved active venue. Closed/full/zero-place/draft/release/withdrawn/invalid entries fail. The existing training-source opt-in is preserved; disabled training cannot be bypassed by posting an ID. Packages have no supplied session ID and are coordinated personally. The fixed-host, TLS-verified Sanity published query receives **only the session ID**; no participant fields/notes/consents go to Sanity. No external URL or callback can be supplied by a visitor. The transport has bounded response size, I/O timeout and elapsed-time checks, no redirects and no starter/demo fallback. Source failure returns unavailable rather than assuming availability. A committed retry can recover its existing receipt after a session is withdrawn; it does not make a new booking.

## Atomic storage and failure behavior

The three added InnoDB tables are `pk_intake_meta` (version 1, random epoch, paused flag), `pk_intake_claims` (HMAC token/fingerprint, opaque request reference, timestamps) and `pk_intake_limits` (short-lived HMAC counters). The six staff foundation tables remain version 1. Migrations are offline/operator-only, never performed by an intake HTTP request. Initial migration defaults to paused. DDL is not wrapped in a pretend rollback guarantee; inspect partial setup before retrying.

A short transaction locks the fixed intake metadata row, rechecks the epoch/pause state and claim, applies new-request limits, then inserts the claim and encrypted `pk_staff_requests` row together. At this initial academy scale, serialization is intentional: it avoids unclaimed gaps and partially committed receipt state. Network session lookup happens before that transaction. No external email/delivery occurs during it. The request starts `pending`; neither price selection nor storage reserves/confirms a place. Pierre's personal confirmation remains separate.

Native prepared statements and InnoDB transactions are used. Organizational, care and proof payloads use the existing staff record/category-bound sodium encryption derivation; cross-reading with the staff candidate is tested. Random nonces and different data/auth/audit/backup keys are retained. The token signature, payload fingerprints and rate identities use a distinct derived authentication purpose. No raw IP, submitted body or health text enters the receipt or limit tables.

Exactly matching retries return the same opaque receipt after a committed write; changed normalized payload returns 409. Missing records behind existing receipts return `reconciliation-required`, not a new insertion. Success is emitted only after a successful commit. Exceptions/lost commit responses return 503 with an uncertain outcome and instructions to preserve the same request. A new connection resolves whether that same claim committed; there is no blind internal write retry. The offline `reconcile` command returns only `received`, `not-found` or `reconciliation-required`, never participant fields. An absent/expired receipt is not permission to reconstruct an old request automatically.

The direct server `REMOTE_ADDR` is validated/canonicalized, HMACed and used independently of all visitor-supplied forwarded headers. Fixed 15-minute windows persist attempt/token, global, peer and normalized-contact bounds. New-request counters share the storage transaction; attempt accounting commits separately before body validation. IPv6 textual aliases cannot create separate identities. A known proxy deployment requires a separately verified server identity strategy; never enable trust in arbitrary forwarding headers. Limits are initial conservative operational values, not a guarantee against distributed abuse.

## Retention and recovery

Receipt expiry is token expiry plus one hour; expired tokens cannot recreate a deleted claim. Counter expiry is the end of its 15-minute window. Run the intake retention command daily beside staff retention; cleanup remains needed even while intake is paused. These short-lived HMAC references contain no content copies. Scheduling/visible failure notification and monthly controls are still #14/#19 acceptance, not established by having a command.

Staff retention/withdrawal rules apply to records created by intake. Only request snapshots are backed up by the staff workflow; credentials, authenticated sessions and intake claims/counters are not included. The updated staff restore transaction pauses an existing intake contract and rotates its epoch before restoring records as `reconciliation`. A fresh target gets a different paused epoch on intake migration. Preserve current independent erasure journal/original keys, apply withdrawals/deadlines, and keep intake disabled through operator reconciliation. Do not restore old admission metadata or replay browser submissions as a recovery tool. This restore integration passed with SQLite fictional data; real-host full staff restore remains #14.

## Private installation and activation gates

`node hosting/strato/accept-registration.mjs` uses pinned SFTP and the shared release lock. A randomly named, website-authenticated plus separately token-authenticated temporary PHP harness runs against four uniquely prefixed disposable fictional tables. It never writes fixture requests into production request tables. Every run attempts fixture cleanup in `finally`; helper removal still runs if fixture cleanup fails. Inspect any failed cleanup before retrying. PHP opcode invalidation and bounded GET/POST propagation checks verify the removed helper returns 404; SFTP absence is also checked. The unchanged public router and inactive registration response are verified.

After acceptance, three paused production intake tables and a content-hashed private library/configuration are installed outside the public root. Keys/database credentials are read from the already provisioned private database config, not embedded in the helper. The published-content project/dataset are retained; no Sanity secret is uploaded in source. Public-dataset transport passed; private datasets would need a separately provisioned least-privilege read token. Existing differing files are refused. Candidate libraries/configurations from earlier disabled acceptance revisions are inert; no public pointer or environment activation was set. Record the chosen hash/config path during #15 deployment rather than guessing a latest filename.

The candidate loader independently requires all of `enabled`, `policyAccepted`, `staffAccepted`, `realDataApproved`, `runtimePrivilegesAccepted`, `requestTimeoutsAccepted`, maintenance off, an exact hash-pinned policy marked **approved**, valid private paths and matching database contracts. Current policy remains **implementation-draft**, configuration gates remain false and the database remains paused. No console activation shortcut is supplied. A general website launch flag cannot activate intake.

Still required before genuine collection:

- #12 final text/policy acceptance and provider/privacy alignment; no blanket approval is inferred from delegated product choices.
- #14 actual staff authentication/access removal, category deletion, scheduled jobs/alerts and backup/restore acceptance; #15 accessible client wiring and full end-to-end journey.
- Runtime credential privilege review. The host login did **not** have server account-administration grants in the observed `SHOW GRANTS`; no extra SQL user was created and runtime/migration credentials are not separated. Confirm supported provider options or explicitly accept/document the constrained hosting arrangement before setting its gate.
- Verify PHP-FPM/web-server request buffering, slow-upload/read hard timeouts and the direct-peer identity on this hosting path. A PHP elapsed-read check cannot prove an upstream hard upload timeout; `requestTimeoutsAccepted` remains false. Never claim the application byte/read checks establish provider-level timeout acceptance.
- Explicit real-data activation and final protected-to-public launch acceptance remain separate decisions. Preserve the website password/noindex and email DNS.

Offline commands (private configuration and public-root environment variables required):

```text
php hosting/strato/registration/console.php migrate
php hosting/strato/registration/console.php pause
php hosting/strato/registration/console.php retention
php hosting/strato/registration/console.php reconcile OPAQUE_RECEIPT
```

Do not put private file contents or completed payloads in commands/logs/issues. Missing configuration fails closed. The candidate is not uploaded by the static publisher and public source `hosting/strato/public/api/registration.php` remains untouched.

## Executed evidence

- 104 PHP assertions: strict policy/envelopes/duplicate JSON, consent proof, encrypted staff compatibility, immutable retries across connections, rollback failure, commit-response ambiguity, deadlines, persisted identity limits, retention, withdrawal/restore reconciliation and independent activation gates/draft denial. SQLite fictional fixtures only.
- 16 loopback HTTP checks through two real PHP workers sharing an isolated database, including simultaneous same-token requests, conflict, consent/source/body failures, forwarded-header distrust and maintenance.
- 26 actual STRATO/MariaDB checks: native-driver simultaneous exactly-once claims, conflicting/restarted retries, both simulated commit-loss timings, actual row-lock timeout/recovery, encrypted fictional payloads, real published Sanity transport with a deliberately nonexistent ID, paused installation and complete fixture/helper removal. This does not claim a genuine published training date or accepted staff UI.
- Existing 59 staff PHP assertions, 11 release/artifact tests and 78 website unit tests passed. Astro check: zero errors/warnings/hints. The complete static export with private-preview packaging built and verified 144 files, excluding intake candidate sources. CI definitions parse and include the new tests; hosted CI has not run for the unpushed source.

Private evidence lives under ignored `output/intake-tests/` and `output/strato-private/registration-acceptance.json`; these are excluded from CI diagnostic uploads. No frontend layout/motion was changed or newly claimed as browser-accepted here.

## Additional host facts

`node hosting/strato/inspect-intake-host.mjs` performed a read-only grant/runtime inspection and one bounded, incomplete fictional upload on the protected host. Observed PHP settings: input limit 60 seconds, execution limit 360 seconds; actual TLS on. The direct peer was public and no proxy/forwarding header was present for this baseline request. Database grants were scoped to this database, with no server user-administration capability or grant option. Counts remained **0 requests, 0 claims, 0 staff users** and intake was paused. No grant/credential/configuration was changed.

The server closed the stalled upload connection after approximately **10.1 seconds** without a response/success; the client did not reach its 35-second abort deadline. The probe had declared 16 bytes and sent only an opening JSON brace, with no participant fields. Its helper was removed/404-checked and the router remained unchanged. This establishes bounded behavior for the measured stalled case, not all slow-drip patterns or proof that PHP's configured input limit governs every upstream buffering path. Private evidence: `output/strato-private/intake-host-inspection.json`.

The residual review is therefore specific: confirm whether a second DML-only login is supported outside the currently exposed account capabilities, and accept/verify the actual buffering/slow-drip limits before switching either host-acceptance gate. Do not create a paid server/upgrade or falsely claim an extra restricted account exists. [STRATO's database instructions](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/) describe the assigned database/user and network-restricted access; they do not establish a second runtime-user capability. [PHP distinguishes execution limits from input handling](https://www.php.net/manual/en/features.file-upload.common-pitfalls.php), so execution time alone was not treated as upload-timeout evidence. These facts narrow the open review without activating intake.

References: [PDO transaction behavior](https://www.php.net/manual/en/pdo.transactions.php), [PDO commit](https://www.php.net/manual/en/pdo.commit.php), [MariaDB atomic upsert](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/inserting-loading-data/insert-on-duplicate-key-update).
