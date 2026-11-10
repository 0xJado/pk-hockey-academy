# Anmeldung v2: Freigabeunterlage für Pierre

**Quellenreview der Papiervorlage, keine Aktivierungsfreigabe und keine fertigen Rechtstexte.** Die Produktentscheidungen vom 10. November stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); Aufbewahrung und Zugriff sind in den [Betriebsregeln](DATENSCHUTZ-BETRIEBSREGELN.md) festgelegt. Diese Quellfragen öffnen bereits getroffene Entscheidungen nicht erneut. Onlineeingabe und Versand bleiben deaktiviert. Keine privaten Antworten oder ausgefüllten Anmeldungen hier eintragen.

Review-Version: `registration-v2-review-2026-11-10`

Review-Prüfsumme: `ac859e116e06b7deb8ed676cddc945edbfd278bb3e0e2c48850b7e2e9076fea2`

Quelle: [unveränderte Anmeldung v2](../web/public/downloads/PK-Hockey-Academy-Anmeldung-v2.pdf), 2 Seiten, 203522 Bytes.

PDF-SHA-256: `5ad3b2845008b09213280653fda49d6fb15882a4ddbfcb0ca975dc664162bff9`

## Was bereits feststeht

- Astro/Sanity bleiben erhalten. Anmeldungen sind für PHP und eine private STRATO-Datenbank vorgesehen; keine Google-Tabelle und keine Ablage in Sanity.
- Angebot bis U13, 60 Minuten On-Ice plus 60 Minuten Off-Ice. Bekannte Preise: 50 € für eine Einheit, 200 € für fünf Einheiten. Daraus folgen keine weiteren Paket- oder Zahlungsregeln.
- SpielerPlus ist ein vollständig eigenständiger Vorgang außerhalb der Website. Keine Integration, automatische Einladung, Datenübertragung oder SpielerPlus-Abnahme als Launch-Voraussetzung vorsehen.
- Das Original-PDF liegt bereits vor und wird nicht erneut angefordert oder verändert. Es enthält selbst einen Hinweis auf die rechtliche Prüfung.
- Die Formularvorlage legt keinen Pflichtstatus fest. Zwei Kontakt-/Unterschriftsbereiche bedeuten nicht automatisch zwei online verpflichtende Personen.

## Feld-, Zweck- und Pflichtmatrix

Die Zuordnung aller 28 Papierfelder/-auswahlen mit Zweck, Pflichtstatus und Format ist im Startmodell festgelegt. Die folgende Tabelle bewahrt die Quellfragen zur Nachvollziehbarkeit; sie ist keine offene 28-Punkte-Aufgabenliste für Pierre. Zusätzliche private Abweichungen werden nur bei tatsächlichem Bedarf dokumentiert.

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
| `health-notes` | 1 / 4 | Allergien, Medikamente, Erkrankungen, Einschraenkungen oder wichtige Hinweise | Die vorgesehenen optionalen Gesundheitshinweise gegen das Startmodell und die getrennte ausdrückliche Einwilligung abgleichen; Umfang, Zugriff und Löschung sind in den Betriebsregeln festgelegt. |
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

## Medienauswahl: festgelegtes Startmodell

| Papierauswahl | Online-Abbildung |
| --- | --- |
| Öffentliches Ja und Nein zugleich | Kein widersprüchliches Kästchenpaar übernehmen; getrennte optionale Zwecke verwenden. |
| Öffentliches Nein plus interne Videoanalyse | Unabhängige Auswahl; interne Analyse erlaubt keine Veröffentlichung. |
| Öffentliches Ja ohne interne Auswahl | Keine interne Analyse aus einer Veröffentlichungsfreigabe ableiten. |
| Keine Medienauswahl | Keine Erlaubnis für den jeweiligen Zweck; keine Vorauswahl. |

## Datenumfang und Pflichtangaben

Quellenreview: `field-scope`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Jede Zeile der Feldmatrix einzeln entscheiden: online erheben, weglassen oder getrennten freigegebenen Weg verwenden; Zweck, Format und Pflichtstatus festlegen.
- Wie wird eine Einzelanfrage einem echten Trainingstermin zugeordnet? Die Papiervorlage enthält kein eigenes Termin-/Datumsfeld dafür.
- Welche Validierungs- und Fehlermeldungstexte werden benötigt, ohne neue Teilnahmebedingungen zu erfinden?

