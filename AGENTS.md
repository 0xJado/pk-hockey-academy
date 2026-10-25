# PK Hockey Academy — Repository Agent Instructions

## 1. Mission

Build and maintain the **PK Hockey Academy** website: a premium, high-performance, mobile-first, **German-language** marketing and training-schedule site for an ice hockey development academy in Germany.

The site must feel like a professionally art-directed hockey brand: cinematic, athletic, precise, trustworthy, and exciting. It is **not** a playful children's website and must not resemble a generic SaaS dashboard or off-the-shelf template.

Primary visitor: parents/guardians considering individual development training for a child up to U13.

Primary conversion: view upcoming training sessions and request/complete registration.

Secondary conversion: contact the academy.

Future extension: a merchandise/equipment shop, **not part of the initial MVP**.

## 2. Verified Business Brief and Content Guardrails

Treat only these facts as established:

- Brand: **PK Hockey Academy**.
- Founder and trainer: **Pierre Klein**.
- Offering: **Individual ice hockey development training** for children and youth players **up to U13**, delivered in small groups with individual coaching attention.
- Positioning: Team training matters; the academy **complements** it with targeted individual development.
- Every training block: **60 minutes On-Ice + 60 minutes Off-Ice**; exact content is adapted to the players/group.
- Current training cities: **Essen, Dinslaken, Duisburg**. Do not claim specific ice rink names/addresses unless supplied.
- Planned additional cities: **Herne, Dorsten, Wesel**. Explicitly label as planned, never as active venues.
- Training is generally organized on weekends at variable locations; do not invent a recurring calendar.
- Pricing provided: **50 € per single session; 200 € for a five-session package**. Do not invent package rules, payment methods, cancellation policies, or availability.
- Pierre has an ice hockey and inline hockey background. **Inline hockey is biographical context ONLY, not a service/product offered by the academy**.
- The training registration form covers single-session and multiple-session bookings. **SpielerPlus** becomes relevant only for participants who have booked multiple sessions, as clarified by the user on 23 October 2026. Do not present it as the default single-session registration path. Exact multi-session integration/link behavior is not yet verified.
- Contact should ultimately offer a form and WhatsApp option; actual destinations and backend are not yet known.
- No approved logo, trainers' portraits, real venues, session dates, phone number, email, shop catalog, or training footage has yet been supplied.

**Do not fabricate facts.**

Never invent testimonials, trainer credentials, registrations, free-place counts, exact venue addresses, legal contact details, real booking links, sponsor relationships, or team affiliations.

If demo sessions are displayed, label them clearly **"Beispieltermin – keine Anmeldung möglich"** and disable any booking CTA.

Placeholder contacts must be visibly non-functional or omitted. Do not use real-looking fake testimonials or misleading "Jetzt anmelden" links.

Content on the public website must be **German**.

Code, comments, documentation, commit messages, and identifiers may be English.

## 3. Technology and Engineering Direction

Preferred initial stack:

- **Astro** with TypeScript **strict**; default static prerendering and semantic server-generated HTML.
- **Tailwind CSS v4** via the supported Vite plugin (not legacy Tailwind v3 integration).
- **GSAP + ScrollTrigger** for selective, refined scroll narratives and parallax.
- Native CSS transitions, SVG, and Astro view transitions/`ClientRouter` where they measurably improve the experience.
- Minimum client JavaScript; no blanket React SPA. Introduce islands/components only if genuinely interactive.
- **Sanity CMS** planned for trainers, venues, dates, and site settings. MVP data should live in typed modules with a clean retrieval boundary; do not build the CMS unless the active task asks for it.
- **Shopify** may be added later for headless commerce and guest checkout. Do not add Shopify, authentication, database infrastructure, checkout UI that suggests purchases work, or payment integrations now.
- Hosting target is undecided. Keep the initial project deployable as static files without relying on a particular hosting vendor.
- Use npm consistently unless the existing repository already establishes another package manager.

If the repository already contains source or configuration, **inspect and preserve it**.

Do not overwrite working code or restructure the project blindly.

