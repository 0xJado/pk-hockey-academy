# Impressum und Datenschutz: bestätigte Textfassung

Stand: 18. November 2026 · Fassung: legal-content-2026-11-18

## Entscheidung

Der Nutzer hat im laufenden Chat ausdrücklich angewiesen: „alright lets confirm and lock in the impressum and datenschutz“. Damit sind die aktuellen Texte für /impressum und /datenschutz einschließlich der am selben Tag bestätigten Telefonnummer und WhatsApp-Kontaktmöglichkeit inhaltlich angenommen und festgeschrieben. Eine erneute Freigaberunde für diese unveränderte Fassung ist nicht erforderlich.

Bestätigte Anbieterangaben: Pierre Klein, PK Hockey Academy, Einzelunternehmen, Verbindungsweg 8, 46562 Voerde, Deutschland; info@pkhockeyacademy.de; +49 151 28790537; https://www.pkhockeyacademy.de. Keine USt-IdNr./W-IdNr. und kein Handelsregistereintrag gemäß übermittelter Bestätigung vom 12. November. WhatsApp: https://wa.me/4915128790537 als freiwilliger externer Kontaktlink.

Die 17-teilige Produktions-Datenschutzfassung beschreibt STRATO, Sanity, den Trainingsanfrageablauf, die getrennten Einwilligungen, Aufbewahrung/Löschung, Betroffenenrechte und den optionalen WhatsApp-Kontakt. Interne Prüfnotizen bleiben in docs/. Die bisherigen Entwurfsbanner entfallen von beiden Website-Seiten.

## Gebundene Quellen

| Quelle | SHA-256 |
| --- | --- |
| web/src/data/legal.ts | dc2083907997dd0a1623cf1de418e3d4445b99eddce907e2c961e6ad9d57fbf5 |
| web/src/content/legal/datenschutz.md | 4178b6cafaceab687bc58814fc4763677f2ff03b9a35bc54ea07fedb15be1143 |

Hashverfahren: UTF-8-Text, CRLF zu LF normalisiert, sonst unverändert. Die Impressum-Darstellung wird durch web/src/pages/[page].astro gerendert, die Datenschutzdarstellung durch web/src/components/PrivacyPolicy.astro. Der zugehörige Git-Commit bindet zusätzlich die Darstellung und die Kontaktkonfiguration.

## Abgrenzung

Dies protokolliert die ausdrückliche Textbestätigung des Nutzers. Es behauptet weder eine externe juristische Zertifizierung noch eine durchgeführte Prüfung der STRATO-/Sanity-Kontoverträge, eine persönliche Verwaltungsübergabe an Pierre oder eine behördliche Freigabe.

Die verbleibenden Anbieter-/Betriebsprüfungen aus REGISTRATION-APPROVAL-2026-11-15.md bleiben sachliche Aufgaben. Die unveränderte Registrierungsvorlage policy.v1.json, ihr Status implementation-draft und publicIntakeEnabled=false werden mit dieser Textfestschreibung nicht verändert. Die frühere Gate-Bezeichnung final-owner-text-acceptance darf nicht als bereits vorhandener Nachweis einer persönlichen Unterschrift Pierres umgedeutet werden; diese Textentscheidung ist durch den Nutzer und die bestehende Delegation dokumentiert. Eine spätere maschinelle Aktivierung benötigt weiterhin den vollständigen gesonderten Abgleich.

Kein Deployment, keine Entfernung des Passwortschutzes, keine Aktivierung von Indexierung oder echter Datenerfassung ist Teil dieser Entscheidung. Sachliche Änderungen an Kontaktdaten, Diensten, Verarbeitungszwecken oder Regeln müssen die Textfassung und diesen Datensatz nachvollziehbar aktualisieren.

## Lokale Prüfung dieser Festschreibung

Astro check: 152 Dateien, keine Fehler/Warnungen/Hinweise. Statischer STRATO-Build mit deaktiviertem CMS erfolgreich. Browserprüfung beider Seiten bei 1440, 768 und 375 Pixeln: keine Entwurfsbanner, ein H1 je Seite, kein horizontaler Überlauf, 17 Datenschutzabschnitte und gültige Inhaltslinks, korrekter Telefonlink, sichtbarer Tastaturfokus, reduzierte Bewegung, Vor-/Zurück-Navigation und Darstellung ohne JavaScript. Keine Laufzeitfehler festgestellt. Die lokale Ausgabe blieb noindex; die Quellen-Prüfsummen und der unveränderte deaktivierte Intake-Status wurden geprüft. Diese lokale Textprüfung ist keine erneute Live-Abnahme des STRATO-Servers.

## Projekt- und Rechtsabgleich vom 18. November 2026

