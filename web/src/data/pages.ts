export const pages = {
  philosophie: {
    label: "UNSERE HALTUNG",
    title: "DEIN TEAM. DEIN WEG.",
    accent: "DEINE ENTWICKLUNG.",
    description:
      "Wie PK Hockey Academy das Vereinstraining mit gezielter individueller Eishockey-Förderung in kleinen Gruppen ergänzt.",
    intro:
      "Teamtraining legt die Basis. Wir schaffen zusätzlichen Raum für die Entwicklung jedes einzelnen Spielers.",
  },
  training: {
    label: "DAS TRAININGSKONZEPT",
    title: "ZWEI PHASEN.",
    accent: "DEIN FORTSCHRITT.",
    description:
      "60 Minuten On-Ice und 60 Minuten Off-Ice: individuell angepasstes Eishockeytraining in kleinen Gruppen für Kinder und Jugendliche bis U13.",
    intro:
      "Ein klarer Rahmen. Persönliche Betreuung. Training, das die individuelle Entwicklung auf und neben dem Eis verbindet.",
  },
  trainerpool: {
    label: "DIE MENSCHEN DAHINTER",
    title: "MIT LEIDENSCHAFT.",
    accent: "MIT PERSPEKTIVE.",
    description:
      "Der Trainerpool der PK Hockey Academy: bestätigte Profile und persönliche Betreuung für die individuelle Entwicklung junger Eishockeyspieler.",
    intro:
      "Individuelle Entwicklung beginnt mit Aufmerksamkeit. Lerne die Menschen hinter dem Training kennen.",
  },
  trainingsstaetten: {
    label: "UNSERE TRAININGSSTÄDTE",
    title: "DEIN EIS.",
    accent: "DEINE REGION.",
    description:
      "PK Hockey Academy trainiert in Essen, Dinslaken und Duisburg. Herne, Dorsten und Wesel sind in Planung. Hallen werden je Termin bekannt gegeben.",
    intro:
      "Aktuell in Essen, Dinslaken und Duisburg. Die konkrete Eishalle wird immer mit dem jeweiligen Trainingstermin bekannt gegeben.",
  },
  trainingstermine: {
    label: "DEINE NÄCHSTE EINHEIT",
    title: "ZEIT FÜR",
    accent: "DEIN POTENZIAL.",
    description:
      "Hier findest du künftig die bestätigten Trainingstermine der PK Hockey Academy, mit Ort, Uhrzeit, Altersgruppe und Anmeldestatus. Aktuell keine Buchung möglich.",
    intro:
      "Alle bestätigten Termine an einem Ort. Sobald Ort und Zeit feststehen, findest du hier die nächsten Einheiten.",
  },
  organisation: {
    label: "GUT ZU WISSEN",
    title: "KLARER RAHMEN.",
    accent: "KLARES ZIEL.",
    description:
      "Organisation und Preise der PK Hockey Academy: Wochenendtraining an variablen Standorten, 50 € pro Einzeltermin oder 200 € für fünf Einheiten.",
    intro:
      "Training am Wochenende. Wechselnde Standorte. Ein Konzept aus 60 Minuten On-Ice und 60 Minuten Off-Ice.",
  },
  kontakt: {
    label: "DEIN KONTAKT ZUR ACADEMY",
    title: "DER ERSTE SCHRITT:",
    accent: "INS GESPRÄCH KOMMEN.",
    description:
      "Kontakt zur PK Hockey Academy. Die Kontaktmöglichkeiten und der Anfrageweg befinden sich noch in Vorbereitung. Aktuell werden keine Anfragen über die Website versendet.",
    intro:
      "Du möchtest mehr über das individuelle Eishockeytraining erfahren? Unsere direkten Kontaktmöglichkeiten folgen hier.",
  },
  impressum: {
    label: "INTERNER ENTWURF · NICHT ZUR VERÖFFENTLICHUNG",
    title: "IMPRESSUM",
    accent: "ANGABEN FOLGEN.",
    description:
      "Interner Platzhalter für das Impressum der PK Hockey Academy. Rechtliche Pflichtangaben müssen vor einer Veröffentlichung ergänzt und geprüft werden.",
    intro:
      "Diese Seite ist ein interner Arbeitsstand und kein vollständiges oder gültig geprüftes Impressum.",
  },
  datenschutz: {
    label: "INTERNER ENTWURF · NICHT ZUR VERÖFFENTLICHUNG",
    title: "DATENSCHUTZ",
    accent: "PRÜFUNG AUSSTEHEND.",
    description:
      "Interner Platzhalter für die Datenschutzhinweise der PK Hockey Academy. Die rechtliche Prüfung und Angaben zum Betrieb stehen vor dem Start noch aus.",
    intro:
      "Diese Seite ist ein interner Arbeitsstand und keine fertige Datenschutzerklärung.",
  },
} as const;
export type ContentPage = keyof typeof pages;
export const principles = [
  {
    number: "01",
    title: "Ergänzen. Gemeinsam wachsen.",
    text: "Das Training im Verein bleibt die Grundlage. Die Academy ergänzt es durch gezielte individuelle Entwicklung in kleinen Gruppen.",
  },
  {
    number: "02",
    title: "Jeden Spieler sehen.",
    text: "Leistungsstände und Entwicklung sind verschieden. Inhalte werden an die jeweiligen Spieler und die Gruppe angepasst.",
  },
  {
    number: "03",
    title: "Auf dem Eis. Neben dem Eis.",
    text: "Jeder Trainingsblock verbindet 60 Minuten On-Ice und 60 Minuten Off-Ice. So bekommt die persönliche Entwicklung einen festen Rahmen.",
  },
];
export const organisationSteps = [
  {
    number: "01",
    title: "Termin entdecken",
    text: "Bestätigte Termine erscheinen auf unserer Terminseite. Dort werden Zeit, Standort, Gruppe und Anmeldestatus angegeben.",
  },
  {
    number: "02",
    title: "Details ansehen",
    text: "Wochenendtermine und Eishallen können wechseln. Maßgeblich sind die Informationen des einzelnen Termins.",
  },
  {
    number: "03",
    title: "Anmeldung prüfen",
    text: "Künftig ist je Termin ein eigener SpielerPlus-Link vorgesehen. Die genaue Anmeldefunktion wird vor der Freigabe bestätigt.",
  },
];
