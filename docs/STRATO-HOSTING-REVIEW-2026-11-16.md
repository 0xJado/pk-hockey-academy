# STRATO 06 — backend review, 16 November 2026

The PHP/database implementation is complete for the protected, disabled production environment. This applies the owner's 14 November direction to continue implementation and fictional-data acceptance while provider questions remain pending. It does **not** accept those unknown provider properties or enable genuine intake. The outstanding activation decisions are explicitly carried into launch issue #19; their runtime gates remain false.

## Current evidence

- 104 PHP registration assertions passed with fictional SQLite fixtures, including validation, consent versions, encryption, atomic claims, failures/uncertain commits and independent activation gates.
- 16 HTTP checks passed through two real PHP workers with fictional storage.
- 26 checks passed against actual STRATO/MariaDB: concurrent same-token submissions persist once, conflicting payloads fail, both commit-loss timings reconcile, row-lock timeout fails safely and recovery works, source/session validation, encrypted fixtures and cleanup.
- Fresh protected host inspection found database-scoped grants, no server-account administration and no grant option. Direct peer was public and no forwarding header was present in this request; forwarded headers remain untrusted by the application.
- Production remained at zero requests, claims and staff users. Intake is paused; the private runtime descriptor is disabled, intake maintenance is on, and all six intake gates are false. The inspection now reads these booleans from the actual installed private runtime/configuration, instead of inferring them from an example file or a 503 response.
- Temporary dual-authenticated helpers and fictional tables were removed. Helper HTTP 404 and unchanged live routing were checked. No credential, database grant, existing configuration, domain/DNS or public-launch flag was changed.

No frontend layout/motion changed. The inspection reports flags/counts only; source/configuration and raw private evidence remain outside public assets and Git.

## Runtime credential decision

The current package-provided login is limited to this database but includes schema privileges; runtime and migrations are not separate SQL identities. The login cannot create server accounts or grant access. A second DML-only identity is **not** established. STRATO's [hosting database instructions](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/) document the assigned account, without proving that this package supports another restricted one.

For the present disabled/protected environment, retain this constrained account and private configuration. Do not grant broader privileges, reuse it elsewhere, create an exposed database listener or buy an upgrade. A compromised runtime could still alter/drop its own database; database scoping is not DML-only separation, and encryption is not a substitute for isolating a compromised application holding its keys.

Before genuine collection, #19 must record either the supported restricted runtime identity and its verification, or an explicit dated acceptance of the constrained arrangement with backup/recovery and access ownership confirmed. `runtimePrivilegesAccepted` stays false until that decision. This review alone does not change it.

## Upload deadline decision

Observed settings remain `max_input_time=60`, `max_execution_time=360`, CGI/FastCGI; setting an input-stream timeout did not succeed. Earlier incomplete slow-drip testing reached the 75-second client abort. No provider hard upload/read deadline was proven and today's recheck did not repeat or replace that failed deadline evidence. An elapsed-read comparison rejects processing after a delayed read returns; it cannot stop upstream buffering or a blocking read. Byte limits and database rate controls do not establish a hard upstream deadline.

Remain disabled while this is unaccepted. Before genuine collection, #19 must record a provider-confirmed and verified control, or an explicit dated residual availability-risk decision and selected mitigation/hosting arrangement. Do not set `requestTimeoutsAccepted` merely because PHP reports a limit or the database tests passed. The [STRATO PHP settings reference](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/) does not prove a hard deadline on the measured hosting path.

The owner confirmed on 16 November that there is still no substantive support reply. The request sent on 12 November remains tracked in [the support record](STRATO-SUPPORT-QUESTIONS.md); no new message or paid service change was requested.

## Scope and next stages

Technical backend completion does not complete staff/operator handoff (#14), final browser/form acceptance (#15), provider/legal alignment (#17), or launch/intake activation (#19). Policy wording was adopted in #12; no repeat signature round is required. The separate machine flags and installed policy status still require controlled final reconciliation. Never claim Pierre personally completed an assistant-run acceptance.

Private reports: `output/strato-private/registration-acceptance.json`, `intake-host-metadata.json`, and `output/strato-06-http-rerun.log`. Do not upload these private reports to GitHub.