## Erziehungsberechtigung und Online-Bestätigung

Quellenreview: `guardian-confirmation`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Wer gibt die Anfrage ab, wer bestätigt welche Erklärung und wann wird eine zweite Person benötigt?
- Welche geprüfte Erklärung und welches Nachweisverfahren ersetzen oder ergänzen den Papierprozess?
- Keine gezeichnete, getippte oder qualifizierte Signatur und keine zusätzlichen Sorgerechtsdokumente ohne ausdrückliche Freigabe vorsehen.

## Gesundheit, Versicherung und Erstversorgung

Quellenreview: `health-insurance-medical`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Optionale Gesundheitsangaben mit gesonderter Einwilligung sind vorgesehen; Datenumfang, Zugriff und Löschung anhand des Startmodells und der Betriebsregeln umsetzen, nicht erneut als offene Grundsatzfrage behandeln.
- Versicherungs-, Haftungs- und Erstversorgungstexte prüfen und den verbindlich freigegebenen Textstand referenzieren.
- Wie werden Ablehnung oder fehlende Bestätigung behandelt? Keine Teilnahmefolgen aus den Kästchen ableiten.

## Medienauswahl und Widerruf

Quellenreview: `media-withdrawal`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Die drei Papierkästchen definieren noch kein eindeutiges Online-Auswahlmodell. Zulässige Kombinationen und die Bedeutung einer leeren Auswahl festlegen.
- Öffentlichkeitsnutzung und interne Videoanalyse jeweils nach Zweck, Medien, Empfängern und Dauer beschreiben; keine Vorauswahl übernehmen.
- Wer nimmt einen Widerruf entgegen, dokumentiert ihn und stoppt bzw. bearbeitet Veröffentlichungen? Bestehende Website-/Social-/Printnutzungen gesondert behandeln.
- Einwilligungsnachweise bleiben privat und werden nicht in das öffentliche Sanity-Medienarchiv geladen.

## Berechtigungen und Aufbewahrung

Quellenreview: `access-retention`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Die gewählten Rollen, Fristen und Verantwortlichkeiten aus den Datenschutz-Betriebsregeln umsetzen und nachweisen.
- Löschung jeder Kategorie, Exporte, Sicherungen und Wiederherstellung gegen diese Regeln prüfen; keine zusätzlichen Fristen erfinden.

## Eingang, Platzprüfung und Buchungsbestätigung

Quellenreview: `booking-response`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Eingang erst nach dauerhafter Speicherung bestätigen; Pierre prüft und bestätigt eine Buchung persönlich per STRATO-E-Mail.
- Keine garantierten Plätze oder erfundenen Antwortfristen; keine Gesundheitsdetails in Benachrichtigungsmails.
- SpielerPlus ist vollständig außerhalb der Website organisiert und keine Prüf- oder Freigabeabhängigkeit.

## Papierabgabe und tatsächliche Buchungsregeln

Quellenreview: `paper-commercial-rules`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Die Papiervorlage bleibt unverändert; keine ungeprüfte Signatur-, Haftungs- oder Versicherungsregel automatisch in die Onlineanfrage übernehmen.
- Einzeltermin oder 5er-Paket als Anfrage anbieten; keine Onlinezahlung oder erfundenen Zahlungs-, Absage- oder Paketbedingungen. Erforderliche Bedingungen vor verbindlicher Bestätigung persönlich klären.

## Datenschutzhinweise, Textstände und Freigabenachweis

Quellenreview: `notices-versions`. Aktuelle Produktentscheidungen stehen im [einfachen Startmodell](REGISTRATION-LAUNCH-POLICY.md); die folgenden Punkte dienen dem Abgleich, nicht einer erneuten Abfrage bereits festgelegter Regeln.

