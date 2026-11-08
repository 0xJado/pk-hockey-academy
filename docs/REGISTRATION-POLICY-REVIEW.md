# Anmeldung v2: Freigabeunterlage für Pierre

**Entwurf zur Entscheidung, keine Freigabe und keine fertigen Rechtstexte.** Onlineeingabe und Versand bleiben deaktiviert. Dieses Dokument enthält ausschließlich Fragen und bekannte Projektentscheidungen, keine privaten Antworten oder ausgefüllten Anmeldungen.

Review-Version: `registration-v2-review-2026-11-08`  
Review-Prüfsumme: `3e1d74396a4f3749d103532fbd51885e908bf7f7ddbc969a7011796f4795b556`  
Quelle: [unveränderte Anmeldung v2](../web/public/downloads/PK-Hockey-Academy-Anmeldung-v2.pdf), 2 Seiten, 203522 Bytes.  
PDF-SHA-256: `5ad3b2845008b09213280653fda49d6fb15882a4ddbfcb0ca975dc664162bff9`

## Was bereits feststeht

- Astro/Sanity bleiben erhalten. Anmeldungen sind für PHP und eine private STRATO-Datenbank vorgesehen; keine Google-Tabelle und keine Ablage in Sanity.
- Angebot bis U13, 60 Minuten On-Ice plus 60 Minuten Off-Ice. Bekannte Preise: 50 € für eine Einheit, 200 € für fünf Einheiten. Daraus folgen keine weiteren Paket- oder Zahlungsregeln.
- SpielerPlus betrifft nur Mehrfachbuchungen. Der genaue Ablauf ist noch offen; Einzeltermine werden nicht automatisch dorthin verwiesen.
- Das Original-PDF liegt bereits vor und wird nicht erneut angefordert oder verändert. Es enthält selbst einen Hinweis auf die rechtliche Prüfung.
- Die Formularvorlage legt keinen Pflichtstatus fest. Zwei Kontakt-/Unterschriftsbereiche bedeuten nicht automatisch zwei online verpflichtende Personen.

## Feld-, Zweck- und Pflichtmatrix

Für **jede** Zeile privat festhalten: online aufnehmen, weglassen oder einen getrennten freigegebenen Weg nutzen; dazu Zweck, Pflicht/optional und genaues Format. Sämtliche Entscheidungen sind offen. Die Fragen sind keine Empfehlung, die jeweiligen Daten tatsächlich zu erheben.