Die Prüfsumme oben dokumentiert weiterhin die ausdrücklich bestätigte Erstfassung in 0e5f8f1. Die auf Wunsch geprüfte Folgefassung der Datenschutzerklärung hat die normalisierte SHA-256-Prüfsumme `fc8f7421888de95107a9be7fc9f9a7d2a966fbadf1c5f29afebb7a88940f8b13`. Prüfgrundlagen waren die 17 Abschnitte der Besucherfassung, die verbindlichen Formularfelder und Einwilligungen, das Druckformular, die PHP-Verarbeitung, die Verwaltung, die tägliche Wartung sowie der dokumentierte STRATO-Abnahmestand vom 17. November.

- **Formular und Medien.** Onlineformular und Druckfassung erheben keine Rechnungsanschrift. Vereins- und Positionsangaben sind freiwillig. Website, Printfotos und interne Videoanalyse haben getrennte Freigaben. Vor der ersten echten Aufnahme muss die Betreuung die konkrete Freigabe, die Vertretungsberechtigung und den Willen des Kindes prüfen können. Veröffentlichung und Löschung der eigentlichen Mediendateien sind redaktionelle Aufgaben.
- **Erhebung bei Dritten.** Kinder-, Notfall- und Abholdaten stammen aus der Anfrage der anmeldenden Person. Der Verweis am Formular und die URL im Papierformular erreichen diese weiteren Betroffenen nicht automatisch. Für den echten Ablauf sind eine altersgerechte Information des Kindes und eine nachweisbare Information der benannten Personen oder eine tatsächlich anwendbare Ausnahme zu organisieren. Bei einer nur namentlich genannten Abholperson den geeigneten Übermittlungsweg im Einzelfall klären. [Art. 12–14 DSGVO](https://eur-lex.europa.eu/legal-content/EN-DE/TXT/?uri=CELEX%3A32016R0679).
- **Löschung.** Die Zuordnung für Wiederholungsversuche, die pseudonymen Missbrauchszähler und das 90-Tage-Verwaltungsprotokoll sind jetzt beschrieben. Der 14-Tage-Lauf für Betreuungsdaten benötigt die Erfassung des tatsächlichen letzten Termins in der Verwaltung. Ein offener oder lediglich bestätigter Datensatz hat dadurch allein noch kein Löschdatum. Die 90-Tage-Wiedervorlage für offene Anfragen ist keine automatische Schließung. Vor echter Nutzung einen Verantwortlichen und eine verlässliche Kontrolle für überfällige Abschlüsse, Widerrufe und Löschungen außerhalb der Datenbank festlegen. Das schließt Papier, Postfach, WhatsApp, Bildbestände und den internen Videospeicher ein. Die Datenbanksicherung prüft die tägliche Wartung auf ein Alter von über 35 Tagen. Für andere Systeme muss die tatsächliche Sicherung gesondert belegt werden.
- **Anbieter.** STRATO unterscheidet nach Vertragsdatum bei der Einbeziehung des AVV. Die öffentlichen Sanity-Growth-Bedingungen nennen Sanity US Inc. Für das Academy-Konto fehlen weiterhin die bestätigte Bestellung, die tatsächlich anwendbare Übermittlungsgrundlage und der Abgleich der eingesetzten Unterauftragnehmer. Danach Abschnitt 12 auf die konkret geltenden Garantien zuschneiden. Beim freiwilligen WhatsApp-Link sind Kontoart, Adressbuchzugriff, Gerätesicherungen und Löschung der Chats am tatsächlichen Gerät zu prüfen. Bei STRATO auch die ausgeschlossene Privatweiterleitung sowie tatsächliche Protokoll- und Sicherungsfristen abgleichen. [STRATO-AVV](https://www.strato.de/faq/vertrag/fragen-zur-auftragsverarbeitungsvertrag-avv-und-der-neuen-eu-datenschutzgrundverordnung-dsgvo/), [Sanity Growth](https://www.sanity.io/legal/tos-growth), [Sanity-DPA, Abschnitt 10 und Anlage A](https://www.sanity.io/legal/dpa), [WhatsApp EWR](https://www.whatsapp.com/legal/privacy-policy-eea).
- **Gesetzliche Einordnung.** Die DSGVO verlangt Zweckbindung, Datenminimierung und zweckbezogene Löschung. Die kurzen Academy-Fristen sind betriebliche Obergrenzen. Die steuerlichen Fristen betreffen jeweils bestimmte Unterlagen. Für das individuelle Training wird keine allgemeine Altersgrenze für Online-Dienste auf sämtliche Entscheidungen über Kinder übertragen. [Art. 5–9, 17, 21 und 44 ff. DSGVO](https://eur-lex.europa.eu/legal-content/EN-DE/TXT/?uri=CELEX%3A32016R0679), [Einwilligung bei Gesundheitsdaten](https://www.datenschutz.sachsen.de/einwilligung.html), [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html), [§ 147 AO](https://www.gesetze-im-internet.de/ao_1977/__147.html).

Die Feststellungen beziehen sich auf den vorgesehenen Produktionsbetrieb. Ein erneuter Zugriff auf Vertragskonten oder Pierres Endgerät und eine Prüfung echter Teilnehmerdaten waren nicht Teil des Abgleichs.

## Nachprüfung im Kundenkonto und Vorschlag für die Information vor dem Training

Am 18. November 2026 zeigte das angemeldete STRATO-Konto den erfolgreichen Abschluss der AVV erstmals am 7. September und zuletzt am 6. November 2026. Für info@pkhockeyacademy.de war in der Filterverwaltung des Anbieters keine Weiterleitungsregel sichtbar. Lokale Mailprogramme wurden nicht geprüft. BackupControl zeigte 14 Webspace-Stände vom 5. bis 18. November. Die gesonderte Datenbank-Backupseite meldete, dass aktuell kein Backup vorhanden ist. Das sind sichtbare Wiederherstellungspunkte zum Prüfzeitpunkt. Eine vertragliche Höchstfrist für alle STRATO-Sicherungskopien oder die Funktionsfähigkeit einer Datenbankwiederherstellung folgt daraus nicht. Die privaten Sicherungen der Anwendung haben einen eigenen Wartungsablauf.

Im Sanity-Projekt standen „6 days left in trial“ und die automatische Rückstufung auf Free. Für die Betreiberprüfung sind die allgemeinen Vertragsbedingungen, die DPA und die tatsächlich eingesetzten Leistungen maßgeblich. Die Besucherfassung verweist auf die allgemeinen Bedingungen. Weitere Prüfungspunkte sind die konkret anwendbare Grundlage für Drittlandübermittlungen und Pierres WhatsApp-Geräteeinstellungen. [Sanity-Vertragsbedingungen](https://www.sanity.io/legal/tos), [Auftragsverarbeitung](https://www.sanity.io/legal/dpa), [Unterauftragsverarbeiter](https://www.sanity.io/third-party-sub-processors).

Die Folgefassung der Besucherhinweise enthält kurze Texte für Kinder und benannte Erwachsene. Normalisierte SHA-256: cdb707eaa0e71a1c6f3d4410b296a16b57b9d099330673614aa47f2d4775f6cc.

Vorgeschlagener Ablauf vor echter Datenerhebung: Bei der Onlineanfrage und auf Papier den Kindertext direkt mitgeben und vor dem ersten Training altersgerecht besprechen. Für benannte Erwachsene einen persönlich zustellbaren Hinweis mit vollständiger Erklärung bereitstellen. Pierre kann den Notfallkontakt über die schon angegebene Nummer informieren. Bei ausschließlich namentlich bekannten Abholberechtigten kann die anmeldende Person den Hinweis übermitteln. Pierre hält je Kontakt nur Zeitpunkt, Weg, Textversion und offenen bzw. bestätigten Empfang fest. Bleibt die Zustellung offen, fasst Pierre rechtzeitig nach. Die Frist richtet sich nach Abschnitt 6. Diese Information ist keine Einwilligung; Gesundheitsangaben oder Namen anderer Kinder gehören nicht in die Mitteilung.

Vorschlag für Wiederbuchungen: Ein verifizierter Elternkontakt kann die Wiederverwendung ausdrücklich ausgewählter organisatorischer Basisdaten für 14 Tage ab dem tatsächlichen letzten Training wünschen. Eine solche Funktion braucht eine selbständig ablaufende Frist, einen einfachen Widerruf und die Prüfung der aktuellen Angaben bei der nächsten Anfrage. Gesundheitsdaten, Notfallkontakte und Abholberechtigte werden für jede neue Buchung aktuell erfragt. Die bestehende Einwilligung für die sichere Betreuung der gebuchten Einheiten und die vorhandene 90-Tage-Abwicklungsfrist decken keine pauschale Wiederverwendung. Eine Wiederbuchungsfunktion ist bislang nicht eingerichtet.

## Ergänzung zur WhatsApp-Löschung

Der Nutzer bestätigte am 18. November 2026 die Löschung sämtlicher Chats mit der anfragenden Person und ihres zugehörigen Kontakteintrags auf Wunsch sowie den Betrieb ohne WhatsApp-Chat-Backups der Academy. Dies ist eine Betreiberangabe. Kontoart und Adressbuchzugriff wurden am Gerät noch nicht geprüft. Normalisierte SHA-256 der Besucherfassung: 1445ed5d3e15c6e6ff0baa06e4cc5d0c5d07131562f2a48692364db7c05b653e.
