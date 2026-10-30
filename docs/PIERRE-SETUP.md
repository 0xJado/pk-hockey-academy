# PK Hockey Academy — Einrichtung für Pierre

Stand: 25. Oktober 2026.

Die aktualisierte [Checkliste vom 30. Oktober](PIERRE-CHECKLIST.md) nennt alle noch benötigten Entscheidungen und Inhalte. Sanity einschließlich Website-Klickbearbeitung ist inzwischen eingerichtet; dafür kein neues Konto oder Projekt erstellen. Die folgenden Einrichtungsschritte bleiben als Anleitung erhalten.

Mit dieser Anleitung bereitest du die Website-Verwaltung und die private Tabelle für Trainingsanmeldungen vor. Du behältst die Kontrolle über beide Konten. Die technische Verbindung zur Website übernimmt anschließend die Entwicklung.

**Aktueller Stand:** Die Academy-E-Mail-Adressen sowie das Sanity-Konto und -Projekt wurden vom Entwickler angelegt. Das öffentliche Dataset ist lokal mit Studio und Website verbunden; die Redaktion ist unter [pk-hockey-academy.sanity.studio](https://pk-hockey-academy.sanity.studio/) bereitgestellt. Anmeldung, Trainerbearbeitung, private Profilvorschau, Camp-Alben und deutsche Redaktionshilfe sind geprüft; das Academy-Konto hat laut Studio die Rolle Administrator. Pierres bestätigtes Startprofil ist freigegeben und veröffentlicht. Die Trainerübernahme und automatische Aktualisierung sind aktiv; Veröffentlichen, Ändern, Zurückziehen und Wiederherstellen wurden auf der geschützten Review-Website geprüft. Echte Camp-Medien und Kontowiederherstellung bleiben gesonderte Abnahmepunkte. Die private Google-Tabelle ist noch nicht verbunden; das Online-Anmeldeformular nimmt weiterhin keine Eingaben entgegen.

| Dienst | Wofür wir ihn verwenden |
| --- | --- |
| Sanity Free | Öffentliche Website-Inhalte, zunächst Trainerprofile und Camp-Galerien. |
| Private Google-Tabelle | Später eine Zeile pro eingegangener Trainingsanmeldung; Zugriff nur für berechtigte Personen und den eingerichteten technischen Schreibzugang. |

## 1. Sanity für die Website einrichten

Konto und Projekt sind bereits angelegt; die Anmeldung wurde geprüft. Die folgenden Schritte bleiben als Dokumentation erhalten; dafür kein zweites Projekt erstellen. Verwende im oben verlinkten Studio die Academy-E-Mail und dieselbe Anmeldemethode **E-Mail/Passwort**. Als Nächstes den vorbereiteten Trainerentwurf inhaltlich prüfen.

1. Öffne [Sanity](https://www.sanity.io/get-started) und lege dein eigenes Konto an. Nutze eine E-Mail-Adresse und Anmeldemethode, auf die du dauerhaft zugreifen kannst. Verwende später dieselbe Anmeldemethode.
2. Öffne [Sanity Manage](https://www.sanity.io/manage) und erstelle ein Projekt mit dem Namen **PK Hockey Academy**. Falls eine Organisation ausgewählt werden soll, verwende eine von dir verwaltete Academy-Organisation. Du behältst die Administratorrolle.
3. Verwende den Tarif **Free**. Für diese Einrichtung ist kein kostenpflichtiger Tarif vorgesehen. Unser Ansatz verwendet ein **öffentliches Dataset**, üblicherweise mit dem Namen `production`. Wenn dir die Dataset-Einstellung unklar ist, lass sie uns gemeinsam vornehmen. Ein zweites Website- oder Studio-Starterprojekt wird nicht benötigt; der vorhandene Code ist vorbereitet.
4. Notiere die **Project ID** aus der Projektübersicht. Falls du bereits ein Dataset angelegt hast, notiere auch dessen Namen. Die Project ID ist eine öffentliche Kennung und kein Passwort.
5. Gib diese Angaben an die Entwicklung weiter. Die technischen Einstellungen nehmen wir nach autorisiertem Zugriff vor; deine Anmeldung führst du selbst aus.

Ein einzelnes Konto auf deinen Namen reicht aus. Falls der Entwickler unabhängig auf Sanity zugreifen soll, kannst du sein eigenes Konto später unter **Members** einladen. Free unterstützt derzeit bis zu 20 Konten. Für Einrichtung und Bearbeitung wäre dort **Administrator** nötig; **Viewer** erlaubt nur Lesen. Die umfassende Administratorfreigabe entscheidest du ausdrücklich selbst. Ein zusätzliches Konto erfordert innerhalb der Free-Grenzen kein kostenpflichtiges Abo. [Sanity-Tarife und Rollen](https://www.sanity.io/pricing)

**Welche Inhalte gehören hinein?** Nur Material, das für die öffentliche Nutzung geeignet und freigegeben ist. Veröffentlichte Dokumente sind über Sanitys API lesbar, auch wenn sie mit „Zurückhalten“ von der Academy-Website ausgeschlossen werden. Unveröffentlichte Entwürfe benötigen einen berechtigten Zugang. Hochgeladene Medien sind über ihre CDN-URL abrufbar, auch bei Entwürfen. Spielerlisten, Anmeldungen, Gesundheitsdaten und Einwilligungsunterlagen gehören deshalb nicht in Sanity. [Sanity: Entwürfe](https://www.sanity.io/docs/content-lake/drafts-and-versions), [Medienzugriff](https://www.sanity.io/docs/content-lake/keeping-your-data-safe)

Die ausführliche Sanity-Anleitung steht in [Sanity-Ersteinrichtung für Pierre](../studio/OWNER-SETUP.md).

## 2. Die private Google-Tabelle anlegen

Hier verwenden wir **Google Tabellen / Google Sheets**, also eine Tabelle mit Zeilen und Spalten.

1. Melde dich mit einem Google-Konto an, das du dauerhaft selbst für die Academy verwaltest. Die Tabelle soll unter deiner Kontrolle liegen.
2. Öffne [Google Tabellen](https://sheets.google.com) und erstelle eine **leere Tabelle**. Eine bestehende Tabelle mit privaten Daten wird nicht benötigt. [Google-Anleitung zur Erstellung](https://support.google.com/docs/answer/6000292?hl=de)
3. Nenne die Datei **PK Hockey Academy – Anmeldungen**. Benenne den ersten Tabellenreiter unten in **Anmeldungen** um. Das ist der vorgeschlagene Zielname für die spätere Verbindung.
4. Lass die Tabelle zunächst leer. Die Spalten richten wir passend zu den tatsächlich freigegebenen Formularfeldern ein. Noch keine echten Spieler- oder Elterndaten eintragen.
5. Öffne oben rechts **Freigeben**. Prüfe unter **Allgemeiner Zugriff**, dass **Eingeschränkt** eingestellt ist. Verwende keine Freigabe für alle Personen mit dem Link und keine Veröffentlichung im Web. [Google: Freigaben verwalten](https://support.google.com/drive/answer/2494822?hl=de)
6. Prüfe die Liste der Personen mit Zugriff. Zunächst reicht dein eigenes Konto als **Inhaber**. Falls die Datei in einem bereits freigegebenen Ordner liegt, prüfe auch dessen Zugriffe: Ordnerfreigaben können auf die Tabelle vererbt werden. Wähle einen privaten Ablageort, wenn darüber weitere Personen Zugriff hätten. [Google: vererbte Freigaben](https://support.google.com/drive/answer/2494822?hl=de)
7. Soll später eine bestimmte Person Anmeldungen nur ansehen, genügt **Betrachter**. Nur wer Einträge ändern soll, braucht **Bearbeiter**. Welche Personen Zugriff erhalten, entscheidest du; es werden keine Mitarbeiteradressen vorausgesetzt.
8. Kopiere die Tabellenadresse aus der Browserzeile und gib sie der Entwicklung privat weiter. Dazu den Dateinamen und den Reiternamen **Anmeldungen** nennen. Die vollständige Adresse reicht aus; die technische Tabellen-ID können wir daraus entnehmen. [Google: Tabellen-ID](https://developers.google.com/workspace/sheets/api/guides/concepts)

**Mit diesen Schritten ist die Tabelle vorbereitet, aber noch nicht mit dem Formular verbunden.** Du musst keine Passwörter oder Schlüsseldateien verschicken und keinen Apps-Script-Code einfügen.

## 3. Diese Angaben gibst du uns zurück

Die folgenden Angaben über einen privaten Kanal zurückgeben. In dieser öffentlich versionierbaren Anleitung bleiben die Felder leer.

```text
Sanity
Project ID:
Dataset-Name, falls bereits angelegt:
Tarif: Free

Google Tabellen
Link zur Datei:
Verwendetes Inhaberkonto:
Tabellenreiter: Anmeldungen
Allgemeiner Zugriff: Eingeschränkt
Weitere ausdrücklich berechtigte Personen, falls gewünscht:
```

Keine Passwörter, Zugangstokens, Schlüsseldateien oder ausgefüllten Anmeldungen in diese Rückmeldung aufnehmen.

## 4. Was die Entwicklung danach übernimmt

Für Sanity verbinden wir das Projekt mit dem vorhandenen Studio und der Website, richten die automatische Website-Aktualisierung ein und prüfen Anmeldung, Bearbeitung und Veröffentlichung. Danach zeigst du einmal selbst eine typische Inhaltsänderung.

Für Google Tabellen richten wir den technischen Schreibzugang und die serverseitige Formularverarbeitung ein. Falls dafür eine gesonderte Konto-Adresse benötigt wird, erhältst du genau diese Adresse zur gezielten Freigabe **dieser Tabelle** als Bearbeiter. Die Adresse wird erst nach der technischen Einrichtung mitgeteilt; es gibt aktuell noch keine solche Freigabe.

Die geplante Übertragung lautet: **Website-Formular → geprüfte serverseitige Verarbeitung → private Tabelle**. Eine erfolgreich übermittelte Anmeldung soll eine neue Zeile erzeugen. Fehler müssen sichtbar bleiben; eine Tabellenzeile ist noch keine Zusage für einen Trainingsplatz. Die Google-Anbindung wird erst nach echten Erfolgs- und Fehlertests aktiviert.

## 5. Vor der Aktivierung der Anmeldung noch festlegen

- Welche Angaben tatsächlich erfasst werden und welche Pflichtfelder sind. Die vorhandene Papiervorlage legt das noch nicht vollständig fest; Gesundheitsangaben werden nicht automatisch zu Tabellenspalten.
- Welche Datenschutz-, Zustimmungs- und Online-Bestätigungsformulierungen freigegeben werden. Auch die Umsetzung der Unterschriften muss vereinbart werden.
- Wer Anmeldungen bearbeiten darf und wie lange sie aufbewahrt bzw. wann und durch wen sie gelöscht werden.
- Wo Papierformulare abgegeben werden und wie der Übergang zu SpielerPlus bei mehreren gebuchten Einheiten funktioniert. Einzelbuchungen laufen nicht standardmäßig über SpielerPlus.

Bis diese Punkte und die technische Anbindung geklärt sind, bleibt die Online-Anmeldung deaktiviert. Die blanke PDF-Vorlage ist bereits als Download verfügbar.

Technische Details für die Entwicklung stehen in den [Registrierungsnotizen](issue-3-registration.md). Google dokumentiert das zeilenweise Schreiben über die [Sheets-API](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append).