| ID | PDF-Seite / Abschnitt | Feld bzw. Auswahl der Papiervorlage | Prüffrage |
| --- | --- | --- | --- |
| `child-name` | 1 / 1 | Vor- und Nachname des Kindes | Welche Namensangaben werden zur Zuordnung benötigt? Getrennte Felder oder ein gemeinsames Feld? |
| `child-birth` | 1 / 1 | Geburtsdatum / Jahrgang | Jahrgang oder vollständiges Geburtsdatum? Welche konkrete Altersprüfung ist vorgesehen? Kein Stichtag wird unterstellt. |
| `child-team` | 1 / 1 | Verein / Mannschaft | Wozu wird Verein/Mannschaft benötigt? Wie werden Kinder ohne Verein erfasst? |
| `child-address` | 1 / 1 | Adresse des Kindes | Wird eine Postanschrift für diesen Anmeldeprozess benötigt? Zweck und gegebenenfalls Weglassen festlegen. |
| `child-city` | 1 / 1 | PLZ / Ort | Wird PLZ/Ort unabhängig von einer vollständigen Anschrift benötigt? Zweck und Format festlegen. |
| `child-position` | 1 / 1 | Feldspieler / Torwart | Eine oder mehrere Positionen? Wie ist die zusätzliche Linie im Papierlayout zu verstehen? Auswahl oder Freitext ausdrücklich festlegen. |
| `child-experience` | 1 / 1 | Besonderheiten / Erfahrungsstand | Welche Trainingsinformationen sind hier erwünscht? Umfang begrenzen und Abgrenzung zu Gesundheitsangaben klären. |
| `guardian-1-name` | 1 / 2 | Name erziehungsberechtigte Person 1 | Wer darf die Anmeldung abgeben und welche Namensangabe/Vertretungsbestätigung ist erforderlich? |
| `guardian-1-phone` | 1 / 2 | Telefon | Wofür wird die Telefonnummer verwendet und wann muss die Person erreichbar sein? |
| `guardian-1-email` | 1 / 2 | E-Mail | Ist dies der Rückmeldekanal? Was ist vorgesehen, falls keine E-Mail-Adresse angegeben wird? |
| `guardian-2-name` | 1 / 2 | Name erziehungsberechtigte Person 2 | In welchen Fällen wird eine zweite Person benötigt? Nicht automatisch als Pflichtangabe übernehmen. |
| `guardian-2-phone` | 1 / 2 | Telefon | Ist ein zweiter Telefonkontakt erforderlich oder entbehrlich? Abhängigkeit von Person 2 festlegen. |
| `guardian-2-email` | 1 / 2 | E-Mail | Ist ein zweiter E-Mail-Kontakt erforderlich oder entbehrlich? Abhängigkeit von Person 2 festlegen. |
| `emergency-name` | 1 / 2 | Notfallkontakt (Name) | Ist ein gesonderter Notfallkontakt nötig? Darf dies dieselbe Person wie der Hauptkontakt sein? |
| `emergency-phone` | 1 / 2 | Notfalltelefon | Welche erreichbare Nummer wird im Notfall verwendet? Abhängigkeit zum Notfallkontakt festlegen. |
| `pickup-persons` | 1 / 2 | Abholberechtigte Person(en) | Wofür und wann werden Abholberechtigte benötigt? Welche Angaben und welcher Änderungsweg sind vorgesehen? |
| `booking-type` | 1 / 3 | Ich buche eine einzelne Doppelstunde. / Ich buche die 5er-Buchung. | Wie wird zwischen Einzel- und 5er-Buchung gewählt und welchem Termin bzw. Vorgang wird die Anfrage zugeordnet? |
| `health-notes` | 1 / 4 | Allergien, Medikamente, Erkrankungen, Einschraenkungen oder wichtige Hinweise | Überhaupt online erheben, weglassen oder einen getrennten freigegebenen Weg nutzen? Falls online: Zweck, Umfang, Rechtsgrundlage, Zugriff und Löschung gesondert prüfen. |
| `health-confirmation` | 1 / 4 | Mein Kind ist sportgesund und kann am Eishockeytraining teilnehmen. | Wird diese Erklärung übernommen, geändert oder weggelassen? Bedeutung und Folgen einer fehlenden Bestätigung prüfen. |
| `insurance-cover` | 2 / 5 | Versicherungsschutz fuer das Kind ist vorhanden. | Welche Erklärung wird tatsächlich benötigt und wie ist eine fehlende Bestätigung zu behandeln? Geprüften Wortlaut referenzieren. |
| `liability-acknowledgement` | 2 / 5 | Haftungshinweise gelesen und verstanden. | Welche geprüften Hinweise werden zur Kenntnis gegeben? Nicht aus der Papiervorlage eine ungeprüfte Online-Regel ableiten. |
| `medical-first-aid` | 2 / 6 | Einverstanden / Nicht einverstanden | Wie sind Zustimmung und Ablehnung im tatsächlichen Ablauf zu verstehen? Wortlaut und Folgen rechtlich/fachlich prüfen. |
| `media-public-yes` | 2 / 7 | Ja, ich/wir willige(n) in die Nutzung von Foto- und Videoaufnahmen ein. | Für welche konkreten Zwecke/Medien und welchen Zeitraum soll diese Auswahl gelten? Verhältnis zur internen Analyse klären. |
| `media-public-no` | 2 / 7 | Nein, ich/wir willige(n) nicht in die Nutzung zu Werbe-/Oeffentlichkeitszwecken ein. | Wie wird eine Ablehnung eindeutig erfasst? Kombinationen mit der Ja-Auswahl und interner Analyse festlegen. |
| `media-internal-video` | 2 / 7 | Videoanalyse nur intern fuer Trainingsfeedback erlaubt. | Ist interne Trainingsanalyse ein eigener Zweck mit eigener Auswahl? Umfang, Empfänger, Speicherung und Widerrufsablauf klären. |
| `signature-location-date` | 2 / 8 | Ort, Datum | Ist eine Ortsangabe online nötig? Welche Datumsangabe bzw. technische Zeitdokumentation ist vorgesehen? |
| `guardian-1-signature` | 2 / 8 | Unterschrift erziehungsberechtigte Person 1 | Welche Online-Bestätigung soll die Papierunterschrift abbilden? Wortlaut und Nachweisverfahren ausdrücklich prüfen; keine Gleichwertigkeit unterstellen. |
| `guardian-2-signature` | 2 / 8 | Unterschrift erziehungsberechtigte Person 2 | Wann ist eine zweite Bestätigung erforderlich? Sonderfälle und Verfahren festlegen, ohne automatisch zwei Unterschriften zu verlangen. |

## Medienauswahl: ausdrücklich aufzulösende Fälle