If the repository is empty, prefer `/web` as the Astro workspace so `/studio` can later contain Sanity; explain your choice in README.

Use a reasonably small and understandable component architecture; avoid clever abstractions, redundant packages, or speculative features.

Keep project dependencies current, stable, compatible, and lockfile-pinned.

## 4. Routes, Information Architecture, and UI Priorities

Must provide working, responsive pages or clearly linked sections covering:

### Startseite
`/`

Branded hero, mission/positioning, philosophy teaser, training system teaser, trainer teaser, location teaser, next-appointments teaser, prominent CTA.

### Philosophie
`/philosophie`

Philosophy and complement to team training.

### Training
`/training`

Youth up to U13, small-group individual development, 60/60 concept, pricing.

Include a clear `#zielgruppe` anchor if the target-group topic is consolidated here.

### Trainerpool
`/trainerpool`

Pierre's starter profile, placeholders for future trainers, no fabricated biographies.

### Trainingsstätten
`/trainingsstaetten`

The three current cities and three planned cities, with placeholders rather than invented rink details.

### Trainingstermine
`/trainingstermine`

**Highest priority deep link**, stable permanent route for printed QR codes.

List sessions sorted chronologically, structured fields for date/time, location, group, capacity, status, registration URL.

Do not imply live SpielerPlus synchronization.

### Organisation
`/organisation`

Weekend/variable-location organization, process and pricing.

Avoid unsupported booking policy claims.

### Kontakt
`/kontakt`

Contact section with safe placeholders until real destinations and submission service exist.

### Legal Pages

`/impressum`

`/datenschutz`

Prominent legal TODO placeholders clearly marked **not ready for publishing**, never invented legally complete documents.

Desktop primary navigation should be concise, with links/menus or appropriate anchors covering all topics.

Mobile navigation must be simple and keyboard-operable.

Persistent or repeated training-schedule CTA is valuable.

A future `Shop` navigation item should **not** masquerade as a working store; feature-flag/omit it until implemented.

Each public page should have:

- Exactly one logical `<h1>`.
- Descriptive German title and meta description.
- Sensible link text.
- Distinct SEO purpose.

## 5. Visual and Brand System

Style references, as inspiration **only**. Do not clone designs/assets or imply affiliation.

### NHL Inspiration

**Seattle Kraken**

Early brand storytelling: dramatic reveal, dark atmosphere, subtle SVG motion.

**Los Angeles Kings**

Documentary/editorial treatment: high-contrast photography, monochrome portraits, assertive headlines.

**Vegas Golden Knights**

Promotional energy: sophisticated spotlighting and event focus, but **not** a gold color scheme.

### DEL Inspiration

**Adler Mannheim / ERC Ingolstadt**

Modern content architecture: legibility, strong tiles, schedule and navigation clarity.

**EHC Red Bull München**

Media sections and strong sports storytelling.

**Kölner Haie**

Bold, concise copy and powerful hockey identity.

### Brand Palette

- Deep black/charcoal: `#050B12`
- Navy surface: `#101D2E`
- Electric hockey blue: `#087ED5`
- Ice white: `#DDECF8`
- Pure white: `#FFFFFF`

### Typography

An expressive condensed display face for major headings and a modern, readable body face.

Self-host properly licensed fonts.

Avoid external Google Fonts requests by default.

### Art Direction

- Dramatic hockey footage and photography.
- Cold rink lighting.
- Purposeful negative space.
- Diagonal cuts inspired by skate blades.
- Very subtle ice textures and arena markings.
- Black-and-white photos may transition to full color on interaction.
- Visually varied sections: not every section dark and not every section a three-card grid.

Make the homepage feel premium at 1440px and compelling at 375px.

The main CTAs should remain obvious under the motion.

## 6. Motion Design — Mandatory, but Performance-Aware

Create a **real reusable animation system**, not just named empty components or static mockups.

Prefer expressive motion in a few key moments over nonstop distractions.

### Animation 1 — The Ice Reveal

On first homepage load:

