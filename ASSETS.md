# Asset provenance

## Subpage contour and hockey equipment accents — 7 November 2026

The final skate revision uses a side-on hockey boot with a forward tongue, reinforced quarter, rounded toe cap, thin outsole, two mounting towers, blade holder and rockered steel runner. It is original generic vector artwork, with no product branding or third-party tracing.

`web/public/images/accents/` contains six original local SVG drawings: `contours.svg`, `stick.svg`, `puck.svg`, `skate.svg`, `glove.svg` and `helmet.svg`. The flowing contours are abstract decorative linework, not a map of real locations. Equipment is generic, unbranded outline artwork made for the website; no third-party product drawing, team mark or photo was traced. No raster generation, external asset download or new font was used.

`web/src/styles/hockey-subpages.css` places these assets behind text in marketing-page headers and selected content-section margins. They are CSS decoration with no accessibility-tree content or pointer interaction. A finite header fade respects reduced motion; mobile uses lighter static decoration. The homepage and approved PK CTA remain outside these rules.

## Hockey motion and rink graphics — 7 November 2026

- `web/src/components/PKOutline.astro` is a manually traced, stroke-only decorative study of the supplied crest's italic PK lettering, used behind the final CTA. The user's supplied 262×177px logo close-up informed the revised individual contours: P has a sharp lower cut-in, and K's slimmed stem descends directly from P's outer bowl corner rather than extending beneath the bowl. K's top also meets P's sloped edge, eliminating the intermediate gap. Both letters retain their own outlines. It is not a replacement master logo. No new font, third-party mark, raster edit or AI portrait was created.
- The hero, philosophy and U13 rink diagrams now use five-second stroke tracing, a five-second hold and a short fade. The loops pause offscreen, when the tab is hidden, or through the shared pause control. Reduced-motion/no-JS rendering retains the static drawings.

- Follow-up: the coach carousel's jersey outlines are original local SVG presentation placeholders, explicitly labelled as empty templates. They do not depict coaches or imply academy staffing. The spray now originates at the bottom right on each homepage navigation; its separate replay control was removed at the user's request.

- `web/src/components/RinkMarkings.astro` and `web/public/images/skate-traces.svg` are original vector drawings created for this website: rink geometry, faceoff circles, a coaching route and paired skate traces. No club marks or third-party artwork were copied.
- `web/src/lib/motion/ice-spray.ts` draws the finite ice-stop entrance procedurally in canvas. It uses no footage, sound, downloaded animation, external runtime or generated raster asset.
- The user supplied a textual Lando Norris website style reference. Its editorial scale, asymmetric framing and technical linework informed this interpretation; the academy retains its own palette, typography, branding and content. No Norris/McLaren logos, fonts, photographs, code or 3D assets were imported.
- The missing-CMS-hero state is explicitly labelled as a graphic study. This work does not restore withdrawn/unapproved photography or assert that the rink drawing depicts a real venue.

The PK accent's final junction includes a short outward ledge aligned with P's lower bowl edge, connecting it to the narrow K stem without widening the stem below the junction.

No NHL/DEL assets or external video embeds are used. Existing branding and illustrative assets are served locally. The gallery is empty until real, approved camp albums are connected; those photos, video files and posters will be served by Sanity's CDN. Illustrative photographs do not document academy training or imply an affiliation.

## Camp gallery — 20 October 2026

- The empty gallery's rink/PK graphic is original CSS artwork in `web/src/styles/gallery.css`, created for this repository. It contains no third-party imagery.
- No camp media, fabricated camps or coach identities have been added. Each real upload must include a credit and required descriptions; videos need a poster and text alternative. Album rights/consent approval is required before website publication.
- Sanity's private dataset protects document reads, but asset CDN URLs are public to anyone who has the URL, including for drafts. Only already-cleared media should be uploaded. See [`studio/README.md`](studio/README.md) for removal and metadata handling.

## Supplied registration template — 23 October 2026

- Source: `PK_Hockey_Academy_Anmeldeformular_v2.pdf`, attached by the user in this chat as the registration-form source for issue #3. It is a blank template with no completed personal details, two A4 pages, and no AcroForm fields, page annotations, JavaScript name tree or open action.
- Public download: `web/public/downloads/PK-Hockey-Academy-Anmeldung-v2.pdf`; 203,522 bytes. SHA-256: `5ad3b2845008b09213280653fda49d6fb15882a4ddbfcb0ca975dc664162bff9`. This is byte-for-byte identical to the attached original; branding, typography, text, metadata and signatures remain unchanged. No derivative PDF was generated.
- The original was extracted with pypdf and both pages rendered with Poppler and visually inspected. The supplied file is a paper/handwriting template; it is not represented as fillable or legally approved. Its express legal-review warning is retained in the download and reproduced in the online preview.
- Usage is based on the user's supplied business document and registration implementation request. No broader ownership/license or legal-validity claim is made. The attachment directory stays Git-ignored; no other attachment was copied into the site. The website preview stores no personal data and contains no submission form.

## Supplied academy branding — 19 October 2026

