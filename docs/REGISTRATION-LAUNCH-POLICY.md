# Anmeldung: einfaches Startmodell

Stand und Produktentscheidung: 10. November 2026. Der Nutzer hat die Ausgestaltung möglichst einfach beauftragt und SpielerPlus vollständig aus dem Website-Arbeitsablauf genommen. Dieses Dokument konkretisiert die bereits gewählten [Datenschutz-Betriebsregeln](DATENSCHUTZ-BETRIEBSREGELN.md). Es ist die Umsetzungsvorgabe für #13–#15, keine Behauptung einer laufenden Anmeldung oder einer abgeschlossenen rechtlichen Freigabe.

## Ein Vorgang: Trainingsanfrage

1. Eltern wählen Einzeltermin oder 5er-Paket. Angezeigt werden ausschließlich die bestätigten Preise 50 € beziehungsweise 200 € und die bekannten 60 Minuten On-Ice plus 60 Minuten Off-Ice.
2. Bei einer Einzeltermin-Anfrage wird ein tatsächlich veröffentlichter, anfragbarer Termin ausgewählt; der Server prüft dessen ID erneut. Keine erfundenen Termine oder automatisch zugesagten Plätze. Beim Paket genügt die Paketwahl; Terminabstimmung übernimmt Pierre.
3. Ein erziehungsberechtigter Hauptkontakt gibt die notwendigen Angaben und seine Berechtigung an. Weitere Angaben und Einwilligungen bleiben getrennt und freiwillig.
4. Erst nach nachgewiesener dauerhafter Speicherung erscheint: „Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.“ Bei Fehlern keine Erfolgsmeldung.
5. Pierre prüft die Anfrage und meldet sich über STRATO-E-Mail. Erst die ausdrückliche Bestätigung der Academy macht eine Buchung verbindlich; das entspricht dem Hinweis der Papiervorlage. Eine technische Eingangsbestätigung ist keine Buchungsbestätigung. Keine erfundene Antwortfrist.

