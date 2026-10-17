# Asset provenance

No NHL/DEL assets, external embeds, remotely loaded media, stock photography or training footage are used.

## Original local illustrations

Created specifically for this repository as editable SVG artwork:

| File | Purpose | Provenance |
| --- | --- | --- |
| `web/public/images/hero-hockey.svg` | Anonymous geometric hockey athlete and arena | Original code-authored illustration; no academy player or real arena depicted |
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