- A diagonal/angled wipe reveals the hero.
- Animated headline lines slide/fade with a crisp stagger.
- CTA appears after the headline.

Keep the intro short.

Never gate content behind a video download.

### Animation 2 — Layered Hero Depth

Conservative parallax on optional background imagery/decorative elements.

Never apply disruptive parallax to primary CTA text.

### Animation 3 — On-Ice / Off-Ice Storytelling

Two-phase scroll reveal or tightly scoped pinning on desktop.

Ordinary stacked content on mobile.

### Animation 4 — Section Reveals

Subtle masks/translations for photos and headings as they enter view.

### Animation 5 — Trainer Cards

Refined color/zoom/overlay hover and focus states.

Support touch without requiring hover.

### Animation 6 — Venue Imagery

Clip-path/mask entrance with readable static fallback.

### Animation 7 — Skate-Blade Transitions

Selective diagonal wipes or line sweeps.

Do not use long or disorienting transitions for every interaction.

### Animation 8 — Page Transitions

Subtle crossfades or native View Transitions if reliable.

Protect navigation and SEO.

### Animation 9 — Micro-Interactions

Purposeful button fills, arrows, link underlines, accessible navigation.

### Motion Engineering Rules

- Respect `prefers-reduced-motion: reduce` in **CSS and JS**.
- Show content immediately when reduced motion is enabled.
- Disable parallax and pinning for reduced-motion users.
- Keep semantic content readable and reachable **before JS runs**.
- Never permanently hide elements if JavaScript fails.
- Favor `transform` and `opacity`.
- Avoid animating expensive layout properties and high-volume blur/filter effects.
- Disable or significantly soften parallax and pinned sequences on narrow devices.
- Do not hijack native scrolling or add smooth-scrolling libraries unless explicitly requested.
- If using Astro `ClientRouter`, initialize on `astro:page-load`, tear down on `astro:before-swap`, and avoid duplicate GSAP timelines/listeners.
- Use scoped `gsap.context()` / `gsap.matchMedia()` and revert them cleanly on route changes.
- Test browser back/forward and repeated navigation.
- Provide poster/fallback imagery for video.
- If video becomes available, use muted, looping, `playsinline` presentation only where appropriate.
- Optimize video formats, lazy-load below-the-fold assets, and pause invisible playback.
- Do not animate every element simply because motion is available.

Strong motion hierarchy matters.

## 7. Data Modeling and Upgrade Path

Keep editable material separate from layouts.

### TrainingSession

Fields:

- `id`
- `title`
- `startAt` — timezone-aware timestamp
- `endAt`
- `group`
- `venueId`
- `status`
- `availableSpots` — nullable/manual
- `spielerPlusUrl` — optional
- `isDemo`

### Trainer

Fields:

- `id`
- `name`
- `role`
- `verifiedBackground`
- `specialties`
- `portrait` — optional
- `active`

### Venue

Fields:

- `id`
- `city`
- `rinkName` — optional
- `address` — optional
- `status` — `active_city` or `planned_city`
- `photography` — optional
- `details`

### SiteSettings

Fields:

- `brandName`
- `contactDestinations` — optional
- `globalCTAs`
- `socialHandles` — optional
- `seoConfig`

### Pricing

Fields:

- `packageLabel`
- `price`
- `description`

Do not declare taxes, shipping, or payment assumptions.

### Data Requirements

Render sample/demo schedule data separately from genuine published sessions.

A session with no valid registration URL must not present a functional registration action.

No brittle hardcoded JSX data.

Prepare adapter/query boundaries to simplify a later Sanity migration.

Do not add a database until requirements justify it.

Keep all external secrets in environment variables and provide `.env.example` if needed.

Never commit real secrets.

### Future Shop

Document a proposed `/shop` path and a distinct commerce interface.

Do not implement customer accounts or mock payment workflows.

Initial direction is hosted guest checkout through Shopify when merchandise launches.

## 8. SEO, Accessibility, Privacy, and Production Readiness

### Search Engine Optimization

