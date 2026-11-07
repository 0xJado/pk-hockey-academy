# STRATO production migration decision

Confirmed by the user on 6 November 2026. This supersedes earlier Google Sheets registration plans and the undecided production hosting direction. It records an approved direction, not a completed migration.

## Ownership and boundaries

- Pierre already pays for STRATO Hosting Basic. Browser inspection showed 100 GB of empty webspace, allowance for 25 databases, three academy domains and an unassigned free included single-domain SSL certificate.
- Production should use Pierre's STRATO account. The current Vercel account belongs to the developer and remains the protected review host until cutover.
- Keep Astro and the existing design. Build public pages outside the web server and deploy static output to STRATO.
- Keep Sanity's public dataset for public website content. Native drafts still require authentication; public assets are not private storage. Do not migrate the editorial CMS or place registration/health/consent records in it.
- Abandon Google Sheets as the registration destination. Use a private STRATO MySQL/MariaDB database with a PHP backend. One database should initially suffice; actual engine/version and limits need verification.
- Plan a protected, minimal staff interface for registration review and necessary actions. Staff authorization is separate from Sanity editorial access. CSV export is proposed, not an implemented feature or an approved data-sharing process.

## Work before cutover

1. Verify the package's PHP version/extensions, database capabilities, HTTPS, deployment access and secret storage. No database, account or credential was created during inspection, and no DNS or domain assignment was changed.
2. Prepare a migration branch and a staging deployment. Preserve the existing review site during acceptance; do not change public DNS or enable indexing merely because the hosting direction is approved.
3. Replace Node runtime endpoints with appropriate PHP implementations. Node remains a build/development dependency; PHP cannot execute Astro server routes directly. The current Node registration route remains inactive.
4. Replace and verify automatic Sanity publish/edit/unpublish deployment to STRATO, including failed-build behavior, complete releases and rollback. The current hook targets Vercel; copying files once does not migrate publishing.
5. Decide and implement private-preview continuity. The existing full website Visual Editing uses Node routes. Retaining only the in-Studio preview would change functionality and is not an approved substitute yet. Never export drafts into public static files.
6. Implement PHP registration validation, durable duplicate/rate controls and database storage, with tests for failure and concurrent submissions. Preserve the current processing requirements from [forms foundation](FORMS-FOUNDATION.md); existing TypeScript tests do not validate a PHP port.
7. Build and verify the protected staff workflow, credential handling, access removal, deletion and backup/restore. Agree fields, consent/signatures, recipients and retention before accepting genuine registrations. A saved submission is not a confirmed training place.
8. Verify all pages, extensionless URLs, navigation, assets and HTTPS on staging, then arrange the domain switch and explicit launch approval after legal/content readiness. Preserve email DNS records.

## Current acceptance

No STRATO deployment, PHP backend, database, registration interface or replacement publishing/preview integration exists yet. Registration remains disabled. No Google Sheet creation or Google API setup should be requested from Pierre.

Sources: [STRATO PHP settings](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/), [database management](https://www.strato.de/faq/hosting/so-nutzen-sie-unsere-datenbank/), [SFTP](https://www.strato.de/faq/hosting/so-verbinden-sie-sich-mit-dem-strato-sftp-server/), [Node hosting limits](https://www.strato.de/server/node-js-hosting/), [Astro deployment](https://docs.astro.build/en/guides/deploy/).
