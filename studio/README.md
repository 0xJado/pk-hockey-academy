# PK Hockey Academy — Camp-Galerie / Redaktion

Standalone German Sanity Studio for trainer profiles and camp albums, photos and videos. The website remains static; React is used only in this separate administrator app. Sessions, venues and prices remain in `web/src/data/academy.ts`. The existing local Pierre profile remains active until the coach migration is explicitly enabled.

## Connect the real project

1. Create or choose Pierre's academy project in [Sanity Manage](https://www.sanity.io/manage), keep the **Free** plan and use a **public dataset**, normally `production`.
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
6. Optional: set `SANITY_STUDIO_AUTH_PROVIDER` to `google`, `github` or `sanity` only after confirming membership and recovery with that exact sign-in method. Blank preserves native providers. This filters native login choices; it does not grant access, enforce MFA or invalidate existing sessions. Unknown or unavailable providers fail explicitly.

## Pierre and other administrators

Pierre uses his own Administrator account. No additional human account is required. If he explicitly authorizes another person's access, invite their individual account under Sanity Manage → project → Members. Free offers Administrator and Viewer; editing/setup requires Administrator, with its full project permissions. Do not describe a Free administrator as a restricted editor. Editor/Developer/Contributor roles are paid-plan options, not prerequisites. Published documents are public, while edits, uploads and native draft reads still require actual grants. No shared-password service or public write API is implemented.

Invitations, membership permissions and authenticated uploads require the real project and accounts. They have **not** been provisioned or verified here. Send account invitations only with explicit user authorization.

The built Studio retains Sanity's native `noindex` metadata. The website's `/verwaltung` is always noindex and contains no password form, upload endpoint or write credentials. Its configured HTTPS destination is validated; local/IP destinations, placeholders, credentials and query/fragment links fail the website build rather than silently pointing editors elsewhere. Native Content Lake grants protect edits and unpublished documents; the public Studio shell and website inclusion flags do not provide confidentiality for published content.

See [`ACCESS.md`](ACCESS.md) for the role matrix, invitations, revocation, sign-out, MFA, recovery and real-account acceptance checks. The authenticated **Redaktionshilfe** tool provides the German editing/publication guide in Studio. Its displayed role names are informational; Sanity evaluates the actual grants.

## Trainerprofile: Ersteinrichtung und Redaktion

1. Für die erste Übernahme unter **Alle Trainerprofile → Neu** die Vorlage **Pierre Klein · geprüftes Startprofil** wählen. Sie übernimmt ausschließlich die bereits bestätigten Angaben aus `shared/pierre-profile.ts`, ohne erfundene Qualifikationen oder ein Porträt. Die Vorlage startet zurückgehalten und ohne Freigabebestätigung. Alternativ ein leeres Trainerprofil für einen bestätigten weiteren Trainer anlegen.
2. **Profil**: Name, Rolle, Biografie und bestätigten Hintergrund ergänzen. Qualifikationen und Eishockey-Schwerpunkte sind optionale Listen. Nur freigegebene Tatsachen verwenden. Absätze mit einer Leerzeile trennen; die Website zeigt Klartext und führt kein HTML aus.
3. **Trainerfoto**: optional JPEG, PNG oder WebP, maximal 12 MB, mit Bildbeschreibung und Urhebernachweis. Ohne Foto zeigt die Website das Academy-Wappen als erkennbaren Platzhalter. Vor Uploads Rechte klären und GPS/EXIF entfernen. CDN-Dateien sind über die URL auch bei Entwürfen öffentlich erreichbar.
4. **Profilvorschau** zeigt den aktuellen Bearbeitungsstand im angemeldeten Studio. Sie unterstützt unvollständige Entwürfe mit einer Erklärung, veröffentlicht nichts und ist keine pixelgleiche Live-Website-Vorschau. Es gibt keinen öffentlichen Draft-Endpunkt und keine geteilten Vorschau-Token.
5. **Freigabe**: Sortiernummer (kleinere zuerst), Aktivität und bestätigte Angaben festlegen. Gleiche Nummern werden stabil nach Dokument-ID sortiert. Das erste aktive, freigegebene Profil erscheint auf der Startseite. **Auf der Website zeigen** wählen und veröffentlichen; Pflichtfelder, Zustimmung und hochgeladene Dateien werden geprüft. Fehler blockieren die Veröffentlichung. Ein Entwurf bleibt im Studio.
6. Bei der ersten Migration im Website-Build `SANITY_TRAINERS_ENABLED=true` sowie Projekt-ID und Dataset wie für die Galerie konfigurieren. Für das öffentliche Dataset bleibt der Lesetoken leer. Erst aktivieren, wenn alle vorgesehenen Profile freigegeben und veröffentlicht sind. Ohne Aktivierung bleibt Pierre aus den lokalen Daten erhalten. Bei aktiviertem CMS ist eine leere Liste ausdrücklich leer; Fehler oder Unpublishing stellen keine alten lokalen Profile wieder her.
7. Nach Veröffentlichung oder Änderung die Website erfolgreich neu bauen. Erst dann aktualisieren sich `/trainerpool` und der Startseiten-Teaser. Ohne angebundenen Build-Webhook ist dies weiterhin ein manueller Betriebsschritt. Ein fehlgeschlagener Build lässt die vorherige veröffentlichte Website bestehen.
8. Zum Zurückziehen **Zurückhalten** wählen und veröffentlichen, **Aktiver Trainer** deaktivieren und veröffentlichen oder die Veröffentlichung aufheben. Für die native Unpublish-Aktion gegebenenfalls zuerst die veröffentlichte Perspektive auswählen. Anschließend die Website neu bauen und beide Seiten kontrollieren. Eine Datenänderung allein entfernt keine bereits gebauten Seiten oder CDN-Dateien.

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
- `SANITY_READ_TOKEN`: leave blank for the public dataset; published content is read without an Authorization header. Optional private-dataset compatibility is retained: if explicitly configured later, use a dedicated read-only/Viewer token, never a `PUBLIC_*` or `SANITY_STUDIO_*` variable, browser code, screenshots or Git.
- `SANITY_TRAINERS_ENABLED=true`: opt in to CMS coach profiles after migration. Leave `false` until ready; this flag does not affect gallery activation.

The build uses the origin API and `published` perspective, excludes drafts/releases, and requires website visibility plus confirmed rights. Independent runtime validation rejects missing metadata, unsupported files, invalid dates and foreign asset URLs. A configured but broken/inaccessible API fails the build; it never silently deploys an empty gallery. With project, dataset and token blank, no CMS request is made and the gallery is honestly empty. Either project/dataset alone, or a token without both identifiers, is invalid configuration.

For automatic updates, configure a Sanity webhook calling the chosen host's secret build-hook URL. Include published `galleryCamp` and `trainer` create/update/delete events, exclude `drafts.**` and `versions.**`, and include unpublish/withdrawal events. Do not filter only on public visibility or activity, because withdrawal needs a rebuild too. Test publishing, editing and removing both an album and a trainer. Keep hook URLs private and out of Studio/browser code. No hosting vendor is required by this implementation. No build hook is connected locally; an editor-to-website workflow without developer assistance requires this one-time account/hosting setup and acceptance test.

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
- [Native authentication](https://www.sanity.io/docs/studio/custom-auth), [Studio component views](https://www.sanity.io/docs/studio/structure-builder-reference)
- [Account recovery](https://www.sanity.io/docs/help/account-recovery), [account management](https://www.sanity.io/docs/platform-management/manage-your-account)
- [Roles and plan availability](https://www.sanity.io/docs/content-lake/roles-concepts)
