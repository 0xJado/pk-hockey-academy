# PHP private Visual Editing — issue #11

## Signed-in acceptance completed — 16 November 2026

STRATO 04 / #11 is closed under the user's explicit instruction to use the signed-in Studio and accept the representative editing check. In the in-app browser, clicking Pierre's role in the website preview opened the matching document field. Changed only `Gründer & Trainer` to `Gründer und Trainer`; a native read beforehand confirmed no unrelated draft differences. The draft preview refreshed automatically. Switching to published perspective still showed the old wording; switching back showed the edited draft. Published through Studio, navigated to the selected profile and manually refreshed successfully.

Preview sign-out returned to the ordinary public trainer page. The in-app browser then needed the existing STRATO Basic Auth login entered again by the user; Sanity identity stayed signed in. After that, Studio reopened the authenticated preview and preserved selected-profile navigation. This browser login behavior is recorded, not presented as CMS sign-out or public-launch acceptance. Prior security/isolation and responsive checks remain supporting evidence. No sharing/release-perspective expansion is claimed. The earlier Computer Use limitations below are superseded for these tested editing interactions.

## Active cutover — 15 November 2026

### Expired-session repair — 16 November 2026

The open signed-in Brave Studio showed `preview_login_required` after its one-hour PHP cookie expired. Presentation retained the plain `/redaktion/trainerpool` iframe address, so refreshing did not rerun the fragment handoff. This failure is independent of Vercel retirement.

Unauthorized private-page GETs now return a 401 HTML connection bootstrap without draft data. It requests a fresh native preview capability from its signed-in Studio parent, with a random nonce and exact origin/source checks in both directions. Studio only replies to its current STRATO iframe and rechecks the user's capability creation permission. PHP validates that capability before issuing the same one-hour secure session. Selected profile and perspective survive reconnection. An open embedded preview also reconnects at expiry. Standalone unauthenticated visitors cannot renew; private JSON remains 401. No server read token is exposed or capability sent in URLs.

