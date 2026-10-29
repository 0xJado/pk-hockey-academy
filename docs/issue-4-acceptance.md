# Coach profiles — issue #4 acceptance, 29 October 2026

The original [issue #4](https://github.com/0xJado/pk-hockey-academy/issues/4) workflow is accepted for the currently approved, portrait-free profile. The user confirmed that no trainer photography exists and requested the existing academy-logo backdrop. Pierre's public profile and homepage teaser retain that presentation. No new coach identity or qualification was invented.

## Acceptance evidence

| Criterion                                                   | Executed check and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| An administrator can create and publish without code        | In the authenticated hosted Studio, created a separate document from **Pierre Klein · geprüftes Startprofil**, edited equivalent role wording and order, inspected **Profilvorschau**, and published using the native action. It remained withheld and unapproved, so no duplicate Pierre appeared on the website.                                                                                                                                                                                                             |
| Required fields block publication                           | Replaced the test profile's name with whitespace. Studio displayed validation errors and disabled **Veröffentlichen**; the private preview explained the incomplete profile. Restored the valid name. Native-schema regression tests also cover required copy, approval and optional image metadata.                                                                                                                                                                                                                           |
| Mobile and desktop rendering                                | The real protected website passed at 1440, 768 and 375px: one profile, one h1, no horizontal overflow, no editor metadata, and the academy crest. The isolated compiled cases passed at all three widths too.                                                                                                                                                                                                                                                                                                                  |
| Drafts and unpublished profiles stay off the website        | Authenticated readback found the native draft; anonymous queries returned no draft records. Publishing the withheld test document did not change the public trainer list. Withdrawing the original removed it after the successful build.                                                                                                                                                                                                                                                                                      |
| Text, portraits and order are editable                      | Native Studio editing/private preview accepted the verified role wording and order. Earlier real publishing acceptance verified equivalent role changes on both public pages. Isolated builds and browser checks verified two profiles changing order, updated copy and a replacement optional portrait URL; the homepage followed the first profile, including its logo fallback. No authentic portrait was available, so real portrait upload/replacement remains untested and is outside the user's current no-photo scope. |
| Withdrawal removes the profile after publication processing | Used native **Unveröffentlichen** on the original profile, waited for a READY deployment, and verified an empty trainer pool plus no Pierre teaser on the homepage. Republished the preserved original, waited for READY, and verified its return. All non-system business fields matched the backup, with no portrait.                                                                                                                                                                                                        |
| Workflow is documented                                      | [German editor guide](../studio/README.md), [publishing runbook](CMS-PUBLISHING.md), and this record cover creation, validation, preview, ordering, approval, publication, withdrawal and rebuild verification.                                                                                                                                                                                                                                                                                                                |

## Live deployment record

Each deployment below used committed website source `c0a9591` through the existing Sanity webhook, with deployment protection and noindex retained.

| Action                                      | Deployment reaching READY          |
| ------------------------------------------- | ---------------------------------- |
| Publish the withheld acceptance copy        | `dpl_A5KJXtx3yu8GsihdeLzYJC9DHMXN` |
| Unpublish that copy                         | `dpl_Gbb3T8m36S6KVwDTfwxV6dZDr9X8` |
| Withdraw the original public Pierre profile | `dpl_CZTpomKhSWpZkcLGRDiWVnot4uz7` |
| Restore the unchanged original profile      | `dpl_2fDZbZtN3Umkh52yLvJMb4FBvHmi` |

The user explicitly approved discarding the separate temporary test draft, and it was discarded in Studio. The original approved document remains published. Backups, screenshots and authenticated test tooling remain ignored; no credentials or synthetic profiles were uploaded to source control. A withheld published document in this public dataset is API-readable: withholding is website selection, while native drafts require authentication.

## Automated and browser checks

- Website: 40 tests, Astro check (70 files, zero diagnostics), and configured production build passed.
- Studio: 18 tests, TypeScript check and Studio build passed.
- Six isolated CMS builds passed: starter, populated authenticated, populated public with edited/reordered profiles, empty, invalid trainer and invalid gallery. Invalid approved content fails the build; withdrawal never resurrects local starter content.
- Compiled trainer browser checks covered four data states at 1440/768/375px, optional-image replacement, edited text/order, homepage selection, gallery layout, actual no-JavaScript rendering, reduced-motion emulation, visible keyboard focus and two back/forward round trips. There were zero page exceptions. The live trainer page's monitored warning/error log was empty.
- Ignored evidence: `output/playwright/issue4-browser-qa.txt`, `issue4-{withdrawn,restored}-api.json`, responsive screenshots, invalid-draft screenshot and live withdrawal screenshot. CMS artifacts: `output/cms-integration-eCjh4x/`.

The existing website design and motion system are preserved; this increment adds validation and acceptance coverage. Shop work is excluded.

## Separate follow-ups

Hosted **Website bearbeiten** / Presentation iframe click-to-edit activation and its full edit/refresh sequence remain separate from the original ticket's native editable-profile requirement. Do not infer that acceptance from field attributes or private-preview tests. Real trainer-image upload acceptance can follow when approved photography exists. Real gallery upload/publication/withdrawal, account recovery/MFA/member lifecycle and legal/public launch checks also remain separate.

No GitHub issue comment or state change was made during this acceptance run.
