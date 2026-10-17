# Asset provenance

No NHL/DEL assets, external embeds, remotely loaded media or training footage are used. The hero uses one locally stored, licensed stock photograph; it does not depict academy training or imply an affiliation.

## Hero photograph

- Local source: `web/src/assets/hero-hockey-photo.jpg`.
- Photographer: **Ron Lach**.
- Source: [A Person Wearing Black Helmet with Cage — Pexels photo 8974646](https://www.pexels.com/photo/a-person-wearing-black-helmet-with-cage-8974646/).
- Downloaded 17 October 2026 from `https://images.pexels.com/photos/8974646/pexels-photo-8974646.jpeg?auto=compress&cs=tinysrgb&w=2400`.
- [Pexels License](https://www.pexels.com/license/), checked on the download date: permits website use and modification; attribution is optional. No endorsement by the depicted person or brands is claimed.
- Displayed with a visible German `Symbolbild` label and photographer credit. This is stock imagery, not a trainer portrait or a real academy participant claim.
- Astro `Image` emits local responsive WebP assets; CSS applies a monochrome blue treatment and responsive cropping. No runtime Pexels request is made.

## Original local illustrations

Created specifically for this repository as editable SVG artwork:

| File | Purpose | Provenance |
| --- | --- | --- |
| `web/public/images/hero-hockey.svg` | Retained original geometric hero, no longer displayed | Original code-authored illustration; no academy player or real arena depicted |
| `web/public/images/blade.svg` | Editorial skate/ice illustration | Original code-authored illustration |
| `web/public/images/trainer-placeholder.svg` | PK monogram in place of a portrait | Original code-authored graphic; explicitly not a portrait of Pierre |
| `web/public/images/rink.svg` | Abstract arena, location visual | Original code-authored illustration; not an actual training venue |
| `web/public/images/social.svg` | Social metadata source artwork | Original code-authored graphic |
| `web/public/images/social.png` | Compatible social preview image | Rasterized locally from `social.svg` |
| `web/public/favicon.svg` | Temporary PK favicon | Original code-authored mark |
| `web/src/components/Wordmark.astro` | Temporary wordmark | Original code-authored mark; final academy branding pending |

These are project placeholder assets, not approved final academy branding. Replace with approved academy photography and logo when available. Preserve descriptive alternatives and image dimensions. A future hero video must retain the local poster and respect reduced motion.

## Self-hosted fonts

- Barlow Condensed: `@fontsource/barlow-condensed` (OFL-1.1).
- Inter: `@fontsource/inter` (OFL-1.1).

Font CSS and WOFF2 files are bundled locally through npm/Vite. No Google Fonts requests. Font package licenses are retained in their installed packages; copies are included in `web/licenses/` for distribution. See `web/package-lock.json` for exact package versions and integrity hashes.

GSAP is a runtime dependency, under its own Standard License (see the installed `gsap` package). No redistribution claim is made for third-party packages. Third-party libraries retain their respective licenses.
