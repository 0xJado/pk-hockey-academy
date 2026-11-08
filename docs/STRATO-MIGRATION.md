# STRATO production migration decision

Confirmed by the user on 6 November 2026. This supersedes earlier Google Sheets registration plans and the undecided production hosting direction. It records an approved direction, not a completed migration.

Execution tracker: [STRATO migration and webapp launch #7](https://github.com/0xJado/pk-hockey-academy/issues/7). Native sub-issues #8–#19 cover hosting, first deployment, automated publishing, private preview, registration policy/backend/staff/form, editorial acceptance, legal/content/SEO, interview scope and final launch. Their checklists distinguish implementation from evidence and owner approvals. First step: [configure protected production hosting #8](https://github.com/0xJado/pk-hockey-academy/issues/8).

Current increment, 8 November 2026: #8/#9 are complete; #10 automation awaits its GitHub dispatch token and activation. A PHP private-preview candidate (#11) is deployed and standalone-tested on STRATO with no Node runtime. The hosted Studio destination and existing review host remain unchanged until in-Studio acceptance. See [private preview scope, security and remaining checks](STRATO-PRIVATE-PREVIEW.md). This does not approve public launch or activate registrations.

## Ownership and boundaries

- Updated decision, 7 November 2026: use **one STRATO production environment at `pkhockeyacademy.de`**, temporarily password-protected for server acceptance. No separate staging domain, QA subdomain or wildcard upgrade is required. Remove temporary protection only after explicit launch acceptance. Astro/npm stay as local/CI build tools and Sanity stays the existing CMS.

- Pierre already pays for STRATO Hosting Basic. Browser inspection showed 100 GB of empty webspace, allowance for 25 databases, three academy domains and an unassigned free included single-domain SSL certificate.
- Production should use Pierre's STRATO account. The current Vercel account belongs to the developer and remains the protected review host until cutover.
- Keep Astro and the existing design. Build public pages outside the web server and deploy static output to STRATO.
- Keep Sanity's public dataset for public website content. Native drafts still require authentication; public assets are not private storage. Do not migrate the editorial CMS or place registration/health/consent records in it.
- Abandon Google Sheets as the registration destination. Use a private STRATO MySQL/MariaDB database with a PHP backend. One database should initially suffice; actual engine/version and limits need verification.
- Plan a protected, minimal staff interface for registration review and necessary actions. Staff authorization is separate from Sanity editorial access. CSV export is proposed, not an implemented feature or an approved data-sharing process.

## Work before cutover

1. Verify the package's PHP version/extensions, database capabilities, HTTPS, deployment access and secret storage. No database, account or credential was created during inspection, and no DNS or domain assignment was changed.
2. Prepare the single production environment behind temporary password protection. Preserve the existing review site during acceptance; do not enable indexing or remove access protection merely because the hosting direction is approved.
3. Replace Node runtime endpoints with appropriate PHP implementations. Node remains a build/development dependency; PHP cannot execute Astro server routes directly. The current Node registration route remains inactive.
4. Replace and verify automatic Sanity publish/edit/unpublish deployment to STRATO, including failed-build behavior, complete releases and rollback. The current hook targets Vercel; copying files once does not migrate publishing.
5. Decide and implement private-preview continuity. The existing full website Visual Editing uses Node routes. Retaining only the in-Studio preview would change functionality and is not an approved substitute yet. Never export drafts into public static files.
6. Implement PHP registration validation, durable duplicate/rate controls and database storage, with tests for failure and concurrent submissions. Preserve the current processing requirements from [forms foundation](FORMS-FOUNDATION.md); existing TypeScript tests do not validate a PHP port.
7. Build and verify the protected staff workflow, credential handling, access removal, deletion and backup/restore. Agree fields, consent/signatures, recipients and retention before accepting genuine registrations. A saved submission is not a confirmed training place.
8. Verify all pages, extensionless URLs, navigation, assets and HTTPS on the protected production environment, then arrange explicit launch approval after legal/content readiness. Preserve email DNS records.

## Current acceptance

### Issue #9 protected deployment — 8 November 2026

The current published Sanity content was built with `SITE_URL=https://pkhockeyacademy.de` and `PUBLIC_LAUNCH_READY=false`, then deployed as a static/PHP artifact behind the existing Basic Auth layer. All 127 files were checksum-verified, with the previous holding page/configuration backed up only in ignored local release diagnostics. Release: `2026-11-08T11-28-39-123Z-2ceb0e5deccc`; its local manifest records the subsequent routing amendment and final artifact hash. The upload staging directory was removed.

Actual STRATO acceptance found a trailing-slash redirect on extensionless routes. `DirectorySlash Off` and `RewriteBase /`, with `Options -Indexes` retained and the resolved request filename used for directory-index checks, corrected it. The routing amendment preserves the host's authentication rules and was verified against the final source artifact.

Executed checks: Astro check (115 files, zero errors/warnings/hints), 74 unit tests, 111 actual-host HTTP checks and 51 live browser route/viewport checks at 1440/768/375px. Keyboard/no-JS navigation, back/forward, all 13 footer destinations, reduced motion, spray/carousel/rink lifecycle and both fictional interview journeys passed. Animation trigger counts remained 15/15/15, with zero browser errors or unexpected external requests. The published nested coach profile passed phone checks. Screenshots were inspected at desktop/tablet/phone sizes. No live gallery album/video existed to exercise media-specific acceptance; that remains part of #16.

The live host returns genuine 404s, correct asset MIME types, and inactive 503/no-store responses for GET/POST/OPTIONS registration requests and preview routes. Root/www remain password-protected, indexing is disabled, and credentials/private reports stay Git-ignored. The existing Sanity/Vercel hook and private Visual Editing remain unchanged; STRATO updates are manual until #10. No registration database, real-data collection or public launch was activated. Protected deployment tooling, acceptance mode and recovery steps are documented in `hosting/strato/README.md`.

### Issue #8 implementation progress — 7 November 2026

**Current outcome, 8 November 2026:** technical hosting acceptance passed. Temporary Basic Auth is installed, with its bcrypt hash outside the public web root. Correct and incorrect credentials, anonymous root/www/HTML/asset/PHP requests, authenticated static/PHP responses, dotfile denial, both HTTP redirects and setup-helper removal were verified. Fifteen final HTTP cases passed. Known alternate domains/master HTTP paths return only STRATO placeholders; the provider master hostname does not offer working HTTPS and no certificate checks were bypassed. Root/www production HTTPS works. The actual website is not deployed: the authenticated page is a minimal German holding page. No database, real registrations or public launch/indexing activation occurred. GitHub issue status and publication of detailed acceptance notes remain pending specific user approval after the earlier automatic-review rejections.

**Critical for issue #9:** preserve the temporary authentication layer while merging the exported Apache routing rules. Blindly copying the export's `.htaccess` over the current file loses the public-directory login (the parent guard still denies access, but the expected authenticated preview would break). The live guard must retain the external credential path and be verified before website content is uploaded. Never upload the local `.env.local`, setup template, dependencies or private diagnostic records.

- Created empty `/pk-hockey-academy/public` and sibling `/pk-hockey-academy/private` directories through STRATO Webspace. These are webspace-relative paths; the actual PHP filesystem path and HTTP isolation still require a protected runtime probe. No secret/configuration has been placed there.
- Assigned the existing **included SSL certificate** to `pkhockeyacademy.de`, without ordering/upgrading a product. STRATO reports SSL active. Root and `www` HTTPS pages load in the browser without a certificate warning.
- Enabled STRATO's permanent HTTP-to-HTTPS redirect. A browser visit to `http://pkhockeyacademy.de/` resolves to `https://pkhockeyacademy.de/`. No browser warnings were bypassed.
- Prepared, but did not save, a new SFTP-only deployment account scoped to `/pk-hockey-academy/public`; its password field remains for the user to enter and submit privately. No SSH access selected. Account creation and actual SFTP boundary testing are not yet complete.
- Domain target remains the STRATO placeholder until temporary access protection is installed and verified. No website files, PHP probe or registration data were uploaded. No database, QA hostname, email/DNS configuration or Sanity/Vercel integration changed.

Next: finish user-operated SFTP credential setup, install and verify temporary HTTP access protection, map the production domain to the public directory, and test runtime capabilities and alternate-host/path isolation. Issue #8 remains open. Browser evidence is retained locally under ignored `output/strato-issue8-*.jpg`; account/session identifiers must never be published.

Follow-up in the same acceptance phase: the user saved the deployment account; the dashboard confirms SFTP only and root `/pk-hockey-academy/public`. Uploaded a 106-byte deny-all `.htaccess` into `/pk-hockey-academy`, then mapped only `pkhockeyacademy.de` internally to its `public` directory. The root, `www`, `/index.html`, `/assets/acceptance.css`, `/api/acceptance.php` and `/.htaccess` render 403 in unauthenticated browser checks. The representative file paths contain no uploaded test content; these checks demonstrate early denial, not authenticated file serving or PHP execution. No website files were deployed and no email/DNS/Sanity/Vercel settings changed.

Temporary Basic Auth is still pending; the deny-all guard stays active in the meantime. Prepared a Git-ignored `hosting/strato/.env.local` for the user to enter the SFTP password and a separate website-review password privately. The credential-free `.env.example` documents key names. Do not include the private file, server/account identifiers or any password in public evidence. Next steps are actual SFTP boundary tests, authentication installation with private credential storage, protected runtime probes and alternate-host isolation checks. No database is provisioned; issue #8 remains open.

After local credential entry, actual SFTP authentication succeeded. Parent traversal resolves to the restricted root; the tested sibling/private paths are unavailable. A first-observed provider host key is pinned locally (TOFU, not independent fingerprint verification). The site-review password is currently shorter than the acceptance setup's 12-byte minimum, so authentication installation stopped before changing remote configuration.

Independent runtime acceptance then verified PHP **8.4.27**, PDO MySQL, JSON, OpenSSL, session, mbstring, fileinfo and sodium. A random-name PHP helper required a 256-bit token header before returning runtime/private-path information. It verified private-directory read/write and cleanup. Apache `Options -Indexes -MultiViews`, rewrite support and an explicit authorization condition for the exact rewrite-test path passed. Earlier rewritten-route attempts were correctly denied before rewrite because of the parent guard; the exact scoped authorization resolved that test. Each probe was removed and deny-all protection restored. No personal data, registration records or database were created. Detailed private reports are Git-ignored under `output/strato-private/`; no credentials were logged. Basic Auth correctness, private-hash storage, authenticated website serving and final alternate-host acceptance remain pending.

### Read-only package inspection — 7 November 2026

Inspected the signed-in STRATO customer dashboard in the in-app browser. No settings were saved, credentials created, files uploaded, database created, domain assigned or DNS changed. Session links and customer/account identifiers are intentionally omitted from this record.

| Item | Dashboard evidence |
| --- | --- |
| Package/webspace | Hosting Basic; 100 GB; 0 B used; Webspace file listing empty; advertised webspace path `/home/www` |
| PHP | Current/recommended PHP 8.4; offered choices 8.2, 8.3, 8.4 and 8.5; unchanged |
| Database allowance | 0 of 25 used; actual engine/version, extensions and connection limits not yet verified |
| Deployment access | 0 of 10 SFTP accounts used; creation form offers SFTP or SFTP+SSH and root-directory selection; left blank and cancelled |
| Subdomains | 0 of 500 used; domain settings provide subdomain creation; none created |
| Domains | `pkhockeyacademy.de`, `pk-hockeyacademy.de`, `pk-hockey-academy.de`; all active with placeholder targets and SSL inactive |
| SSL | Two unassigned entries: STRATO SSL Basic and Inklusives SSL-Zertifikat. Included-certificate assignment dialog lists the three root domains; cancelled without assigning |

This verifies package configuration, not runtime behavior. PHP extensions (especially PDO MySQL), the actual private filesystem location, Apache directives/rewrite/access control, database engine and HTTPS still need server tests. No database is needed for the first static staging acceptance.

STRATO documents [directory password protection through `.htaccess`](https://www.strato.de/faq/sicherheit/kann-ich-einzelne-verzeichnisse-fuer-bestimmte-nutzer-nutzergruppen-mit-einem-passwort-schuetzen/). Its [SSL guidance](https://www.strato.de/faq/domains/so-nutzen-sie-strato-ssl/) states that a single-domain certificate normally covers the root and `www`; do not assume it covers `staging.pkhockeyacademy.de`.

The earlier proposal to use an alternative academy domain for staging and the subsequent `qa.pkhockeyacademy.de` preference are superseded by the single-environment decision above. Next implementation: assign the included certificate to `pkhockeyacademy.de`, prepare a dedicated directory and scoped deployment access, and verify HTTPS plus unauthenticated denial before uploading the site. Confirm any terms/costs before applying; no certificate has been ordered or assigned. The user enters credentials privately. Preserve email configuration and Vercel/Sanity publishing/preview during acceptance. No hosting changes have been applied yet.

First restructuring increment, 7 November 2026: `web/src/runtime/` now separates the existing review-only Node endpoints from public pages. `npm run build:strato` builds without a server adapter and packages static pages with Apache rules and inactive PHP registration/preview endpoints. See [build and hosting boundary](../hosting/strato/README.md). Node/npm remain local/CI build tools; this target requires no Node process on STRATO.

The protected STRATO website is now deployed and accepted as recorded above. Active registration processing, database/staff workflows and replacement automatic publishing/private-preview integration remain unfinished. The existing protected Vercel host and Studio integrations are preserved. Registration remains disabled. No Google Sheet creation or Google API setup should be requested from Pierre.

Sources: [STRATO PHP settings](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/), [database management](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/), [SFTP](https://www.strato.de/faq/hosting/so-verbinden-sie-sich-mit-dem-strato-sftp-server/), [Node hosting limits](https://www.strato.de/server/node-js-hosting/), [Astro deployment](https://docs.astro.build/en/guides/deploy/).
