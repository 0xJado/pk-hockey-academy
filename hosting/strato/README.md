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

Only the **contents** of `output/strato/public/` belong in the selected web root, including `.htaccess`. Never upload the repository, `.env`, `src/runtime`, `node_modules`, Studio source or `READY.json`. This increment provides no upload command, deployment credentials, staging authentication, release switching or rollback automation. Do not expose the preview publicly merely because it is noindex. Set up HTTPS and real access protection before uploading review content.

## Files and responsibilities

| Location | Responsibility |
| --- | --- |
| `web/src/pages/` | Public static pages and build-time endpoints |
| `web/src/runtime/` | Existing review-host Node routes; injected only for the review build |
| `hosting/strato/public/` | Reviewed public Apache configuration and PHP entry points |
| `output/strato/public/` | Generated static site plus PHP, ignored by Git |
| Private configuration/storage | Not provisioned; must live outside the public web root |

`npm run build` retains the existing local Node/Vercel review adapter and original route URLs. Private Visual Editing has **not** been ported: STRATO's `/redaktion/*` and `/api/preview/*` return 503, without fetching drafts or logging URL secrets. The existing Studio preview URL and publish hook must stay on the protected review host until replacements pass acceptance. The public STRATO build never injects these Node routes.

## PHP boundary

`/api/registration` rewrites to `api/registration.php`. Every method returns the existing German inactive JSON response with HTTP 503 and no-store. Application code does not parse request bodies or access storage. Registration remains disabled in the UI. The private database, consent policy, submission processing, durable duplicate/rate controls, staff authentication and retention/deletion are future increments; no schema or credentials are invented here.

Apache rules preserve extensionless nested routes, serve assets normally, disable directory listing/MultiViews, block dotfiles/source folders, and use the generated 404 page with a real missing-resource status. They assume the site occupies the domain web root and Apache 2.4 rewrite support. PHP execution, allowed `Options`, rewrite behavior, HTTPS and access protection must be tested on actual STRATO staging. Do not deploy these files to a host that serves PHP as plain text.

## Remaining acceptance

1. Verify actual PHP version/extensions, Apache directives, private secret location and database access on the purchased package.
2. Protect staging; test `/`, extensionless pages, trainer detail pages, assets, missing URLs and direct PHP URLs. Verify API status/no-store for GET/POST/OPTIONS without accepting real personal data.
3. Port and test private Visual Editing while keeping tokens/drafts server-side; do not substitute a static draft export.
4. Implement and verify Sanity-triggered complete deployment, failed-build protection and rollback.
5. Implement approved registration/staff workflows and exercise failure/concurrent-submission, access removal, deletion and backup/restore cases.
6. Complete legal/content approval before separately authorized domain cutover. Preserve email DNS.