- Entire visible site and metadata in **German**.
- Use `<html lang="de">`.
- Static, crawlable HTML.
- Unique titles and descriptions.
- Canonical URLs once a real domain is configured.
- Sitemap and robots.txt when safe to configure.
- Config-driven site URL.
- Do not silently claim placeholder or localhost URLs are production canonicals.

### Accessibility

- Logical headings.
- Correct landmarks.
- Meaningful alt text.
- Semantic links/buttons.
- No clickable `<div>` substitutes.
- Keyboard navigation.
- Visible focus.
- Accessible menus.
- Labeled controls.
- Appropriate contrast.
- Touchscreen-friendly sizing.

### Performance

- Optimize appropriately licensed raster images with Astro `<Image>` or `<Picture>` where possible.
- Size assets to avoid layout shifts.
- Lazy-load secondary imagery.
- Never lazy-load a crucial hero poster.
- Keep animation JavaScript lightweight.

### Images and Media

No hotlinking copyrighted NHL/DEL imagery or logos.

Use authentic academy assets when supplied.

Until then, use local tasteful CSS/SVG placeholders or **explicitly licensed** stock.

Record provenance and usage licenses in `ASSETS.md`.

Do not generate false player testimonials or coach identities.

### Privacy and Compliance

- No analytics, trackers, embedded third-party content, or non-essential cookies without review of consent obligations.
- Data minimization for enquiries concerning minors.
- Do not request children's sensitive data by default.
- German Impressum, privacy, cancellation and commerce terms require real business/legal inputs and review before launch.
- A placeholder legal route does not constitute compliance.
- Never claim untested links, forms, or checkout are functional.

## 9. Quality Bar and Acceptance Checks

After each implementation increment:

1. Run the appropriate package scripts (`astro check`, build, lint/tests if configured).
2. Fix any resulting failures.
3. If browser tools are available, inspect desktop (~1440px), tablet (~768px), and phone (~375px).
4. Verify no horizontal overflow or broken layouts.
5. Test menu behavior, visible focus and CTA links.
6. Test keyboard navigation.
7. Test reduced-motion preference.
8. Test video/poster fallback.
9. Test browser back/forward after page transitions.
10. Test repeated navigation for duplicate animations and scroll-position issues.
11. Inspect the console for runtime warnings/errors.
12. Verify static content and CTAs work without JavaScript where feasible.
13. Keep README up to date with setup commands, features, placeholder assets, incomplete areas and deployment notes.

**Definition of done for any task:**

Code exists, runs/builds, requested interactions demonstrably work, and the handoff clearly distinguishes completed work from placeholders or unverified behavior.

Do not report tests as passed unless they were run.

## 10. Working Style for Codex

1. Inspect the repository before changing anything.
2. Summarize discovered state and a compact plan.
3. Implement rather than only proposing implementation, unless explicitly asked for planning.
4. Make small cohesive commits if authorized and working in a suitable Git repository.
5. Never force-push, discard user changes, or overwrite uncommitted work without permission.
6. Favor quality over quantity: begin with a polished visual foundation and homepage, then propagate components consistently.
7. Preserve project decisions in README/AGENTS.md.
8. Update instructions only when user decisions supersede them.
9. If media, copy, credentials, rink details and real sessions are unknown, use tasteful **clearly labeled placeholders** and continue.
10. When blocked on an external integration, build a clean internal interface and document the missing input rather than pretending the integration works.
11. At handoff, summarize:
    - Files touched.
    - Design choices.
    - Motion behaviors implemented.
    - Commands/tests run.
    - Links to any local preview.
    - Content needed from Pierre.

## 11. Source Documentation

Validate framework and motion APIs against official documentation when versions change.

- Astro: https://docs.astro.build/
- Astro transitions: https://docs.astro.build/en/guides/view-transitions/
- Tailwind/Astro: https://docs.astro.build/en/guides/styling/
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP matchMedia: https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/
- Sanity (later): https://www.sanity.io/docs
- Shopify Storefront API (later): https://shopify.dev/docs/api/storefront
