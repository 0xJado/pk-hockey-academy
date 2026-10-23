# PK Hockey Academy

A German, static Astro marketing website with a cinematic homepage, training information, camp gallery and a separate Sanity administrator CMS. The academy's source instructions are preserved verbatim in [`AGENTS.md`](AGENTS.md).

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
npm run test:cms
npm run build
npm run preview
```

Build output is `web/dist`. The app stays fully static and needs no hosting adapter. Vercel is the selected review host; no custom domain is connected.

`npm run test:cms` builds isolated starter, populated-CMS, empty-CMS and malformed-content cases using a test-only fetch transport. It verifies real bundler environment substitution, publication filtering, escaping, ordering, withdrawal behavior, admin linking and absence of read tokens/private fixtures from public output. It uses no real project or token and retains its artifacts under ignored `output/cms-integration-*`; it never changes `web/dist` or deploys anything.

### Vercel review hosting

Project: `driftwoodmedia/pk-hockey-academy`. Connected GitHub source: `0xJado/pk-hockey-academy`, branch `main`.

- Root Directory: `web` (a Vercel project setting, not a `vercel.json` key).
- Framework: Astro; Node.js: 24.x; install: `npm ci`; output: `dist`.
- `web/vercel.json` runs Astro checks, the content tests and the static build before publishing. It preserves extensionless URLs and routes without trailing slashes.
- Keep `PUBLIC_LAUNCH_READY=false` for both Preview and Production environments. Leave `SITE_URL` unset during review so the temporary host is not presented as the academy's canonical domain.
- Keep deployment protection enabled. Use a Vercel shareable link for Pierre when the preview is ready; a plain protected URL can require a Vercel account. Do not put a shareable link's access token in Git.
- `.vercel/` is ignored so local project links and pulled environment files stay out of Git.

Preferred review host: `https://pk-hockey-academy.vercel.app`. A non-expiring shareable link for this shorter project domain was created and verified on 21 October 2026; the full link is provided privately in the diagnostic chat. The original main-branch host, `https://pk-hockey-academy-git-main-driftwoodmedia.vercel.app`, and its non-expiring shareable link remain valid. Both addresses currently serve the same deployment. Anyone holding a full shareable link can view the review; keep its access token out of source files and public GitHub issues. Bare protected URLs can require Vercel access. The requested `pk.vercel.app` address could not be added: Vercel confirmed it is assigned to a project on another team.

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

`/web` contains the static Astro frontend. `/studio` now contains a separate German Sanity CMS for camp photo/video albums, with project-member authentication. Its real project, administrator invitations, read token and deployment still need connecting; see [`studio/README.md`](studio/README.md). There is no visitor authentication, payment provider, shop or booking backend.

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

- The shared header stays at the top while scrolling on every page using CSS sticky positioning. Anchor targets leave space below the header, and the mobile menu scrolls within the remaining viewport height, including landscape screens. This works without JavaScript and adds no animation.

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

The `/medienkit` page is linked from the footer and currently offers only the original transparent academy logo. `web/src/data/media-kit.ts` holds its typed download metadata for a later Sanity migration. Astro optimizes the preview separately; the download preserves the supplied PNG and uses the filename `PK-Hockey-Academy-Logo.png`. No CMS, ZIP or additional media downloads are included.

`TrainingSession`, `Trainer`, `Venue`, `SiteSettings` and `Pricing` are defined in `src/types/content.ts`. Local sessions, settings, venues and prices remain in `src/data/academy.ts`, behind `src/lib/content.ts`. Coaches now use `src/lib/trainer-source.ts`; `src/lib/trainers.ts` fetches and validates approved published profiles. `shared/pierre-profile.ts` preserves the verified local starter content and supplies an optional Studio template; `shared/trainer-profile.ts` shares validation between Studio and the website. Do not import CMS clients into presentation components. `src/lib/gallery-source.ts` fetches approved published albums at build time, while `src/lib/gallery.ts` independently validates the response.

### Coach CMS and administrator access — local implementation

