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
