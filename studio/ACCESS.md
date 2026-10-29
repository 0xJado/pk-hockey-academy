# Admin access and acceptance runbook — issue 1

The implementation uses native Sanity authentication and Content Lake grants. It has no shared password, custom login service, public write token or visitor account system. Local code and mock tests cannot provision a real project or prove live account access.

## Setup status

The user created the academy account/project using Pierre's new academy email on 25 October 2026. Ignored `studio/.env` and `web/.env` now contain the real project/public `production` dataset configuration. Native CLI and browser email/password sign-in, authenticated project access, actual dataset visibility, schema deployment and creation/readback of Pierre's hidden draft are verified. The draft is excluded from anonymous queries. The deployed Studio is **https://pk-hockey-academy.sanity.studio/**. The authenticated editor shows Pierre's profile fields and private preview; the user subsequently approved publishing the verified starter content. The empty camp-album collection and German editorial guide load; the guide reports Administrator for the current academy account. Real native Studio publish/edit/unpublish/restore acceptance passed, with four successful protected deployments and profile/homepage verification. The local website's admin link uses this real URL. Vercel has the public CMS identifiers/admin URL and trainer migration enabled. The connected build hook delivered all four publication events successfully; editing the draft alone produced no delivery. Tests still use `cmsqa123/qa` only as synthetic identifiers. Neither issue is ready to close until the remaining live checks below pass.

The project already permits **http://localhost:3333** with credentials. A proposed additional `http://127.0.0.1:3333` CORS origin was rejected by automatic approval review because the persistent access change lacked specific authorization; it was not added or retried. Use the existing localhost origin for local Studio access. No additional CORS grant is required for this workflow.

## Role assignment

Direction, 25 October 2026: Pierre should control the academy project. Use Sanity Free with a public dataset holding public website content; player registrations remain in the separately planned private Google Sheet. One Pierre-owned account is sufficient; a separate developer account is optional. The real account/project and CLI session are now available. Follow [OWNER-SETUP.md](OWNER-SETUP.md) for the owner handoff. No invitation or elevated grant is authorized by this documentation alone.

| Person/service | Intended access | Setup decision |
| --- | --- | --- |
| Pierre / responsible owner and publisher | Administrator | Retain project, membership and any organization/billing control. Verify his account recovery. |
| User / technical developer (optional account) | Explicitly owner-approved Administrator on Free | Independent configuration requires broad project access. Otherwise perform setup using Pierre's authorized session. Code work needs no Sanity account. |
| Additional content publisher (optional) | Explicitly owner-approved Administrator on Free; Editor only on a supporting paid plan | Free has no restricted publishing role. Do not grant broad administration automatically. |
| Draft author (future paid-plan option) | Contributor | Draft editing without publishing, only where the plan supports it. |
| Content reviewer | Viewer | Read-only access; native permissions prevent mutations. |
| Website build | Anonymous read of published content | No read token needed. Optional private-dataset compatibility retains a server-only Viewer token if intentionally configured later. |

Free provides Administrator and Viewer human roles and currently supports up to 20 accounts. More than one account does not itself require a subscription. Do not substitute Administrator for an unavailable narrower editor role without an explicit owner decision. Roles are additive: an extra broad role can undo an intended restriction. Fine-grained custom roles are plan-dependent; no custom role has been created or implied here.

Published records in the public dataset are anonymously readable, including published hidden/inactive/unapproved records that the website filters out. Those flags are editorial controls, not access permissions. Native drafts/releases require authentication, and edits/uploads/publishing require write grants. All uploaded dataset assets remain URL-public even in drafts. Store only public-release material here; no registration records, health data, private notes or consent documents. No subscription or billing configuration is needed or has been created.