- Local original: `web/src/assets/brand/pk-hockey-crest.png`.
- Source: **Vollständiges Hockey-Akademie-Wappen.png**, supplied by Pierre through the user's Google Drive file link in this chat. The user explicitly requested replacing the website logo with it.
- Original: 1254 × 1254 RGBA PNG, 1,558,622 bytes. SHA-256: `913EF27652DA16D9940F8872A675174C4F99911ECF8348E074AD225A66FDEC53`.
- The supplied pixels, proportions and transparency are preserved. Astro generates resized local WebP versions for the header, footer and trainer-profile graphic, a 64px PNG favicon, and a 512px social-image rendition when a real site origin is configured. No redrawing or AI alteration of the crest was performed.
- The media kit at `/medienkit` provides the same unmodified original PNG as `PK-Hockey-Academy-Logo.png`, with a separately optimized preview. No additional licensing terms are asserted by this download page.
- On 30 October 2026, this same checksum-verified original was migrated to Sanity as the media-kit file and preview source. The download preserves its original bytes and filename; the website optimizes only the preview. No additional asset or reuse licence was invented. The page explicitly identifies that agreed usage guidance has not yet been supplied.
- Artwork ownership and any third-party designer's license have not been independently established; usage is based on the user's supplied business asset and explicit website instruction. No broader license claim is made.
- Brand direction: **PK_Hockey_Academy_Flyer_Trainingsprogramm.pptx**, also supplied by Pierre through the user's Drive link. The one-slide PPTX contains one flattened 1024 × 1536 raster. It was inspected locally as a design reference; the full flyer is not published with the website.
- The redesign takes the flyer's ice-white/navy/cobalt palette, condensed typography, “Skills. Mindset. Zukunft.” heading and training-band hierarchy as general visual direction. The flyer is not copied as a webpage screenshot. Its embedded portrait, credentials, contact details, QR destination and registration language have not been imported as independently verified website content.
- A standalone trainer portrait is still needed before replacing the clearly described crest graphic in the trainer profile. The registration PDF was outside that branding task; its later supplied version is recorded above.

## Supplied academy hero photograph — 23 October 2026

- Local original: `web/src/assets/hero-academy-players.jpg` (1280 × 962 JPEG).
- Source: `1000046804.jpg`, supplied by the user directly from Pierre with explicit authorization to use it for the homepage hero. Depicts three young players in academy jerseys on the ice; no player names, venue or session details are asserted.
- SHA-256: `4cf7bd5c1d8251cb7512b980259d2ce9dc7af7c943c6310db02eec6b6f0cf5e7`. The supplied original is preserved unchanged. A separately saved retouch now supplies the hero, as described below. No external image requests run on the website.
- Usage is based on the supplied academy asset and explicit website instruction; no independent ownership, photographer credit or broader license is asserted. The former stock-photo label has been removed. Responsive framing, the existing reveal and desktop parallax remain.

### Studio retouch — 23 October 2026

- At the user's request, the built-in Image Gen tool edited the supplied photograph for cleaner white balance, more even facial lighting, controlled contrast, richer blue kit and improved apparent clarity. The prompt explicitly requested preservation of identities, equipment, composition and branding. This is an AI-retouched derivative, not newly captured detail or an unmodified original.
- Local derivative: `web/src/assets/hero-academy-players-retouched.png`, 1445 × 1088, 2,606,153 bytes. SHA-256: `3c784ea982f8b2761b0e60319ded51746f6e379c3521e90a7e478b802c967a28`. Output is saved in the repository alongside the original; no alternate academy, venue or player facts are introduced.
- Full generation prompt: [`web/src/assets/hero-academy-players-retouched.prompt.txt`](web/src/assets/hero-academy-players-retouched.prompt.txt). The requested ideal resolution was higher; the tool actually returned 1445 × 1088. The website does not claim a 4K master or recovery of original lost detail.
- Astro generates local WebP renditions from 480px to 1445px at quality 92. Desktop image sizing accounts for the height-driven cover crop, avoiding an unnecessarily small source. Removed the old grayscale/contrast filter and translucent navy tint so the retouch displays at full opacity. Mobile framing and motion remain unchanged.

## Former hero photograph — retained, unused

- Local source: `web/src/assets/hero-hockey-photo.jpg`.
- Photographer: **Ron Lach**.
- Source: [A Person Wearing Black Helmet with Cage — Pexels photo 8974646](https://www.pexels.com/photo/a-person-wearing-black-helmet-with-cage-8974646/).
- Downloaded 17 October 2026 from `https://images.pexels.com/photos/8974646/pexels-photo-8974646.jpeg?auto=compress&cs=tinysrgb&w=2400`.
- [Pexels License](https://www.pexels.com/license/), checked on the download date: permits website use and modification; attribution is optional. No endorsement by the depicted person or brands is claimed.
- Previously displayed with a visible German `Symbolbild` label and photographer credit. Replaced by Pierre's supplied academy photo on 23 October 2026; this stock original is retained but no longer referenced by the website.
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

## Local gallery preview media

User-supplied placeholder media may be prepared locally under `web/.local-gallery/`, including optimized images, a video poster and an optional silent video rendition. Originals remain untouched. The folder, album manifest and preparation tooling are Git-ignored; no personal asset filenames or sample metadata are recorded here. These samples are authorized for the local gallery demonstration only. They are visibly labeled and excluded from production output. Their use does not establish publication rights or identify a real camp, venue or participant. Approved publication assets and credits must be entered through the CMS separately.

## Gallery goalkeeper indicator — 21 October 2026

`web/src/assets/gallery-goalie.png` is a fictional, directly overhead hockey goalkeeper illustration created with the built-in Image Gen tool for the gallery's moving tab indicator. It is decorative UI artwork, with no real person, team identity, logo or affiliation. The generated original is preserved unchanged in the local generated-images directory; transparent padding was trimmed and the source downsampled to 352 × 165 RGBA pixels (92,329 bytes). Astro produces the small local rendition, displayed at 88px wide on desktop/tablet and 76px on phones. No external image request is required.

SHA-256: `2be9f44a572779daf4483fedabb4dbfeffdae0f0dedbac1ed6f19a8404a39efa`.

The initial generation and refinement prompts, tool choice and preparation are recorded in `web/src/assets/gallery-goalie.prompt.txt`. This reusable design asset is part of the website source; personal sample gallery files and metadata remain Git-ignored.
