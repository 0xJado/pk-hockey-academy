# Technische Rückfragen zu Hosting Basic — am 12. November 2026 versendet

Betreff: Hosting Basic: JSON-Upload-Zeitlimit und MariaDB-Benutzerrechte

Mit ausdrücklicher Zustimmung des Nutzers über den angemeldeten STRATO-Kundenservice unter „Hosting und Domains“ versendet. STRATO zeigte die Eingangsbestätigung „Vielen Dank für Ihre Anfrage“; eine Vorgangsnummer wurde in der Bestätigung nicht angezeigt. Es wurden keine Zugangsdaten oder Teilnehmerdaten eingetragen. Eine technische Antwort steht aus; die Annahme-Sperren bleiben bestehen. Keine Session-URL oder Kundennummer in diese Dokumentation übernehmen.

Wir betreiben eine statisch gebaute Website mit kleinen PHP-Endpunkten für Trainingsanfragen. Die Anwendung ist noch geschützt; die Annahme echter Daten bleibt deaktiviert. Bitte klären Sie folgende Funktionen im vorhandenen Hosting-Basic-Paket ohne kostenpflichtige Umstellung:

1. Welche serverseitige harte Gesamtfrist und welche minimale Datenrate gelten für eingehende Request-Bodies vor beziehungsweise während der Übergabe an PHP/FastCGI? Können wir das für einen einzelnen PHP-Endpunkt oder sein Verzeichnis verbindlich konfigurieren? Bitte nennen Sie die im Paket tatsächlich unterstützte Einstellung und ihren Geltungsbereich.
2. Bei einem einzelnen unvollständigen JSON-Testrequest blieb die Verbindung trotz weniger fortlaufender Bytes länger als 75 Sekunden offen, bis unser Testclient abbrach. PHP meldet `max_input_time=60`; ein nachträglicher PHP-Zeitvergleich beweist hier keine Grenze vor der Anwendungsverarbeitung. Wie kann ein kleiner JSON-Endpunkt auf dieser Hosting-Umgebung auch solche langsamen Eingaben zuverlässig begrenzen?
3. Kann für eine vorhandene MariaDB-Datenbank ein zweiter Benutzer ausschließlich mit den erforderlichen Datenrechten (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) angelegt werden, getrennt vom Schema-/Migrationszugang? Im aktuellen Zugang sind die Rechte auf die eigene Datenbank begrenzt, ohne Benutzerverwaltung oder Weitergaberecht. Falls die Trennung im vorhandenen Paket nicht unterstützt wird, bitten wir um Bestätigung dieser Einschränkung.

Es werden keine Zugangsdaten, Tokens, Sessionlinks, Datenbanknamen oder Teilnehmerdaten benötigt beziehungsweise mit diesem Entwurf übermittelt. Die konkrete Paketidentifizierung erfolgt gegebenenfalls ausschließlich über den authentifizierten STRATO-Support.

## Interner Abgleich

- Die Anfrage wurde versendet. Dies ist noch keine Anbieterbestätigung zu den technischen Eigenschaften und kein Auftrag für ein Upgrade.
- Der lokale #13-Zeitvergleich schützt vor verspäteter Verarbeitung nach Rückkehr des Leseaufrufs. Die gemessene langsame Eingabe ist damit noch nicht als fristgerecht beendet akzeptiert.
- Ein isolierter Versuch mit ausgeschaltetem automatischem POST-Lesen und PHP-Alarm hat auf diesem Hosting ebenfalls keine belastbare kurze Antwortfrist für den Testrequest ergeben. Die genaue Grenze zwischen vorgelagerter Verarbeitung und blockierendem SAPI-Lesen ist nicht nachgewiesen; keine ungeprüfte Ursachenbehauptung an den Anbieter senden.
- Die experimentelle Laufzeit-/Verzeichniskonfiguration wurde entfernt und nicht in den öffentlichen oder privaten Registrierungseintrag übernommen. Die Site-Konfiguration und die Annahme-Sperren blieben erhalten.
