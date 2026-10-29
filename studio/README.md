# PK Hockey Academy — Camp-Galerie / Redaktion

Standalone German Sanity Studio for trainer profiles and camp albums, photos and videos. Public website pages remain prerendered. Optional **Website bearbeiten** connects a protected server-rendered trainer preview with click-to-edit fields and a **Trainer hinzufügen** action. The existing content editor and private profile preview remain available. Sessions, venues and prices remain in `web/src/data/academy.ts`. The local Pierre profile is used only when the coach CMS migration is disabled.

See [Visual Editing configuration and activation](../docs/VISUAL-EDITING.md). Set `SANITY_STUDIO_PREVIEW_URL` only when its website preview origin is ready; blank hides the new tool. The server-only Viewer credential is configured in the website environment, never in Studio. Native Studio deployment and iframe acceptance must be recorded separately from local builds.

## Ownership and first account setup

The user confirmed on 25 October 2026 that Pierre should own the academy's Sanity project; the user is its developer. The developer has now created the account/project using Pierre's new academy email. This workstation's CLI is authenticated using native email/password sign-in, and the real public `production` dataset is configured in ignored local environment files. A single Pierre-owned account is sufficient; technical setup needs authorized account access, while code development needs no Sanity seat. A separate developer account remains optional. The German [owner setup guide](OWNER-SETUP.md) covers the initial steps.