| Papierauswahl | Offene Entscheidung |
| --- | --- |
| Öffentliches Ja und Nein zugleich | Welche Eingabe ist zulässig und welche Rückfrage/Fehlermeldung folgt? |
| Öffentliches Nein plus interne Videoanalyse | Sind dies unabhängig erlaubte Zwecke? Wortlaut und Auswahlmodell freigeben. |
| Öffentliches Ja ohne interne Auswahl | Deckt das interne Analyse ab oder braucht es eine gesonderte Entscheidung? |
| Keine Medienauswahl | Was bedeutet eine leere Auswahl? Keine Einwilligung aus dem Schweigen ableiten oder automatisch vorauswählen. |

## Datenumfang und Pflichtangaben

Entscheidung: `field-scope` — **offen**.

- Jede Zeile der Feldmatrix einzeln entscheiden: online erheben, weglassen oder getrennten freigegebenen Weg verwenden; Zweck, Format und Pflichtstatus festlegen.
- Wie wird eine Einzelanfrage einem echten Trainingstermin zugeordnet? Die Papiervorlage enthält kein eigenes Termin-/Datumsfeld dafür.
- Welche Validierungs- und Fehlermeldungstexte werden benötigt, ohne neue Teilnahmebedingungen zu erfinden?

## Erziehungsberechtigung und Online-Bestätigung

Entscheidung: `guardian-confirmation` — **offen**.

- Wer gibt die Anfrage ab, wer bestätigt welche Erklärung und wann wird eine zweite Person benötigt?
- Welche geprüfte Erklärung und welches Nachweisverfahren ersetzen oder ergänzen den Papierprozess?
- Keine gezeichnete, getippte oder qualifizierte Signatur und keine zusätzlichen Sorgerechtsdokumente ohne ausdrückliche Freigabe vorsehen.

## Gesundheit, Versicherung und Erstversorgung

Entscheidung: `health-insurance-medical` — **offen**.

- Ob Gesundheitsangaben überhaupt online erfasst werden, ist offen. Aufnahme, Umfang, Rechtsgrundlage, berechtigte Rollen und Löschregel gesondert entscheiden.
- Versicherungs-, Haftungs- und Erstversorgungstexte prüfen und den verbindlich freigegebenen Textstand referenzieren.
- Wie werden Ablehnung oder fehlende Bestätigung behandelt? Keine Teilnahmefolgen aus den Kästchen ableiten.

## Medienauswahl und Widerruf

Entscheidung: `media-withdrawal` — **offen**.

- Die drei Papierkästchen definieren noch kein eindeutiges Online-Auswahlmodell. Zulässige Kombinationen und die Bedeutung einer leeren Auswahl festlegen.
- Öffentlichkeitsnutzung und interne Videoanalyse jeweils nach Zweck, Medien, Empfängern und Dauer beschreiben; keine Vorauswahl übernehmen.
- Wer nimmt einen Widerruf entgegen, dokumentiert ihn und stoppt bzw. bearbeitet Veröffentlichungen? Bestehende Website-/Social-/Printnutzungen gesondert behandeln.
- Einwilligungsnachweise bleiben privat und werden nicht in das öffentliche Sanity-Medienarchiv geladen.

## Berechtigungen und Aufbewahrung

Entscheidung: `access-retention` — **offen**.

- Berechtigte Personen privat benennen; Lesen, Bearbeiten, Exportieren, Bestätigen und Löschen getrennt zuordnen. Gesundheitsangaben nicht automatisch für alle Coaches freigeben.
- Für offene, bestätigte, abgelehnte/zurückgezogene Anfragen sowie Gesundheits-, Mediennachweis-, Papier- und technische Daten jeweils Zweck, Fristbeginn, Dauer und Löschverantwortung festlegen.
- Wie werden Exporte, Papierkopien, Sicherungen und Wiederherstellungen in die Löschprozesse einbezogen? Keine Aufbewahrungsdauer voraussetzen.

## Eingang, Platzprüfung und Buchungsbestätigung

Entscheidung: `booking-response` — **offen**.

- Wer prüft eine Anfrage und wer bestätigt den Trainingsplatz? Eingangsnachweis und Buchungsentscheidung getrennt festlegen.
- Über welchen freigegebenen Kanal und durch wen erfolgen Rückfragen, Absagen und Bestätigungen? Keine Antwortfrist erfinden.
- SpielerPlus betrifft nur Mehrfachbuchungen. Zeitpunkt, Einladung/Linkart, zuständige Person und Elternanleitung bestätigen; kein Standardweg für Einzeltermine.
- Es wird keine automatische SpielerPlus-Synchronisierung oder funktionierende Einladung unterstellt.

## Papierabgabe und tatsächliche Buchungsregeln

Entscheidung: `paper-commercial-rules` — **offen**.

