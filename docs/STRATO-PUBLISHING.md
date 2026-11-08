# Protected STRATO publishing — issue #10

Implementation in progress. The GitHub workflow and new Sanity hook are not activated yet. The existing Vercel publication hook and private Visual Editing remain intact. Registration stays inactive and indexing stays disabled.

## Delivery model

Sanity sends only `{"ref":"main"}` to the fixed GitHub Actions workflow-dispatch endpoint. A separate fine-grained token needs **Actions: write** for this repository only; store it in the Sanity hook's Authorization header, never on STRATO or in source. The existing published-document filter includes creation, changes, withdrawals and deletions while excluding drafts and release versions. The new hook is separate from the existing review hook during acceptance.

The workflow checks types/tests, builds the current published Sanity snapshot, validates the complete static export and activates it through scoped SFTP. GitHub concurrency serializes running deployments and coalesces pending updates; a remote lock also excludes local deploys. No PR event gets deployment credentials. Node runs only on the build machine.

Each release is checksummed under `.pk-releases/<id>/`. Direct requests to dot directories are forbidden. One atomic rename replaces the root routing configuration, with the existing authentication and noindex headers preserved. All ordinary URLs resolve inside the selected release. Previous non-asset files cannot leak through from the original upload. Shared hashed `_astro` assets stay available across releases and cannot be overwritten with different bytes. There is no automatic pruning yet; monitor webspace and retain versions until a separate reviewed cleanup exists.

HTTP verification checks the protection, static bytes and removed URLs. Failure restores the previous routing unless an operator changed it meanwhile. A process killed before switching leaves the old site; a kill after switching can leave the complete new release active but unverified. The server lock remains after a hard kill, preventing another run from guessing what happened.

## One-time activation inputs

1. The reviewed checkpoint series and workflow through `688918f` are pushed to `main`. Confirm the intended revision before activation.
2. Add repository Actions secrets: `STRATO_SFTP_HOST`, `STRATO_SFTP_PORT`, `STRATO_SFTP_USERNAME`, `STRATO_SFTP_PASSWORD`, `STRATO_SFTP_HOST_KEY`, `STRATO_PREVIEW_USERNAME`, `STRATO_PREVIEW_PASSWORD`. Copy the existing pinned raw key value from the ignored private host-key record. Never turn off pinning or print credentials. The account is restricted to the website root. This does not grant access to the outside-root password file or future database credentials.
3. Add approved public repository variables matching the existing website build: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_TRAINERS_ENABLED`, `SANITY_TRAINING_ENABLED`, `SANITY_SOCIAL_ENABLED`, `PUBLIC_SANITY_STUDIO_URL`. Also set `STRATO_PRIVATE_PREVIEW_ENABLED=true` to retain the PHP preview candidate deployed during #11; its credentials stay outside the public root on STRATO and are not passed to CI. Do not enable a previously disabled content feature. No draft/read token is needed for the existing public published-content build.
4. Set `STRATO_PUBLISH_ENABLED=true` only when credentials/configuration are ready. Dispatch once manually and inspect delivery, not just the build result.
5. Create a repository-scoped fine-grained GitHub token (Actions: write; explicit expiry and renewal owner). Keep it in an ignored local environment file as `STRATO_DISPATCH_TOKEN`, then run from `studio/`: `node --env-file-if-exists=.env --env-file-if-exists=../hosting/strato/.env.local --experimental-strip-types scripts/configure-strato-hook.mjs`. This is a dry run. Add `--apply` after reviewing the destination and storage. The script creates a new hook only and does not overwrite existing hooks. Do not send the token in chat or put it in command-line arguments.
6. Run real publish/edit/unpublish/restore acceptance on approved content, checking direct withdrawn profile/gallery/download URLs, an invalid publication, build failure, delivery failure and rollback. Restore content using revision guards; do not manufacture trainer identities or sessions. Have Pierre perform a representative update. Only then retire the old public publishing hook; retain review-host Visual Editing until issue #11 is accepted.

GitHub Actions job results and step summaries distinguish build success from verified delivery. The repository operator must enable Actions failure notifications and confirm receipt before claiming the failure-notification acceptance criterion. A webhook accepted by GitHub does not mean the website has been delivered.

## Operator commands and recovery

From `hosting/strato/`, use `npm ci --ignore-scripts`, `npm test`, then `npm run deploy` after a new verified `web` build. `npm run rollback` selects the previous version. To select an older retained version, set `STRATO_ROLLBACK_RELEASE` to its exact release ID before running rollback and clear it afterwards. Rollback checks stored served bytes and preserves current authentication; it does not revert Sanity content, so a later publication rebuilds current content again.

Do not remove a busy lock. After a failed/cancelled run, confirm that no GitHub/local deployment is still running, inspect `.pk-state/deploy.lock/owner.json` privately and read `# PK-RELEASE` in the live root `.htaccess`. The router is authoritative; a manifest directory alone is not an activated release. Check anonymous 401, authenticated pages, noindex and PHP 503. If the complete release is healthy, record acceptance; otherwise restore the saved `.pk-state/before-<release>.conf` using an atomic temporary-file rename, preserving any newer authentication changes. Remove only the inspected lock's owner file and empty lock directory, then run a fresh verified deployment. Do not recursively delete release/state directories or replace authentication with the exported public `.htaccess`.

Configuration/state paths contain operational details and stay off public issues/logs. Local errors are saved only in ignored `output/strato-private/release-error.json`. CI prints a generic failure; inspect operational state privately. No credentials, traces or private artifacts are uploaded as Actions artifacts.

## Evidence and limits

Local automated tests cover complete versions, withdrawal routing, rollback with rotated authentication, corrupt artifacts, immutable asset collisions, interrupted staging, lock contention, duplicate publication coalescing, health-check failure recovery and competing operator changes. Studio tests evaluate the fixed dispatch projection and existing document/draft filters. These tests do not prove live webhook delivery, GitHub secret configuration, operator notifications or Pierre's acceptance; issue #10 stays open until those checks pass.

Protected-host acceptance on 8 November 2026 passed the technical-route creation/withdrawal/rollback drill and injected upload interruption. The final academy-only release, including the approved logo at its website-owned download URL, passed 112 HTTP checks. Detailed commands/evidence: [validation record](../VALIDATION.md).

The STRATO build now copies approved media-kit downloads into release-owned `/downloads/medienkit/entry-<document-id>.<extension>` files and links there. Published bytes are fetched only from the trusted public Sanity CDN, with bounded size/MIME checks; failure stops the build. Withdrawals omit both the link and the generated file, so the old website URL returns 404 after activation. Isolated builds verify this lifecycle and rejection of incomplete downloads. Existing review-host links remain unchanged. Any already known external Sanity CDN URL can remain accessible: deployment does not delete shared CMS assets or revoke third-party caches. Real approved-download lifecycle acceptance remains pending with CI activation.

API references: [Sanity webhook headers/projections](https://www.sanity.io/docs/http-reference/webhooks), [GitHub workflow dispatch and fine-grained permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
