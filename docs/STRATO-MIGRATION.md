# STRATO production migration decision

Confirmed by the user on 6 November 2026. This supersedes earlier Google Sheets registration plans and the undecided production hosting direction. It records an approved direction, not a completed migration.

Execution tracker: [STRATO migration and webapp launch #7](https://github.com/0xJado/pk-hockey-academy/issues/7). Native sub-issues #8–#19 cover hosting, first deployment, automated publishing, private preview, registration policy/backend/staff/form, editorial acceptance, legal/content/SEO, interview scope and final launch. Their checklists distinguish implementation from evidence and owner approvals. First step: [configure protected production hosting #8](https://github.com/0xJado/pk-hockey-academy/issues/8).

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

No STRATO deployment, active PHP processing, database, staff interface or replacement publishing/private-preview integration exists yet. The existing protected review host and Studio integrations are preserved. Registration remains disabled. No Google Sheet creation or Google API setup should be requested from Pierre.

Sources: [STRATO PHP settings](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/), [database management](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/), [SFTP](https://www.strato.de/faq/hosting/so-verbinden-sie-sich-mit-dem-strato-sftp-server/), [Node hosting limits](https://www.strato.de/server/node-js-hosting/), [Astro deployment](https://docs.astro.build/en/guides/deploy/).
