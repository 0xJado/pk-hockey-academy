// Original supplied question sets; see docs/bot-integration-review.md for provenance.
export type InterviewKind = "player" | "trainer";
export interface InterviewQuestion {
  id: string;
  section: string;
  label: string;
  question: string;
  required: boolean;
  followUp?: string | true;
  internal?: boolean;
}
export const answerLimit = 3000;
export const interviewDefinitions: Record<
  InterviewKind,
  {
    title: string;
    label: string;
    description: string;
    questions: InterviewQuestion[];
  }
> = {
  player: {
    title: "Dein Spiel. Deine Geschichte.",
    label: "Spielerinterview",
    description:
      "Deine Hockeygeschichte, deine Stärken und deine Ziele – gemeinsam mit einer erwachsenen Begleitperson.",
    questions: [
      {
        id: "name",
        section: "1. DAS BIN ICH",
        label: "Mein Name",
        question: "Hey Hockey-Star! Wie heißt du?",
        required: false,
      },
      {
        id: "age",
        section: "1. DAS BIN ICH",
        label: "Mein Alter",
        question: "Wie alt bist du?",
        required: false,
      },
      {
        id: "team",
        section: "1. DAS BIN ICH",
        label: "Mein Verein / meine Mannschaft",
        question: "In welchem Verein oder in welcher Mannschaft spielst du?",
        required: false,
      },
      {
        id: "height",
        section: "1. DAS BIN ICH",
        label: "Meine Größe (cm)",
        question: "Weißt du, wie groß du bist? Am besten in Zentimetern.",
        required: false,
      },
      {
        id: "weight",
        section: "1. DAS BIN ICH",
        label: "Mein Gewicht (kg)",
        question:
          "Weißt du, wie viel du wiegst? Du kannst die Frage auch überspringen.",
        required: false,
      },
      {
        id: "number",
        section: "1. DAS BIN ICH",
        label: "Meine Rückennummer",
        question: "Welche Nummer steht auf deinem Trikot?",
        required: false,
      },
      {
        id: "club",
        section: "1. DAS BIN ICH",
        label: "Mein Lieblingsverein",
        question: "Welcher Eishockeyverein ist dein Lieblingsverein?",
        required: false,
      },
      {
        id: "story",
        section: "2. MEINE HOCKEY-STORY",
        label: "Wie bin ich zum Eishockey gekommen?",
        question: "Erzähl mal: Wie bist du zum Eishockey gekommen?",
        required: false,
        followUp: true,
      },
      {
        id: "idol",
        section: "2. MEINE HOCKEY-STORY",
        label: "Mein Hockey-Vorbild / Lieblingsspieler",
        question: "Wer ist dein größtes Hockey-Vorbild oder Lieblingsspieler?",
        required: false,
        followUp: true,
      },
      {
        id: "position",
        section: "2. MEINE HOCKEY-STORY",
        label: "Meine Lieblingsposition",
        question:
          "Spielst du am liebsten Stürmer, Verteidiger oder Torwart? Oder bist du noch unsicher?",
        required: false,
      },
      {
        id: "success",
        section: "3. MEINE ERFOLGE & TRÄUME",
        label: "Mein schönster oder größter Hockey-Erfolg",
        question:
          "Was war bisher dein schönstes Erlebnis oder dein größter Erfolg beim Eishockey?",
        required: false,
        followUp: true,
      },
      {
        id: "dream",
        section: "3. MEINE ERFOLGE & TRÄUME",
        label: "Mein größter Hockey-Traum",
        question: "Was ist dein allergrößter Traum im Eishockey?",
        required: false,
        followUp: true,
      },
      {
        id: "strength",
        section: "4. MEINE TRAININGSZIELE",
        label: "Das kann ich schon richtig gut",
        question: "Was kannst du beim Eishockey schon richtig gut?",
        required: false,
        followUp: true,
      },
      {
        id: "improve",
        section: "4. MEINE TRAININGSZIELE",
        label: "Das möchte ich verbessern",
        question: "Was möchtest du beim Eishockey unbedingt noch verbessern?",
        required: false,
        followUp: true,
      },
      {
        id: "learn",
        section: "4. MEINE TRAININGSZIELE",
        label: "Das möchte ich bei der PK Hockey Academy lernen",
        question: "Was möchtest du bei der PK Hockey Academy lernen?",
        required: false,
        followUp: true,
      },
    ],
  },
  trainer: {
    title: "Dein Weg. Dein Trainerprofil.",
    label: "Trainerinterview",
    description:
      "Deine Erfahrungen, deine Haltung und dein Blick auf gutes Hockeytraining.",
    questions: [
      {
        id: "name",
        section: "1. PERSÖNLICHE ANGABEN",
        label: "Vor- und Nachname",
        question: "Wie heißt du mit Vor- und Nachnamen?",
        required: true,
      },
      {
        id: "birth",
        section: "1. PERSÖNLICHE ANGABEN",
        label: "Geburtsjahr (freiwillig)",
        question:
          "Möchtest du uns dein Geburtsjahr verraten? Das ist freiwillig.",
        required: false,
        internal: true,
      },
      {
        id: "role",
        section: "1. PERSÖNLICHE ANGABEN",
        label: "Trainerfunktion / Rolle",
        question:
          "Welche Rolle übernimmst du bei uns? Zum Beispiel Skating-Coach, Skill-Coach oder Torwarttrainer.",
        required: false,
        followUp: "Welche Bereiche betreust du dabei besonders?",
      },
      {
        id: "contact",
        section: "1. PERSÖNLICHE ANGABEN",
        label: "Kontakt für interne Rückfragen",
        question:
          "Unter welcher E-Mail-Adresse oder Telefonnummer dürfen wir dich intern erreichen? Diese Angabe ist nicht für die öffentliche Vorstellung.",
        required: false,
        internal: true,
      },
      {
        id: "start",
        section: "2. HOCKEYLAUFBAHN & ERFAHRUNG",
        label: "Seit wann spielst du Eishockey oder Skaterhockey?",
        question:
          "Wie bist du zum Eishockey oder Skaterhockey gekommen, und seit wann spielst du?",
        required: false,
        followUp:
          "Erinnerst du dich noch an deinen allerersten Verein oder an ein prägendes Erlebnis aus deinen Anfängen?",
      },
      {
        id: "teams",
        section: "2. HOCKEYLAUFBAHN & ERFAHRUNG",
        label: "Vereine / Mannschaften",
        question:
          "Bei welchen Vereinen oder Mannschaften warst du im Laufe deiner Hockeyzeit aktiv?",
        required: false,
        followUp:
          "Welche dieser Stationen hat dich besonders geprägt – und warum?",
      },
      {
        id: "highlights",
        section: "2. HOCKEYLAUFBAHN & ERFAHRUNG",
        label: "Besondere Stationen, Ligen oder sportliche Erfolge",
        question:
          "Gab es besondere Ligen, sportliche Erfolge oder Erlebnisse, auf die du gerne zurückblickst?",
        required: false,
        followUp:
          "Welcher Moment ist dir dabei am stärksten in Erinnerung geblieben?",
      },
      {
        id: "experience",
        section: "2. HOCKEYLAUFBAHN & ERFAHRUNG",
        label: "Trainererfahrung, Qualifikationen und Lizenzen",
        question:
          "Welche Erfahrungen hast du als Trainer gesammelt? Hast du Qualifikationen, Ausbildungen oder Lizenzen?",
        required: false,
        followUp:
          "Mit welchen Teams oder Altersgruppen konntest du bisher als Trainer arbeiten?",
      },
      {
        id: "focus",
        section: "3. TRAININGSPROFIL",
        label: "Trainingsschwerpunkte",
        question:
          "Was sind deine persönlichen Trainingsschwerpunkte? Zum Beispiel Skating, Schusstechnik, Stickhandling, Skills oder Torwarttraining.",
        required: false,
        followUp:
          "Was sollen die Kinder in diesem Bereich nach einem Training bei dir besser können?",
      },
      {
        id: "ages",
        section: "3. TRAININGSPROFIL",
        label: "Bevorzugte Altersgruppen / Leistungsstufen",
        question:
          "Mit welchen Altersgruppen oder Leistungsstufen arbeitest du besonders gerne?",
        required: false,
      },
      {
        id: "philosophy",
        section: "3. TRAININGSPROFIL",
        label: "Persönliche Eishockey- und Trainingsphilosophie",
        question:
          "Wie würdest du deine persönliche Trainingsphilosophie beschreiben? Was macht für dich gutes Hockeytraining aus?",
        required: false,
        followUp: "Wie setzt du diese Philosophie ganz konkret auf dem Eis um?",
      },
      {
        id: "kids",
        section: "3. TRAININGSPROFIL",
        label: "Wichtig bei der Arbeit mit Kindern und Jugendlichen",
        question:
          "Was ist dir bei der Arbeit mit Kindern und Jugendlichen besonders wichtig?",
        required: false,
        followUp:
          "Wie gehst du mit Kindern um, die sich etwas nicht zutrauen oder einen Fehler machen?",
      },
      {
        id: "intro",
        section: "4. DEINE VORSTELLUNG",
        label: "Deine Vorstellung in 2–3 Sätzen",
        question:
          "Stell dich zum Abschluss bitte in zwei bis drei Sätzen vor. Was zeichnet dich als Coach aus?",
        required: false,
        followUp:
          "Was sollen Eltern und Kinder nach dem ersten Training über dich sagen können?",
      },
      {
        id: "stats",
        section: "4. DEINE VORSTELLUNG",
        label: "Link zu Spieler-/Statistikprofil (optional)",
        question:
          "Hast du einen Link zu einem Spieler- oder Statistikprofil, zum Beispiel RODI-DB oder Elite Prospects?",
        required: false,
      },
    ],
  },
};
