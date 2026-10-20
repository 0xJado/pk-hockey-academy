# PK Hockey Academy

First milestone: a German, static Astro marketing website with a cinematic homepage, nine internal content routes and a custom 404. The academy's source instructions are preserved verbatim in [`AGENTS.md`](AGENTS.md).

## Run locally

Requires Node.js **22.22+** (Node 24 LTS recommended) and npm 9.6.5+. From this repository:

```powershell
cd web
npm ci
npm run dev
```

Open the URL printed by Astro, normally `http://127.0.0.1:4321`.

```powershell
npm run check
npm test
npm run build
npm run preview
```

Build output is `web/dist`. The app stays fully static and needs no hosting adapter. Vercel is the selected review host; no custom domain is connected.

### Vercel review hosting

Project: `driftwoodmedia/pk-hockey-academy`. Connected GitHub source: `0xJado/pk-hockey-academy`, branch `main`.

- Root Directory: `web` (a Vercel project setting, not a `vercel.json` key).
- Framework: Astro; Node.js: 24.x; install: `npm ci`; output: `dist`.
- `web/vercel.json` runs Astro checks, the content tests and the static build before publishing. It preserves extensionless URLs and routes without trailing slashes.
- Keep `PUBLIC_LAUNCH_READY=false` for both Preview and Production environments. Leave `SITE_URL` unset during review so the temporary host is not presented as the academy's canonical domain.
- Keep deployment protection enabled. Use a Vercel shareable link for Pierre when the preview is ready; a plain protected URL can require a Vercel account. Do not put a shareable link's access token in Git.
- `.vercel/` is ignored so local project links and pulled environment files stay out of Git.

Review host: `https://pk-hockey-academy-git-main-driftwoodmedia.vercel.app`. The authenticated shareable link is provided privately in the setup chat. It has no expiry and is scoped to this branch alias; anyone holding the full link can view the review. Keep its token out of source files and public GitHub issues. The bare URL still requires Vercel access.

Setup status (18 October 2026): the existing project is connected to `0xJado/pk-hockey-academy`, confirmed in both Vercel's Git settings and the authenticated connector. Pushing setup commit `fd44099` automatically triggered deployment `dpl_g3o37kfb5A9fJnwvgxX9BNcuKuhp`, which reached READY after checks, tests and the static build. The existing branch shareable link followed the new deployment without changing its access token. See `VALIDATION.md` for executed checks.

The account mismatch was resolved by replacing the `adorajado` GitHub sign-in connection with `0xJado` in the existing Vercel account's Authentication settings, with explicit user approval. The academy project was then connected through `https://vercel.com/driftwoodmedia/pk-hockey-academy/settings/git`. Google and email remained listed as sign-in methods. No new Vercel account or project was created, and the repository was not moved.

Pushes to `main` trigger the default deployment and other branches receive previews. Local edits only reach Vercel after a push or an explicit deployment. The same build command and root settings are also configured on the Vercel project. These review deployments use Vercel's Production target for the main branch while retaining protection, disabled booking/contact controls and incomplete legal notices; this is not approval for the public academy launch.

### This Codex Windows environment

The desktop environment provided Node but did not initially expose npm. A temporary npm copy was downloaded into the **ignored** `.tools/package` directory. Until npm is on your PATH, the equivalent command from `/web` is:

```powershell
node ..\.tools\package\bin\npm-cli.js run dev
```

This local tooling is not part of the GitHub repository. A normal Node installation includes npm; contributors should use the standard commands above.

## Architecture

`/web` contains the frontend so a future `/studio` can remain separate. There is **no CMS, database, authentication, payment provider, shop or booking backend** in this milestone.

```text
web/
  public/images/          original local SVG illustrations and social image
  src/
    assets/              locally stored licensed hero photo, optimized with Astro Image
    components/          shared header, footer, buttons, schedule and content sections
    layouts/Base.astro   German document, metadata, ClientRouter, global shell
    pages/               homepage, typed static content routes, robots and sitemap
    data/                typed editable local academy content
    types/               CMS-independent content interfaces
    lib/content.ts       query/registration boundary
    lib/motion/          scoped GSAP and navigation lifecycle
    styles/              Tailwind v4 and responsive design system
  tests/                 content safety/chronological ordering checks
```

The dynamic `[page].astro` file generates the nine fixed, static internal routes from `src/data/pages.ts`. It does not expose arbitrary content slugs. Main homepage components are reused on appropriate internal pages.

## Design and motion

- Matching On-Ice and Off-Ice training cards use intact rectangular 16:9 images, a subtle navy edge vignette, aligned copy and tags, and accessible phase headings. The existing user-supplied running image is retained; the On-Ice practice illustration was generated with the built-in Image Gen tool. Per the user's preview preference, both images have no visible caption; their illustrative status remains in descriptive alt text and asset documentation. Responsive WebP renditions are served locally by Astro. See [`ASSETS.md`](ASSETS.md) for provenance and the generation prompt.

