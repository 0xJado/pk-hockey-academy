# CMS publishing and automatic website updates

Current implementation: 25 October 2026. The Studio is deployed; native CLI/browser login and draft privacy are verified. Vercel has the public project/dataset and Studio URL for its existing protected review project. Following the user's explicit approval, the main-branch deploy hook **PK Hockey Academy · Sanity** is connected to the active Sanity document webhook **PK Hockey Academy · Website** (`0DrSPAU3ECwrY7Y9`). An identical-config readback passed. The user then explicitly approved Pierre's existing verified profile publishing test. Trainer migration is now enabled locally and on hosting; social activation remains `false`.

## Completed coach acceptance

All actions used the native authenticated Studio editor and the real `trainer-pierre-klein` document. No additional identity, portrait or claim was invented. Sanity recorded four successful deliveries (HTTP 201), with only document ID/type/operation in each payload. All four automatic deployments reached READY from `main`, commit `bcd64ab2096e7697f1ac3182cc456c2edc06b92c`:

| Action | Successful deployment | Website result |
| --- | --- | --- |
| Publish verified starter | `dpl_FpMYGaMadKxzhWzaERtSWEXseX5L` | Profile and homepage teaser show original content. |
| Publish equivalent role wording | `dpl_5vuDWjTi2fkmUcrzF65GBkemsBcU` | Both pages show “Gründer und Trainer”. Saving the draft first caused no extra delivery and did not leak its text. |
| Native unpublish | `dpl_DxBKPqYjoviotSaZ2rcwcEQ1gns5` | Trainer pool shows its honest empty state; homepage teaser, profile link and Pierre text disappear. |
| Restore original verified wording | `dpl_GA7T1WEctK2RFM9Qry4Vv8WssVWG` | Profile and teaser return with “Gründer & Trainer”. Native readback matches every original business field. |

The original draft backup and credential remain ignored. Final trainer configuration is `SANITY_TRAINERS_ENABLED=true`; Sanity is authoritative even when empty. The website remains a protected, noindex review deployment with `PUBLIC_LAUNCH_READY=false`. Native member invitation/revocation/recovery/MFA, authentic portrait uploads and real camp-media publication are separate checks; this coach test does not establish them.

## One-time connection

Media-kit extension, 30 October 2026: the existing hook now also handles published `mediaKitDownload` changes and file-asset deletion. New uploads/ordinary asset metadata changes remain excluded. The bounded filter-update command preserved the destination, API version, HTTP method, projection and draft/release exclusions and verified its readback. See the [media-kit workflow](issue-2-media-kit.md).

The [29 October issue #4 acceptance](issue-4-acceptance.md) extends the earlier check with native new-document creation, blocking validation, withheld publication and draft cleanup, plus a fresh real-profile withdrawal/restoration. All four associated deployments reached READY. The original public profile was restored without changing its business fields. The user requested the current logo backdrop because no approved trainer photography exists. Portrait URL replacement and ordering were checked in isolated compiled fixtures; real photo upload remains separate.

1. Keep the existing `driftwoodmedia/pk-hockey-academy` project, Git repository and `main` branch. Retain deployment protection and `PUBLIC_LAUNCH_READY=false`.
2. The build settings use `web`; configure `SANITY_PROJECT_ID`, `SANITY_DATASET` and `PUBLIC_SANITY_STUDIO_URL`. Public dataset reads need no read token. These public settings are configured for Production and Preview. Do not copy the Studio's CLI session into hosting.
3. In Vercel's Git settings, create one deploy hook named **PK Hockey Academy · Sanity** for **main**. Its URL is a deployment credential: keep it out of Git, screenshots, chat messages, Studio client configuration and public build output.
4. Store that URL in a private local file under ignored `.tools/`, supplied directly by the owner or the authorized setup flow. From `studio`, run `npm run webhook:setup -- --url-file ../.tools/sanity-deploy-hook.private.txt` to inspect the proposed configuration. Append `--apply` only when the connection is authorized. The command uses the existing native Sanity CLI login, never prints the URL, reuses an identical active hook, and refuses to overwrite a differing existing hook.
5. The shared [publication configuration](../shared/cms-publication.ts) handles published `trainer`, `galleryCamp` and `socialPost` create/update/delete events. It excludes native drafts and releases, includes withdrawal/inactive/unapproved transitions, and sends only document ID/type/operation. Do not filter only on currently visible documents: that misses removals.
6. After reviewing the existing approved starter content, publish Pierre's profile with its existing verified wording and no invented portrait/credentials. Set `SANITY_TRAINERS_ENABLED=true` only once the intended profile is published. A CMS-enabled empty collection is intentionally empty; old local profiles never reappear after withdrawal.
7. Keep `SANITY_SOCIAL_ENABLED=false` until real academy accounts and approved posts exist. Registration stays inactive and outside Sanity; the owner confirmed that Google setup is still pending.

## Real acceptance sequence

- Keep unapproved text in a native draft. Confirm anonymous queries cannot read it and the draft does not trigger a website build.
- Publish the verified Pierre content through Studio. Check Sanity's delivery log for the new hook and a successful Vercel deployment for the intended source branch.
- Verify `/verwaltung`, `/trainerpool` and the homepage on that deployment. Check German content, ordering, mobile rendering and absence of draft content.
- Make a representative verified-content change, publish it, and confirm another automatic rebuild. Do not invent another coach to test this.
- Withdraw/unpublish the profile and confirm a successful rebuild removes both profile and homepage teaser. Restore the verified content and confirm it returns. Preserve the original draft until acceptance is complete.
- Test an anonymous mutation against the existing draft as a no-op only; it must be denied. Document role/sign-out/recovery checks independently. Do not revoke the only owner's account as a test, create invitations without authorization, reset credentials automatically, or claim MFA was enabled.
- A delivery acknowledgment is not proof of a successful build. A failed build must retain the prior deployment, and its failure must be visible during acceptance. Never close #1 or #4 merely because a webhook exists.

The editor guide reflects the connected hook and active coach migration. A webhook fetches the committed branch, so local-only website changes need their own deployment before editors can use them on the review website. Social link-card source is now committed; activation remains disabled. A successful webhook response still does not guarantee a successful website build; verify deployment completion and page output after each publication.

Sources: [Vercel deploy hooks](https://vercel.com/docs/deploy-hooks), [Sanity webhooks API](https://www.sanity.io/docs/http-reference/webhooks), [Sanity webhook practices](https://www.sanity.io/docs/content-lake/webhook-best-practices).
