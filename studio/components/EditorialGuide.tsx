import {
  useCurrentUser,
  useDataset,
  useProjectId,
  type CurrentUser,
} from "sanity";
import "./editorial.css";

export function EditorialGuide() {
  const user = useCurrentUser();
  const projectId = useProjectId();
  const dataset = useDataset();
  return (
    <EditorialGuideContent
      user={user}
      projectId={projectId}
      dataset={dataset}
    />
  );
}

export function EditorialGuideContent({
  user,
  projectId,
  dataset,
}: {
  user: CurrentUser | null;
  projectId: string;
  dataset: string;
}) {
  if (!user)
    return (
      <div className="pk-editorial">
        <p>Bitte mit deinem freigeschalteten Sanity-Konto anmelden.</p>
      </div>
    );
  return (
    <div className="pk-editorial">
      <p className="pk-editorial-eyebrow">PK HOCKEY ACADEMY · REDAKTION</p>
      <h1>Inhalte pflegen. Sicher veröffentlichen.</h1>
      <p>
        Angemeldet als <strong>{user.name}</strong>. Projekt{" "}
        <code>{projectId}</code> · Dataset <code>{dataset}</code>.
      </p>
      <p>
        Zugewiesene Rollen:{" "}
        {user.roles.map((role) => role.title || role.name).join(", ") ||
          "Keine Rolle gemeldet"}
        . Die tatsächlichen Zugriffsrechte prüft Sanity serverseitig.
      </p>
      <aside className="pk-editorial-notice">
        <strong>Ein Entwurf ist noch keine Veröffentlichung.</strong>
        <p>
          Vorschau und Bearbeitung erfolgen im angemeldeten Studio. Die
          statische Website übernimmt freigegebene, veröffentlichte Inhalte erst
          nach einem erfolgreichen Website-Build. Der automatische Build-Hook
          ist verbunden. Die Übernahme der Trainerprofile ist aktiviert;
          Veröffentlichen und Zurückziehen starten automatisch einen neuen
          Build.
        </p>
      </aside>
      <p>
        Dieses CMS enthält öffentliche Website-Inhalte. Veröffentlichte
        Dokumente sind über Sanitys API lesbar, auch wenn „Zurückhalten“ sie von
        der Website ausschließt. Unveröffentlichte Texte im Entwurf lassen.
        Trainingsanmeldungen und Spielerangaben gehören in das separat
        vorgesehene private Google Sheet.
      </p>
      <section aria-labelledby="coach-guide">
        <h2 id="coach-guide">Trainerprofile</h2>
        <p>
          Wenn „Website bearbeiten“ eingerichtet ist: Dort Profiltext oder Foto
          in der echten Website-Vorschau anklicken und rechts bearbeiten. Über
          „Trainer hinzufügen“ ein neues Profil anlegen. Unvollständige Profile
          zeigen einen Hinweis, bis die Pflichtfelder ergänzt sind. Die
          Entwurfsvorschau zeigt auch zurückgehaltene Profile; sie
          veröffentlicht nichts.
        </p>
        <ol>
          <li>
            Unter „Inhalte → Alle Trainerprofile“ ein Profil anlegen oder
            öffnen.
          </li>
          <li>
            Name, Rolle, Biografie und bestätigten Hintergrund ergänzen.
            Qualifikationen und Schwerpunkte nur eintragen, wenn bestätigt. Ein
            Trainerfoto ist optional.
          </li>
          <li>
            Unter „Profilvorschau“ den aktuellen Bearbeitungsstand prüfen. Diese
            private Inhaltsvorschau ist keine Live-Website-Vorschau.
          </li>
          <li>
            Unter „Freigabe“ Reihenfolge, Aktivität und geprüfte Angaben
            festlegen. Kleinere Sortiernummern stehen zuerst; das erste
            sichtbare Profil erscheint auch auf der Startseite.
          </li>
          <li>
            „Auf der Website zeigen“ wählen und veröffentlichen. Danach den
            Website-Build ausführen lassen. Die CMS-Übernahme muss bei der
            Ersteinrichtung aktiviert werden.
          </li>
          <li>
            Zum Entfernen „Zurückhalten“ veröffentlichen, „Aktiver Trainer“
            deaktivieren und veröffentlichen oder die Veröffentlichung aufheben.
            Danach die Website neu bauen. Für „Veröffentlichung aufheben“
            gegebenenfalls zuerst die veröffentlichte Perspektive auswählen.
          </li>
        </ol>
      </section>
      <section aria-labelledby="media-kit-guide">
        <h2 id="media-kit-guide">Medienkit-Downloads</h2>
        <ol>
          <li>
            Unter „Inhalte → Medienkit-Downloads“ eine Datei anlegen. Nur
            bereits zur öffentlichen Weitergabe freigegebene Dateien hochladen.
          </li>
          <li>
            Titel, Beschreibung und öffentlichen Download-Dateinamen eintragen.
            Im Dateimenü die Datei hochladen, ersetzen oder entfernen. Format
            und Größe übernimmt die Website aus der Datei.
          </li>
          <li>
            Ein Vorschaubild und bestätigte Nutzungshinweise sind optional.
            Keine Lizenzbedingungen erfinden; ohne abgestimmten Wortlaut zeigt
            die Website einen entsprechenden Hinweis.
          </li>
          <li>
            Reihenfolge festlegen, Datei und Angaben bestätigen, „Auf der
            Website zeigen“ wählen und veröffentlichen. Fehler blockieren die
            Veröffentlichung.
          </li>
          <li>
            Nach erfolgreichem automatischem Build unter /medienkit den Download
            prüfen. Zum Entfernen „Zurückhalten“ veröffentlichen oder die
            Veröffentlichung aufheben. Eine leere Sammlung bleibt leer.
          </li>
        </ol>
        <p>
          PNG, JPEG, WebP und PDF bis 20 MB; ein optionales, vorab geprüftes ZIP
          bis 50 MB. CDN-Dateien bleiben über bestehende URLs abrufbar, auch
          wenn ein Download zurückgezogen wurde. Keine privaten Unterlagen
          hochladen. Für eine tatsächliche Dateilöschung erst Verweise entfernen
          und dann die native Asset-Verwaltung verwenden; CDN-Caches können
          verzögert reagieren.
        </p>
      </section>
      <section aria-labelledby="gallery-guide">
        <h2 id="gallery-guide">Camp-Galerie</h2>
        <ol>
          <li>
            Unter „Inhalte → Alle Camp-Alben“ ein Album mit bestätigtem Datum
            und Ort anlegen.
          </li>
          <li>
            Freigegebene Fotos/Videos hochladen, beschreiben und On-Ice, Off-Ice
            oder weiteren Camp-Momenten zuordnen. Reihenfolge per Ziehen
            festlegen.
          </li>
          <li>
            Rechte und Einwilligungen prüfen, „Auf der Website zeigen“ wählen
            und veröffentlichen. Danach die Website neu bauen; auch Rücknahmen
            benötigen einen neuen Build.
          </li>
        </ol>
        <p>
          CDN-Dateien sind über ihre URL öffentlich abrufbar, auch bei
          Entwürfen. Vor Uploads Rechte klären und GPS/EXIF entfernen. Keine
          privaten Rohaufnahmen, Kinderdaten oder Einwilligungsdokumente
          hochladen.
        </p>
      </section>
      <section aria-labelledby="social-guide">
        <h2 id="social-guide">Ausgewählte Social-Beiträge</h2>
        <p>
          Unter „Inhalte → Ausgewählte Social-Beiträge“ bestätigte
          Academy-Beiträge als Linkkarten anlegen. Plattform, direkten
          Beitragslink, eigenen Begleittext und Reihenfolge eintragen. Angaben
          prüfen, Website-Freigabe wählen und veröffentlichen.
        </p>
        <p>
          Die Website zeigt höchstens sechs Karten und lädt keine
          Plattform-Skripte. Ist ein Beitrag privat, gelöscht oder nicht mehr
          verfügbar, den Status ändern und einen Academy-Profillink als
          Alternative hinterlegen oder die Karte zurückziehen. Die Verfügbarkeit
          wird manuell geprüft. Academy-Social-Konten und die erste Aktivierung
          stehen noch aus.
        </p>
      </section>
      <section aria-labelledby="access-guide">
        <h2 id="access-guide">Zugriff und Rollen</h2>
        <div className="pk-editorial-table">
          <table>
            <caption>
              Im Free-Tarif sind Administrator und Viewer verfügbar. Weitere
              Rollen hängen vom Tarif ab.
            </caption>
            <thead>
              <tr>
                <th scope="col">Rolle</th>
                <th scope="col">Aufgabe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Administrator</th>
                <td>
                  Projekt, Zugänge und Konfiguration verwalten. Für den
                  Eigentümer und ausdrücklich von ihm autorisierte Personen.
                </td>
              </tr>
              <tr>
                <th scope="row">Editor</th>
                <td>
                  Inhalte und Medien bearbeiten und veröffentlichen; sofern im
                  Tarif verfügbar.
                </td>
              </tr>
              <tr>
                <th scope="row">Contributor</th>
                <td>
                  Entwürfe bearbeiten, ohne Veröffentlichungsrecht; sofern im
                  Tarif verfügbar.
                </td>
              </tr>
              <tr>
                <th scope="row">Viewer</th>
                <td>
                  Inhalte lesen; kein Bearbeitungs- oder Veröffentlichungsrecht.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Einladungen und Entzug von Mitgliedschaften erfolgen durch den
          Verantwortlichen in{" "}
          <a href={`https://www.sanity.io/manage/project/${projectId}`}>
            Sanity Manage
          </a>
          . Diese Hilfe vergibt keine Rechte. Rollen können Rechte addieren;
          eine zusätzliche breite Rolle kann eine engere Einschränkung aufheben.
        </p>
      </section>
      <section aria-labelledby="account-guide">
        <h2 id="account-guide">Abmelden und Konto schützen</h2>
        <p>
          Zum Abmelden das Benutzer-/Profilmenü in der Studio-Navigation öffnen
          und „Abmelden“ beziehungsweise „Sign out“ wählen. Auf gemeinsam
          genutzten Geräten anschließend alle Studio-Tabs schließen.
        </p>
        <p>
          Verwende ein eigenes Konto und die bei der Einladung verwendete
          Anmeldemethode. Aktiviere Mehrfaktor-Authentifizierung beim
          verwendeten Google-/GitHub-Anbieter oder beim eingerichteten
          Identitätsanbieter. Die Website und diese Hilfe können MFA weder
          aktivieren noch bestätigen.
        </p>
        <p>
          Bei verlorenem Zugang den{" "}
          <a href="https://www.sanity.io/docs/help/account-recovery">
            offiziellen Sanity-Wiederherstellungsweg
          </a>{" "}
          verwenden und den Projektverantwortlichen kontaktieren. Ein anderer
          Anmeldeanbieter kann ein separates Konto ohne bestehende
          Mitgliedschaft erzeugen.
        </p>
      </section>
      <section aria-labelledby="publish-guide">
        <h2 id="publish-guide">Nach dem Website-Build prüfen</h2>
        <ol>
          <li>
            Trainerpool, Startseite oder betroffenes Camp-Album auf der
            Review-Website öffnen.
          </li>
          <li>
            Inhalte, Bildbeschreibungen und mobile Ansicht prüfen.
            Zurückgezogene Profile/Alben dürfen nicht mehr erscheinen.
          </li>
          <li>
            Bei einem fehlgeschlagenen Build bleibt die vorherige Website
            bestehen. Einen fehlgeschlagenen Build nicht als erfolgreiche
            Veröffentlichung behandeln.
          </li>
        </ol>
      </section>
    </div>
  );
}
