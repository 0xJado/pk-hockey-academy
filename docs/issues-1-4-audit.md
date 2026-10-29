# Issues 4 and 1 — implementation and adversarial review

The original implementation was committed and pushed in the user-authorized pre-connection batch. Subsequent explicit setup and publishing approvals connected the real project and protected review website. On 25 October 2026, native owner sign-in, draft privacy, denied anonymous mutation and the real coach publish/edit/unpublish/restore round trip passed. The [publishing runbook](CMS-PUBLISHING.md) records all four successful deployments. Remaining account lifecycle and authentic media checks are listed below; new integration source remains uncommitted.

## Issue 4 — coach profiles

Implemented a German trainer schema, explicit publication approval, optional portrait with metadata validation, ordering, private in-Studio draft preview, published-only server retrieval and reusable website profiles. Existing Pierre content remains the default until `SANITY_TRAINERS_ENABLED=true`. An activated CMS is authoritative, including an empty collection. No fabricated biographies or portraits were added.

### Opposing senior-engineer argument

“A schema and a happy-path card are insufficient. CMS migrations often resurrect deleted content through fallback logic, leak drafts through tokens or previews, accept content that later breaks the static build, and silently drop records. The homepage must also survive an empty collection, and removing a profile should remove its hardcoded references.”

### Findings and repairs

1. **High — fallback could undo unpublishing.** Added an explicit migration flag. Once active, the CMS response is authoritative; no local fallback on empty results or request failures. Empty, hidden, inactive, unapproved, draft and release records are tested.
2. **High — a query alone is not a publication boundary.** Added independent runtime type, ID, approval, activity, visibility and metadata checks. The API origin, published perspective, timeout and redirect rejection are explicit. The token exists only in build-time request headers. Errors do not include tokens or response bodies.
3. **Medium — whitespace-only portrait metadata could pass field rules and fail the website build.** Added shared publication validation for the uploaded reference, trimmed alternative text and credit, alongside field and asynchronous asset validation.
4. **Medium — first-trainer assumptions could crash an empty collection or retain stale personal metadata.** Removed non-null first-item accesses; added an honest empty trainer-pool state, omitted the empty homepage teaser and made route metadata independent of a particular coach.
5. **Medium — arbitrary portrait URLs could cause untrusted remote loads.** Public portraits require the exact Sanity CDN origin, project/dataset path, raster extension, bounded dimensions/size and complete metadata. The Studio preview derives raster URLs only from validated native asset references.
6. **Medium — malformed approved content should not silently disappear.** Invalid required content or portrait data fails the configured build with an actionable, non-secret error. Optional missing portraits retain the academy-crest fallback.
7. **High — environment-object passing left the migration inactive in real static builds.** Build-level fixtures exposed that Astro did not substitute private settings when passing the generic environment object. Changed trainer and gallery boundaries to explicit server-only property reads. Rebuilt with synthetic CMS responses and verified real generated profiles, empty collections and rejected malformed approved profiles.
8. **High — custom validation warnings could allow invalid publication.** Native Sanity schema validation exposed warning-level custom checks. Made document and image checks explicit errors; added native-engine tests for whitespace-only fields, unapproved publication, invalid images, optional portraits and malformed ordering/types.
9. **Medium — the existing upload helper accepted negative or nonnumeric sizes.** Tightened the shared Studio upload check to positive safe integer byte counts, aligning coach validation with the public boundary. Native schema and upload-helper tests now reject negative, fractional, nonfinite and string sizes as well as oversized files.

### Verification

Automated transport/content tests, schema extraction, Studio compilation and website compilation are used below; final browser and combined verification are recorded in `VALIDATION.md` after execution. The draft preview is a Studio-only view, not a public draft endpoint or a promise of live visual editing.

## Issue 1 — admin access

Implemented a noindex public entry page that links only to a valid configured HTTPS Studio destination, native Sanity authentication, optional restriction to an existing supported provider, and an authenticated German editorial-help tool. Account management and actual grants remain with Sanity. The website has no password collection, authentication proxy or write token.

### Opposing senior-engineer argument

“A hidden link, a role label or a login-looking page does not enforce authorization. Provider filtering is not MFA. A UI cannot prove that accounts have the correct roles, that revoked sessions stop working, or that a dataset is private. A successful bundle also does not prove configuration survived browser compilation.”

### Findings and repairs

1. **High — confusing UI with authorization.** Kept all editing, uploads and publishing within native Sanity. The help tool only displays the signed-in user's supplied role names and performs no privileged operations. A missing user renders only a sign-in message. Role restrictions must be configured and enforced in the real Content Lake, not with hidden buttons.
2. **Medium — malformed admin destinations were silently treated as missing.** A configured invalid URL now fails with an actionable error that does not print its value. Tests reject credentials, queries/fragments, non-HTTPS schemes, local/IP destinations, placeholder domains and unsupported ports. Blank configuration retains a nonfunctional setup state.
3. **High — helper refactoring could break compiled Studio settings.** The browser build initially replaced a generic `process.env` object with an empty object. Restored explicit project/dataset/provider property reads and verified the built Studio proceeds to Sanity's access/setup gate instead of throwing a configuration error. Offline helper tests alone would not have found this regression.
4. **Medium — provider restriction could silently allow every method if unavailable.** Unsupported configuration or a selected provider missing from the native list now errors. Blank configuration preserves native providers. No arbitrary authentication endpoint can be configured through this helper.
5. **Medium — MFA and account recovery could be overstated.** Documented provider-level MFA, recovery using the original sign-in identity, account removal and reinvitation. Provider filtering is described only as a login-choice restriction; it neither enables nor verifies MFA, revokes existing sessions, or changes data permissions.
6. **Medium — role recommendations could accidentally overgrant on a lower plan.** The role matrix is explicitly plan-dependent. It does not recommend granting administrator rights to ordinary editors when a narrower role is unavailable. Roles are additive; reviewers must check combined grants.
7. **Medium — preview and public CDN behavior could mislead editors.** The Studio preview is explicitly private editorial rendering, not a public draft route or live visual-editing integration. Help and setup docs explain the separate public asset-CDN boundary and rebuild requirement, including withdrawals.

### Remaining external acceptance checks

The real public dataset and ignored local environment files are configured. The owner account's native sign-in and Administrator role, draft exclusion, denied anonymous mutation, approved profile publication, draft isolation, published edit, withdrawal and restoration are verified. Trainer migration is active; empty CMS results do not resurrect local profiles. No additional member or provider policy was changed. Remaining real-account checks are invitation acceptance, appropriate other-member roles, supported MFA, sign-out/recovery and revocation of an already open session. Do not revoke the only owner as a test. An authentic approved portrait and camp-media upload/publication also remain untested; no synthetic identity or unapproved media was uploaded for acceptance. Keep these limitations distinct from the completed coach content round trip.

### React and lifecycle review

Applied the React review checklist to both Studio components: hooks are unconditional and restricted to native wrappers; derived preview state is calculated during rendering, with no effects/listeners/fetch waterfalls. Components use typed props and semantic headings, lists, tables, links and image alternatives. Text is escaped by React/Astro; neither component uses raw HTML injection. A separate pure rendering layer permits isolated UI checks without adding a product authentication bypass. No React or Studio JavaScript is shipped to website visitors.
