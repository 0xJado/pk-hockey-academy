export interface RegistrationField {
  id: string;
  label: string;
  context?: string;
  type?: "text" | "tel" | "email" | "textarea";
}

// Transcribed from the supplied v2 PDF. Requiredness and online consent rules
// are deliberately undefined until the registration process is approved.
export const registration = {
  downloadUrl: "/downloads/PK-Hockey-Academy-Anmeldung-v2.pdf",
  downloadName: "PK-Hockey-Academy-Anmeldung-v2.pdf",
  sourceName: "PK_Hockey_Academy_Anmeldeformular_v2.pdf",
  pages: 2,
  sizeBytes: 203522,
  sha256: "5ad3b2845008b09213280653fda49d6fb15882a4ddbfcb0ca975dc664162bff9",
  tagline: "Individuelles Eishockeytraining fuer Kinder bis U13",
  trainingFormat: "1H EIS + 1H OFF-ICE/TROCKENTRAINING + KLEINE GRUPPEN",
  instruction:
    "Bitte gut lesbar ausfuellen. Eine Anmeldung wird erst nach Bestaetigung durch die PK Hockey Academy verbindlich.",
  sections: [
    "DATEN DES KINDES",
    "ERZIEHUNGSBERECHTIGTE / KONTAKT",
    "KOSTEN / BUCHUNG",
    "GESUNDHEIT / HINWEISE FUER DIE COACHES",
    "VERSICHERUNG / HAFTUNG",
    "MEDIZINISCHE ERSTVERSORGUNG",
    "BILD- UND VIDEORECHTE",
    "ZUSTIMMUNG / UNTERSCHRIFT",
  ],
  child: [
    { id: "child-name", label: "Vor- und Nachname des Kindes" },
    { id: "child-birth", label: "Geburtsdatum / Jahrgang" },
    { id: "child-team", label: "Verein / Mannschaft" },
    { id: "child-address", label: "Adresse des Kindes" },
    { id: "child-city", label: "PLZ / Ort" },
  ] satisfies RegistrationField[],
  positions: ["Feldspieler", "Torwart"],
  experience: {
    id: "child-experience",
    label: "Besonderheiten / Erfahrungsstand",
  } satisfies RegistrationField,
  guardians: [
    { id: "guardian-1-name", label: "Name erziehungsberechtigte Person 1" },
    { id: "guardian-1-phone", label: "Telefon", context: "erziehungsberechtigte Person 1", type: "tel" },
    { id: "guardian-1-email", label: "E-Mail", context: "erziehungsberechtigte Person 1", type: "email" },
    { id: "guardian-2-name", label: "Name erziehungsberechtigte Person 2" },
    { id: "guardian-2-phone", label: "Telefon", context: "erziehungsberechtigte Person 2", type: "tel" },
    { id: "guardian-2-email", label: "E-Mail", context: "erziehungsberechtigte Person 2", type: "email" },
    { id: "emergency-name", label: "Notfallkontakt (Name)" },
    { id: "emergency-phone", label: "Notfalltelefon", type: "tel" },
    { id: "pickup-persons", label: "Abholberechtigte Person(en)" },
  ] satisfies RegistrationField[],
  bookingDescription:
    "Das Training wird ausschliesslich als Doppelstunde gebucht: 1 Stunde Eis plus 1 Stunde Off-Ice/Trockentraining.",
  pricing: [
    { title: "Einzelbuchung", price: "50 EUR", detail: "pro Doppelstunde", note: "1H Eis + 1H Off-Ice" },
    {
      title: "5er-Buchung",
      price: "200 EUR",
      detail: "fuer 5 Doppelstunden",
      note: "Rabattierte Buchung",
      advantage: {
        title: "Vorteil 5er-Buchung",
        price: "40 EUR",
        detail: "je Doppelstunde",
        saving: "50 EUR",
        savingLabel: "Ersparnis gesamt",
      },
    },
  ],
  bookingChoices: [
    "Ich buche eine einzelne Doppelstunde.",
    "Ich buche die 5er-Buchung.",
  ],
  health: {
    id: "health-notes",
    label: "Allergien, Medikamente, Erkrankungen, Einschraenkungen oder wichtige Hinweise",
    type: "textarea",
  } satisfies RegistrationField,
  healthConfirmation:
    "Mein Kind ist sportgesund und kann am Eishockeytraining teilnehmen.",
  insurance: [
    "Die Teilnahme erfolgt auf eigene Verantwortung der Teilnehmenden bzw. der Erziehungsberechtigten. Die Erziehungsberechtigten bestaetigen, dass fuer das Kind ein ausreichender Kranken- und Unfallversicherungsschutz besteht und dass die fuer den Eishockeysport erforderliche Schutz- und Trainingsausruestung genutzt wird.",
    "Die PK Hockey Academy, ihre Coaches und eingesetzten Helfer haften nach den gesetzlichen Bestimmungen bei Vorsatz und grober Fahrlaessigkeit sowie bei Verletzung von Leben, Koerper oder Gesundheit. Fuer selbstverschuldete Unfaelle, Schaeden an oder Verlust von Ausruestung und persoenlichen Gegenstaenden sowie fuer nicht von der PK Hockey Academy zu vertretende Schaeden wird keine Haftung uebernommen.",
  ],
  insuranceChoices: [
    "Versicherungsschutz fuer das Kind ist vorhanden.",
    "Haftungshinweise gelesen und verstanden.",
  ],
  legalNote:
    "Hinweis: Diese Vorlage ersetzt keine rechtliche Pruefung. Vor Nutzung bitte ggf. juristisch pruefen lassen.",
  medicalDescription:
    "Im Notfall duerfen die Coaches bzw. Betreuer notwendige Erste-Hilfe-Massnahmen einleiten und, falls erforderlich, den Rettungsdienst informieren. Die Erziehungsberechtigten werden schnellstmoeglich benachrichtigt.",
  medicalChoices: ["Einverstanden", "Nicht einverstanden"],
  mediaDescription:
    "Waehrend der Training-Sessions koennen Foto- und Videoaufnahmen entstehen. Diese koennen - sofern unten zugestimmt wird - fuer Trainingsdokumentation, Website, Social Media, Flyer/Printmedien und oeffentliche Kommunikation der PK Hockey Academy genutzt werden. Die Einwilligung ist freiwillig und kann fuer die Zukunft widerrufen werden.",
  mediaChoices: [
    "Ja, ich/wir willige(n) in die Nutzung von Foto- und Videoaufnahmen ein.",
    "Nein, ich/wir willige(n) nicht in die Nutzung zu Werbe-/Oeffentlichkeitszwecken ein.",
    "Videoanalyse nur intern fuer Trainingsfeedback erlaubt.",
  ],
  signatureDescription:
    "Mit der Unterschrift bestaetige(n) ich/wir die Richtigkeit der Angaben und die Kenntnisnahme der oben genannten Hinweise.",
  signatures: [
    "Ort, Datum",
    "Unterschrift erziehungsberechtigte Person 1",
    "Unterschrift erziehungsberechtigte Person 2",
  ],
};