- Studio includes German coach fields for name, role, biography, confirmed background/qualifications, specialties, optional portrait/alt/credit, activity, approval and ordering. Its private **Profilvorschau** shows draft content within Studio; it is not a public preview endpoint. The authenticated **Redaktionshilfe** tool explains editing, publication, withdrawals, roles, sign-out and recovery.
- `SANITY_TRAINERS_ENABLED=false` preserves Pierre's local profile. Set it to `true` only after approved profiles are published in the configured Sanity project. Once enabled, the CMS is authoritative, including an empty collection. Invalid approved content and request failures fail the build; they never republish a local fallback. Drafts, releases, inactive, hidden and unapproved profiles are excluded independently of the GROQ query.
- `/trainerpool` renders ordered profiles, with a clear empty state. The first visible coach supplies the homepage teaser. Uploaded portraits use the same-project Sanity image pipeline; absent portraits use the clearly labeled existing crest. Profile links account for the sticky header. All profile content is server-rendered and escaped; no new visitor JavaScript or assets were added.
- `/verwaltung` stays noindex and links to a validated configured HTTPS Studio address. Blank configuration displays setup pending; malformed configuration fails explicitly. Credentials, uploads and permissions use native Sanity. Optional `SANITY_STUDIO_AUTH_PROVIDER` narrows native login choices; it does not enable MFA or grant rights. The [access runbook](studio/ACCESS.md) covers real-account setup and checks, including plan-dependent roles.
- Studio/website environment settings use explicit property access so their bundlers can substitute the values correctly. Server read tokens stay out of public artifacts. Gallery configuration uses the same corrected boundary.
- No real Sanity project, accounts, MFA, Studio hosting or build webhook has been provisioned. A real authenticated publish/edit/unpublish → rebuild acceptance test remains necessary; neither GitHub issue was closed. See the [adversarial audits and repairs](docs/issues-1-4-audit.md), [editor workflow](studio/README.md), and executed checks in [VALIDATION.md](VALIDATION.md). Work stays local until separately authorized.

The live schedule and separate demo collection are intentionally empty. Published sessions require timezone-aware timestamps, valid duration, non-demo content and non-draft status, and are sorted chronologically. Rendered cards support title, date, start/end, location, group, available spots and status. Unknown capacity stays unknown.

`getRegistrationUrl()` deliberately returns no functional registration URL in this milestone, including for a configured URL: the approved SpielerPlus destination and semantics must be verified before enabling this boundary. No live synchronization is implied. The stable permanent QR destination is **`/trainingstermine`**.

Contact options are visibly disabled, have no form or destination, and never collect or transmit data. No analytics, third-party video embeds or non-essential visitor cookies are configured. Once real albums are connected, gallery media is delivered by Sanity's CDN; document this in the reviewed privacy notice.

### Camp gallery and administrator CMS

