# Trainer Visual Editing

Pierre can edit trainer profiles in the website layout through Sanity's **Website bearbeiten** tool. The first release covers trainer profiles only. Gallery, curated social cards and other website content retain their existing editing workflows. Sessions, prices and venues have not been migrated.

## Editor workflow

1. Open the academy Studio and sign in using the existing authorized account.
2. Choose **Website bearbeiten**. Open an existing profile through its website-location badge, or use the full trainer preview.
3. Click a name, role, biography, background list or photo to open its field in the Studio. Changes refresh the preview; the preview can show withheld and unapproved drafts.
4. Use **Trainer hinzufügen** to open Sanity's native creation form. A new profile starts withheld and unapproved. Complete the required profile fields, then open its website-location badge. An incomplete profile shows an explanatory placeholder until the shared website validator can render it.
5. Confirm the facts and image rights, choose the intended activity and website approval settings, and publish. The existing publication webhook updates the static public website after a successful build. Previewing and saving a draft do not publish it.
6. **Vorschau beenden** removes the preview session in that browser context. It does not sign the editor out of Sanity; use Sanity's profile menu for that.

The optional navigator in Presentation also provides a native **Trainer hinzufügen** link. The Studio's existing **Inhalte** tool and private **Profilvorschau** remain available.

## Runtime and security

- Public routes remain prerendered and use the existing strict published-only adapter. No overlays, source attributes, draft content or preview credential are included in public HTML.
- `/redaktion/trainerpool` is rendered on demand. It reads drafts only after `/api/preview/enable` validates a native Sanity preview secret.
- The server issues an HMAC-signed one-hour session in an HttpOnly, Secure, SameSite=None, Partitioned cookie scoped to `/redaktion`. Expired, forged and missing sessions receive HTTP 401 before any draft query.
- Editor responses use `private, no-store`, noindex headers, a no-referrer policy, and frame-ancestor restrictions. Only the dedicated preview path and a safe document ID/perspective survive preview redirects.
- The private preview permits the configured Studio origin and `https://www.sanity.io`, because hosted Studio is itself nested inside Sanity Dashboard. Every iframe ancestor must match CSP. Local Studio framing at `http://localhost:3333` is allowed only in development; no Studio configuration defaults to self-only framing. This does not grant a preview session or draft access.
- `SANITY_PREVIEW_READ_TOKEN` is a dedicated **Viewer** robot token for this project. It is server-only and never prefixed `PUBLIC_` or `SANITY_STUDIO_`. Local preview retains its existing credential in ignored `web/.env`. Hosted preview has a separate annual token, stored as a production-only Secret on `driftwoodmedia/pk-hockey-academy` in Vercel after explicit owner approval. No additional human account or write permission was created. Viewer can read drafts throughout the project; the application's trainer-only query does not narrow the token's underlying permissions. Rotating/revoking the server credential removes preview access. Published public reads remain tokenless.
- The shared trainer renderer uses explicit Sanity data attributes. It does not alter the public validator or inject stega characters into content. The preview client has bounded requests and bypasses the CDN.
- Visual Editing is loaded only in the private preview. Native page loads keep the Studio frame and its history in sync; back/forward restores the overlay runtime. Perspective changes switch between published and draft queries. An explicit refresh callback reloads the server-rendered page when Sanity sends a content-change or manual-refresh message; overlays alone do not refetch server content in the pinned SDK.
- Third-party frames/cookies can be restricted by a browser. Open the preview directly from Studio if needed; do not disable browser security globally. Vercel Deployment Protection stays enabled. Its login/bypass challenge is separate from Sanity draft authorization.
- The public static files are in `web/dist/client`. Hosting only these files preserves the public website but cannot provide private Visual Editing. Full preview hosting needs the Node runtime or Vercel functions; no visitor authentication/database was added.

## Configuration and activation

Website server/build environment:

```dotenv
SANITY_PROJECT_ID=<existing academy project>
SANITY_DATASET=production
SANITY_PREVIEW_READ_TOKEN=<dedicated Viewer credential>
PUBLIC_SANITY_STUDIO_URL=https://pk-hockey-academy.sanity.studio
```

Studio build environment:

```dotenv
SANITY_STUDIO_PREVIEW_URL=<website HTTPS origin>
```

Blank `SANITY_STUDIO_PREVIEW_URL` hides Presentation until a working preview origin is configured. Local Studio development may use `http://localhost:4321` (adjust to the actual free port). Use `localhost:3333` for Studio because that credential-enabled CORS origin was already configured. Draft queries run on the website server; this implementation does not add a public browser read token or wildcard CORS.

