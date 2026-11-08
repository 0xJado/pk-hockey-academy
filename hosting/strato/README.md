# STRATO hosting boundary

The website stays authored in Astro. Node/npm run locally or in CI only. STRATO receives static HTML/CSS/browser JavaScript/assets and PHP; it does not execute Astro or start a Node service. Sanity Studio remains a separate hosted editorial application.

User decision, 7 November 2026: deploy to one production environment at `pkhockeyacademy.de`, initially password-protected for acceptance. References below to staging mean this protected acceptance phase, not a second environment. No QA subdomain or wildcard upgrade is required. Public exposure remains a separate launch decision.

## Build

From `web/`, after `npm ci`:

```powershell
npm run check
npm test
npm run build:strato
npm run test:strato
```

`build:strato` sets `DEPLOY_TARGET=strato`, writes the site to `output/strato/public/`, overlays `hosting/strato/public/` and checks that expected pages exist and private/editor/server sources are absent. `output/strato/READY.json` records local artifact validation, not hosting acceptance. It is invalidated before a rebuild or verification. A failed build must never be deployed. The build still requires access to Sanity when configured; failures deliberately stop publication rather than replacing real content with starter data.

Publish only the validated contents of `output/strato/public/` through the release tool below; it selects a protected versioned directory and retains the login rules. Never copy the repository, `.env`, `src/runtime`, `node_modules`, Studio source or `READY.json` into public files. CI activation and live Sanity publishing acceptance remain issue #10.

## Protected manual deployment

From `hosting/strato/`, with the locally entered credentials and already pinned provider key:

```powershell
npm ci --ignore-scripts
npm run deploy:review
node verify-host.mjs
```

Build first with `PUBLIC_LAUNCH_READY=false` and the approved `SITE_URL`. `deploy-review.mjs` now delegates to `release.mjs`: manual and CI deployments share a server lock, checksum verification and atomic routing switch. Releases live under HTTP-denied `.pk-releases/`; immutable `_astro/` assets are shared so pages opened before a switch can still load their assets. The root authentication layer is preserved. Old non-asset URLs resolve only inside the active release, so withdrawn files return 404 even while earlier versions remain available for rollback.

Every uploaded file is read back. After one atomic SFTP rename of the routing file, HTTP checks compare served static bytes to the complete manifest and check withdrawn URLs. A failed post-switch check restores the previous router if it has not been changed by another operator. `npm run rollback` activates the preceding complete release; `STRATO_ROLLBACK_RELEASE=<id>` selects a retained version. Current authentication is retained during rollback. See the [publishing operator runbook](../../docs/STRATO-PUBLISHING.md) for activation, interrupted-run recovery and outstanding live acceptance.

`verify-host.mjs` tests actual HTTP responses, MIME types, metadata, robots/sitemap gates, inactive PHP methods, missing resources and unauthenticated protection. The existing browser suite can target this one approved origin using `PK_BROWSER_ORIGIN=https://pkhockeyacademy.de`, `PK_BROWSER_ROOT=../output/strato/public` and a dedicated `PK_BROWSER_OUTPUT`. It loads the private local credentials with origin-scoped authentication and disables traces to avoid retaining authentication headers. Only the existing public Sanity CDN is additionally allowed for published images. Screenshots/results remain local.

## Files and responsibilities

| Location | Responsibility |
| --- | --- |
| `web/src/pages/` | Public static pages and build-time endpoints |
| `web/src/runtime/` | Existing review-host Node routes; injected only for the review build |
| `hosting/strato/public/` | Reviewed public Apache configuration and PHP entry points |
| `output/strato/public/` | Generated static site plus PHP, ignored by Git |
| Private STRATO directory | Temporary review credential hash outside the public root; registration database remains unprovisioned |

`npm run build` retains the existing local Node/Vercel review adapter and original route URLs. A PHP private-preview candidate is now deployed and standalone-tested on STRATO, while hosted Studio remains connected to Vercel. The optional `STRATO_PRIVATE_PREVIEW_ENABLED=true` package uses private PHP configuration and the existing Astro components/native editing controller; no Node runtime is injected. Default builds still exclude it. See [private-preview operations and pending Studio acceptance](../../docs/STRATO-PRIVATE-PREVIEW.md). Keep the existing preview destination and publication hook until their separate acceptance gates pass.

## PHP boundary

