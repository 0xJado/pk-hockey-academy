# Asset provenance

No NHL/DEL assets, external embeds, remotely loaded media or training footage are used. The supplied academy crest, licensed hero stock photograph, supplied Off-Ice illustration and generated On-Ice illustration are served locally. Illustrative photographs do not document academy training or imply an affiliation.

## Supplied academy branding — 19 October 2026

- Local original: `web/src/assets/brand/pk-hockey-crest.png`.
- Source: **Vollständiges Hockey-Akademie-Wappen.png**, supplied by Pierre through the user's Google Drive file link in this chat. The user explicitly requested replacing the website logo with it.
- Original: 1254 × 1254 RGBA PNG, 1,558,622 bytes. SHA-256: `913EF27652DA16D9940F8872A675174C4F99911ECF8348E074AD225A66FDEC53`.
- The supplied pixels, proportions and transparency are preserved. Astro generates resized local WebP versions for the header, footer and trainer-profile graphic, a 64px PNG favicon, and a 512px social-image rendition when a real site origin is configured. No redrawing or AI alteration of the crest was performed.
- Artwork ownership and any third-party designer's license have not been independently established; usage is based on the user's supplied business asset and explicit website instruction. No broader license claim is made.
- Brand direction: **PK_Hockey_Academy_Flyer_Trainingsprogramm.pptx**, also supplied by Pierre through the user's Drive link. The one-slide PPTX contains one flattened 1024 × 1536 raster. It was inspected locally as a design reference; the full flyer is not published with the website.
- The redesign takes the flyer's ice-white/navy/cobalt palette, condensed typography, “Skills. Mindset. Zukunft.” heading and training-band hierarchy as general visual direction. The flyer is not copied as a webpage screenshot. Its embedded portrait, credentials, contact details, QR destination and registration language have not been imported as independently verified website content.
- A standalone trainer portrait is still needed before replacing the clearly described crest graphic in the trainer profile. The registration PDF is outside this task and is not imported or linked.

## Hero photograph

- Local source: `web/src/assets/hero-hockey-photo.jpg`.
- Photographer: **Ron Lach**.
- Source: [A Person Wearing Black Helmet with Cage — Pexels photo 8974646](https://www.pexels.com/photo/a-person-wearing-black-helmet-with-cage-8974646/).
- Downloaded 17 October 2026 from `https://images.pexels.com/photos/8974646/pexels-photo-8974646.jpeg?auto=compress&cs=tinysrgb&w=2400`.
- [Pexels License](https://www.pexels.com/license/), checked on the download date: permits website use and modification; attribution is optional. No endorsement by the depicted person or brands is claimed.
- Displayed with a visible German `Symbolbild` label and photographer credit. This is stock imagery, not a trainer portrait or a real academy participant claim.
- Astro `Image` emits local responsive WebP assets; CSS applies a cold, partially desaturated treatment and responsive cropping. No runtime Pexels request is made.

## Off-Ice running image — 19 October 2026

- Local asset: `web/src/assets/off-ice-running.png`.
- Source: the image of children running supplied by the user in this conversation for the Off-Ice training card. Usage is based on that explicit instruction; no independent ownership or participant affiliation is claimed.
- Image Gen applied cool blue grading and a navy edge vignette to the supplied image. It remains an illustrative `Symbolbild`, not evidence of an academy session.
- Astro generates responsive, locally served WebP renditions. Shared CSS adds a subtle navy edge vignette. The diagonal CSS corner cut and visible image caption were removed on 20 October 2026 at the user's request; the source image is unchanged. Descriptive alt text identifies this as a `Symbolbild`. No runtime external image requests.

## On-Ice practice image — 20 October 2026

- Local original: `web/src/assets/on-ice-practice.png`.
- Generated specifically for this project with the built-in `image_gen` tool at the user's explicit request. This is fictional illustrative media, not a photograph of academy participants, Pierre or a verified venue. No third-party team imagery or supplied personal photographs were used as generation inputs. No independent license or exclusivity claim is made.
- Depicts fully equipped youth players practicing puck control in a generic indoor rink. No academy, sponsor or team marks were requested. The visible caption was removed at the user's request for this placeholder preview; descriptive alt text still identifies it as a `KI-generiertes Symbolbild`.
- The source is preserved locally. Astro produces responsive WebP renditions; the shared rectangular 16:9 frame keeps the image corners intact and uses a subtle navy edge vignette. No image-generation API or external image request runs in the website.
- Full final generation prompt: [`web/src/assets/on-ice-practice.prompt.txt`](web/src/assets/on-ice-practice.prompt.txt). Real approved training photography can replace this illustration later.

## Original local illustrations

Created specifically for this repository as editable SVG artwork:

| File | Purpose | Provenance |
| --- | --- | --- |
| `web/public/images/hero-hockey.svg` | Retained original geometric hero, no longer displayed | Original code-authored illustration; no academy player or real arena depicted |
| `web/public/images/blade.svg` | Editorial skate/ice illustration | Original code-authored illustration |
| `web/public/images/trainer-placeholder.svg` | Retained unused early trainer graphic | Original code-authored graphic; no longer displayed |
| `web/public/images/rink.svg` | Abstract arena, location visual | Original code-authored illustration; not an actual training venue |
| `web/public/images/social.svg` | Retained early social artwork | Original code-authored graphic; no longer referenced by metadata |
| `web/public/images/social.png` | Retained early social raster | Rasterized locally from `social.svg`; no longer referenced |
| `web/public/favicon.svg` | Retained early favicon | Original code-authored mark; no longer referenced |

The illustrations remain clearly identified project placeholders. The supplied crest is now the displayed academy branding; real training and venue photography remain pending. Preserve descriptive alternatives and image dimensions. A future hero video must retain the local poster and respect reduced motion.

## Self-hosted fonts

- Barlow Condensed: `@fontsource/barlow-condensed` (OFL-1.1).
- Inter: `@fontsource/inter` (OFL-1.1).

Font CSS and WOFF2 files are bundled locally through npm/Vite. No Google Fonts requests. Font package licenses are retained in their installed packages; copies are included in `web/licenses/` for distribution. See `web/package-lock.json` for exact package versions and integrity hashes.

GSAP is a runtime dependency, under its own Standard License (see the installed `gsap` package). No redistribution claim is made for third-party packages. Third-party libraries retain their respective licenses.