- Wer nimmt das Papierformular wann und wo entgegen? Welche Aussagen müssen in Papier und Online-Fassung übereinstimmen?
- Gültigkeit, Übertragbarkeit, Verwendung und Terminzuordnung der 5er-Buchung sowie tatsächliche Zahlungs-, Absage-, Umbuchungs- und Erstattungsregeln bestätigen.
- Die bekannten Preise 50 € und 200 € begründen keine zusätzlichen Regeln. Änderungen am Original-PDF erfolgen nur als ausdrücklich freigegebene neue Version.

## Datenschutzhinweise, Textstände und Freigabenachweis

Entscheidung: `notices-versions` — **offen**.

- Verantwortlichenangaben, Datenzwecke/Rechtsgrundlagen, Empfänger, Aufbewahrung und Betroffenenkontakt anhand der tatsächlichen Verarbeitung rechtlich prüfen.
- Freigegebene Hinweise und Erklärungen mit Version, Datum und privatem Freigabeverweis dokumentieren; die vorhandene PDF enthält selbst einen Prüfhinweis.
- Geschäftliche Freigabe durch Pierre und erforderliche rechtliche/datenschutzfachliche Prüfung separat dokumentieren. Ausgefüllte Formulare, private Namen oder Freigabeunterlagen nicht in öffentliche Issues schreiben.

## Aufbewahrung und Rollen: privat zu ergänzen

Für offene, bestätigte, abgelehnte/zurückgezogene Anfragen, Gesundheitsangaben, Mediennachweise/Widerrufe, Papierunterlagen und technische Sicherungen jeweils festlegen: Zweck, Fristbeginn, Dauer, berechtigte Rollen, Löschverantwortung und Umgang mit Kopien/Sicherungen. Hier wird keine Frist gesetzt und keine Person pauschal berechtigt.

Die rechtliche Prüfung muss zu den tatsächlichen Zwecken und Abläufen passen. Die Prüffragen betreffen insbesondere Datenumfang, Rechtsgrundlage, Einwilligungen, besondere Datenkategorien, Information und Löschung; die Einzelfallentscheidung ist offen. Referenz: [DSGVO, insbesondere Artikel 5, 6, 7, 9, 13 und 17](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

## Vorschlag für eine spätere technische Eingangsbestätigung

Nur zur Freigabe, noch nicht im Formular oder einem Versanddienst verwendet:

> Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.

Diese Meldung darf erst nach nachgewiesener technischer Annahme verwendet werden. Sie ersetzt keine Platzprüfung oder Buchungsbestätigung. Wer wann verbindlich bestätigt und welche Folgen das hat, muss Pierre festlegen und prüfen lassen. Die jetzige API nimmt keine Angaben an und gibt weiterhin HTTP 503 zurück.

## Private Antworten und verbindliche Freigabe

Pierre kann die Fragen in normalem Deutsch beantworten; die Arbeitsdatei dient der privaten Dokumentation durch die Entwicklung. Im Verzeichnis `web/` wird sie mit `npm run review:registration -- --init-private` unter `output/registration-private/policy-answers.3e1d74396a4f.local.json` im Projektstamm erzeugt. Dieser Pfad ist Git-ignoriert. Der Dateiname bindet sie an den Review-Stand. Vorhandene Antworten werden weder überschrieben noch automatisch in neue Versionen übernommen.

Je Feld: `collection` ist `include`, `omit` oder `separate_approved_channel`; `purpose` beschreibt den bestätigten Zweck bzw. den Grund für das Weglassen. Bei `include` werden `requiredness` als `required` oder `optional` und das genaue `format` eingetragen. Andernfalls lautet `requiredness` `not_applicable`. Je Prozessentscheidung gehören Beschreibung und privater Freigabeverweis zusammen. Dies sind Dokumentationswerte, keine bereits genehmigten Regeln.

Keine realen Anmeldungen, Gesundheitsangaben, Passwörter oder Einladungslinks in die Arbeitskopie schreiben; sensible Freigabeunterlagen nur über private Verweise referenzieren.

`npm run review:registration -- --status ../output/registration-private/policy-answers.3e1d74396a4f.local.json` zeigt nur Vollständigkeitszahlen, keine Antworten. Die Prüfung bestätigt weder Pierres Identität/Freigabe noch rechtliche Angemessenheit und kann die Registrierung nicht aktivieren. Geänderte Fragen, Quellformulierungen oder PDF-Versionen machen die Versionsbindung der Arbeitskopie ungültig.

Vor Abschluss von [Ticket #12](https://github.com/0xJado/pk-hockey-academy/issues/12) sind geschäftliche Freigabe, erforderliche fachliche/rechtliche Prüfung und die verbindlichen Text-/Prozessversionen privat nachzuweisen. Erst danach können #13 bis #15 die freigegebene Datenverarbeitung und Bedienung umsetzen und abnehmen. Hosting, ein ausgefülltes Arbeitsblatt oder ein erfolgreicher HTTP-Request sind dafür keine Freigabe.
