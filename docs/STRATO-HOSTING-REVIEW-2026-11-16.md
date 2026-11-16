# STRATO 06 — backend review, 16 November 2026

The PHP/database implementation is complete for the protected, disabled production environment. This applies the owner's 14 November direction to continue implementation and fictional-data acceptance. Later on 16 November the user relayed STRATO's substantive reply: the two constraints below are confirmed package limitations, rather than unanswered configuration questions. Retain the agreed Basic hosting architecture and its documented risks. Genuine-intake activation and operational acceptance remain in #19; runtime gates remain false.

## Provider reply received — 16 November 2026

STRATO states that its upstream shared webservers buffer complete request bodies before handing them to PHP/FastCGI. The provider controls global timeout/rate settings; Basic customers cannot override those controls per endpoint through PHP or `.htaccess`. No numeric hard deadline or minimum rate was supplied. The reply also confirms one assigned user per database, schema rights within that database, no GRANT/user-management rights and no customer-panel facility for a second DML-only user on the same database.

This explains the observed limitation; it does not turn the previous 75-second client-aborted slow-drip test into a passed hard-deadline test. STRATO's suggested own-server/external-WAF options are alternatives, not instructions or authorization to purchase, add a proxy, change DNS or transfer traffic/data to another provider.

Architecture decision under the existing Basic-hosting direction: keep the scoped database login and provider-managed upstream controls. Retain parameterized application operations, private credentials, byte/rate/receipt safeguards, encrypted backups and recovery checks; these controls do not remove the upstream availability risk or create DML-only privilege separation. Before activation, #19 must record operational/backup ownership and explicit reconciliation of these known conditions with the intake gates. No new provider answer is needed merely to establish whether the two Basic features exist.

## Current evidence

- 104 PHP registration assertions passed with fictional SQLite fixtures, including validation, consent versions, encryption, atomic claims, failures/uncertain commits and independent activation gates.
- 16 HTTP checks passed through two real PHP workers with fictional storage.
- 26 checks passed against actual STRATO/MariaDB: concurrent same-token submissions persist once, conflicting payloads fail, both commit-loss timings reconcile, row-lock timeout fails safely and recovery works, source/session validation, encrypted fixtures and cleanup.
- Fresh protected host inspection found database-scoped grants, no server-account administration and no grant option. Direct peer was public and no forwarding header was present in this request; forwarded headers remain untrusted by the application.
- Production remained at zero requests, claims and staff users. Intake is paused; the private runtime descriptor is disabled, intake maintenance is on, and all six intake gates are false. The inspection now reads these booleans from the actual installed private runtime/configuration, instead of inferring them from an example file or a 503 response.
- Temporary dual-authenticated helpers and fictional tables were removed. Helper HTTP 404 and unchanged live routing were checked. No credential, database grant, existing configuration, domain/DNS or public-launch flag was changed.

No frontend layout/motion changed. The inspection reports flags/counts only; source/configuration and raw private evidence remain outside public assets and Git.

## Runtime credential decision

The current package-provided login is limited to this database but includes schema privileges; runtime and migrations are not separate SQL identities. The login cannot create server accounts or grant access. STRATO's relayed reply confirms that a second DML-only identity cannot be created in Basic. STRATO's [hosting database instructions](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/) describe the assigned account; the package-specific limitation comes from the support reply.

For the present disabled/protected environment, retain this constrained account and private configuration. Do not grant broader privileges, reuse it elsewhere, create an exposed database listener or buy an upgrade. A compromised runtime could still alter/drop its own database; database scoping is not DML-only separation, and encryption is not a substitute for isolating a compromised application holding its keys.

Before genuine collection, #19 must reconcile the constrained Basic arrangement with verified backup/recovery and access ownership, or an explicitly chosen different infrastructure design. `runtimePrivilegesAccepted` stays false until that activation review. Do not retry unsupported CREATE USER/GRANT commands or claim the account is DML-only.

## Upload deadline decision

Observed settings remain `max_input_time=60`, `max_execution_time=360`, CGI/FastCGI; setting an input-stream timeout did not succeed. Earlier incomplete slow-drip testing reached the 75-second client abort. No provider hard upload/read deadline was proven and today's recheck did not repeat or replace that failed deadline evidence. An elapsed-read comparison rejects processing after a delayed read returns; it cannot stop upstream buffering or a blocking read. Byte limits and database rate controls do not establish a hard upstream deadline.

Remain disabled while this is unaccepted. Before genuine collection, #19 must record a provider-confirmed and verified control, or an explicit dated residual availability-risk decision and selected mitigation/hosting arrangement. Do not set `requestTimeoutsAccepted` merely because PHP reports a limit or the database tests passed. The [STRATO PHP settings reference](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/) does not prove a hard deadline on the measured hosting path.

The request sent on 12 November and substantive reply relayed later on 16 November are tracked in [the support record](STRATO-SUPPORT-QUESTIONS.md). The earlier same-day no-reply checkpoint is superseded; no new message or paid service change was requested.

## Scope and next stages

Technical backend completion does not complete staff/operator handoff (#14), final browser/form acceptance (#15), provider/legal alignment (#17), or launch/intake activation (#19). Policy wording was adopted in #12; no repeat signature round is required. The separate machine flags and installed policy status still require controlled final reconciliation. Never claim Pierre personally completed an assistant-run acceptance.

Private reports: `output/strato-private/registration-acceptance.json`, `intake-host-metadata.json`, and `output/strato-06-http-rerun.log`. Do not upload these private reports to GitHub.