Use **Sanity Free with a public dataset for public website content**. Player/guardian registrations belong in the separate private Google Sheet planned in [the registration notes](../docs/issue-3-registration.md), never Sanity. The earlier private-dataset assumption is superseded. [Free currently supports up to 20 accounts](https://www.sanity.io/pricing), so an optional second account does not itself require payment. Its human roles are Administrator and Viewer; independent developer setup would require an explicitly owner-approved Administrator invitation. No additional human account, invitation, paid subscription or broader role grant has been created by the agent. See [ACCESS.md](ACCESS.md) for acceptance checks.

The real editing Studio and its schema are deployed at **https://pk-hockey-academy.sanity.studio/**. `SANITY_STUDIO_APP_ID` in the ignored local configuration binds later deployments to that application; deployment auto-updates are disabled so releases use the pinned source dependencies. The website's local `/verwaltung` links to this real address. Pierre's verified starter content is approved and published. Native draft privacy was verified before publication, and the original verified fields were preserved through the publishing acceptance test. Native browser sign-in, the German profile editor/private preview, approval controls, empty gallery collection and editorial guide are verified. The current academy account's Administrator role is shown in Studio. `SANITY_TRAINERS_ENABLED=true` now makes Sanity authoritative locally and in the protected Vercel review builds. The public hosting settings are configured; the automatic rebuild hook passed native Studio publish/edit/unpublish/restore acceptance, with four successful deployments and verified profile/homepage changes.

Published documents in a public dataset are anonymously readable through Sanity's API, including records withheld from the website with `visibility: "hidden"`, `active: false` or approval flags. These fields control website inclusion, not confidentiality. [Native drafts and release versions require authentication](https://www.sanity.io/docs/content-lake/drafts-and-versions). Only content suitable for public release belongs in this CMS; never store registrations, health data, consent records or private editorial notes here. Dataset media remain URL-public even in drafts.

## Connect the real project

1. Create or choose Pierre's academy project in [Sanity Manage](https://www.sanity.io/manage), keep the **Free** plan and use a **public dataset**, normally `production`.
2. Copy `.env.example` to `.env`. Enter the real `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`. These identifiers are public configuration. There are no fictional fallback identifiers; unconfigured startup/build fails with a setup message.
3. Run:

   ```powershell
   cd studio
   npm ci
   npm run dev
   ```

   Open **http://localhost:3333**: this exact origin already has credential-enabled CORS in the real project. The server remains bound to `127.0.0.1`; use `localhost` in the browser even if the CLI prints its numeric address. Sign in with the authorized academy account. Additional credential-enabled origins require explicit owner authorization; no wildcard origin is needed.
4. Run `npm run check`, `npm test`, `npm run schema:extract` and `npm run build`. The Studio is already deployed at the address above. Once `SANITY_STUDIO_APP_ID` is configured, `npm run deploy -- --schema-required` updates that exact application. A separately hosted SPA remains an alternative if deliberately chosen later.
5. Set `PUBLIC_SANITY_STUDIO_URL` in the website build environment to the actual HTTPS Studio address. `/verwaltung` then links to the real login. Until then it reports setup is pending.
6. Optional: set `SANITY_STUDIO_AUTH_PROVIDER` to `google`, `github` or `sanity` only after confirming membership and recovery with that exact sign-in method. Blank preserves native providers. This filters native login choices; it does not grant access, enforce MFA or invalidate existing sessions. Unknown or unavailable providers fail explicitly.

## Pierre and other administrators

Pierre uses his own Administrator account. No additional human account is required. If he explicitly authorizes another person's access, invite their individual account under Sanity Manage → project → Members. Free offers Administrator and Viewer; editing/setup requires Administrator, with its full project permissions. Do not describe a Free administrator as a restricted editor. Editor/Developer/Contributor roles are paid-plan options, not prerequisites. Published documents are public, while edits, uploads and native draft reads still require actual grants. No shared-password service or public write API is implemented.

Invitations, membership permissions and authenticated uploads require the real project and accounts. They have **not** been provisioned or verified here. Send account invitations only with explicit user authorization.

The built Studio retains Sanity's native `noindex` metadata. The website's `/verwaltung` is always noindex and contains no password form, upload endpoint or write credentials. Its configured HTTPS destination is validated; local/IP destinations, placeholders, credentials and query/fragment links fail the website build rather than silently pointing editors elsewhere. Native Content Lake grants protect edits and unpublished documents; the public Studio shell and website inclusion flags do not provide confidentiality for published content.

See [`ACCESS.md`](ACCESS.md) for the role matrix, invitations, revocation, sign-out, MFA, recovery and real-account acceptance checks. The authenticated **Redaktionshilfe** tool provides the German editing/publication guide in Studio. Its displayed role names are informational; Sanity evaluates the actual grants.

## Trainerprofile: Ersteinrichtung und Redaktion

Stand 29. Oktober 2026: Der native Ablauf wurde einschließlich Neuanlage, Pflichtfeldprüfung, Entwurfsschutz und Rücknahme/Wiederherstellung abgenommen; siehe [Abnahmeprotokoll](../docs/issue-4-acceptance.md). Es gibt derzeit keine freigegebenen Trainerfotos. Auf Wunsch bleibt deshalb der vorhandene Logo-Hintergrund bestehen; ein Foto ist keine Voraussetzung für die Profilveröffentlichung.

1. Für die erste Übernahme unter **Alle Trainerprofile → Neu** die Vorlage **Pierre Klein · geprüftes Startprofil** wählen. Sie übernimmt ausschließlich die bereits bestätigten Angaben aus `shared/pierre-profile.ts`, ohne erfundene Qualifikationen oder ein Porträt. Die Vorlage startet zurückgehalten und ohne Freigabebestätigung. Alternativ ein leeres Trainerprofil für einen bestätigten weiteren Trainer anlegen.
2. **Profil**: Name, Rolle, Biografie und bestätigten Hintergrund ergänzen. Qualifikationen und Eishockey-Schwerpunkte sind optionale Listen. Nur freigegebene Tatsachen verwenden. Absätze mit einer Leerzeile trennen; die Website zeigt Klartext und führt kein HTML aus.
3. **Trainerfoto**: optional JPEG, PNG oder WebP, maximal 12 MB, mit Bildbeschreibung und Urhebernachweis. Ohne Foto zeigt die Website das Academy-Wappen als erkennbaren Platzhalter. Vor Uploads Rechte klären und GPS/EXIF entfernen. CDN-Dateien sind über die URL auch bei Entwürfen öffentlich erreichbar.
4. **Profilvorschau** zeigt den aktuellen Bearbeitungsstand im angemeldeten Studio. Sie unterstützt unvollständige Entwürfe mit einer Erklärung, veröffentlicht nichts und ist keine pixelgleiche Live-Website-Vorschau. Es gibt keinen öffentlichen Draft-Endpunkt und keine geteilten Vorschau-Token.
5. **Freigabe**: Sortiernummer (kleinere zuerst), Aktivität und bestätigte Angaben festlegen. Gleiche Nummern werden stabil nach Dokument-ID sortiert. Das erste aktive, freigegebene Profil erscheint auf der Startseite. **Auf der Website zeigen** wählen und veröffentlichen; Pflichtfelder, Zustimmung und hochgeladene Dateien werden geprüft. Fehler blockieren die Veröffentlichung. Ein Entwurf bleibt im Studio.
6. Bei der ersten Migration im Website-Build `SANITY_TRAINERS_ENABLED=true` sowie Projekt-ID und Dataset wie für die Galerie konfigurieren. Für das öffentliche Dataset bleibt der Lesetoken leer. Erst aktivieren, wenn alle vorgesehenen Profile freigegeben und veröffentlicht sind. Ohne Aktivierung bleibt Pierre aus den lokalen Daten erhalten. Bei aktiviertem CMS ist eine leere Liste ausdrücklich leer; Fehler oder Unpublishing stellen keine alten lokalen Profile wieder her.
7. Nach Veröffentlichung oder Änderung die Website erfolgreich neu bauen. Erst dann aktualisieren sich `/trainerpool` und der Startseiten-Teaser. Ohne angebundenen Build-Webhook ist dies weiterhin ein manueller Betriebsschritt. Ein fehlgeschlagener Build lässt die vorherige veröffentlichte Website bestehen.
8. Zum Zurückziehen **Zurückhalten** wählen und veröffentlichen, **Aktiver Trainer** deaktivieren und veröffentlichen oder die Veröffentlichung aufheben. Für die native Aktion oben **Veröffentlicht** auswählen, im Aktionsmenü **Unveröffentlichen** und danach **Jetzt zurückziehen** wählen. Der Entwurf bleibt erhalten. Zum Wiederherstellen auf **Entwurf** wechseln und **Veröffentlichen** wählen. Anschließend den erfolgreichen Website-Build abwarten und beide Seiten kontrollieren. Eine Datenänderung allein entfernt keine bereits gebauten Seiten oder CDN-Dateien.

## Publishing workflow (für Pierre)

The [automatic publishing runbook](../docs/CMS-PUBLISHING.md) records the Vercel connection and real acceptance sequence. Public hosting identifiers/admin URL and the build hook are configured. Coach migration and real publish/edit/unpublish/restore acceptance have passed. [Curated social link cards](../docs/issue-5-social-posts.md) are committed; accounts and activation remain pending.

1. **Alle Camp-Alben → Neues Camp-Album** öffnen. Titel, stabile Seitenadresse, bestätigtes Datum, Stadt und kurzen Rückblick eintragen.
2. Unter **Fotos & Videos** ein Foto oder Video hinzufügen. Der native Dateidialog bzw. Drag-and-drop im Uploadfeld lädt die Datei hoch. Bei jedem Medium unter **Galerie-Bereich** **On-Ice**, **Off-Ice** oder **Weitere Camp-Momente** wählen. Medien durch Ziehen neu anordnen; die Reihenfolge innerhalb jedes Bereichs folgt dieser Liste. Das erste gültige Medium der gesamten Liste liefert weiterhin das Titelbild. Ein Video-Vorschaubild übernimmt den Bereich des Videos und benötigt keine eigene Zuordnung.
3. Fotos: JPEG, PNG oder WebP, maximal 12 MB; Beschreibung und Urhebernachweis ergänzen. Videos: MP4 (H.264) oder WebM, maximal 100 MB, mit Vorschaubild, Urhebernachweis und vollständiger Textalternative. Es gibt kein automatisches Transcoding; große Videos vorab komprimieren.
4. Unter **Freigabe** Rechte/Einwilligungen bestätigen, **Auf der Website zeigen** auswählen und **Veröffentlichen** klicken. Pflichtfelder werden geprüft; Leerzeichen allein gelten nicht als Text. Fehler bei Albumdaten, Medien, Beschreibungen oder Urhebernachweisen blockieren die Veröffentlichung. Ein gespeicherter Entwurf erscheint nicht auf der Website. Studio und Website teilen diese Regeln; fehlerhafte freigegebene API-Inhalte lassen den Build mit einem Korrekturhinweis scheitern, statt Bilder oder Alben still zu entfernen.
5. Website neu bauen und deployen. Erst ein erfolgreiches Deployment aktualisiert `/galerie` und die Albumseiten. Der automatische Build-Webhook ist verbunden; Veröffentlichung, Änderung, Rücknahme und Wiederherstellung des Trainerprofils wurden auf der Review-Website erfolgreich geprüft. Die Abnahme mit echten Camp-Medien steht noch aus.
6. Zum Zurückziehen **Zurückhalten** wählen und veröffentlichen oder die Veröffentlichung aufheben. Danach die Website erneut bauen/deployen. Zurückgezogene Albumseiten werden im neuen statischen Build entfernt.

## Connect the website

Set these build-server variables in `web/.env` and the hosting build environment:

- `SANITY_PROJECT_ID` and `SANITY_DATASET`: the same project/dataset as Studio.
- `SANITY_READ_TOKEN`: leave blank for the public dataset; published content is read without an Authorization header. Optional private-dataset compatibility is retained: if explicitly configured later, use a dedicated read-only/Viewer token, never a `PUBLIC_*` or `SANITY_STUDIO_*` variable, browser code, screenshots or Git.
- `SANITY_TRAINERS_ENABLED=true`: opt in to CMS coach profiles after migration. Leave `false` until ready; this flag does not affect gallery activation.

The build uses the origin API and `published` perspective, excludes drafts/releases, and requires website visibility plus confirmed rights. Independent runtime validation rejects missing metadata, unsupported files, invalid dates and foreign asset URLs. A configured but broken/inaccessible API fails the build; it never silently deploys an empty gallery. With project, dataset and token blank, no CMS request is made and the gallery is honestly empty. Either project/dataset alone, or a token without both identifiers, is invalid configuration.

For automatic updates, configure a Sanity webhook calling the chosen host's secret build-hook URL. Include published `galleryCamp` and `trainer` create/update/delete events, exclude `drafts.**` and `versions.**`, and include unpublish/withdrawal events. Do not filter only on public visibility or activity, because withdrawal needs a rebuild too. Test publishing, editing and removing both an album and a trainer. Keep hook URLs private and out of Studio/browser code. No hosting vendor is required by this implementation. The existing protected Vercel review project is now connected through the tested shared configuration, including `socialPost`. A direct hook deployment succeeded. The real coach publishing acceptance passed on 25 October 2026: publish, edit, unpublish and restore each triggered a successful deployment. Coach migration is active; authentic camp-media publishing remains untested.

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
