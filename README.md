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

Build output is `web/dist`. No hosting provider or adapter is required. No website was deployed and no domain was connected.

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

- Charcoal/navy/electric-blue palette, condensed Barlow headlines and Inter body copy, self-hosted fonts.
- Licensed Ron Lach/Pexels hockey portrait with a monochrome blue treatment and a visible `Symbolbild` credit; original skate and rink illustrations. All media is served locally, and no trainer photograph is fabricated. Provenance in [`ASSETS.md`](ASSETS.md).
- Short diagonal hero reveal, staggered headline and CTA entrance.
- Conservative desktop hero parallax, scoped two-phase training reveals and drawn rink lines.
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

1. Approved logo, licensed academy/player media, trainer photograph and any training footage.
2. Full biography, verified qualifications and concrete coaching specialties.
3. Confirmed training dates, start/end times, age groups, hall names, addresses, capacity/status.
4. Verified per-session SpielerPlus link format and desired registration behavior.
5. Real business contact details, WhatsApp destination and approved form delivery/privacy handling.
6. Package conditions, payment and cancellation information; do not infer these from the supplied prices.
7. Complete provider details, privacy/hosting information and legal review.
8. Hosting/domain choice and explicit permission to publish.

## Validation

See [`VALIDATION.md`](VALIDATION.md) for commands actually executed, viewport screenshots, navigation/motion evidence and remaining limitations. Browser artifacts are intentionally ignored under `output/playwright/`.

## GitHub

Requested destination: public `0xJado/pk-hockey-academy`. This source repository does not enable GitHub Pages or any automatic website deployment. Git history must preserve the original `AGENTS.md` and must never include `.env`, dependencies, build output or local test artifacts.
