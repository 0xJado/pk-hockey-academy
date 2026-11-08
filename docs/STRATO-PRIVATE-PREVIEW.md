# PHP private Visual Editing — issue #11

The PHP candidate is deployed behind the existing STRATO website protection. It passed native Sanity capability/session checks and standalone browser checks at 1440, 768 and 375px. **Hosted Studio still points to the existing Vercel preview.** In-Studio field selection, mutation refresh, iframe cookies and the user’s acceptance remain open before changing that destination or retiring Vercel. Implementation is committed locally; the checkpoint series has not been pushed.

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
