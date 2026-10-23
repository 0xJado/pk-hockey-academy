# Admin access and acceptance runbook — issue 1

The implementation uses native Sanity authentication and Content Lake grants. It has no shared password, custom login service, public write token or visitor account system. Local code and mock tests cannot provision a real project or prove live account access.

## Setup status

This checkout has no `studio/.env` or `web/.env`, real project/member configuration, deployed Studio URL or build-hook destination. Compilation/fixtures use `cmsqa123/qa` solely as test identifiers. They are not academy configuration. Do not copy these values into a real environment. Neither GitHub issue is ready to close until the live acceptance checks below pass.

## Role assignment

| Person/service | Intended access | Setup decision |
| --- | --- | --- |
| Responsible owner | Administrator | Full project and membership control; keep a separate recovery-capable owner. |
| Trusted content publisher | Editor | Edit/upload/publish, without project administration; available on supported paid plans. |
| Draft author | Contributor | Draft editing without publishing, where the plan supports it. |
| Content reviewer | Viewer | Read-only access; native permissions prevent mutations. |
| Website build | Dedicated Viewer/read-only API token | Build server only; never expose the token in Studio or visitor code. |

Default-role availability depends on the real plan. Do not substitute Administrator for an unavailable narrower editor role without an explicit owner decision. Roles are additive: an extra broad role can undo an intended restriction. Fine-grained custom roles are plan-dependent; no custom role has been created or implied here. A private dataset protects documents from unauthenticated reads; native CDN assets remain URL-public.

Source: [Sanity roles and permissions](https://www.sanity.io/docs/content-lake/roles-concepts), [role administration](https://www.sanity.io/docs/user-guides/roles).

## Invitations and removal

1. The authorized owner selects the academy project in Sanity Manage and checks the dataset is private.
2. Confirm each person's identity, address, intended login method and role. Use individual accounts. Invite only after approval to send that invitation.
3. The person accepts with the exact intended sign-in method. Different methods can create separate accounts even at the same email address. Confirm the accepted account actually holds the intended membership.
4. Verify permitted and denied actions using that account; Studio visibility is not sufficient evidence of backend access.
5. To revoke access, remove the membership (and any other organization/project grants supplying access) in Manage. Test an already-open Studio session and a fresh login: future reads/mutations must be denied. Revocation cannot erase information already downloaded into a browser.
6. If a service token was exposed, revoke/rotate it separately. Removing a human membership is not a substitute for rotating an independent API token.

No invitations or memberships were created, removed or modified during local implementation.

## Sign-in, MFA, sign-out and recovery

- Use `/verwaltung` only as a link to the configured Studio. Credentials are entered with Sanity or its supported identity provider, never on the academy website.
- Blank `SANITY_STUDIO_AUTH_PROVIDER` keeps the native choices. Optionally restrict to `google`, `github` or `sanity` after membership and recovery have been tested with that method. This is not an MFA requirement, a permission grant, or a session-revocation mechanism.
- Enable and test MFA at the selected identity provider; enforce it there when the account/organization supports that policy. The code cannot inspect or enable the provider's MFA. Email/password login must not be described as MFA-protected without verification. Enterprise SAML/SSO is a separate account/plan configuration and was not provisioned.
- Sign out through the native Studio user/profile menu, then close Studio tabs on shared devices. Verify a newly opened Studio requires authentication; the identity provider may retain its own session separately.
- Recover using the original provider's supported process. For Sanity email/password accounts, use the supported password reset. For lost identity access, consult [Sanity account recovery](https://www.sanity.io/docs/help/account-recovery) and the owner. Do not assume a different provider at the same email retains membership. When moving accounts, the owner must intentionally remove the old membership and invite the replacement. Do not remove the last recovery-capable owner.

Sources: [Sanity native authentication and SAML](https://www.sanity.io/docs/studio/custom-auth), [account management](https://www.sanity.io/docs/platform-management/manage-your-account).

## Live acceptance checks (not executed locally)

| Check | Required evidence |
| --- | --- |
| Private dataset | Owner verifies visibility; anonymous API read fails. No unapproved raw assets uploaded. |
| Outsider | Anonymous and authenticated nonmember cannot read private documents, edit, upload or publish. |
| Editor | Intended account can create/update permitted profiles/albums and publish; cannot administer membership/tokens. |
| Contributor/Viewer | Applicable account cannot publish; Viewer cannot edit/upload. Test backend denial, not only disabled controls. |
| Invite / recovery / MFA | Real intended identity accepts membership; recovery and provider MFA succeed without shared credentials. |
| Sign-out | Native sign-out succeeds and a fresh Studio visit requires authentication. |
| Revocation | An already-open session and a fresh login lose access after all relevant grants are removed. |
| CMS publishing | Create a draft; public build omits it. Publish with approval and rebuild; public pages update. Edit and rebuild; new copy appears. Withdraw/unpublish and rebuild; content disappears, including the homepage teaser. |
| Build failure | Revoke read-token access or simulate a configured API failure in staging; build fails, existing deployment is not replaced with an empty fallback. |
| Editor independence | Configure/test the native server-to-server build webhook once. Subsequent publishing, changes and withdrawal update the site after a successful build without developer action. |
| Secrets/CORS | Server-only read token and private build-hook destination; exact Studio origins only, no wildcard credentialed CORS. |

Use only approved academy content during real acceptance. Fixture accounts/documents in automated tests do not establish these checks.
