# Sanity-Ersteinrichtung für Pierre

Stand: 25. Oktober 2026. Pierre soll das Sanity-Projekt der Academy selbst kontrollieren. Vorgesehen sind Sanity Free und ein öffentliches Dataset für Website-Inhalte. Konto, Projekt und technische Verbindung sind noch einzurichten. Trainingsanmeldungen und Spielerangaben gehören in das separat geplante private Google Sheet.

Die folgende Anleitung beschreibt die noch ausstehenden Schritte zur Konto- und Projektanlage. Die Entwicklung übernimmt anschließend Studio, Website-Anbindung und die technische Prüfung; Inhalte werden erst nach Freigabe veröffentlicht.

Die gemeinsame [Einrichtungsanleitung für Pierre](../docs/PIERRE-SETUP.md) enthält auch die Schritte zum Anlegen und Freigeben der privaten Google-Tabelle sowie die benötigte Rückmeldung an die Entwicklung.

Das deutsche Redaktionssystem für Trainerprofile und Camp-Galerien ist bereits im Repository vorhanden. Für den Start sind diese Schritte nötig:

## 1. Eigene Konten anlegen

Pierre erstellt sein Konto über [Sanity](https://www.sanity.io/get-started). Er verwendet eine E-Mail-Adresse und Anmeldemethode, auf die er dauerhaft selbst zugreifen kann. Bei späteren Anmeldungen dieselbe Methode verwenden. Ein eigenes Entwicklerkonto ist für die Arbeit am Website-Code nicht erforderlich.

## 2. Pierre legt das Academy-Projekt an

In [Sanity Manage](https://www.sanity.io/manage) ein neues Projekt mit dem Namen **PK Hockey Academy** erstellen. Bei einer Organisationsauswahl eine von Pierre verwaltete Organisation verwenden. Pierre behält die Administratorrolle und die Kontrolle über eine eventuell spätere Abrechnung.

Den Tarif **Free** und ein **öffentliches Dataset** verwenden, üblicherweise mit dem Namen `production`. Es muss kein zweites Website- oder Studio-Starterprojekt erzeugt werden; der vorhandene Code wird angeschlossen. Dataset und technische Einstellungen kann die Entwicklung nach autorisiertem Zugriff einrichten.

Free unterstützt nach der am 25. Oktober 2026 geprüften Tarifübersicht bis zu 20 Konten. Ein zusätzliches Entwicklerkonto erzwingt deshalb kein kostenpflichtiges Abo. Private Datasets und die feineren Rollen Developer, Editor und Contributor benötigen einen anderen Tarif; sie sind für diesen Startumfang nicht vorgesehen. Kein kostenpflichtiges Abo aktivieren.

**Was öffentlich ist:** Veröffentlichte Sanity-Dokumente können über die API gelesen werden, auch wenn „Zurückhalten“ sie von der Academy-Website ausschließt. Unveröffentlichte Entwürfe und Release-Versionen benötigen einen berechtigten Zugang. Hochgeladene Medien sind über ihre CDN-URL öffentlich abrufbar, auch bei Entwürfen. Daher nur zur öffentlichen Nutzung freigegebene Inhalte hochladen; keine Spielerlisten, Anmeldungen, Gesundheitsdaten oder Einwilligungsunterlagen in Sanity speichern.

## 3. Zugriff für die einmalige technische Einrichtung

Die Einrichtung kann mit Pierres autorisierter Anmeldung erfolgen. Pierre übernimmt dabei die Kontoanmeldung selbst. Der Entwickler benötigt kein dauerhaftes eigenes Sanity-Konto.

Falls der Entwickler unabhängig auf Sanity zugreifen soll, legt er ein eigenes Konto an. Pierre kann ihn im Projekt unter **Members** einladen. Free bietet **Administrator** und **Viewer**. Für die technische Einrichtung wäre Administrator erforderlich; Pierre muss diesen umfassenden Zugriff ausdrücklich freigeben. Viewer erlaubt keine Einrichtung oder Bearbeitung. Zusätzliche Konten und Einladungen werden nicht automatisch angelegt.

Dem Entwickler die **Project ID** aus der Projektübersicht nennen. Sie ist eine öffentliche Kennung, kein Passwort. Für das Lesen öffentlicher Website-Inhalte wird kein API-Token benötigt.

## Anschließend übernimmt die Entwicklung

- Mit autorisiertem Kontozugriff die technischen Einstellungen vornehmen.
- Ein öffentliches Dataset einrichten bzw. dessen Sichtbarkeit prüfen und Studio sowie Website damit verbinden.
- Die Website ausschließlich veröffentlichte, für die Website freigegebene Inhalte lesen lassen; `SANITY_READ_TOKEN` bleibt leer.
- Das vorhandene Studio bereitstellen und den Einstieg `/verwaltung` anschließen.
- Die automatische Aktualisierung nach Veröffentlichung, Änderung und Zurückziehen von Trainerprofilen und Galerie-Alben einrichten.
- Pierres bestätigtes Startprofil übernehmen; Inhalte erst nach Freigabe öffentlich zeigen.
- Mit echten Konten Anmeldung, Berechtigungen und den vollständigen Veröffentlichungsablauf prüfen.

Zum Abschluss prüft Pierre einmal die Anmeldung sowie eine typische Inhaltsänderung. Weitere Redaktionskonten können später gezielt ergänzt werden.

Sanity verwaltet hier Website-Inhalte. Die geplanten Trainingsanmeldungen werden getrennt an ein privates Google Sheet angebunden; diese Verbindung ist noch offen.

## Technische Fortsetzung und Quellen

Die vollständige technische Einrichtung steht in [README.md](README.md), die Zugriffs- und Abnahmeprüfungen in [ACCESS.md](ACCESS.md). Realer Kontozugriff, Veröffentlichungsabnahme und automatische Website-Aktualisierung sind noch ausstehend.

- [Sanity: Rollen und Berechtigungen](https://www.sanity.io/docs/content-lake/roles-concepts)
- [Sanity: Aktuelle Tarife und Nutzerpreise](https://www.sanity.io/pricing)
- [Sanity: Datasets](https://www.sanity.io/docs/content-lake/datasets)
- [Sanity: Entwürfe und Veröffentlichung](https://www.sanity.io/docs/content-lake/drafts-and-versions)
- [Sanity: Rollen zuweisen](https://www.sanity.io/docs/user-guides/roles)
- [Sanity: Projekte, Organisationen und Abrechnung](https://www.sanity.io/docs/platform-management/projects-organizations-and-billing)
- [Sanity: Studio bereitstellen](https://www.sanity.io/docs/studio/deployment)