`/api/registration` rewrites to `api/registration.php`. Every method returns the existing German inactive JSON response with HTTP 503 and no-store. Application code does not parse request bodies or access storage. Registration remains disabled in the UI. The private database, consent policy, submission processing, durable duplicate/rate controls, staff authentication and retention/deletion are future increments; no schema or credentials are invented here.

Apache rules preserve extensionless nested routes, serve assets normally, disable directory listing/MultiViews, block dotfiles/source folders, and use the generated 404 page with a real missing-resource status. They use `DirectorySlash Off`, `RewriteBase /` and the resolved request filename to work with STRATO's mapped directory while retaining `Options -Indexes`. These rules and PHP execution are now host-tested; repeat acceptance after relevant changes. Do not deploy these files to a host that serves PHP as plain text.

## Remaining acceptance

Issue #8 technical acceptance completed on 8 November 2026: the SFTP-only account is restricted to `/pk-hockey-academy/public`; the included certificate and HTTP-to-HTTPS redirects are active, and the domain is mapped to that directory. The parent retains a deny-all guard; the public directory now overrides it with tested temporary Basic Auth. Anonymous root/www/HTML/asset/PHP requests receive 401, wrong credentials receive 401, correct credentials serve a German holding page, and dotfiles remain denied. This is hosting setup, not deployment of the academy website.

Local acceptance credentials belong in the Git-ignored `.env.local` in this directory, with separate SFTP and temporary website-review passwords. This local file is outside `public/` and must never be uploaded or copied into issues/chat/logs. Host/user values come from STRATO's SFTP overview. The remote bcrypt credential file is in the sibling private directory, outside the public document root. Do not remove or overwrite the review guard during the first site deployment; the current exported `.htaccess` does not contain this host-specific authentication layer. Preserve/merge that layer and rerun unauthenticated checks before delivering site files.

SFTP authentication, a parent path resolving to the same restricted root, and unavailable private/sibling paths passed. The first observed SSH host key on the dashboard-supplied provider hostname is pinned in ignored local diagnostic state; it was not independently compared with a provider-published fingerprint. PHP 8.4.27 reports PDO MySQL, JSON, OpenSSL, session, mbstring, fileinfo and sodium. A token-authenticated temporary probe verified private-directory read/write/removal plus Apache `Options` and rewriting. No database or academy website is deployed.

`acceptance-bootstrap.php.template` is local setup source, outside `public/`; it must not become a permanent public endpoint. Its random-name/hash-token substitution, scoped temporary authorization and cleanup were handled only in local acceptance diagnostics. Inspect and install modes were executed on STRATO after the user updated the review password. Correct/incorrect/anonymous login, authenticated static/PHP responses and helper removal passed; the final Apache guard contains no bootstrap exception. The remote root contains only the protected holding page and authentication configuration. Private records stay under ignored `output/strato-private/`.

Fifteen final HTTP checks passed, including both HTTPS names, both HTTP redirects, dotfile denial, absent private-sibling mapping and known alternate-host paths. The unused academy domains and provider master HTTP paths return STRATO placeholders, not protected content. The provider master hostname's HTTPS service failed TLS negotiation; certificate validation was not bypassed, and it is not a public launch hostname. Production root/www HTTPS validation passed normally.

The package/lockfile here are for the local SSH acceptance client only (`npm ci --ignore-scripts`); they are not website runtime dependencies and must never be uploaded to STRATO. Private diagnostics remain under ignored `output/strato-private/`. The user authorized closing issue #8 and starting #9 on 8 November; #8 is closed. The separate parent #7 checklist update was rejected by automatic approval review and remains unchanged pending specific approval.

1. Verify database engine/version, least-privilege connectivity and storage lifecycle when registration processing is implemented; PHP/Apache/private-directory acceptance already passed.
2. Retain the working review login and repeat route/asset/PHP/indexing checks after relevant deployment changes. The first protected website release passed the live suite without accepting real personal data.
3. Port and test private Visual Editing while keeping tokens/drafts server-side; do not substitute a static draft export.
4. Implement and verify Sanity-triggered complete deployment, failed-build protection and rollback.
5. Implement approved registration/staff workflows and exercise failure/concurrent-submission, access removal, deletion and backup/restore cases.
6. Complete legal/content approval before separately authorized domain cutover. Preserve email DNS.