- Pierre's supplied transparent academy crest is used in the header, footer, trainer-profile graphic, favicon and configured social metadata. The original PNG is preserved, with optimized renditions generated by Astro.
- The supplied training flyer is the approved general branding direction: ice-white surfaces, deep navy headings, cobalt accents, condensed Barlow display type, a split photographic hero and strong training bands. The homepage uses “Skills. Mindset. Zukunft.”; the shared shell and internal page headers carry the same system. Inter remains the readable body face, with both fonts self-hosted.
- Licensed Ron Lach/Pexels hockey photograph with a visible `Symbolbild` credit; original skate and rink illustrations remain clearly labeled. All displayed media is served locally. The flyer is a flattened image and is not published as a page or used to invent a standalone trainer portrait. Provenance in [`ASSETS.md`](ASSETS.md).
- Short diagonal hero reveal, staggered headline and CTA entrance.
- Conservative upward desktop hero parallax with image coverage maintained, scoped two-phase training-card reveals and a scroll-driven handover of panel accents in the flyer palette.
- Venue/image masks, trainer zoom/color and always-visible informational overlay.
- Directional button fills and arrow movement; keyboard-visible focus.
- Astro ClientRouter crossfade. GSAP initializes on `astro:page-load`, reverts before swaps, uses `gsap.context()` and `gsap.matchMedia()`, and aborts page event listeners.
- Reduced-motion mode removes reveal/parallax animations and CSS transitions. Mobile uses normal document flow with lighter reveals. No scroll hijacking or pinning.
- All content is visible in server HTML before JavaScript; the native `<details>` mobile menu works without JS. Escape closes it and restores focus when JS is available.

## Content and future integrations

`TrainingSession`, `Trainer`, `Venue`, `SiteSettings` and `Pricing` are defined in `src/types/content.ts`. Edit local data in `src/data/academy.ts`; later replace the retrieval boundary in `src/lib/content.ts` with Sanity queries. Do not import CMS clients into presentation components.

The live schedule and separate demo collection are intentionally empty. Published sessions require timezone-aware timestamps, valid duration, non-demo content and non-draft status, and are sorted chronologically. Rendered cards support title, date, start/end, location, group, available spots and status. Unknown capacity stays unknown.

`getRegistrationUrl()` deliberately returns no functional registration URL in this milestone, including for a configured URL: the approved SpielerPlus destination and semantics must be verified before enabling this boundary. No live synchronization is implied. The stable permanent QR destination is **`/trainingstermine`**.

Contact options are visibly disabled, have no form or destination, and never collect or transmit data. No analytics, third-party embeds or non-essential cookies are configured.

Future commerce should live at `/shop` behind a separate commerce interface, with hosted Shopify guest checkout once approved. There is currently no shop route, checkout, account UI or integration.

## SEO and launch gates

Every page has one H1, a unique German title and description, social metadata and semantic HTML. The generated static site defaults to **noindex/nofollow** and robots **Disallow: /**. The sitemap remains empty until launch is explicitly enabled.

Copy `web/.env.example` to `web/.env` only when needed:

- `SITE_URL`: real HTTPS origin. Optional for previews; without it no canonical or absolute social URL is emitted. Invalid origins fail the build.
- `PUBLIC_LAUNCH_READY`: keep `false` until launch is approved and real content/legal information is complete. It enables indexing/sitemap only together with a configured site origin.

These environment flags do not constitute launch approval or legal review. Impressum and privacy routes visibly state they are incomplete internal drafts.

## Required from Pierre before launch

1. A standalone approved trainer photograph, licensed academy/player media and any training footage. The supplied crest is already integrated. The registration form is explicitly deferred to a later task.
2. Full biography, verified qualifications and concrete coaching specialties.
3. Confirmed training dates, start/end times, age groups, hall names, addresses, capacity/status.
4. Verified per-session SpielerPlus link format and desired registration behavior.
5. Real business contact details, WhatsApp destination and approved form delivery/privacy handling.
6. Package conditions, payment and cancellation information; do not infer these from the supplied prices.
7. Complete provider details, privacy/hosting information and legal review.
8. Final public domain and explicit approval for the public academy launch. Vercel review hosting has been requested separately.

## Validation

See [`VALIDATION.md`](VALIDATION.md) for commands actually executed, viewport screenshots, navigation/motion evidence and remaining limitations. The flyer comparison and final design review are recorded in [`design-qa.md`](design-qa.md). Browser artifacts are intentionally ignored under `output/playwright/` and `output/design/`.

## GitHub

Source: public `0xJado/pk-hockey-academy`. Vercel review hosting is configured separately as described above; GitHub Pages is not used. Git history must preserve the original `AGENTS.md` and must never include `.env`, dependencies, build output or local test artifacts.