- `/galerie`: German album index with an honest empty state until approved albums exist.
- `/galerie/[slug]`: static pages with centered, outlined On-Ice/Off-Ice tabs (and another tab when unassigned camp media exists); five-column square photo tiles, native videos and a keyboard-operable mixed-media viewer. Only the selected section is shown with JavaScript, with arrow-key/Home/End/Space support, visible focus and hash-based restoration. Without JavaScript the same controls are ordinary anchors and both sections stay visible. The overall media count stays above the tabs; section counts and visible video-to-text labels are omitted. Accessible credits and video descriptions remain available. Optional photo spotlights span two columns/two rows strictly on the left (1–2) or right (4–5), never in the middle. Tablets use three columns; phones use one. Each upload has an optional CMS section assignment, with unassigned media preserved. Responsive photos use Sanity's image pipeline; videos load on demand and pause when their section is hidden.
- `src/lib/gallery-layout.ts` shares deterministic edge-only packing between static rendering and browser viewport changes. Thumbnail crops fill tiles; clicking a photo opens the viewer, which shows complete photos and video playback from the selected section in the same visible placement order. Photos, videos and album covers have no corner arrow badges. Inline videos use the same playback controls as the viewer; browser-native controls remain available without JavaScript. The media counter includes photos and videos. Tall translucent arrows sit over the media edges, become clearer on hover/focus, and stay visible on touch devices; there is no lower arrow bar. Escape closes the viewer and restores focus, while arrow keys navigate unless a player control has focus. Videos never autoplay and are paused/unloaded when leaving the item or closing; responsive repacking preserves current playback. CMS media order remains the basis for packing and selecting the album cover.
- `VideoControls.astro` and `src/lib/video-player.ts` provide a small shared player with a blue central play button, a dark gradient control bar, seek/time display, play/pause, sound and fullscreen. Controls have German accessible names, keyboard-operable buttons and a native range input. JavaScript enhances the original HTML video only after binding controls; native controls and a direct video link provide fallbacks. Fullscreen uses the browser API where available, with a feature-detected iOS video fallback. Controls remain visible on touch devices, and their short color transitions follow reduced-motion preferences. The close button uses a centered text/icon row rather than a larger typographic cross.
- `/verwaltung`: always noindex. Links to the authenticated Studio when `PUBLIC_SANITY_STUDIO_URL` is configured; otherwise explains setup is pending. The link grants no permissions.
- `/studio`: separate npm project using Sanity 6, German UI, native uploads, reorderable media, required metadata and explicit publication approval. No React/Studio runtime is shipped to visitors.
- A small, decorative overhead goalkeeper slides beneath the selected tab label. It snaps into place for reduced motion and realigns after viewport/font changes. The repeated section heading is visually hidden once tabs are active; without JavaScript, both headings stay visible and the goalkeeper stays hidden.
- Motion reuses scoped section reveals and reduced-motion support; small photo hover zooms and viewer arrow fades are disabled for reduced motion. Gallery listeners, goalkeeper resize tracking and video observers clean up on navigation. Gallery initialization waits until Astro's synchronous page swap has finished replacing video elements, so player references remain valid after client navigation.
- Gallery photos and videos have no visible caption/credit overlays or shading for text. Descriptions and credits remain available to assistive technology; album media counts sit below the cover. The local placeholder notice appears above the gallery.

Connect the gallery variables in `web/.env.example` only when the real project is ready. The website token is read-only and server-only; keep the dataset private. Changes and unpublishing require a successful website rebuild/deployment. A build webhook is documented but not connected. See [CMS setup and Pierre's editing workflow](studio/README.md) for full steps and the public-asset limitation.

Future commerce should live at `/shop` behind a separate commerce interface, with hosted Shopify guest checkout once approved. There is currently no shop route, checkout, account UI or integration.

### Local gallery samples (never published)

`npm run dev` optionally reads `web/.local-gallery/album.json` and serves files from `web/.local-gallery/media/`. This entire folder is Git-ignored and sits outside `public/`. The loader returns before reading any local data in production; the media endpoint exists only on the development server. `npm run build` and `npm run preview` therefore exclude both the sample album and its media, even when the local folder exists. Keep the dev server bound to `127.0.0.1` as configured.

The local manifest contains `title`, `slug`, `description`, `cover` (a photo ID), and a `media` array. Photos use `type: "image"`, unique `id`, `file`, `alt`, `credit`, `width`, `height`, optional `caption`, `section` (`on-ice`, `off-ice`, `other`) and optional `spotlight` (`left`, `right`). Videos use `type: "video"`, `id`, `file`, `title`, `credit`, `transcript`, optional `caption`/`section`, and a `poster` with the photo fields. Files must have flat lowercase filenames with letters, numbers and hyphens; supported extensions are WebP/PNG/JPEG and MP4/WebM. Local images should be optimized before adding them. Personal filenames, captions, originals and sample metadata belong only in this ignored folder, never in source modules or `public/`.

Preview albums have a visible German placeholder notice, no camp date/location and forced noindex. They supplement any configured published CMS albums without changing CMS publication validation. Change media and the manifest locally; restart the dev server and reload after manifest edits so cached album routes refresh. Rename `album.json` to `album.disabled.json` and restart to hide the local album. No new dependency is needed to serve samples; Node type definitions support the server-side adapter. Real administrator uploads still use the separate Sanity Studio once its project and access are configured.

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