Presentation's `initial` URL must include the website origin, for example `http://localhost:4322/redaktion/trainerpool`. A relative initial URL loads Studio into itself. `getTrainerPreviewOptions()` constructs the absolute URL and keeps its enable endpoint on the same website origin. Overlay metadata uses `getStudioEditBaseUrl()` to remove the trailing slash accepted by ordinary Studio links but rejected by Sanity's edit URL builder. Both cases have regression coverage.

1. Configure the server credential on the existing protected Vercel project in the intended deployment environments. Transfer it through stdin/protected environment tooling; never paste it into chat, shell arguments or Git.
2. Build/deploy the website with the Vercel adapter (`VERCEL=1`, supplied by Vercel). The project still prerenders public routes. Locally, the Node adapter preserves `npm run build` and `npm run preview`.
3. Set Studio's preview origin to the stable protected website host and deploy the existing Studio application using its configured app ID.
4. Sign in to the protected review host as needed. Open **Website bearbeiten** in Studio; confirm the iframe connects, clicking a field opens it, an unpublished edit refreshes, and a new withheld trainer can be created and previewed without publishing.
5. Verify a fresh anonymous request to `/redaktion/trainerpool` returns 401. Keep `PUBLIC_LAUNCH_READY=false` until the academy launch is separately approved.

At implementation time, the native Sanity preview secret → signed cookie → real CMS draft render was verified locally. Browser checks covered 1440/768/375 widths, focus, reduced motion, repeated back/forward navigation, no-JavaScript content and anonymous denial. Native signed-in Studio click/creation acceptance and hosted activation must be recorded separately; they must not be inferred from the type/build checks.

Credential setup, 30 October 2026: Sanity readback verified the separate hosted robot's sole project membership and Viewer role, its one-year expiration, and a successful authenticated trainer preview query. After explicit transfer approval, Vercel metadata confirmed `SANITY_PREVIEW_READ_TOKEN` as `sensitive` (Secret), scoped only to production. The temporary credential staging file was removed; the existing local token was retained. Deployment Protection remains enabled. Website deployment `dpl_C6oREFB19u6Z6fGbg2jExvfrR9af` reached READY, and the existing Studio/schema were deployed with the protected website origin. Native browser acceptance connected the nested preview and opened the role field by clicking it on the website. A saved equivalent draft exposed a missing refresh callback in the pinned overlay SDK; the explicit server-page reload fix passed website checks/build and awaits hosted refresh verification.

## Annual token renewal

The hosted token expires at **2027-10-30 17:50:02 UTC** (`2027-10-30T17:50:02.232Z`). This is a fixed one-year lifetime, not automatic annual renewal. Renew before that date; an expired token cannot be reactivated. Expiration interrupts private draft preview, while the public static website continues using tokenless published reads.

1. Create a replacement project robot with only the Viewer role and an expiration one year from issuance. Do not reuse the local preview token or grant editor/administrator permissions.
2. Securely replace the production-only Vercel Secret, without putting its value in source, browser code, URLs, logs or shell arguments.
3. Redeploy the website, reopen the Studio preview to obtain a fresh session, and verify authenticated draft rendering plus anonymous denial. Old preview cookies are signed with the old credential and must be replaced.
4. After confirming the replacement deployment, revoke the previous hosted robot. If compromise is suspected, revoke immediately and then restore preview using a new token.

Only the renewal date and procedure are recorded in Git. No scheduled reminder or automatic token rotation has been configured.

## Implementation files

Implementation files: `studio/sanity.config.ts`, `studio/lib/presentation.ts` and `studio/components/TrainerNavigator.tsx` configure the editor. `web/src/pages/redaktion/`, `web/src/pages/api/preview/enable.ts`, `web/src/lib/preview-auth.ts` and `web/src/lib/trainer-preview-source.ts` provide authenticated drafts. `TrainerCard.astro` and `Base.astro` share the website layout and map fields. Adapter/dependency configuration, environment examples, editorial help, focused tests and validation notes are updated alongside them. The existing visual style and motion system are reused; this feature adds no new public animation sequence.

## Official references

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Sanity Astro Visual Editing](https://www.sanity.io/docs/astro/astro-visual-editing)
- [Overlays and click-to-edit](https://www.sanity.io/docs/visual-editing/visual-editing-overlays)
- [Presentation configuration](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool)
- [Sanity authentication and robot tokens](https://www.sanity.io/docs/content-lake/http-auth)
- [CSP checks every iframe ancestor](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