Regression checks cover missing/expired cookies, forged messages, removed frames, permission failures, preserved selection/perspective, responsive rendering and no capability in request URLs. The Studio wrapper uses the [supported layout component API](https://www.sanity.io/docs/studio/studio-components-reference). Extended signed-in editing acceptance remains separate from isolated and native-host browser verification.

Deployed the hosted Studio and complete protected STRATO release from `f16c89c`; [delivery run 43775280328](https://github.com/0xJado/pk-hockey-academy/actions/runs/43775280328) passed. The preceding release was rejected by the handshake checksum guard because PHP now binds the public Studio-origin meta value. Delivery now permits only that exact approved substitution and verifies every other byte; its regression rejects foreign origins and changed content.

Validation: Studio TypeScript and 30 tests; Astro check with zero diagnostics and 89 website tests; 49 PHP assertions; 13 hosting tests; isolated Brave preview at 1440/768/375, cold-session and expired-session renewal. Post-deployment `verify-preview.mjs --browser --nested` passed against the actual STRATO host, including native capability validation, selected draft/published data, natural nested portrait loading, missing-session renewal preserving selection, responsive layouts and sign-out. Its one owned temporary Sanity capability was removed. No trainer document was changed or published.

The actual signed-in Brave tab was reloaded, but Computer Use stopped because it could not reliably determine the current browser URL. Its final visual state and further signed-in field/mutation checks were therefore not accepted in this run. This limitation does not replace the successful native-host browser checks above. Vercel remains retired; Basic Auth, noindex and inactive registration remain intact.

### Portrait CORS repair — 15 November 2026

The missing portrait is resolved in actual nested Brave acceptance. Sanity returned `403 CORS Origin not allowed` for image requests carrying `Origin: https://pkhockeyacademy.de`; Brave surfaced that JSON denial as `ERR_BLOCKED_BY_ORB`. A direct image tab without that Origin loaded successfully, so standalone decoding did not establish iframe acceptance. Added the exact `https://pkhockeyacademy.de` origin through `sanity cors add ... --no-credentials --yes`. Readback listed the origin; a fresh image response returned 200 with matching `Access-Control-Allow-Origin` and no `Access-Control-Allow-Credentials` header. The private draft-read token, Studio identity and role settings were not changed.

`node hosting/strato/verify-preview.mjs --browser --nested` now verifies Dashboard-shaped and Studio-shaped outer frames with the actual protected STRATO preview and real portrait, without forcing image decoding. `PK_BROWSER_EXECUTABLE` selects an installed browser in a fresh test profile. This test failed on natural portrait loading before the CORS change and passed afterward in Brave, with a decoded screenshot inspected. Native session, selected draft/published data, responsive layouts and sign-out also passed; the one owned temporary preview-secret draft was removed. Extended signed-in editor checks listed below remain separate; the earlier missing-portrait limitation is superseded by this result. No production-renderer change or public website deployment was needed.

The isolated browser regression also models the nested origins, uses correctly sized synthetic image bytes and rejects nonexistent template-asset URLs. The original 1px fixture could round to zero intrinsic width under `800w` responsive descriptors and was unsuitable for this assertion. No real image/identity was added to the isolated fixtures.

Hosted Studio now uses `https://pkhockeyacademy.de` with the `php-fragment` transport. The deployment guard accepts only that hosted origin and always selects PHP transport; local `SANITY_STUDIO_PREVIEW_URL` remains independent. The previous Vercel publication hook was disabled with authenticated readback. Vercel accepted the project-pause request; after the user explicitly approved the two additional settings, Vercel accepted `commandForIgnoringBuildStep=exit 0` and `previewDeploymentsDisabled=true`. No project or deployment was deleted, and registration/public-launch gates remain disabled.

Actual signed-in Sanity Dashboard acceptance verified the STRATO iframe connection, native document discovery/name selection, opening the portrait editor with optional metadata, and automatic mutation refresh: a clearly labelled role suffix was saved only in the draft, appeared in the preview, then the original `Gründer & Trainer` wording was restored. Nothing was published during this check. Standalone protected STRATO checks passed again for native session activation, selected draft/published data, denied invalid access, 1440/768/375 layouts, actual portrait decoding and sign-out. Extended in-Studio perspective/history/share/browser checks remain unaccepted: Computer Use stopped when it could not determine the browser URL. The open Brave iframe displayed a missing portrait despite successful standalone image decoding; this browser-specific discrepancy remains unresolved. Do not report all #11 acceptance complete.

The pinned Studio 6 callback receives an empty `previewUrlSecret` and does not create it automatically for legacy function resolvers. The PHP resolver now creates a native `sanity.previewUrlSecret` draft through the signed-in user's client when needed, using 256 bits of browser randomness. Concurrent resolution shares only the in-flight request; each later opening checks the current user's create permission again. PHP still validates the native document and its one-hour age. The read token stays outside the public root; no credential is put in query parameters or logs. This fixes the actual authenticated Studio handoff rather than merely testing a synthetic secret argument.

The earlier implementation notes below describe pre-cutover checkpoints. Vercel is no longer the configured Studio destination.

The PHP candidate is deployed behind the existing STRATO website protection. It passed native Sanity capability/session checks and standalone browser checks at 1440, 768 and 375px. **Hosted Studio still points to the existing Vercel preview.** In-Studio field selection, mutation refresh, iframe cookies and the user’s acceptance remain open before changing that destination or retiring Vercel. The implementation checkpoint series through `688918f` is pushed to main.

## Existing workflow inventory

The existing website-layout preview is the trainer preview, separate from the in-Studio `TrainerPreview` card. Its scope is preserved; this does not claim field editing for every public page.

| Route/interaction | Existing review host | PHP candidate |
| --- | --- | --- |
| Activation | Native Sanity secret validated by Node SDK at `GET /api/preview/enable` | Native secret carried in a browser fragment to `/redaktion/verbinden`, exchanged through same-origin `POST /api/preview/enable` |
| Private page | `/redaktion/trainerpool`, signed one-hour cookie | Same URL and bounded signed session, separate signing key |
| Selected trainer | `?id=...`, including draft-ID normalization | Same selected-profile navigation and shared normalization |
| Perspectives | Drafts/published | Same two perspectives, fetched fresh by PHP |
| Field selection | Native `data-sanity` markers and `enableVisualEditing` | Same helpers, SDK and extracted shared connection/navigation controller |
| Refresh | Coalesced trainer mutations, immediate manual refresh, selected-profile filter | Same shared callbacks; actual Studio-frame mutation acceptance still pending |
| Profile layout | `TrainerCard` + `CoachDetails`, optional portrait/gallery/career fields | The same Astro components generate inert templates; authenticated data fills them using escaped text and trusted media URLs |
| Incomplete drafts | Editable completion notice | Same notice and native edit destination |
| Sign-out | `/redaktion/abmelden` clears matching preview cookie | Same URL; private PHP session cookie cleared, return to public trainer page |
| Native Studio login | Existing Sanity identity and roles | Unchanged; a preview session grants no CMS write permissions |

## Runtime and privacy boundary

Astro/Node compile the public pages and private presentation templates on the build machine. PHP handles activation, authenticated data reads and sign-out on STRATO. No Node server or Composer dependency is installed there. Public pages retain static HTML and their existing motion system.

The private draft-read token and a separate random session key live in `preview-config.json` in the verified private directory **outside the public root**, with owner-only file permissions. A root dotfile contains only the server-side configuration location, never credentials. The release router denies dotfile requests. The scoped SFTP account cannot read the outside-root configuration. Releases and rollback preserve this configuration.

`api/editor.php` is the only PHP entry point. Its library/templates are in `api/preview-lib/`, denied by both Apache routing and a directory guard. No draft record is rendered into static build output. The public build never receives the draft token; verification scans every artifact file, including PHP and binary files, for configured token values. The optional package must be complete before deployment accepts it.

PHP only runs fixed trainer/secret queries against the configured project’s HTTPS Sanity API, with TLS verification, no redirects, bounded time/response sizes and no CDN draft reads. Parameters are sent in a POST body rather than upstream request URLs. There is no arbitrary-query endpoint. Private lists are bounded to 200 profiles; selecting an ID filters before that limit.

The PHP session is a signed, random, one-hour bearer cookie: Secure, HttpOnly, SameSite=None, Partitioned and restricted to `/redaktion`. Perspective/ID parameters cannot grant access. Private responses are no-store/noindex with no-referrer, nosniff and restricted frame ancestors. Private JSON is same-origin only; no permissive CORS is added. Current temporary website Basic Auth remains an additional acceptance gate.

Browser code contains public project/dataset/Studio identifiers only. It requests private data from the same-origin PHP endpoint and fills the shared templates without injecting CMS HTML. It does not store drafts in local/session storage or public files. Preview secrets are removed from the fragment immediately and exchanged in a bounded JSON body; the connection page runs only self-hosted scripts under a strict CSP. Application/testing diagnostics do not persist request bodies, headers, bearer URLs or raw browser/SDK errors.

The private page now needs JavaScript to populate its templates. Its no-JavaScript response explains that requirement and reveals no draft data. Public pages retain their existing no-JavaScript behavior. This rendering difference and any browser-specific iframe-cookie behavior require acceptance; the standalone browser check does not establish the full Studio flow.

## Build and operations

Default `npm run build:strato` excludes the PHP preview package and retains unavailable preview routes. To include the already-provisioned candidate, set `STRATO_PRIVATE_PREVIEW_ENABLED=true` in the shell/CI environment before building. Do not mistake a standalone candidate build for a deployable public artifact.

From the repository root:

```powershell
# Uses existing local preview credentials and verified private hosting paths.
# Never prints them. Changed existing private configuration is not overwritten.
node hosting/strato/provision-preview.mjs

# Build from web/ with the approved published-content configuration.
$env:STRATO_PRIVATE_PREVIEW_ENABLED='true'
cd web
npm run build:strato
cd ..
node hosting/strato/release.mjs
node hosting/strato/verify-host.mjs
node hosting/strato/verify-preview.mjs --browser
```

The provisioner holds the same server lock as deployment, verifies the current release, uploads a one-use hash-authenticated installer, writes the configuration outside the public root and removes/verifies removal of the installer in `finally`. No credential is embedded in a deployable artifact. A different existing configuration produces a conflict; token/key rotation needs an owner-controlled private-file update, rather than silently replacing credentials. Rotating the signing key revokes all preview cookies; clearing a browser cookie signs that browser out, while a previously copied bearer remains bounded by its expiry.

Live acceptance uses one uniquely owned native `sanity.previewUrlSecret` draft and removes it with a revision guard afterward. It never edits trainer records or deletes other users’ expired secrets. No capability values or cookie headers are written to reports. Live screenshots stay under ignored `output/strato-private/`; CI artifacts include only synthetic fixture screenshots.

Before issue #10 automation is activated, set the repository variable `STRATO_PRIVATE_PREVIEW_ENABLED=true` to retain this deployed candidate in subsequent releases. Otherwise a default build intentionally disables its routes. The flag grants no draft access; the outside-root configuration and authenticated session remain required. Misconfigured candidates fail delivery checks and trigger routing recovery.

Rollback can return to the previous static-only release without deleting outside-root credentials. Keep the Vercel preview available throughout. No registration/database functionality is enabled by this package.

## Studio cutover acceptance still required

The source provides an opt-in resolver through `SANITY_STUDIO_PREVIEW_TRANSPORT=php-fragment`. Empty preserves the existing destination/protocol. The PHP transport requires `SANITY_STUDIO_PREVIEW_URL=https://pkhockeyacademy.de`; build/deploy Studio with those values only for the accepted cutover. Studio’s `allowOrigins` follows that validated destination. Native Studio authentication/roles and Content Lake CORS settings have not been changed; server-side PHP queries do not require browser draft-read access.

Before acceptance, test within the actual signed-in Studio iframe: initial activation, third-party/partitioned cookie persistence, name/portrait/biography/career/gallery field selection, selected-profile navigation, draft/published switching, manual and automatic mutation refresh, repeated navigation/back/forward and sign-out/reopening. Confirm incomplete profiles and missing portraits remain usable. Revert Studio’s destination/transport if this fails; do not substitute the in-Studio card preview or remove Vercel.

Native shared-access secret validation is supported by PHP, matching the existing SDK capability model. The actual Studio sharing controls and browser combinations still need cutover acceptance. No support for stacked release perspectives is claimed; the previous implementation also selected drafts/published only.

## Local verification

```powershell
php -n hosting/strato/tests/preview.php
node --test hosting/strato/tests/*.test.mjs
cd web
npm run check
npm test
npm run test:strato:preview:package
npm run test:strato:preview:browser
```

Use a PHP executable on PATH for the first command, or substitute its full path. `PK_PHP_EXECUTABLE` selects the executable used by the browser harness. On this Windows workspace, official portable PHP 8.4.27 was downloaded into ignored `.tools/php-8.4.27/` and checked against the publisher’s SHA-256; no system settings were changed. Local tests use fictional records and a loopback-only synthetic transport. Hosted checks use existing approved content and temporary native capability documents. Vendor editing-library chunk/directive warnings remain; no extra editor bundles are loaded by ordinary public pages.

References: [Sanity draft mode](https://www.sanity.io/docs/visual-editing/implementing-draft-mode), [Presentation configuration](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool), [query API and POST options](https://www.sanity.io/docs/http-reference/query). The secret-query contract was also checked against the pinned `@sanity/preview-url-secret` source.
