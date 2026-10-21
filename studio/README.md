# PK Hockey Academy — Camp-Galerie / Redaktion

Standalone German Sanity Studio. The website remains static; React is used only in this separate administrator app. This increment manages camp albums, photos and videos. Sessions, trainers, venues and prices remain in `web/src/data/academy.ts`.

## Connect the real project

1. Create or choose the academy's project in [Sanity Manage](https://www.sanity.io/manage) and use a **private dataset**.
2. Copy `.env.example` to `.env`. Enter the real `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`. These identifiers are public configuration. There are no fictional fallback identifiers; unconfigured startup/build fails with a setup message.
3. Run:

   ```powershell
   cd studio
   npm ci
   npm run dev
   ```

   Open the URL printed by Sanity (normally `http://127.0.0.1:3333`). Sign in using an invited project member's own account. If needed, add the exact local Studio origin in the project's API/CORS settings with credentials enabled. Do not use wildcard origins. Add the real deployed Studio origin when deploying.
4. Run `npm run check`, `npm test`, `npm run schema:extract` and `npm run build`. Deploy with `npm run deploy` after choosing the real Studio hostname, or host the generated SPA separately with history fallback. No Studio deployment has been performed here.
5. Set `PUBLIC_SANITY_STUDIO_URL` in the website build environment to the actual HTTPS Studio address. `/verwaltung` then links to the real login. Until then it reports setup is pending.

## Pierre and other administrators

In Sanity Manage → project → Members, invite each administrator using their real email address. Each person uses their own account. Grant the least available role permitting editing, asset uploads and publishing (typically Editor); reserve project administration for the owner. Available roles and seat limits depend on the plan. Loading the Studio URL does not grant permissions to the private dataset. No shared passwords or public write API are implemented.

Invitations, membership permissions and authenticated uploads require the real project and accounts. They have **not** been provisioned or verified here. Send account invitations only with explicit user authorization.

## Publishing workflow (für Pierre)

1. **Alle Camp-Alben → Neues Camp-Album** öffnen. Titel, stabile Seitenadresse, bestätigtes Datum, Stadt und kurzen Rückblick eintragen.
2. Unter **Fotos & Videos** ein Foto oder Video hinzufügen. Der native Dateidialog bzw. Drag-and-drop im Uploadfeld lädt die Datei hoch. Bei jedem Medium unter **Galerie-Bereich** **On-Ice**, **Off-Ice** oder **Weitere Camp-Momente** wählen. Medien durch Ziehen neu anordnen; die Reihenfolge innerhalb jedes Bereichs folgt dieser Liste. Das erste gültige Medium der gesamten Liste liefert weiterhin das Titelbild. Ein Video-Vorschaubild übernimmt den Bereich des Videos und benötigt keine eigene Zuordnung.
3. Fotos: JPEG, PNG oder WebP, maximal 12 MB; Beschreibung und Urhebernachweis ergänzen. Videos: MP4 (H.264) oder WebM, maximal 100 MB, mit Vorschaubild, Urhebernachweis und vollständiger Textalternative. Es gibt kein automatisches Transcoding; große Videos vorab komprimieren.
4. Unter **Freigabe** Rechte/Einwilligungen bestätigen, **Auf der Website zeigen** auswählen und **Veröffentlichen** klicken. Pflichtfelder werden geprüft. Ein gespeicherter Entwurf erscheint nicht auf der Website.
5. Website neu bauen und deployen. Erst ein erfolgreiches Deployment aktualisiert `/galerie` und die Albumseiten. Ein sicherer Build-Webhook lässt sich nach Anschluss des Projekts einrichten; aktuell ist keiner verbunden.
6. Zum Zurückziehen **Zurückhalten** wählen und veröffentlichen oder die Veröffentlichung aufheben. Danach die Website erneut bauen/deployen. Zurückgezogene Albumseiten werden im neuen statischen Build entfernt.

## Connect the website

Set these build-server variables in `web/.env` and the hosting build environment:

- `SANITY_PROJECT_ID` and `SANITY_DATASET`: the same project/dataset as Studio.
- `SANITY_READ_TOKEN`: a dedicated read-only/Viewer token. Never put it in a `PUBLIC_*` or `SANITY_STUDIO_*` variable, browser code, screenshots or Git.

The build uses the origin API and `published` perspective, excludes drafts/releases, and requires public visibility plus confirmed rights. Independent runtime validation rejects missing metadata, unsupported files, invalid dates and foreign asset URLs. A configured but broken/inaccessible API fails the build; it never silently deploys an empty gallery. With all three variables blank, no CMS request is made and the gallery is honestly empty.

