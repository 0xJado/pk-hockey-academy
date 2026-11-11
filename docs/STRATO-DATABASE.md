# STRATO registration database foundation

Provisioned on 11 November 2026 at the user's request. The account holder created the database and entered credentials in ignored `hosting/strato/.env.local`. Observed engine: **MariaDB 11.8.8**. The existing package includes the database; no upgrade or separate environment was used.

## Verified on the protected host

- PHP PDO connects with the dashboard-provided settings. Native prepared statements are enabled; the acceptance connection uses utf8mb4 and UTC.
- Version-1 staff migration creates six prefixed InnoDB/utf8mb4 tables. Request, user, session, audit and rate-limit tables were empty after setup. No staff account or genuine registration was created.
- A fictional Unicode/emoji value round-tripped through a temporary InnoDB table. Rollback left that table empty; it disappears when the connection closes. No fixture entered registration storage.
- Sodium authenticated-encryption round-trip passed. This is a runtime prerequisite, not full encrypted intake/lifecycle acceptance.
- Configuration, four separate purpose keys, journal and staff library are outside the public document root. New directories use 0700 and files 0600. Existing differing files are refused rather than overwritten.
- The temporary helper required website authentication plus a random token. Anonymous requests returned 401; authenticated requests without the token returned 403. Cleanup verified SFTP absence and an authenticated 404. The active router was unchanged.
- `/api/registration` still returns 503. Configuration remains `enabled=false`, `maintenance=true`, `databaseContractAccepted=false`. No staff route, public form, scheduled job or notification was activated.

Count-only evidence is in ignored `output/strato-private/database-acceptance.json`. Local credentials/keys are in ignored `output/strato-private/database-config.json`; the server copy is outside the public root. Never publish these files, database identifiers or session URLs. Preserve keys and the independent journal through recovery.

## Operator setup

From the repository root:

```text
node hosting/strato/provision-database.mjs
```

This explicit operator command is never called by CI/build/deployment. It uses pinned SFTP, verified private paths and the shared release lock. A random-name temporary PHP helper contains setup/library source only; configuration is transmitted over HTTPS in a bounded authenticated POST. No credentials enter URLs, command arguments or diagnostic reports. Failures report fixed stages without PDO diagnostics. Never deploy the helper permanently or loosen website protection to run it.

Existing differing local/server configurations are refused. Inspect partial state after failures: MariaDB DDL is not transactional. The migration can complete matching partial tables but is not a general schema-upgrade/reset tool. One initial invocation did not complete; a subsequent invocation completed all recorded checks and helper cleanup. No failure was counted as successful acceptance.

## Remaining acceptance

#13 now has an [implemented and host-tested intake candidate](STRATO-REGISTRATION-BACKEND.md): validated policy/session inputs, encrypted staff records, atomic receipt/idempotency/rate controls and uncertain-write handling. Three additional paused intake tables and disabled versioned private source/configuration are installed. No genuine collection is enabled. Runtime privilege/upstream timeout acceptance, #12 final policy approval and #14/#15 acceptance remain outstanding.

Runtime-versus-migration privilege separation has **not** been established. The dashboard-created login was used for operator setup. Inspect supported grants/account management and arrange or document narrow runtime privileges before enabling intake. Connectivity alone does not establish least-privilege acceptance. No database listener was made public by this work.

#14 still needs actual-host authentication/routing/cookie, access removal, concurrency, retention, scheduler/backup failure reporting and fictional restore acceptance. A privately installed staff library is not an enabled operator service. Static Astro/Sanity publishing was preserved.

## Checks run

Helper PHP syntax, provisioner Node syntax, 59 local PHP staff assertions (SQLite fixtures) and 11 release/artifact tests passed, alongside the live checks above. No UI/layout changes were made; no additional frontend suite is claimed for this setup.
