# Issue #2 — Sanity-managed media kit

The original [media-kit issue](https://github.com/0xJado/pk-hockey-academy/issues/2) was closed with a working local logo download, but its CMS scope was missing. This implementation adds `mediaKitDownload` to the existing academy Sanity project and connects it to the stable German `/medienkit` route.

## Editing workflow

1. Open **Inhalte → Medienkit-Downloads** in the [academy Studio](https://pk-hockey-academy.sanity.studio/). Create a download or open an existing entry.
2. Enter its title, description and public download filename. Upload a file through **Download-Datei → Hochladen**, or use **Auswählen** for an existing asset. The same menu replaces a file or clears its reference. Accepted downloads: PNG, JPEG, WebP and PDF up to 20 MiB; an optional prepared ZIP up to 50 MiB. ZIP contents must already be checked and approved; the site does not generate an archive.
3. Optionally upload a separate optimized preview source and describe/credit it. PDFs and ZIPs without previews receive a format tile. Actual format and byte size come from the uploaded file, not editable claims. Filename extensions must match the file type.
4. Add only approved usage guidance. No logo licence was supplied, so the migrated logo leaves this blank and the page explicitly says agreed guidance is unavailable. Supplying a file does not imply unrestricted reuse.
5. Set order, confirm the file/metadata/public-distribution rights, choose **Auf der Website zeigen**, then publish. Required fields, whitespace, file type/size, matching filename and preview metadata are blocking validation errors. New entries start withheld and unapproved.
6. Wait for a successful automatic website build, then check the download on `/medienkit`. Draft editing alone does not update the site. A failed build preserves the prior deployment.
7. To withdraw, publish **Zurückhalten**, or select the **Veröffentlicht** perspective and use **Unveröffentlichen → Jetzt zurückziehen**. Wait for a successful build and verify removal. Return to **Entwurf → Veröffentlichen** to restore.

## Retrieval and missing-file behavior

`shared/media-kit.ts` shares publication, file and preview rules with Studio and `web/src/lib/media-kit.ts`. The build requests the published perspective and independently excludes drafts, releases, hidden and unapproved entries. `media-kit-source.ts` uses the existing project/dataset/read-token configuration; no new hosting setting or database is required.

A configured CMS is authoritative, including zero downloads. The original local entry is only the unconfigured-development starter. Invalid approved metadata fails the build. Missing/unresolved file references are omitted; anonymous CDN HEAD checks omit 404/410 files and fail on unexpected service errors. The dataset read token is never sent to the CDN or browser. Download URLs use Sanity's supported `?dl=<safe filename>` attachment response so cross-origin links download without depending on the browser's `download` attribute.

The existing publication hook now includes `mediaKitDownload` create/update/delete and file-asset deletion. It retains its existing destination, event projection and draft/release exclusions. File uploads and metadata edits alone do not trigger builds. Hook updates require explicit `--update-existing --apply`, preserve other settings and verify the result.

## Initial content and privacy

Only the already public, user-supplied academy logo was migrated. `npm run media-kit:migrate-logo` checks its documented SHA-256 and reports a dry run; `-- --apply` uploads the original file and preview, then stages a draft for native publication. It refuses to overwrite existing draft/published documents. Original bytes: 1,558,622; SHA-256 `913ef27652da16d9940f8872a675174c4f99911ecf8348e074ad225a66fdec53`.

Sanity CDN files are URL-public even while their referencing documents are drafts or withheld. Approval controls website inclusion; they are not asset access controls. Upload only files already cleared for public distribution. Withdrawal removes the page link after rebuilding but does not revoke shared CDN URLs. Remove references before native asset deletion; Sanity blocks deletion while strong references exist, and CDN caches can outlive deletion. No personal forms, consent documents or private press material belong here.

No press photos, academy-information PDF, new licence terms or ZIP were fabricated. These can be added without code when approved materials exist. The existing brand styling and motion are preserved; no download-specific JavaScript or new animation was introduced.

## Verification

- Website: 44 tests, Astro check (74 files, zero diagnostics), and configured build passed.
- Studio: 20 tests, TypeScript check and hosted schema/Studio deployment passed.
- Seven isolated builds passed: starter, populated authenticated, populated public with replacement/order/text updates, empty, invalid trainer, invalid gallery and invalid media-kit content. Missing files, withheld/draft records, escaping and credential isolation were checked in the actual compiled output.
- Edge browser checks passed at 1440, 768 and 375px for populated, edited and empty states: one h1, no horizontal overflow, correct order, accessible links, completed PNG/PDF downloads, keyboard focus, repeated navigation and no-JavaScript downloading. Zero page exceptions. A downloaded fixture PNG matched the original logo checksum.
- Native Studio blocked publication of a whitespace-only title. The original title was restored before publication. The migrated original was published through the native action, and native asset selection was exercised. Browser automation did not surface the native OS upload chooser; actual upload succeeded through the authenticated Sanity asset API. Distinct-file replacement is covered by compiled fixtures.
- Ignored evidence: `output/playwright/issue2-*`, `output/cms-integration-sGDKtH/`, `output/issue2-web-build.log`.

## Live acceptance completed — 30 October 2026

Implementation commit `798c318` is pushed to `main`. The Studio/schema and the existing protected, noindex website are deployed. Native publication, editing, withdrawal and restoration used the real `media-kit-academy-logo` document. No additional media, account, invitation or licence was created.

| Acceptance criterion                                   | Verified result                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Download on mobile and desktop without visitor sign-in | The live page passed at 1440, 768 and 375px: one h1, one labelled download and no horizontal overflow. Each completed browser download matched the original SHA-256. A separate anonymous CDN request verified the attachment filename, 1,558,622 bytes and identical hash without any account or token. The review website itself retains its existing deployment protection. |
| Only approved assets available from the media kit      | Published-perspective queries and independent approval/draft/visibility checks exclude withheld, unapproved, draft and release entries. Native drafts were unreadable anonymously. The current approved logo is the only listed file. This is page-publication control, with the CDN access limits explained above.                                                            |
| Administrators can update through Sanity               | Native Studio title validation blocked publication; the title was restored. Native file selection and a credit edit were published and appeared on the website after a READY automatic build. Upload and distinct-file replacement test limits are stated in the verification section.                                                                                         |
| Missing/unpublished files produce no broken links      | Compiled fixtures omitted unresolved and 404 file assets. Native withdrawal triggered a READY build; the live page showed **Downloads in Vorbereitung** with zero download links and no local-logo resurrection. Republish restored the approved original.                                                                                                                     |
| Clear, accessible download labels                      | Live output included title, filename, PNG format, 1,56 MB, preview description and a link labelled **PK Hockey Academy Logo herunterladen (PNG, 1,56 MB)**. Missing agreed usage guidance was explicit. Keyboard, no-JavaScript and repeated-navigation checks passed in the compiled browser suite.                                                                           |

| Release/action                                  | Deployment reaching READY          |
| ----------------------------------------------- | ---------------------------------- |
| Deploy the Sanity-backed website implementation | `dpl_2iUQo64zegjggNG9JqZQUnT8goDX` |
| Publish native asset selection/credit edit      | `dpl_Bcz62Q2zMyfb2RDAxjTio99U7n9c` |
| Native withdrawal and verified empty live page  | `dpl_HHf2ZriAiGfKSQSzUG4Tj1uzJScf` |
| Restore the preserved approved original         | `dpl_BbKRJ7TJvyj7GhSyWtyLGEcUUTnA` |

Authenticated readback after restoration matched every non-system business field to the private snapshot. The anonymous public adapter returned exactly `media-kit-academy-logo`, the native draft query returned no anonymous records, and the restored download passed its filename/byte/hash checks again. Live page inspection confirmed the restored link and verified academy credit. No temporary CMS document or test asset needs removal. Issue #2 was already closed when work began; no issue comment or state change was made.

Fresh readback evidence: `output/playwright/issue2-restored-api.json`. Native/website screenshots and the withdrawal record remain under ignored `output/playwright/issue2-*`. Additional press media, academy-information documents, agreed usage wording and any complete ZIP remain content inputs for Pierre, rather than missing CMS implementation.

Official references: [Sanity file fields and attachment downloads](https://www.sanity.io/docs/studio/file-type), [asset upload/deletion and reference protection](https://www.sanity.io/docs/content-lake/manage-assets), [publication validation](https://www.sanity.io/docs/studio/validation), [webhook updates](https://www.sanity.io/docs/http-reference/webhooks).