Button: **Trainingsanfrage senden**. Kein Checkout, keine Zahlung, keine automatische Reservierung, keine automatische Teilnahmezusage. Zahlungs-, Absage-, Erstattungs-, Übertragbarkeits- oder Paketgültigkeitsbedingungen werden nicht erfunden oder durch ein pauschales Kästchen akzeptiert. Soweit im konkreten Fall erforderlich, klärt Pierre diese vor der verbindlichen Bestätigung; entsprechende Angaben und rechtliche Prüfung bleiben Teil der Launch-Abnahme (#17/#19).

## Ein Kontakt, wenige Pflichtangaben

Alle Längen sind technische Obergrenzen für die Umsetzung, keine Aufforderung zur Angabe zusätzlicher Informationen. Freitext als Text behandeln; keine Uploads, Diagnosendokumente oder versteckten Zusatzfelder annehmen.

| Papier-ID | Onlineentscheidung und Zweck | Pflicht / Format |
| --- | --- | --- |
| `child-name` | Kind der Anfrage zuordnen | Pflicht; gemeinsames Namensfeld, höchstens 120 Zeichen |
| `child-birth` | Trainingsgruppe zuordnen | Pflicht; vierstelliger Jahrgang, kein vollständiges Geburtsdatum. U13-/Gruppenzuordnung durch Pierre, kein erfundener Saisonstichtag |
| `child-team` | Trainingsplanung | Optional; Verein/Mannschaft gemeinsam, höchstens 160 Zeichen; vereinslose Kinder möglich |
| `child-address` | Für die erste Anfrage nicht benötigt | Entfällt; spätere erforderliche Rechnungsdaten getrennt beim Vertragspartner |
| `child-city` | Für die erste Anfrage nicht benötigt | Entfällt |
| `child-position` | Trainingsplanung | Optional; genau eine Auswahl Feldspieler oder Torwart, ansonsten leer |
| `child-experience` | Trainingsplanung | Optional; höchstens 500 Zeichen; Hinweis, Gesundheitsinformationen ausschließlich im gesonderten Bereich anzugeben |
| `guardian-1-name` | Verantwortlicher Hauptkontakt | Pflicht; höchstens 120 Zeichen |
| `guardian-1-phone` | Erreichbarkeit für Organisation/Betreuung | Pflicht; Telefonnummer, höchstens 40 Zeichen |
| `guardian-1-email` | Persönliche Rückmeldung | Pflicht; gültige E-Mail-Adresse, höchstens 254 Zeichen |
| `guardian-2-name` | Zweiter vollständiger Datensatz für die erste Anfrage nicht benötigt | Entfällt; Sonderfälle klärt Pierre persönlich |
| `guardian-2-phone` | Wie oben | Entfällt |
| `guardian-2-email` | Wie oben | Entfällt |
| `emergency-name` | Optionaler zusätzlicher Notfallkontakt | Optionales Kontaktpaar; bei zusätzlichem Kontakt Name und Telefon gemeinsam, Name höchstens 120 Zeichen |
| `emergency-phone` | Erreichbarkeit des zusätzlichen Notfallkontakts | Nur zusammen mit zusätzlichem Namen; höchstens 40 Zeichen; sonst Hauptkontakt nutzen |
| `pickup-persons` | Abholung organisieren | Optional; notwendige Namen, höchstens 300 Zeichen; keine Ausweisdaten |
| `booking-type` | Anfragetyp zuordnen | Pflicht; genau Einzeltermin oder 5er-Paket |
| `health-notes` | Sichere Betreuung | Optional; höchstens 1000 Zeichen, ausschließlich betreuungsrelevante Hinweise; nur mit gesonderter ausdrücklicher Gesundheitseinwilligung annehmen |
| `health-confirmation` | Pauschale Papier-Fitnesserklärung | Kein zusätzliches Online-Pflichtkästchen; keine automatische Teilnahmeablehnung aus fehlenden Gesundheitsangaben |
| `insurance-cover` | Papier-Versicherungserklärung | Kein Online-Pflichtkästchen für die Anfrage; notwendige Teilnahmefragen klärt Pierre vor Bestätigung, ohne Versicherungsumfang zu unterstellen |
| `liability-acknowledgement` | Papier-Haftungshinweis | Keine ungeprüfte Online-Haftungsfreizeichnung oder pauschale AGB-Zustimmung |
| `medical-first-aid` | Papier-Erstversorgungserklärung | Nicht als zusätzliche Online-Einwilligung übernehmen; konkrete Sicherheitsfragen werden vor Teilnahme geklärt, keine medizinische Zusage aus dieser Auswahl ableiten |
| `media-public-yes` | Öffentlichkeitszwecke | Durch getrennte optionale Einwilligungen ersetzen, siehe unten |
| `media-public-no` | Widersprüchliche Ja-/Nein-Kästchen vermeiden | Kein zusätzliches Nein-Kästchen; nicht ausgewählt bedeutet keine Erlaubnis |
| `media-internal-video` | Internes Trainingsfeedback | Eigene freiwillige Auswahl, unabhängig von Veröffentlichung |
| `signature-location-date` | Herkunft und Zeitpunkt der Anfrage | Ortsfeld entfällt; Server protokolliert den Annahmezeitpunkt und Textversionen |
| `guardian-1-signature` | Berechtigung zur Anfrage dokumentieren | Keine gezeichnete oder hochgeladene Unterschrift. Name des Hauptkontakts plus nicht vorausgewählte Berechtigungsbestätigung |
| `guardian-2-signature` | Keine automatische Pflicht zu zwei Erklärungen | Entfällt im Startformular; bekannte Vertretungs-/Zustimmungsprobleme prüft Pierre persönlich |

Zusätzlich: bei Einzelterminen eine echte Termin-ID, eine Berechtigungsbestätigung und gesonderte zweckbezogene Einwilligungsfelder. Keine freie Preis-, Platz- oder Statusangabe vom Browser übernehmen. Technische Vorgangs-ID, Annahmezeitpunkt und Fassungen der gezeigten Erklärungen werden serverseitig geführt. Keine IP-Adresse als dauerhafter Einwilligungsnachweis.

Berechtigungsbestätigung zur Umsetzung: „Ich bin berechtigt, diese Trainingsanfrage für das genannte Kind abzugeben.“ Das ersetzt nicht die Prüfung bekannter Sonderfälle und behauptet keine Gleichwertigkeit mit einer bestimmten gesetzlichen Signaturform.

## Einwilligungen ohne Zusatzschritte

- Datenschutzhinweise zugänglich verlinken. Keine pauschale Datenschutz-Einwilligung als Grundlage für alle Pflichtangaben.
- Gesundheitsangaben sind vorgesehen, bleiben jedoch optional und ausdrücklich getrennt. Den gewählten Wortlaut aus Abschnitt 4 der Betriebsregeln verwenden. Ohne entsprechende Einwilligung keinen Gesundheitsinhalt speichern, weiterleiten oder protokollieren. Keine automatische Ablehnung allein wegen fehlender Einwilligung; Pierre prüft konkrete Sicherheitsfragen und datensparsame Alternativen.
- Öffentlichkeitszwecke und interne Analyse getrennt anbieten, nie vorauswählen. Startzwecke: Academy-Website, Print und interne Videoanalyse jeweils eigenständig. Für jeden angebotenen Zweck den konkreten Erklärungstext samt Version und Auswahl privat dokumentieren. Keine Nutzung bei leerer Auswahl. Medienfreigabe ist keine Teilnahmebedingung.
- Social-Media-Auswahl bleibt aus, solange reale Accounts und Empfängerinformationen nicht feststehen. Kein pauschales Kästchen für heutige und künftige Plattformen.
- Nur entsprechend freigegebene Veröffentlichungsfassungen dürfen später ins öffentliche CMS. Anfragen, Gesundheitshinweise und Einwilligungsbelege bleiben privat bei STRATO.
- Rechte-/Widerrufskontakt und Ablauf sowie Fristen, Coach-Zugriff und Sicherungen sind bereits in den Betriebsregeln definiert; nicht erneut als offene Produktentscheidungen behandeln. Die konkrete Erklärung pro angebotenem Zweck und der finale Datenschutztext werden vor Aktivierung auf tatsächliche Umsetzung und rechtliche Eignung geprüft.

## SpielerPlus: eigenständiger Vorgang

SpielerPlus wird vollständig außerhalb der Website organisiert. Weder Anmeldung noch Buchungsbestätigung hängen hier von dessen Profil, Einladung oder Nutzung ab. Keine Website-API, Synchronisierung, Weitergabe der Anmeldedaten, automatische Einladung, Linkkonfiguration, Statusabfrage oder Abnahme dieses fremden Vorgangs. SpielerPlus-Anbieter-/Einladungsdetails sind keine Voraussetzung für #12–#15 oder den Website-Launch. Einzel- und Mehrfachanfragen bleiben auf der Website möglich.

## Umsetzung und Freigabe

Die Original-PDF bleibt unverändert und wird nicht als rechtlich genehmigte Onlinefassung ausgegeben. Der [ältere Quellenreview](REGISTRATION-POLICY-REVIEW.md) dokumentiert die Papiervorlage; seine Fragen sind anhand dieses Startmodells und der Betriebsregeln abzugleichen, nicht erneut alle an Pierre zu stellen. Die Website fragt weder Papier-Abgabeorte noch Papier-Unterschriften ab.

#13 setzt dauerhafte private Speicherung, serverseitige Validierung und Annahme um; #14 Rollen, Zugriff und Lebenszyklus; #15 die barrierearme Eingabe und tatsächliche Ende-zu-Ende-Abnahme. #17 umfasst den finalen rechtlichen/Provider-Abgleich der tatsächlich verwendeten Texte und Funktionen. Dokumentierte Produktentscheidungen aktivieren keine Sammlung echter Daten: bis zur technischen und inhaltlichen Abnahme bleiben Eingaben und PHP-Endpunkt deaktiviert.