For automatic updates, configure a Sanity webhook calling the chosen host's secret build-hook URL. Include published `galleryCamp` create/update/delete events, exclude `drafts.**` and `versions.**`, and include unpublish/withdrawal events. Do not filter only on public visibility, because withdrawal needs a rebuild too. Test publishing, editing and removing an album. Keep hook URLs private and out of Studio/browser code. No hosting vendor is required by this implementation.

## Media handling

**Dataset assets on Sanity's CDN are publicly retrievable by anyone with the URL, even when the dataset is private or the album is a draft.** Do not upload private raw footage or unapproved photos. Before uploading, clear rights/required consent, strip GPS/EXIF metadata, and avoid identifying children in filenames, captions, alt text or transcripts. The schema disables original-filename storage and does not request EXIF metadata; it is not a metadata scrubber. Never store consent records or children's personal information in this CMS.

Hiding/unpublishing an album does not revoke CDN URLs or immediately remove a previously deployed page. If a file must be removed, check references, remove the asset through Sanity's asset management, rebuild, and verify removal/caching with the real host/CDN. Album visibility is not file access control.

Public videos have required posters, no autoplay and `preload="none"`. A shared player adds play/pause, seeking, sound and fullscreen controls; native controls remain the no-JavaScript fallback. Videos pause out of view, when another video starts, on hidden tabs and on navigation. The mixed-media viewer supports Escape, arrow keys and focus return; focused player controls keep their native keyboard behavior. Plain photo links, native videos, transcripts and navigation remain available without JavaScript.

Each album provides tabs for nonempty **On-Ice**, **Off-Ice** and **Weitere Camp-Momente** sections, in that order. Existing/unassigned media safely fall into the last group; no migration is required. Only the selected section is visible with JavaScript. Tabs support arrow keys, Home/End, Space and Enter, and restore the selected section from its URL hash. Without JavaScript the controls remain ordinary section anchors and all sections are readable. The overall media count appears above the tabs; section counts and visible video-to-text labels are omitted. Desktop galleries show **five square tile columns**; tablet widths (701–1000px) use three, and phones (up to 700px) one. Clicking a photo opens the full image; next/previous controls browse photos and videos together in the selected section's visible placement order. Videos can also play inline and pause when their section is hidden; their text alternatives are available to assistive technology. Gallery tiles and album covers have no corner arrow badges. Below-the-fold photos load lazily.

### Spotlight-Fotos

Beim Foto unter **Darstellung im Raster** wählen:

- **Normale Kachel**: eine Rasterzelle.
- **Spotlight · linker Rand**: zwei Spalten und zwei Reihen, im Desktop-Raster Spalten **1–2**.
- **Spotlight · rechter Rand**: zwei Spalten und zwei Reihen, im Desktop-Raster Spalten **4–5**.

Die Mitte ist keine zulässige Spotlight-Position. Mehrere Spotlights werden ohne Überlagerung platziert; normale Kacheln füllen freie Zellen. Bei Spotlights bestimmt die Randplatzierung die genaue Position, daher kann die sichtbare Reihenfolge von der reinen Medienliste abweichen. Tastatur und Fotoansicht folgen der sichtbaren Reihenfolge. Das Album-Titelbild bleibt das erste gültige Medium der ursprünglichen Liste.

Tablets behalten zweispaltige Spotlights am linken/rechten Rand. Auf einspaltigen Telefonen werden alle Fotos als normale, volle Kacheln angezeigt. Die Vorschau wird quadratisch beschnitten; die vergrößerte Ansicht zeigt das ganze Foto. Videos und Video-Vorschaubilder haben keine Spotlight-Einstellung. Vorhandene Fotos ohne Einstellung bleiben normale Kacheln. Beim Wechsel der Bildschirmbreite werden Positionen und sichtbare Fotoreihenfolge neu berechnet.

Document actual Sanity media delivery and hosting in the privacy notice before launch. No public uploads, analytics, third-party video embeds, visitor accounts or payment services were added.

## Official references checked

- [Studio configuration](https://www.sanity.io/docs/studio/configuration)
- [Image schema](https://www.sanity.io/docs/studio/image-type), [file schema](https://www.sanity.io/docs/studio/file-type)
- [Published perspectives](https://www.sanity.io/docs/content-lake/perspectives)
- [Project roles](https://www.sanity.io/docs/user-guides/roles)
- [Asset CDN visibility](https://www.sanity.io/docs/content-lake/manage-assets)
