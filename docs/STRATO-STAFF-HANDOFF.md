# STRATO 07 — personal staff handoff

Readiness checked 16 November 2026. This completes technical preparation, not personal credential setup or operator acceptance. #14 remains open for the named person/delegate to complete that work.

## Ready

- Canonical staff destination: `https://pkhockeyacademy.de/intern/anmeldungen`. It currently returns 503 because the service is deliberately disabled. Website Basic Auth and Sanity authentication are separate from the eventual personal staff login.
- Only Pierre's individually assigned administrator role is supported for launch. Additional roles/accounts are not automatically created, and Sanity membership grants no registration access. CSV/export is absent by design.
- Fresh verification passed 63 PHP staff assertions, 8 maintenance assertions and 34 isolated real STRATO/MariaDB lifecycle checks. These cover authentication/cookie rotation, Origin/CSRF, unauthorized record denial, escaping, concurrent revision checks, withdrawals, stale-session revocation, recovery, backup/restore erasure replay, retention and cleanup.
- Five consecutive scheduled maintenance runs from 12–16 November succeeded, including [16 November run 43843231679](https://github.com/0xJado/pk-hockey-academy/actions/runs/43843231679). The earlier deliberate failure alert was received and accepted on 12 November. Observed CI execution times are evidence of actual runs, not a guarantee that GitHub schedules run at an exact minute.
- Fresh private-host inspection: zero requests, receipt claims and staff users. Runtime disabled; staff disabled, maintenance on, staff database-contract acceptance false; all six intake gates false and intake paused. The inspection now reports installed staff flags explicitly. Temporary helpers and fictional tables were removed and routing remained unchanged.

## Handoff sequence still to perform

1. Confirm whether Pierre is present or the user is performing the check as his delegate. Record the actual operator; do not claim Pierre personally used an assistant/delegate-tested account.
2. The operator chooses and privately enters a unique staff password (16–72 bytes). Do not paste it into chat, a GitHub issue, a command argument or a committed file. Use the existing offline operator password-file input and private transfer mechanism. Do not reuse Sanity, hosting or database credentials, ship a default password, or silently reset an existing account.
3. Inspect the actual private runtime/staff configuration before a controlled change. Establish the personal account with the accepted schema/library, preserving keys, journal and backups. Compare current configuration before replacing it; use private rollback copies and the shared release lock. Do not rerun a disabled installer over activated configuration.
4. Enable only the reviewed staff path, under the existing website password. Keep the intake/token/real-data gates false, the database intake paused and the public form off. A shared runtime descriptor must not bypass the independent registration gates.
5. At the canonical route, the operator signs in privately and checks the empty list and the explanation that status changes do not send email or reserve places. Keep fictional record lifecycle testing isolated; no genuine child/contact/health data is needed for this handoff.
6. Verify logout/direct-access denial and the permanent-account recovery/revocation procedure with the operator's knowledge. Recovery resets the password and revokes stale sessions; it must not restore old credentials or copy sessions from a backup. Leave a usable personal credential only after successful handoff.
7. Confirm who receives maintenance failures and who performs the monthly deletion/rights/media checks. Existing technical alert evidence does not demonstrate Pierre received the operating instructions. Record results in #14; final genuine intake/public-launch activation remains #19.

## Existing operator tools

`hosting/strato/staff/console.php` is CLI-only and stays outside the public root. `admin-password pierre` reads the privately entered file named by `PK_STAFF_PASSWORD_FILE`, with `PK_STAFF_CONFIG` and `PK_PUBLIC_ROOT` set in the operator environment. It resets existing credentials and revokes sessions, so its use is an explicit operator action, not a harmless inspection. `revoke pierre` removes access; retention/backup/restore commands are documented in [the staff runbook](STRATO-STAFF.md).

The pinned SFTP account cannot read the outside-root files. Any hosted operator bridge needed for setup must be temporary, dual-authenticated, bounded and removed/404-checked like the existing acceptance tools; no permanent setup/reset endpoint is approved by this checklist. Never bypass the private path checks or expose the staff source/configuration as a deployment shortcut.

Current action state: **no permanent account created, no staff route enabled, no password requested in chat, no intake activated**. Availability of Pierre/delegate is pending; no technical verification is represented as personal handoff.