Source: [Sanity roles and permissions](https://www.sanity.io/docs/content-lake/roles-concepts), [role administration](https://www.sanity.io/docs/user-guides/roles), [Free plan](https://www.sanity.io/pricing), [drafts and versions](https://www.sanity.io/docs/content-lake/drafts-and-versions).

## Invitations and removal

1. The authorized owner selects the academy project in Sanity Manage and verifies Free/public dataset configuration and public-only content. Invitations are optional for the single-owner setup.
2. Confirm each person's identity, address, intended login method and role. Use individual accounts. Invite only after approval to send that invitation.
3. The person accepts with the exact intended sign-in method. Different methods can create separate accounts even at the same email address. Confirm the accepted account actually holds the intended membership.
4. Verify permitted and denied actions using that account; Studio visibility is not sufficient evidence of backend access.
5. To revoke access, remove the membership (and any other organization/project grants supplying access) in Manage. Test an already-open Studio session and a fresh login: future draft reads and privileged mutations must be denied. Published records remain publicly readable. Revocation cannot erase information already downloaded into a browser.
6. If a service token was exposed, revoke/rotate it separately. Removing a human membership is not a substitute for rotating an independent API token.

No invitations or memberships were created, removed or modified during local implementation.

## Sign-in, MFA, sign-out and recovery

- Use `/verwaltung` only as a link to the configured Studio. Credentials are entered with Sanity or its supported identity provider, never on the academy website.
- Blank `SANITY_STUDIO_AUTH_PROVIDER` keeps the native choices. Optionally restrict to `google`, `github` or `sanity` after membership and recovery have been tested with that method. This is not an MFA requirement, a permission grant, or a session-revocation mechanism.
- Enable and test MFA at the selected identity provider; enforce it there when the account/organization supports that policy. The code cannot inspect or enable the provider's MFA. Email/password login must not be described as MFA-protected without verification. Enterprise SAML/SSO is a separate account/plan configuration and was not provisioned.
- Sign out through the native Studio user/profile menu, then close Studio tabs on shared devices. Verify a newly opened Studio requires authentication; the identity provider may retain its own session separately.
- Recover using the original provider's supported process. For Sanity email/password accounts, use the supported password reset. For lost identity access, consult [Sanity account recovery](https://www.sanity.io/docs/help/account-recovery) and the owner. Do not assume a different provider at the same email retains membership. When moving accounts, the owner must intentionally remove the old membership and invite the replacement. Do not remove the last recovery-capable owner.

Sources: [Sanity native authentication and SAML](https://www.sanity.io/docs/studio/custom-auth), [account management](https://www.sanity.io/docs/platform-management/manage-your-account).

## Live acceptance checklist

| Check | Required evidence |
| --- | --- |
| Free/public dataset | Owner verifies plan/visibility. Anonymous queries may read published records, including website-withheld records, but cannot read native drafts/releases. No registrations, private notes or unapproved raw assets uploaded. |
| Outsider | Anonymous and authenticated nonmember cannot read native drafts/releases, edit, upload or publish. Published website content is deliberately readable. |
| Owner publishing | Pierre can create/update profiles/albums and publish without developer assistance. His Administrator role also permits project administration; do not claim an editor restriction. |
| Optional additional roles | If a Viewer is added, verify reads and denial of edit/upload/publish against the backend. Only test Editor/Contributor restrictions if a supporting plan and those roles are actually configured. |
| Invite / recovery / MFA | Real intended identity accepts membership; recovery and provider MFA succeed without shared credentials. |
| Sign-out | Native sign-out succeeds and a fresh Studio visit requires authentication. |
| Revocation | An already-open session and a fresh login lose draft/edit/upload/publish access after all relevant grants are removed. Published records remain readable. |
| CMS publishing | Create a draft; public build omits it. Publish with approval and rebuild; public pages update. Edit and rebuild; new copy appears. Withdraw/unpublish and rebuild; content disappears, including the homepage teaser. |
| Build failure | Simulate a configured API failure in staging; build fails, existing deployment is not replaced with an empty fallback. If private-dataset compatibility is ever configured, also test read-token failure. |
| Editor independence | Configure/test the native server-to-server build webhook once. Subsequent publishing, changes and withdrawal update the site after a successful build without developer action. |
| Secrets/CORS | Public reads omit authorization. Build-hook destination and any optional service tokens stay server-only; exact Studio origins only, no wildcard credentialed CORS. |

Executed: native owner sign-in, role display, anonymous draft exclusion and denied no-op mutation, native coach publish/edit/unpublish/restore, successful hook delivery/deployment, and profile/homepage rendering. Invitations, revocation, recovery, MFA, other-member roles and authentic media uploads remain unverified; do not revoke the only owner as a test.

Use only approved academy content during real acceptance. Fixture accounts/documents in automated tests do not establish these checks.