- Verantwortlichenangaben, Datenzwecke/Rechtsgrundlagen, Empfänger, Aufbewahrung und Betroffenenkontakt anhand der tatsächlichen Verarbeitung rechtlich prüfen.
- Freigegebene Hinweise und Erklärungen mit Version, Datum und privatem Freigabeverweis dokumentieren; die vorhandene PDF enthält selbst einen Prüfhinweis.
- Geschäftliche Freigabe durch Pierre und erforderliche rechtliche/datenschutzfachliche Prüfung separat dokumentieren. Ausgefüllte Formulare, private Namen oder Freigabeunterlagen nicht in öffentliche Issues schreiben.

## Aufbewahrung und Rollen: bereits festgelegt

Die Datenschutz-Betriebsregeln definieren die gewählten Fristen, Auslöser, Zugriffe und Verantwortlichkeiten. Diese nicht erneut als unbeantwortete Fragen behandeln; Implementierung und tatsächliche Lösch-/Zugriffskontrollen bleiben nachzuweisen. Keine gesetzliche Pflicht zur pauschalen Archivierung aller Anmeldedaten daraus ableiten.

Die rechtliche Prüfung muss zu den tatsächlichen Zwecken und Abläufen passen. Die Prüffragen betreffen insbesondere Datenumfang, Rechtsgrundlage, Einwilligungen, besondere Datenkategorien, Information und Löschung; die Einzelfallentscheidung ist offen. Referenz: [DSGVO, insbesondere Artikel 5, 6, 7, 9, 13 und 17](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

## Vorschlag für eine spätere technische Eingangsbestätigung

Für das Startmodell gewählt, noch nicht im Formular oder einem Versanddienst verwendet:

> Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.

Diese Meldung darf erst nach nachgewiesener dauerhafter Speicherung verwendet werden. Sie ersetzt keine Platzprüfung oder Buchungsbestätigung. Pierre bestätigt die Buchung persönlich; weitere Bedingungen werden nicht erfunden. Die jetzige API nimmt keine Angaben an und gibt weiterhin HTTP 503 zurück.

## Private Antworten und verbindliche Freigabe

Pierre kann die Fragen in normalem Deutsch beantworten; die Arbeitsdatei dient der privaten Dokumentation durch die Entwicklung. Im Verzeichnis `web/` wird sie mit `npm run review:registration -- --init-private` unter `output/registration-private/policy-answers.ac859e116e06.local.json` im Projektstamm erzeugt. Dieser Pfad ist Git-ignoriert. Der Dateiname bindet sie an den Review-Stand. Vorhandene Antworten werden weder überschrieben noch automatisch in neue Versionen übernommen.

Das Arbeitsblatt ist nur für zusätzliche private Nachweise oder Abweichungen vorgesehen; ein leeres altes Blatt bedeutet nicht, dass die im Startmodell bereits gewählten Produktregeln offen sind. Je Feld: `collection` ist `include`, `omit` oder `separate_approved_channel`; `purpose` beschreibt den Zweck bzw. das Weglassen. Bei `include` werden `requiredness` als `required` oder `optional` und das genaue `format` eingetragen; sonst `not_applicable`. Eine vollständig ausgefüllte Datei ist keine eigenständige Aktivierungs- oder Rechtsfreigabe.

Keine realen Anmeldungen, Gesundheitsangaben, Passwörter oder Einladungslinks in die Arbeitskopie schreiben; sensible Freigabeunterlagen nur über private Verweise referenzieren.

`npm run review:registration -- --status ../output/registration-private/policy-answers.ac859e116e06.local.json` zeigt nur Vollständigkeitszahlen, keine Antworten. Die Prüfung bestätigt weder Pierres Identität/Freigabe noch rechtliche Angemessenheit und kann die Registrierung nicht aktivieren. Geänderte Fragen, Quellformulierungen oder PDF-Versionen machen die Versionsbindung der Arbeitskopie ungültig.

Die Nutzerentscheidung vom 10. November legt das einfache Produktmodell fest. #13 bis #15 setzen dessen Datenverarbeitung und Bedienung um; vor echten Daten bleiben technische Abnahme, konkrete Textstände und erforderlicher rechtlicher/Provider-Abgleich nachzuweisen. Die Papiervorlage gilt dadurch nicht als rechtlich geprüft. SpielerPlus ist keine Freigabeabhängigkeit. Hosting, ein ausgefülltes Arbeitsblatt oder ein erfolgreicher HTTP-Request aktivieren keine Registrierung.
